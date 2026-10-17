import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError, readJson } from "@/app/lib/api";
import { startKhaltiPayment, confirmKhaltiPayment, PaymentError } from "@/app/lib/payments";

type Body = { action?: "verify"; orderId?: string; pidx?: string };

// ─── POST /api/payments/khalti — { orderId } starts a payment, { action: "verify", orderId, pidx } confirms it ─

export async function POST(req: NextRequest) {
  const body = (await readJson<Body>(req)) ?? {};
  if (!body.orderId) return jsonError("orderId is required", 400);

  try {
    if (body.action === "verify") {
      // No session needed: Khalti's lookup API is the source of truth, and the pidx must match the order
      if (!body.pidx) return jsonError("pidx is required", 400);
      const { order } = await confirmKhaltiPayment(body.orderId, body.pidx);
      return NextResponse.json({ success: true, order: { id: order.id, orderNumber: order.orderNumber } });
    }

    const auth = await requireUser();
    if (auth.error) return auth.error;
    return NextResponse.json(await startKhaltiPayment(body.orderId, auth.user.id));
  } catch (err) {
    if (err instanceof PaymentError) return jsonError(err.message, err.status);
    console.error("[khalti]", err);
    return jsonError("Could not reach Khalti — please try again", 502);
  }
}
