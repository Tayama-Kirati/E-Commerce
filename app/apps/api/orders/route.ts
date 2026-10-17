import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError, readJson, zodError } from "@/app/lib/api";
import { unitFor } from "@/app/lib/cart";
import { checkCoupon } from "@/app/lib/coupons";
import { quoteShipping } from "@/app/lib/shipping";
import { getSettings } from "@/app/lib/settings";
import { computeOrderTotals, computePointsEarned, computePointsRedemption } from "@/app/lib/pricing";
import { checkLowStock, generateOrderNumber, markOrderPaid, sendPlacedNotifications } from "@/app/lib/orders";

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
    paymentMethod: z.enum(["KHALTI", "STRIPE", "CASH_ON_DELIVERY"], {
      error: () => ({ message: "Choose Khalti, card or cash on delivery" }),
    }),
    notes: z.string().max(500).optional(),
    couponCode: z.string().max(40).optional(),
    pointsToRedeem: z.number().int().min(0).optional(),
    items: z
      .array(
        z.object({
          productId: z.string(),
          variantId: z.string().nullish(),
          quantity: z.number().int().positive().max(100),
        }),
      )
      .min(1),
  })
  .refine((d) => d.addressId || d.address, {
    message: "Either addressId or address is required",
    path: ["address"],
  });

