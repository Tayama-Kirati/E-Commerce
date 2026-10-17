import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, jsonError, readJson, zodError, isAdmin } from "@/app/lib/api";
import { loadOrderForViewer } from "@/app/lib/order-view";
import { CUSTOMER_CANCELLABLE } from "@/app/lib/order-status";
import { transitionOrder, OrderTransitionError } from "@/app/lib/orders";

type Params = { params: Promise<{ id: string }> };

const REASONS: Record<string, string> = {
  CHANGED_MIND: "Changed my mind",
  FOUND_CHEAPER: "Found a better price elsewhere",
  ORDERED_BY_MISTAKE: "Ordered by mistake",
  DELIVERY_TOO_SLOW: "Delivery time too long",
  OTHER: "Other",
};

const CancelSchema = z.object({
  reason: z.string().max(50).default("CHANGED_MIND"),
  note: z.string().max(500).optional(),
});

// ─── POST /api/orders/:id/cancel ──────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = CancelSchema.safeParse((await readJson(req)) ?? {});
  if (!parsed.success) return zodError(parsed.error);

  const order = await loadOrderForViewer(id, auth.user);
  if (!order) return jsonError("Order not found", 404);
  const owner = order.userId === auth.user.id;
  if (!owner && !isAdmin(auth.user.role)) return jsonError("Forbidden", 403);
  if (owner && !isAdmin(auth.user.role) && !CUSTOMER_CANCELLABLE.includes(order.status)) {
    return jsonError("This order has already shipped and can no longer be cancelled. You can request a return after delivery.", 400);
  }

  const reasonText = REASONS[parsed.data.reason] ?? parsed.data.reason;
  try {
    await transitionOrder(order.id, "CANCELLED", {
      cancelReason: parsed.data.note ? `${reasonText} — ${parsed.data.note}` : reasonText,
    });
  } catch (err) {
    if (err instanceof OrderTransitionError) return jsonError(err.message, err.status);
    throw err;
  }

  const paidOnline = order.paymentStatus === "COMPLETED" && order.paymentMethod !== "CASH_ON_DELIVERY";
  return NextResponse.json({
    success: true,
    message: paidOnline
      ? "Order cancelled. Your refund will reach your original payment method in 3–7 business days."
      : "Order cancelled successfully.",
  });
}
