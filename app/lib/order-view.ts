import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { isAdmin, type AuthedUser } from "@/app/lib/api";
import { CUSTOMER_CANCELLABLE, ORDER_FLOW, STATUS_LABEL, isReturnable } from "@/app/lib/order-status";
import { getSettings } from "@/app/lib/settings";

const orderInclude = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  address: true,
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  returnRequests: { orderBy: { createdAt: "desc" as const }, take: 1, include: { items: true } },
  items: {
    include: {
      variant: { select: { id: true, name: true, image: true } },
      product: {
        select: {
          id: true, name: true, slug: true, isEco: true, sellerId: true,
          images: { orderBy: { order: "asc" as const }, take: 1, select: { url: true, alt: true } },
          seller: { select: { storeName: true, storeSlug: true } },
        },
      },
    },
  },
};

/** Looks an order up by id or order number, enforcing who may see it. */
export async function loadOrderForViewer(idOrNumber: string, viewer: AuthedUser) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
    include: orderInclude,
  });
  if (!order) return null;
  const sellerInvolved = viewer.sellerId != null && order.items.some((i) => i.product.sellerId === viewer.sellerId);
  if (order.userId !== viewer.id && !isAdmin(viewer.role) && !sellerInvolved) return null;
  return order;
}

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrderForViewer>>>;

const STEP_META: Record<string, { icon: string; desc: string }> = {
  PENDING: { icon: "📋", desc: "We've received your order" },
  CONFIRMED: { icon: "✅", desc: "Payment confirmed and seller notified" },
  PROCESSING: { icon: "📦", desc: "Your items are being packed" },
  SHIPPED: { icon: "🚚", desc: "Handed over to the courier" },
  OUT_FOR_DELIVERY: { icon: "🛵", desc: "The courier is on the way to you" },
  DELIVERED: { icon: "🎉", desc: "Delivered to your address" },
};

/** Step-by-step progress for the tracking pages. */
export function trackingSteps(order: LoadedOrder) {
  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const currentIdx = ORDER_FLOW.indexOf(order.status);
  const steps = ORDER_FLOW.map((key, idx) => {
    const hist = [...order.statusHistory].reverse().find((h) => h.status === key);
    return {
      key,
      label: STATUS_LABEL[key],
      desc: STEP_META[key].desc,
      icon: STEP_META[key].icon,
      done: !cancelled && currentIdx >= idx,
      active: !cancelled && currentIdx === idx,
      time: hist?.createdAt ?? (key === "PENDING" ? order.createdAt : null),
      note: hist?.note ?? hist?.location ?? null,
    };
  });
  if (cancelled) {
    const hist = order.statusHistory.find((h) => h.status === order.status);
    steps.push({
      key: order.status, label: STATUS_LABEL[order.status], desc: order.cancelReason ?? "This order was cancelled",
      icon: "❌", done: true, active: true, time: hist?.createdAt ?? order.cancelledAt ?? order.updatedAt, note: hist?.note ?? null,
    });
  }
  return steps;
}

function estimatedDelivery(order: LoadedOrder) {
  if (order.deliveredAt || order.status === "CANCELLED" || order.status === "REFUNDED") return null;
  const base = order.shippedAt ?? order.createdAt;
  return new Date(base.getTime() + (order.shippedAt ? 2 : 4) * 86_400_000);
}

export async function serializeOrderDetail(order: LoadedOrder, viewer: AuthedUser) {
  const settings = await getSettings();
  const reviewed = await prisma.review.findMany({
    where: { userId: order.userId, productId: { in: order.items.map((i) => i.productId) } },
    select: { productId: true },
  });
  const reviewedIds = new Set(reviewed.map((r) => r.productId));
  const isOwner = order.userId === viewer.id;
  const latestReturn = order.returnRequests[0] ?? null;

  const items = order.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    quantity: i.quantity,
    price: Number(i.price),
    total: Number(i.total),
    variant: i.variant ? { id: i.variant.id, name: i.variant.name } : i.variantName ? { id: null, name: i.variantName } : null,
    product: { ...i.product, images: i.variant?.image ? [{ url: i.variant.image, alt: i.product.name }] : i.product.images },
    seller: i.product.seller,
    isReviewed: reviewedIds.has(i.productId),
  }));

  const returnable =
    isOwner &&
    isReturnable(order.status, order.deliveredAt, Number(settings.returnWindowDays)) &&
    (!latestReturn || latestReturn.status === "REJECTED");

  return {
    order: {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      discount: Number(order.discount),
      total: Number(order.total),
      address: order.address ? { ...order.address, country: "Nepal" } : null,
      items,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      statusHistory: order.statusHistory,
      returnRequest: latestReturn
        ? { ...latestReturn, refundAmount: latestReturn.refundAmount != null ? Number(latestReturn.refundAmount) : null }
        : null,
      invoice: order.paymentStatus === "COMPLETED" || order.paymentMethod === "CASH_ON_DELIVERY"
        ? { invoiceNo: `INV-${order.orderNumber}`, issuedAt: order.paidAt ?? order.createdAt }
        : null,
      estimatedDelivery: estimatedDelivery(order),
      trackingUrl: null,
      returnRequests: undefined,
    },
    cancellable: isOwner && CUSTOMER_CANCELLABLE.includes(order.status as OrderStatus),
    returnable,
    reviewableItems: order.status === "DELIVERED" && isOwner ? items.filter((i) => !i.isReviewed).map((i) => i.productId) : [],
    timeline: trackingSteps(order),
  };
}
