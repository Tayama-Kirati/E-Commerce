// POST — create order | GET — list user orders
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";
import {
  generateOrderNumber,
  generateInvoiceNumber,
  formatPrice,
} from "@/app/lib/utils";
import { sendOrderConfirmationEmail } from "@/app/lib/email";
import { z } from "zod";

const CreateOrderSchema = z.object({
  addressId: z.string().cuid("Invalid address"),
  paymentMethod: z.enum([
    "KHALTI",
    "ESEWA",
    "STRIPE",
    "CASH_ON_DELIVERY",
    "WALLET",
  ]),
  couponCode: z.string().optional(),
  pointsToRedeem: z.number().int().min(0).default(0),
  customerNote: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        variantId: z.string().cuid().optional(),
        quantity: z.number().int().positive().max(100),
      }),
    )
    .min(1, "Cart is empty"),
});

// ─── POST /api/orders  
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to place an order" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // ─── Load products  
  const productIds = [...new Set(data.items.map((i: any) => i.productId))];
  const [products, address, user] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, status: "ACTIVE" },
      include: { variants: true, seller: true },
    }),
    prisma.address.findUnique({ where: { id: data.addressId } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  // Validate all products exist
  if (products.length !== productIds.length) {
    const foundIds = products.map((p: any) => p.id);
    const missing = productIds.filter((id) => !foundIds.includes(id));
    return NextResponse.json(
      { error: `Products unavailable: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate address ownership
  if (!address || address.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Delivery address not found" },
      { status: 400 },
    );
  }

  // ─── Stock validation ────────────────────────────────────────────────

  for (const item of data.items) {
    const prod = products.find((p: any) => p.id === item.productId)!;
    const variant = prod.variants.find((v: any) => v.id === item.variantId);
    const avail = variant ? variant.stock : prod.stock;
    if (avail < item.quantity) {
      return NextResponse.json(
        {
          error: `"${prod.name}" only has ${avail} left in stock (requested ${item.quantity})`,
        },
        { status: 400 },
      );
    }
  }

  // ─── Pricing calculation  
  let subtotal = 0;
  const lineItems = data.items.map((item: any) => {
    const prod = products.find((p: any) => p.id === item.productId)!;
    const variant = prod.variants.find((v: any) => v.id === item.variantId);
    const price = Number(variant?.price ?? prod.basePrice);
    const total = price * item.quantity;
    subtotal += total;
    const commRate = 0.08;
    return {
      productId: item.productId,
      sellerId: prod.seller.id,
      variantId: item.variantId,
      name: prod.name + (variant ? ` — ${variant.name}` : ""),
      image: undefined as string | undefined,
      sku: variant?.sku ?? prod.sku ?? undefined,
      price,
      quantity: item.quantity,
      total,
      commissionRate: commRate,
      commissionAmt: parseFloat((total * commRate).toFixed(2)),
      sellerEarnings: parseFloat((total * (1 - commRate)).toFixed(2)),
    };
  });

  // ─── Coupon validation ───────────────────────────────────────────────

  let couponDiscount = 0;
  let couponRecord: any = null;
  if (data.couponCode) {
    couponRecord = await prisma.coupon.findUnique({
      where: { code: data.couponCode.toUpperCase() },
      include: { usages: { where: { userId: session.user.id } } },
    });
    if (!couponRecord)
      return NextResponse.json({ error: "Coupon not found" }, { status: 400 });
    if (!couponRecord.isActive)
      return NextResponse.json(
        { error: "This coupon is no longer active" },
        { status: 400 },
      );
    if (couponRecord.expiresAt < new Date())
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 },
      );
    if (couponRecord.startsAt > new Date())
      return NextResponse.json(
        { error: "This coupon is not yet active" },
        { status: 400 },
      );
    if (
      couponRecord.usageLimit &&
      couponRecord.usageCount >= couponRecord.usageLimit
    ) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 },
      );
    }
    if (couponRecord.usages.length >= couponRecord.perUserLimit) {
      return NextResponse.json(
        {
          error: `You've already used this coupon ${couponRecord.perUserLimit} time(s)`,
        },
        { status: 400 },
      );
    }
    if (
      couponRecord.minOrderAmount &&
      subtotal < Number(couponRecord.minOrderAmount)
    ) {
      return NextResponse.json(
        {
          error: `Minimum order amount for this coupon is ${formatPrice(Number(couponRecord.minOrderAmount))}`,
        },
        { status: 400 },
      );
    }

    couponDiscount =
      couponRecord.type === "PERCENTAGE"
        ? Math.min(
            subtotal * (Number(couponRecord.value) / 100),
            Number(couponRecord.maxDiscount ?? Infinity),
          )
        : couponRecord.type === "FIXED"
          ? Math.min(Number(couponRecord.value), subtotal)
          : 0; // FREE_SHIPPING handled below
  }

  const maxRedeemPts = Math.min(
    data.pointsToRedeem,
    user?.loyaltyPoints ?? 0,
    Math.floor(subtotal * 0.1) * 10,
  );
  const pointsDiscount = maxRedeemPts / 10;

  const freeShipping =
    subtotal >= 1000 ||
    couponRecord?.type === "FREE_SHIPPING" ||
    lineItems.every(
      (i) => products.find((p: any) => p.id === i.productId)?.freeShipping,
    );

  const shippingCost = freeShipping ? 0 : 150;

  // ─── Totals  
  const totalDiscount = couponDiscount + pointsDiscount;
  const grandTotal = Math.max(0, subtotal + shippingCost - totalDiscount);
  const pointsEarned = Math.floor(grandTotal / 100); // 1 pt per रू 100

  // ─── Estimated delivery  
  const deliveryDays = data.paymentMethod === "CASH_ON_DELIVERY" ? 4 : 3;
  const estimatedDelivery = new Date(
    Date.now() + deliveryDays * 24 * 60 * 60 * 1000,
  );

  // ─── Create order (transaction)  
  const order = await prisma.$transaction(async (tx: any) => {
    // Create the order
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session.user.id,
        addressId: data.addressId,
        paymentMethod: data.paymentMethod as any,
        paymentStatus: "PENDING",
        status: "PENDING",
        subtotal,
        shippingCost,
        discount: totalDiscount,
        tax: 0,
        total: grandTotal,
        couponId: couponRecord?.id,
        couponCode: couponRecord?.code,
        couponDiscount: couponDiscount || undefined,
        pointsEarned,
        pointsRedeemed: maxRedeemPts,
        customerNote: data.customerNote,
        estimatedDelivery,
        items: { create: lineItems },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        address: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    // Deduct stock
    for (const item of data.items) {
      const prod = products.find((p: any) => p.id === item.productId)!;
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            totalSales: { increment: item.quantity },
          },
        });
      }
    }

    // Redeem loyalty points
    if (maxRedeemPts > 0) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { loyaltyPoints: { decrement: maxRedeemPts } },
      });
      await tx.loyaltyTransaction.create({
        data: {
          userId: session.user.id,
          points: -maxRedeemPts,
          type: "REDEMPTION",
          description: `Redeemed for order ${created.orderNumber}`,
          orderId: created.id,
        },
      });
    }

    // Track coupon usage
    if (couponRecord) {
      await tx.couponUsage.create({
        data: {
          couponId: couponRecord.id,
          userId: session.user.id,
          orderId: created.id,
        },
      });
      await tx.coupon.update({
        where: { id: couponRecord.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Clear cart items
    await tx.cartItem.deleteMany({
      where: { userId: session.user.id, productId: { in: productIds } },
    });

    // Order status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: created.id,
        status: "PENDING",
        note: "Order placed successfully",
        updatedBy: session.user.id,
      },
    });

    // Invoice
    await tx.invoice.create({
      data: {
        orderId: created.id,
        invoiceNo: generateInvoiceNumber(),
        notes: "Thank you for shopping with NexMart!",
      },
    });

    // Customer notification
    await tx.notification.create({
      data: {
        userId: session.user.id,
        type: "ORDER_PLACED",
        title: `Order Placed! 🎉`,
        body: `Your order ${created.orderNumber} was placed. Total: ${formatPrice(grandTotal)}`,
        data: { orderId: created.id },
        imageUrl: created.items[0]?.product?.images?.[0]?.url,
      },
    });

    // Seller notifications
    const sellerIds = [...new Set(lineItems.map((i: any) => i.sellerId))];
    for (const sid of sellerIds) {
      const sellerUser = await tx.seller.findUnique({
        where: { id: sid },
        select: { userId: true, storeName: true },
      });
      if (sellerUser) {
        await tx.notification.create({
          data: {
            userId: sellerUser.userId,
            type: "ORDER_PLACED",
            title: "New Order Received! 📦",
            body: `Order ${created.orderNumber} has been placed for your store.`,
            data: { orderId: created.id },
          },
        });
      }
    }

    return created;
  });

  // Non-blocking: send confirmation email
  sendOrderConfirmationEmail({
    to: order.user.email!,
    name: order.user.name ?? "Customer",
    orderNumber: order.orderNumber,
    total: grandTotal,
    items: lineItems.map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
  }).catch(console.error);

  // If digital payment, signal frontend to redirect to gateway
  const requiresGateway = !["CASH_ON_DELIVERY", "WALLET"].includes(
    data.paymentMethod,
  );

  return NextResponse.json(
    {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: grandTotal,
        status: order.status,
        estimatedDelivery,
      },
      pointsEarned,
      requiresPayment: requiresGateway,
      message: requiresGateway
        ? "Order created — redirecting to payment..."
        : "Order placed successfully! 🎉",
    },
    { status: 201 },
  );
}

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
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true, alt: true },
                },
              },
            },
            variant: { select: { name: true } },
          },
        },
        address: { select: { city: true, district: true, fullName: true } },
        invoice: { select: { invoiceNo: true, pdfUrl: true } },
        returnRequest: { select: { id: true, status: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  // Status counts for filter tabs
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

export async function getOrderHandler(req: NextRequest, orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              isEco: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
          variant: { select: { name: true, attributes: true } },
          seller: {
            select: {
              storeName: true,
              storeSlug: true,
              city: true,
              averageRating: true,
            },
          },
        },
      },
      address: true,
      invoice: { select: { invoiceNo: true, pdfUrl: true, issuedAt: true } },
      returnRequest: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      coupon: { select: { code: true, type: true, value: true } },
    },
  });

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Authorization: owner or admin
  const isOwner = order.userId === session.user.id;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "");
  if (!isOwner && !isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Can the user still cancel?
  const cancellable = ["PENDING", "CONFIRMED"].includes(order.status);

  // Can they return?
  const returnable =
    order.status === "DELIVERED" &&
    !order.returnRequest &&
    order.deliveredAt &&
    Date.now() - order.deliveredAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  // Can they review? (delivered, not yet reviewed)
  const reviewableItems = order.items.filter(
    (i: any) => !i.isReviewed && order.status === "DELIVERED",
  );

  return NextResponse.json({ order, cancellable, returnable, reviewableItems });
}

 
const CancelSchema = z.object({
  reason: z.enum([
    "CHANGED_MIND",
    "WRONG_ITEM_ORDERED",
    "FOUND_CHEAPER",
    "DELIVERY_TOO_LONG",
    "PAYMENT_ISSUE",
    "OTHER",
  ]),
  note: z.string().max(300).optional(),
});

