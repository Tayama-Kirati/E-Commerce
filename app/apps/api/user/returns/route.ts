import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/api";

const REASON_LABEL: Record<string, string> = {
  WRONG_ITEM: "I received the wrong item",
  DAMAGED: "Item arrived damaged",
  NOT_AS_DESCRIBED: "Item not as described",
  CHANGED_MIND: "Changed my mind",
  QUALITY_ISSUE: "Quality issue",
  MISSING_PARTS: "Missing parts or accessories",
  OTHER: "Other reason",
};

// Index into the My Returns progress tracker (RETURN_STEPS / CANCEL_STEPS)
const RETURN_STEP: Record<string, number> = { REQUESTED: 0, APPROVED: 1, RECEIVED: 3, REFUNDED: 5, REJECTED: 0 };
const RETURN_NOTE: Record<string, string> = {
  REQUESTED: "We've received your return request and will review it within 2 business days.",
  APPROVED: "Your return was approved. Our courier will contact you to pick up the package — please pack it securely in its original packaging.",
  RECEIVED: "We've received your return package and are checking it.",
  REFUNDED: "Your refund has been issued to your original payment method.",
  REJECTED: "Your return request was not approved.",
};

const fmt = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19);

// ─── GET /api/user/returns — return requests and cancelled orders ────────────

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  const productSelect = { name: true, images: { take: 1, orderBy: { order: "asc" as const }, select: { url: true } } };
  const [returns, cancelled] = await Promise.all([
    prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { orderNumber: true, paymentMethod: true } },
        items: { include: { orderItem: { select: { price: true, quantity: true, product: { select: productSelect } } } } },
      },
    }),
    prisma.order.findMany({
      where: { userId, status: "CANCELLED" },
      orderBy: { cancelledAt: "desc" },
      include: { items: { take: 1, select: { price: true, quantity: true, product: { select: productSelect } } } },
    }),
  ]);

  const items = [
    ...returns.map((r) => {
      const first = r.items[0]?.orderItem;
      return {
        id: r.id,
        type: "return" as const,
        orderId: r.order.orderNumber,
        raCode: `RN-${r.id.slice(-10).toUpperCase()}`,
        returnedOn: fmt(r.createdAt),
        refundMethod: r.order.paymentMethod === "CASH_ON_DELIVERY" ? "BANK_OR_WALLET" : "ORIGINAL_PAYMENT",
        status: r.status,
        statusStep: RETURN_STEP[r.status] ?? 0,
        statusNote: r.adminNote ? `${RETURN_NOTE[r.status]} ${r.adminNote}` : RETURN_NOTE[r.status],
        statusNoteDate: fmt(r.updatedAt),
        product: {
          name: first?.product.name ?? "Item",
          image: first?.product.images[0]?.url ?? null,
          price: first ? Number(first.price) : 0,
          qty: r.items.reduce((s, i) => s + i.quantity, 0),
          reason: REASON_LABEL[r.reason] ?? r.reason,
        },
      };
    }),
    ...cancelled.map((o) => {
      const first = o.items[0];
      const refunded = o.paymentStatus === "REFUNDED";
      return {
        id: o.id,
        type: "cancellation" as const,
        orderId: o.orderNumber,
        raCode: `CN-${o.id.slice(-10).toUpperCase()}`,
        returnedOn: fmt(o.cancelledAt ?? o.updatedAt),
        refundMethod: "ORIGINAL_PAYMENT",
        status: "CANCELLED",
        // Unpaid (e.g. COD) cancellations stop at "approved"; paid ones go on to the refund steps
        statusStep: refunded ? 4 : 2,
        statusNote: refunded
          ? "Your cancellation was approved. The refund will reach your original payment method in 3–7 business days."
          : "Your order was cancelled. No payment was taken.",
        statusNoteDate: fmt(o.cancelledAt ?? o.updatedAt),
        product: {
          name: first?.product.name ?? "Order",
          image: first?.product.images[0]?.url ?? null,
          price: first ? Number(first.price) : 0,
          qty: first?.quantity ?? 1,
          reason: o.cancelReason ?? "Cancelled",
        },
      };
    }),
  ].sort((a, b) => b.returnedOn.localeCompare(a.returnedOn));

  return NextResponse.json({ items });
}
