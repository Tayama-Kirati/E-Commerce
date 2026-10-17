import type { OrderStatus } from "@prisma/client";

export const ORDER_FLOW: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
];

/** Statuses a customer may still cancel from (before the parcel is handed over). */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING"];

/**
 * Staff may move an order forward along the flow (skipping steps is allowed),
 * cancel anything not yet delivered, and refund a delivered or cancelled order.
 */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (to === "CANCELLED") return !["DELIVERED", "CANCELLED", "REFUNDED"].includes(from);
  if (to === "REFUNDED") return from === "DELIVERED" || from === "CANCELLED";
  const fi = ORDER_FLOW.indexOf(from);
  const ti = ORDER_FLOW.indexOf(to);
  return fi !== -1 && ti !== -1 && ti > fi;
}

export function isReturnable(status: OrderStatus, deliveredAt: Date | null, windowDays: number, now = new Date()) {
  if (status !== "DELIVERED" || !deliveredAt) return false;
  return now.getTime() - deliveredAt.getTime() <= windowDays * 86_400_000;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Order confirmed",
  PROCESSING: "Being packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};