export async function cancelOrderHandler(req: NextRequest, orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: session.user.id },
    include: { items: true },
  });
  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    return NextResponse.json(
      {
        error: `Cannot cancel an order with status "${order.status}". Contact support for help.`,
      },
      { status: 400 },
    );
  }

  const body = await req.json();
  const data = CancelSchema.parse(body);
  const cancelReason = `${data.reason}${data.note ? `: ${data.note}` : ""}`;

  await prisma.$transaction(async (tx: any) => {
    // Update order
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason,
        paymentStatus:
          order.paymentStatus === "COMPLETED"
            ? "REFUNDED"
            : order.paymentStatus,
      },
    });

    // Restore stock
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    // Restore redeemed loyalty points
    if (order.pointsRedeemed > 0) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { loyaltyPoints: { increment: order.pointsRedeemed } },
      });
      await tx.loyaltyTransaction.create({
        data: {
          userId: session.user.id,
          points: order.pointsRedeemed,
          type: "BONUS",
          description: `Points restored from cancelled order ${order.orderNumber}`,
          orderId: order.id,
        },
      });
    }

    // Status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        note: `Cancelled by customer. Reason: ${cancelReason}`,
        updatedBy: session.user.id,
      },
    });

    // Notification
    await tx.notification.create({
      data: {
        userId: session.user.id,
        type: "ORDER_CANCELLED",
        title: `Order Cancelled`,
        body: `Your order #${order.orderNumber} has been cancelled.${order.paymentStatus === "COMPLETED" ? " A refund will be processed within 5–7 business days." : ""}`,
        data: { orderId: order.id },
      },
    });
  });

  return NextResponse.json({
    success: true,
    message: "Order cancelled successfully.",
    willRefund: order.paymentStatus === "COMPLETED",
  });
}

