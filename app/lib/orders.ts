import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { notify } from "@/app/lib/notify";
import { sendOrderConfirmationEmail, sendOrderStatusEmail, sendBackInStockEmail, sendLowStockEmail } from "@/app/lib/email";
import { canTransition, STATUS_LABEL } from "@/app/lib/order-status";
import { loyaltyTierFor } from "@/app/lib/pricing";
import { getStripe, isStripeConfigured } from "@/app/lib/stripe";
import { convertReferral } from "@/app/lib/referrals";

type Tx = Prisma.TransactionClient;

export function generateOrderNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `PN-${ymd}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const orderForNotify = {
  id: true, orderNumber: true, userId: true, total: true, status: true,
  trackingNumber: true, carrier: true, pointsEarned: true, pointsAwarded: true,
  user: { select: { email: true, name: true, firstName: true, phone: true } },
  items: { select: { quantity: true, price: true, variantName: true, product: { select: { name: true } } } },
} satisfies Prisma.OrderSelect;

type NotifyOrder = Prisma.OrderGetPayload<{ select: typeof orderForNotify }>;

const displayName = (u: NotifyOrder["user"]) => u.firstName ?? u.name ?? "there";

// ── Stock ────────────────────────────────────────────────────────────────────

/** Puts order quantities back on the shelf (variant stock when a variant was ordered). */
export async function restoreStock(tx: Tx, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { productId: true, variantId: true, quantity: true } });
  for (const it of items) {
    if (it.variantId) {
      await tx.productVariant.update({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } });
    }
    await tx.product.update({
      where: { id: it.productId },
      data: { stock: { increment: it.quantity }, totalSales: { decrement: it.quantity } },
    });
  }
  return items.map((i) => i.productId);
}

/** Emails everyone waiting on a product that has stock again. */
export async function notifyBackInStock(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, slug: true, stock: true, isActive: true } });
  if (!product || product.stock <= 0 || !product.isActive) return;
  const alerts = await prisma.stockAlert.findMany({ where: { productId, notifiedAt: null }, take: 500 });
  for (const a of alerts) {
    try {
      await sendBackInStockEmail({ to: a.email, productName: product.name, productSlug: product.slug });
      if (a.userId) {
        await prisma.notification.create({
          data: { userId: a.userId, type: "PROMO", title: "Back in stock", body: `${product.name} is available again.` },
        });
      }
      await prisma.stockAlert.update({ where: { id: a.id }, data: { notifiedAt: new Date() } });
    } catch (err) {
      console.error("[back-in-stock]", err);
    }
  }
}

/** Warns sellers when any of these products drop to or below their low-stock threshold. */
export async function checkLowStock(productIds: string[]) {
  if (!productIds.length) return;
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, sellerId: { not: null } },
    select: {
      name: true, stock: true, lowStockThreshold: true,
      seller: { select: { storeName: true, userId: true, user: { select: { email: true } } } },
    },
  });
  const low = products.filter((p) => p.stock <= p.lowStockThreshold && p.seller);
  const bySeller = new Map<string, typeof low>();
  for (const p of low) bySeller.set(p.seller!.userId, [...(bySeller.get(p.seller!.userId) ?? []), p]);

  for (const [userId, list] of bySeller) {
    const seller = list[0].seller!;
    const names = list.map((p) => `${p.name} (${p.stock} left)`).join(", ");
    await notify({
      userId,
      type: "SYSTEM",
      title: "Low stock alert",
      body: names,
      email: () => sendLowStockEmail({ to: seller.user.email, storeName: seller.storeName, products: list }),
    });
  }
}

// ── Loyalty ──────────────────────────────────────────────────────────────────

async function changePoints(tx: Tx, userId: string, points: number, type: "EARNED" | "REVERSED" | "REDEEMED" | "BONUS", description: string, orderId?: string) {
  const user = await tx.user.update({ where: { id: userId }, data: { loyaltyPoints: { increment: points } }, select: { loyaltyPoints: true } });
  await tx.user.update({ where: { id: userId }, data: { loyaltyTier: loyaltyTierFor(user.loyaltyPoints) } });
  await tx.loyaltyTransaction.create({ data: { userId, points, type, description, orderId } });
}

async function awardOrderPoints(tx: Tx, orderId: string) {
  // updateMany with the guard makes awarding idempotent even under concurrent calls
  const claimed = await tx.order.updateMany({ where: { id: orderId, pointsAwarded: false, pointsEarned: { gt: 0 } }, data: { pointsAwarded: true } });
  if (!claimed.count) return;
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { userId: true, pointsEarned: true, orderNumber: true } });
  await changePoints(tx, order.userId, order.pointsEarned, "EARNED", `Points earned for order ${order.orderNumber}`, orderId);
}

// ── Payment ──────────────────────────────────────────────────────────────────

/**
 * Marks an order paid exactly once. Safe to call from the return page, a webhook
 * and the reconciliation job at the same time — only the first call does anything.
 */
export async function markOrderPaid(orderId: string, opts: { gateway: string; ref?: string | null }) {
  const changed = await prisma.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "COMPLETED" }, status: { in: ["PENDING", "CONFIRMED"] } },
      data: {
        paymentStatus: "COMPLETED",
        status: "CONFIRMED",
        paidAt: new Date(),
        paymentGateway: opts.gateway,
        ...(opts.ref ? { paymentRef: opts.ref } : {}),
      },
    });
    if (!res.count) return false;
    await tx.orderStatusEvent.create({ data: { orderId, status: "CONFIRMED", note: `Payment received via ${opts.gateway}` } });
    await awardOrderPoints(tx, orderId);
    return true;
  });
  if (changed) await sendPlacedNotifications(orderId, true);
  return changed;
}

/** In-app + email + SMS for a newly placed (COD) or newly paid (online) order. */
export async function sendPlacedNotifications(orderId: string, paid: boolean) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: orderForNotify });
  if (!order) return;
  const total = Number(order.total);
  await notify({
    userId: order.userId,
    type: paid ? "PAYMENT" : "ORDER",
    title: paid ? "Payment received" : "Order placed",
    body: `Order ${order.orderNumber} — रू ${total.toLocaleString()}${paid ? " paid." : " (cash on delivery)."}`,
    email: () => sendOrderConfirmationEmail({
      to: order.user.email,
      name: displayName(order.user),
      orderNumber: order.orderNumber,
      total,
      items: order.items.map((i) => ({
        name: i.variantName ? `${i.product.name} (${i.variantName})` : i.product.name,
        quantity: i.quantity,
        price: Number(i.price),
      })),
    }),
    sms: { phone: order.user.phone, text: `PeaNut: Order ${order.orderNumber} ${paid ? "is confirmed" : "was placed"}. Total Rs ${total}.` },
  });
}

// ── Status changes ───────────────────────────────────────────────────────────

export type TransitionOpts = {
  note?: string | null;
  location?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  cancelReason?: string | null;
};

export class OrderTransitionError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

/**
 * Moves an order to a new status with every side effect in one place:
 * history entry, timestamps, stock/points/coupon reversal on cancel,
 * COD payment capture on delivery, and the customer notification.
 */
export async function transitionOrder(orderId: string, to: OrderStatus, opts: TransitionOpts = {}) {
  const current = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, status: true, paymentMethod: true, paymentStatus: true, paymentGateway: true, paymentRef: true, total: true },
  });
  if (!current) throw new OrderTransitionError("Order not found", 404);
  if (!canTransition(current.status, to)) {
    throw new OrderTransitionError(`Cannot move an order from ${current.status} to ${to}`);
  }

  const restoredProducts = await prisma.$transaction(async (tx) => {
    // Re-check inside the transaction so two concurrent updates can't both apply
    const moved = await tx.order.updateMany({
      where: { id: orderId, status: current.status },
      data: {
        status: to,
        ...(opts.location !== undefined && { currentLocation: opts.location }),
        ...(opts.trackingNumber !== undefined && { trackingNumber: opts.trackingNumber }),
        ...(opts.carrier !== undefined && { carrier: opts.carrier }),
        ...(to === "SHIPPED" && { shippedAt: new Date() }),
        ...(to === "DELIVERED" && { deliveredAt: new Date() }),
        ...(to === "CANCELLED" && { cancelledAt: new Date(), cancelReason: opts.cancelReason ?? opts.note ?? null }),
        ...(to === "DELIVERED" && current.paymentMethod === "CASH_ON_DELIVERY" && { paymentStatus: "COMPLETED", paidAt: new Date() }),
        ...((to === "CANCELLED" || to === "REFUNDED") && current.paymentStatus === "COMPLETED" && { paymentStatus: "REFUNDED" }),
      },
    });
    if (!moved.count) throw new OrderTransitionError("The order was updated by someone else — refresh and try again", 409);

    await tx.orderStatusEvent.create({
      data: { orderId, status: to, note: opts.note ?? opts.cancelReason ?? null, location: opts.location ?? null },
    });

    if (to === "DELIVERED") await awardOrderPoints(tx, orderId);

    if (to === "CANCELLED") {
      const restored = await restoreStock(tx, orderId);
      await reverseOrderBenefits(tx, orderId);
      return restored;
    }
    return [] as string[];
  });

  // Online refunds: Stripe is refunded automatically; Khalti refunds are issued from the merchant dashboard.
  if ((to === "CANCELLED" || to === "REFUNDED") && current.paymentStatus === "COMPLETED" && current.paymentGateway === "stripe" && current.paymentRef?.startsWith("pi_") && isStripeConfigured()) {
    try {
      await getStripe().refunds.create({ payment_intent: current.paymentRef });
    } catch (err) {
      console.error("[stripe refund]", err);
    }
  }

  for (const productId of new Set(restoredProducts)) await notifyBackInStock(productId);
  if (to === "DELIVERED") await convertReferral(current.userId).catch((err) => console.error("[referral]", err));
  await sendStatusNotification(orderId, to, opts.note);
}

/** Gives back redeemed points, takes back earned points, and frees the coupon use. */
async function reverseOrderBenefits(tx: Tx, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { userId: true, orderNumber: true, pointsRedeemed: true, pointsEarned: true, pointsAwarded: true },
  });
  if (order.pointsRedeemed > 0) {
    await changePoints(tx, order.userId, order.pointsRedeemed, "BONUS", `Points returned from cancelled order ${order.orderNumber}`, orderId);
  }
  if (order.pointsAwarded && order.pointsEarned > 0) {
    await tx.order.update({ where: { id: orderId }, data: { pointsAwarded: false } });
    await changePoints(tx, order.userId, -order.pointsEarned, "REVERSED", `Points reversed for cancelled order ${order.orderNumber}`, orderId);
  }
  const redemptions = await tx.couponRedemption.findMany({ where: { orderId } });
  for (const r of redemptions) {
    await tx.coupon.update({ where: { id: r.couponId }, data: { usedCount: { decrement: 1 } } });
  }
  await tx.couponRedemption.deleteMany({ where: { orderId } });
}

async function sendStatusNotification(orderId: string, status: OrderStatus, note?: string | null) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: orderForNotify });
  if (!order) return;
  const smsWorthy: OrderStatus[] = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
  await notify({
    userId: order.userId,
    type: "ORDER",
    title: STATUS_LABEL[status],
    body: `Order ${order.orderNumber}: ${STATUS_LABEL[status].toLowerCase()}${order.trackingNumber && status === "SHIPPED" ? ` — tracking ${order.trackingNumber}` : ""}.`,
    email: () => sendOrderStatusEmail({
      to: order.user.email, name: displayName(order.user), orderId: order.id, orderNumber: order.orderNumber,
      status, trackingNumber: order.trackingNumber, carrier: order.carrier, note,
    }),
    sms: smsWorthy.includes(status)
      ? { phone: order.user.phone, text: `PeaNut: Order ${order.orderNumber} — ${STATUS_LABEL[status]}.${order.trackingNumber && status === "SHIPPED" ? ` Tracking: ${order.trackingNumber}` : ""}` }
      : undefined,
  });
}

/** Timeline for tracking pages: history events, plus the creation event for older orders. */
export async function orderTimeline(orderId: string, createdAt: Date) {
  const events = await prisma.orderStatusEvent.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } });
  const timeline = events.map((e) => ({
    status: e.status, label: STATUS_LABEL[e.status], note: e.note, location: e.location, at: e.createdAt,
  }));
  if (!timeline.some((t) => t.status === "PENDING")) {
    timeline.unshift({ status: "PENDING", label: STATUS_LABEL.PENDING, note: null, location: null, at: createdAt });
  }
  return timeline;
}
