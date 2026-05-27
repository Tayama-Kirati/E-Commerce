import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

const InlineAddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  street: z.string().min(1),
  city: z.string().min(1),
  district: z.string().min(1),
  province: z.string().min(1),
  label: z.string().optional(),
});

const CreateOrderSchema = z
  .object({
    addressId: z.string().optional(),
    address: InlineAddressSchema.optional(),
    paymentMethod: z.enum(["KHALTI", "ESEWA", "STRIPE", "CASH_ON_DELIVERY"]),
    notes: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().positive().max(100),
        }),
      )
      .min(1),
  })
  .refine((d) => d.addressId || d.address, {
    message: "Either addressId or address is required",
    path: ["address"],
  });

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to place an order" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 422 },
    );
  }
  const data = parsed.data;

  const productIds = [...new Set(data.items.map((i) => i.productId))];

  // Validate addressId if provided (inline address is created inside the transaction)
  if (data.addressId) {
    const dbAddress = await prisma.address.findUnique({
      where: { id: data.addressId },
      select: { userId: true },
    });
    if (!dbAddress || dbAddress.userId !== session.user.id) {
      return NextResponse.json({ error: "Delivery address not found" }, { status: 400 });
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    const missing = productIds.filter((id) => !products.find((p) => p.id === id));
    return NextResponse.json({ error: `Products unavailable: ${missing.join(", ")}` }, { status: 400 });
  }

  // Stock validation
  for (const item of data.items) {
    const prod = products.find((p) => p.id === item.productId)!;
    if (prod.stock < item.quantity) {
      return NextResponse.json(
        { error: `"${prod.name}" only has ${prod.stock} left (requested ${item.quantity})` },
        { status: 400 },
      );
    }
  }

  // Pricing
  let subtotal = 0;
  const lineItems = data.items.map((item) => {
    const prod = products.find((p) => p.id === item.productId)!;
    const price = Number(prod.basePrice);
    const total = price * item.quantity;
    subtotal += total;
    return { productId: item.productId, price, quantity: item.quantity, total };
  });

  const freeShipping = subtotal >= 1000 || products.every((p) => p.freeShipping);
  const shippingCost = freeShipping ? 0 : 150;
  const grandTotal = subtotal + shippingCost;
  const pointsEarned = Math.floor(grandTotal / 100);

  const order = await prisma.$transaction(async (tx: any) => {
    // Resolve address: use existing DB address or create one from the inline payload
    let resolvedAddressId: string | null = data.addressId ?? null;
    if (!resolvedAddressId && data.address) {
      const newAddr = await tx.address.create({
        data: {
          userId: session.user.id,
          label: data.address.label ?? "Home",
          fullName: data.address.fullName,
          phone: data.address.phone,
          street: data.address.street,
          city: data.address.city,
          district: data.address.district,
          province: data.address.province,
        },
      });
      resolvedAddressId = newAddr.id;
    }

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session.user.id,
        addressId: resolvedAddressId,
        paymentMethod: data.paymentMethod,
        paymentStatus: "PENDING",
        status: "PENDING",
        subtotal,
        shippingCost,
        discount: 0,
        total: grandTotal,
        notes: data.notes,
        items: { create: lineItems },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: { orderBy: { order: "asc" }, take: 1 },
              },
            },
          },
        },
        address: true,
        user: { select: { name: true, email: true } },
      },
    });

    // Deduct stock
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          totalSales: { increment: item.quantity },
        },
      });
    }

    // Award loyalty points
    if (pointsEarned > 0) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { loyaltyPoints: { increment: pointsEarned } },
      });
      await tx.loyaltyTransaction.create({
        data: {
          userId: session.user.id,
          points: pointsEarned,
          type: "EARNED",
          description: `Points earned from order ${created.orderNumber}`,
        },
      });
    }

    // Notification
    await tx.notification.create({
      data: {
        userId: session.user.id,
        type: "ORDER",
        title: "Order Placed! 🎉",
        body: `Your order ${created.orderNumber} was placed. Total: रू ${grandTotal.toLocaleString()}`,
      },
    });

    // Clear ordered items from cart
    await tx.cartItem.deleteMany({
      where: { userId: session.user.id, productId: { in: productIds } },
    });

    return created;
  });

  const requiresPayment = !["CASH_ON_DELIVERY"].includes(data.paymentMethod);

  return NextResponse.json(
    {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: grandTotal,
        status: order.status,
      },
      pointsEarned,
      requiresPayment,
      message: requiresPayment
        ? "Order created — redirecting to payment..."
        : "Order placed successfully! 🎉",
    },
    { status: 201 },
  );
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const status = searchParams.get("status") || undefined;

  const where: any = { userId: session.user.id };
  if (status && status !== "all") where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: { orderBy: { order: "asc" }, take: 1, select: { url: true, alt: true } },
              },
            },
          },
        },
        address: { select: { city: true, district: true, fullName: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    where: { userId: session.user.id },
    _count: { status: true },
  });

  return NextResponse.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    statusCounts: statusCounts.reduce(
      (acc: any, s: any) => ({ ...acc, [s.status]: s._count.status }),
      {} as Record<string, number>,
    ),
  });
}