const ReturnSchema = z.object({
  reason: z.enum([
    "WRONG_ITEM",
    "DAMAGED",
    "NOT_AS_DESCRIBED",
    "CHANGED_MIND",
    "QUALITY_ISSUE",
    "MISSING_PARTS",
    "OTHER",
  ]),
  description: z
    .string()
    .min(10, "Please describe the issue in at least 10 characters")
    .max(1000),
  images: z.array(z.string().url()).max(5).default([]),
  itemIds: z.array(z.string()).min(1, "Select at least one item"),
});

export async function createReturnHandler(req: NextRequest, orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: session.user.id },
    include: { returnRequest: true, items: true },
  });

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.returnRequest)
    return NextResponse.json(
      { error: "Return already submitted" },
      { status: 409 },
    );
  if (order.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Only delivered orders can be returned" },
      { status: 400 },
    );
  }
  if (!order.deliveredAt) {
    return NextResponse.json(
      { error: "Delivery date not recorded" },
      { status: 400 },
    );
  }

  const daysSinceDelivery =
    (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 7) {
    return NextResponse.json(
      {
        error: `Return window closed. Returns must be requested within 7 days of delivery (delivered ${Math.floor(daysSinceDelivery)} days ago).`,
      },
      { status: 400 },
    );
  }

  const body = await req.json();
  const data = ReturnSchema.parse(body);

  // Calculate refund amount from selected items
  const selectedItems = order.items.filter((i: any) =>
    data.itemIds.includes(i.id),
  );
  const refundAmount = selectedItems.reduce(
    (sum: any, i: any) => sum + Number(i.total),
    0,
  );

  const returnRequest = await prisma.$transaction(async (tx: any) => {
    const rr = await tx.returnRequest.create({
      data: {
        orderId,
        userId: session.user.id,
        reason: data.reason,
        description: data.description,
        images: data.images,
        status: "REQUESTED",
        refundAmount,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: "RETURN_REQUESTED" },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "RETURN_REQUESTED",
        note: `Return requested. Reason: ${data.reason}`,
        updatedBy: session.user.id,
      },
    });

    await tx.notification.create({
      data: {
        userId: session.user.id,
        type: "ORDER_CANCELLED",
        title: "Return Request Submitted",
        body: `Your return for order #${order.orderNumber} has been received. We'll review it within 24 hours.`,
        data: { orderId, returnId: rr.id },
      },
    });

    return rr;
  });

  return NextResponse.json(
    {
      returnRequest,
      message:
        "Return request submitted. Our team will review it within 24 hours.",
    },
    { status: 201 },
  );
}