class OrderError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  const parsed = CreateOrderSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const data = parsed.data;

  // Resolve the province first — shipping cost depends on it
  let province: string;
  if (data.addressId) {
    const dbAddress = await prisma.address.findFirst({ where: { id: data.addressId, userId, isArchived: false }, select: { province: true } });
    if (!dbAddress) return jsonError("Delivery address not found", 400);
    province = dbAddress.province;
  } else {
    province = data.address!.province;
  }

  // Merge duplicate lines (same product + variant)
  const lines = new Map<string, { productId: string; variantId: string | null; quantity: number }>();
  for (const it of data.items) {
    const key = `${it.productId}:${it.variantId ?? ""}`;
    const prev = lines.get(key);
    lines.set(key, { productId: it.productId, variantId: it.variantId ?? null, quantity: (prev?.quantity ?? 0) + it.quantity });
  }

  const productIds = [...new Set([...lines.values()].map((l) => l.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { variants: true, seller: { select: { userId: true } } },
  });
  if (products.length !== productIds.length) {
    return jsonError("Some products in your cart are no longer available", 400, {
      unavailable: productIds.filter((id) => !products.find((p) => p.id === id)),
    });
  }

  // Price every line from the database, never from the client
  let subtotal = 0;
  const lineItems: { productId: string; variantId: string | null; variantName: string | null; price: number; quantity: number; total: number }[] = [];
  for (const line of lines.values()) {
    const prod = products.find((p) => p.id === line.productId)!;
    const variant = line.variantId ? prod.variants.find((v) => v.id === line.variantId) : null;
    if (line.variantId && !variant) return jsonError(`The selected option for "${prod.name}" is no longer available`, 400);
    const { price, stock } = unitFor(prod, variant);
    if (stock < line.quantity) {
      return jsonError(`"${prod.name}${variant ? ` (${variant.name})` : ""}" only has ${stock} left (requested ${line.quantity})`, 400);
    }
    subtotal += price * line.quantity;
    lineItems.push({ productId: prod.id, variantId: variant?.id ?? null, variantName: variant?.name ?? null, price, quantity: line.quantity, total: price * line.quantity });
  }

  const shipping = await quoteShipping({ subtotal, allItemsFreeShipping: products.every((p) => p.freeShipping), province });

  let couponDiscount = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;
  if (data.couponCode?.trim()) {
    const check = await checkCoupon({ code: data.couponCode, userId, subtotal, shippingCost: shipping.cost });
    if (!check.ok) return jsonError(check.error, check.status);
    couponDiscount = check.discount;
    couponId = check.coupon.id;
    couponCode = check.coupon.code;
  }

  const settings = await getSettings();
  let pointsRedeemed = 0;
  if (data.pointsToRedeem && settings.loyaltyEnabled) {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { loyaltyPoints: true } });
    pointsRedeemed = computePointsRedemption(data.pointsToRedeem, me.loyaltyPoints, subtotal - couponDiscount);
  }

  const { discount, total: grandTotal } = computeOrderTotals({
    subtotal, shippingCost: shipping.cost, couponDiscount, pointsDiscount: pointsRedeemed,
  });
  const pointsEarned = settings.loyaltyEnabled ? computePointsEarned(grandTotal) : 0;

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      let addressId: string | null = data.addressId ?? null;
      if (!addressId && data.address) {
        const hasAny = await tx.address.count({ where: { userId } });
        const created = await tx.address.create({
          data: { userId, ...data.address, label: data.address.label ?? "Home", isDefault: hasAny === 0 },
        });
        addressId = created.id;
      }

      // Reserve stock with a conditional update so two simultaneous orders can't oversell
      for (const li of lineItems) {
        if (li.variantId) {
          const v = await tx.productVariant.updateMany({
            where: { id: li.variantId, stock: { gte: li.quantity } },
            data: { stock: { decrement: li.quantity } },
          });
          if (!v.count) throw new OrderError("An item in your cart just sold out — please review your cart");
        }
        const p = await tx.product.updateMany({
          where: { id: li.productId, stock: { gte: li.quantity } },
          data: { stock: { decrement: li.quantity }, totalSales: { increment: li.quantity } },
        });
        if (!p.count) throw new OrderError("An item in your cart just sold out — please review your cart");
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          addressId,
          paymentMethod: data.paymentMethod,
          paymentStatus: "PENDING",
          status: "PENDING",
          subtotal,
          shippingCost: shipping.cost,
          discount,
          total: grandTotal,
          notes: data.notes,
          couponCode,
          pointsEarned,
          pointsRedeemed,
          items: { create: lineItems },
          statusHistory: { create: { status: "PENDING", note: "Order placed" } },
        },
      });

      if (couponId) {
        // Re-check the global limit atomically at redemption time
        const { maxUses } = await tx.coupon.findUniqueOrThrow({ where: { id: couponId }, select: { maxUses: true } });
        const bumped = await tx.coupon.updateMany({
          where: maxUses > 0 ? { id: couponId, usedCount: { lt: maxUses } } : { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
        if (!bumped.count) throw new OrderError("This coupon has just reached its usage limit");
        await tx.couponRedemption.create({ data: { couponId, userId, orderId: created.id, discount: couponDiscount } });
      }

      if (pointsRedeemed > 0) {
        const spent = await tx.user.updateMany({
          where: { id: userId, loyaltyPoints: { gte: pointsRedeemed } },
          data: { loyaltyPoints: { decrement: pointsRedeemed } },
        });
        if (!spent.count) throw new OrderError("Not enough loyalty points");
        await tx.loyaltyTransaction.create({
          data: { userId, orderId: created.id, points: -pointsRedeemed, type: "REDEEMED", description: `Redeemed on order ${created.orderNumber}` },
        });
      }

      // Notify each seller whose products are in this order
      const sellerUserIds = new Set(products.map((p) => p.seller?.userId).filter(Boolean) as string[]);
      const buyerName = auth.user.name ?? "A customer";
      if (sellerUserIds.size) {
        await tx.notification.createMany({
          data: [...sellerUserIds].map((sellerUserId) => ({
            userId: sellerUserId,
            type: "ORDER" as const,
            title: "New order received",
            body: `${buyerName} placed order ${created.orderNumber}.`,
          })),
        });
      }

      // Remove ordered lines from the cart
      for (const li of lineItems) {
        await tx.cartItem.deleteMany({ where: { userId, productId: li.productId, variantKey: li.variantId ?? "" } });
      }

      return created;
    });
  } catch (err) {
    if (err instanceof OrderError) return jsonError(err.message, err.status);
    throw err;
  }

  const requiresPayment = data.paymentMethod !== "CASH_ON_DELIVERY" && grandTotal > 0;
  if (!requiresPayment) {
    if (grandTotal === 0) await markOrderPaid(order.id, { gateway: "points" });
    else await sendPlacedNotifications(order.id, false);
  }
  checkLowStock(productIds).catch((err) => console.error("[low-stock]", err));

  return NextResponse.json(
    {
      order: { id: order.id, orderNumber: order.orderNumber, total: grandTotal, status: order.status },
      pointsEarned,
      requiresPayment,
      message: requiresPayment ? "Order created — redirecting to payment..." : "Order placed successfully!",
    },
    { status: 201 },
  );
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const session = { user: auth.user };

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