export async function reorderHandler(req: NextRequest, orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { isActive: true, status: true, stock: true } },
        },
      },
    },
  });
  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const available: any[] = [];
  const unavailable: string[] = [];

  for (const item of order.items) {
    if (
      !item.product.isActive ||
      item.product.status !== "ACTIVE" ||
      item.product.stock === 0
    ) {
      unavailable.push(item.name);
      continue;
    }
    available.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    });
  }

  if (available.length === 0) {
    return NextResponse.json(
      { error: "None of the items in this order are currently available" },
      { status: 400 },
    );
  }

  // Upsert into cart
  for (const a of available) {
    await prisma.cartItem.upsert({
      where: {
        userId_productId_variantId: {
          userId: session.user.id,
          productId: a.productId,
          variantId: a.variantId ?? null,
        },
      },
      update: { quantity: { increment: a.quantity } },
      create: { userId: session.user.id, ...a },
    });
  }

  return NextResponse.json({
    added: available.length,
    unavailable,
    message: `${available.length} item(s) added to your cart.${unavailable.length ? ` ${unavailable.length} item(s) are no longer available.` : ""}`,
  });
}

export async function trackOrderHandler(req: NextRequest, orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
      userId: session.user.id,
    },
    include: {
      statusHistory: { orderBy: { createdAt: "asc" } },
      items: {
        take: 1,
        include: {
          product: {
            select: {
              name: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
      address: true,
    },
  });
  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Build timeline steps
  const allStatuses = [
    {
      key: "PENDING",
      label: "Order Placed",
      icon: "📋",
      desc: "Payment received and order confirmed",
    },
    {
      key: "CONFIRMED",
      label: "Confirmed",
      icon: "✅",
      desc: "Seller has confirmed your order",
    },
    {
      key: "PROCESSING",
      label: "Processing",
      icon: "📦",
      desc: "Seller is preparing and packing your order",
    },
    {
      key: "SHIPPED",
      label: "Shipped",
      icon: "🚚",
      desc: "Your package is on the way",
    },
    {
      key: "OUT_FOR_DELIVERY",
      label: "Out for Delivery",
      icon: "🛵",
      desc: "Your package is nearby — expect delivery today!",
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      icon: "🎉",
      desc: "Your order has been delivered. Enjoy!",
    },
  ];

  const cancelledStatuses = [
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUNDED",
  ];
  const isCancelled = cancelledStatuses.includes(order.status);

  const orderedKeys = allStatuses.map((s: any) => s.key);
  const currentIdx = orderedKeys.indexOf(order.status);

  const timeline = allStatuses.map((step, idx) => {
    const historyEntry = order.statusHistory.find(
      (h: any) => h.status === step.key,
    );
    return {
      ...step,
      done: isCancelled ? false : idx < currentIdx || order.status === step.key,
      active: !isCancelled && order.status === step.key,
      time: historyEntry?.createdAt ?? null,
      note: historyEntry?.note ?? null,
    };
  });

  // Add cancellation/return step if applicable
  if (isCancelled) {
    const cancelEntry = order.statusHistory.find((h: any) =>
      cancelledStatuses.includes(h.status),
    );
    timeline.push({
      key: order.status,
      label:
        order.status === "CANCELLED"
          ? "Cancelled"
          : order.status === "REFUNDED"
            ? "Refunded"
            : "Return Requested",
      icon: order.status === "REFUNDED" ? "Yes" : "No",
      desc: order.cancelReason ?? "Order was cancelled",
      done: true,
      active: true,
      time: cancelEntry?.createdAt ?? order.cancelledAt ?? null,
      note: cancelEntry?.note ?? null,
    });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancelReason: order.cancelReason,
      address: order.address,
      itemCount: order.items.length,
      firstItem: order.items[0],
    },
    timeline,
  });
}

export async function downloadInvoiceHandler(
  req: NextRequest,
  orderId: string,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { name: true } },
        },
      },
      address: true,
      invoice: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // If PDF already generated, redirect
  if (order.invoice?.pdfUrl) {
    return NextResponse.redirect(order.invoice.pdfUrl);
  }

  // Generate HTML invoice (in production: use puppeteer or @react-pdf/renderer)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1A1523; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; }
    .logo { font-size: 28px; font-weight: 900; color: #3B82F6; }
    .logo span { color: #F59E0B; }
    .invoice-meta { text-align: right; font-size: 13px; color: #6B6878; }
    .invoice-meta strong { font-size: 22px; color: #1A1523; display: block; margin-bottom: 4px; }
    .divider { border: none; border-top: 2px solid #E8E6F0; margin: 20px 0; }
    .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 28px; }
    .address-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9B97A8; margin-bottom: 8px; }
    .address-block p { font-size: 14px; line-height: 1.6; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    thead tr { background: #F8F7FC; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9B97A8; }
    td { padding: 12px; font-size: 14px; border-bottom: 1px solid #F0EDF8; }
    .totals { margin-left: auto; width: 240px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .total-row.grand { font-weight: 700; font-size: 18px; border-top: 2px solid #3B82F6; padding-top: 12px; margin-top: 6px; color: #3B82F6; }
    .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #9B97A8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Nex<span>Mart</span></div>
    <div class="invoice-meta">
      <strong>INVOICE</strong>
      ${order.invoice?.invoiceNo ?? order.orderNumber}
      <br>Order: ${order.orderNumber}
      <br>Date: ${new Date(order.createdAt).toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })}
    </div>
  </div>
  <hr class="divider">
  <div class="addresses">
    <div class="address-block">
      <h3>Bill To</h3>
      <p>
        <strong>${order.user.name}</strong><br>
        ${order.user.email}<br>
        ${order.user.phone ?? ""}
      </p>
    </div>
    <div class="address-block">
      <h3>Ship To</h3>
      <p>
        ${order.address.fullName}<br>
        ${order.address.street}<br>
        ${order.address.city}, ${order.address.district}<br>
        ${order.address.province}, ${order.address.country}<br>
        📞 ${order.address.phone}
      </p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items
        .map(
          (item: any, idx: any) => `
        <tr>
          <td>${idx + 1}</td>
          <td>
            ${item.product.name}
            ${item.variant ? `<br><small style="color:#9B97A8">${item.variant.name}</small>` : ""}
          </td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">रू ${Number(item.price).toLocaleString()}</td>
          <td style="text-align:right"><strong>रू ${Number(item.total).toLocaleString()}</strong></td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>रू ${Number(order.subtotal).toLocaleString()}</span></div>
    <div class="total-row"><span>Shipping</span><span>${Number(order.shippingCost) === 0 ? "Free" : "रू " + Number(order.shippingCost).toLocaleString()}</span></div>
    ${Number(order.discount) > 0 ? `<div class="total-row" style="color:#16A34A"><span>Discount</span><span>-रू ${Number(order.discount).toLocaleString()}</span></div>` : ""}
    <div class="total-row grand"><span>Total</span><span>रू ${Number(order.total).toLocaleString()}</span></div>
  </div>
  <hr class="divider">
  <div style="font-size:13px; color:#6B6878; margin-top:16px">
    <strong>Payment:</strong> ${order.paymentMethod.replace("_", " ")} · Status: ${order.paymentStatus}
    ${order.paymentRef ? `· Ref: ${order.paymentRef}` : ""}
  </div>
  <div class="footer">
    <p>Thank you for shopping with NexMart!</p>
    <p>For support, visit nexmart.com/help or email support@nexmart.com</p>
    <p style="margin-top:8px; color:#C4B5FD">NexMart Pvt. Ltd. · Kathmandu, Nepal</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="NexMart-Invoice-${order.orderNumber}.html"`,
    },
  });
}

export async function validateCouponHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, orderAmount } = await req.json();
  if (!code)
    return NextResponse.json(
      { error: "Coupon code required" },
      { status: 400 },
    );

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: { usages: { where: { userId: session.user.id } } },
  });

  if (!coupon || !coupon.isActive || coupon.expiresAt < new Date()) {
    return NextResponse.json({
      valid: false,
      error: "Invalid or expired coupon",
    });
  }
  if (coupon.usages.length >= coupon.perUserLimit) {
    return NextResponse.json({
      valid: false,
      error: "You've already used this coupon",
    });
  }
  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
    return NextResponse.json({
      valid: false,
      error: `Minimum order amount: ${formatPrice(Number(coupon.minOrderAmount))}`,
    });
  }

  const discount =
    coupon.type === "PERCENTAGE"
      ? Math.min(
          orderAmount * (Number(coupon.value) / 100),
          Number(coupon.maxDiscount ?? Infinity),
        )
      : coupon.type === "FIXED"
        ? Math.min(Number(coupon.value), orderAmount)
        : 0;

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    discount,
    description:
      coupon.description ??
      `Save ${coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatPrice(Number(coupon.value))}`,
    message: `Coupon applied! You save ${formatPrice(discount)}`,
  });
}
