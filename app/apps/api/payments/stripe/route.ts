import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError, readJson } from "@/app/lib/api";
import { startStripePayment, confirmStripeSession, PaymentError } from "@/app/lib/payments";

type Body = { action?: "verify"; orderId?: string; sessionId?: string };

// ─── POST /api/payments/stripe — { orderId } starts Checkout, { action: "verify", orderId, sessionId } confirms it ─

export async function POST(req: NextRequest) {
  const body = (await readJson<Body>(req)) ?? {};
  if (!body.orderId) return jsonError("orderId is required", 400);

  try {
    if (body.action === "verify") {
      if (!body.sessionId) return jsonError("sessionId is required", 400);
      const { order } = await confirmStripeSession(body.sessionId, body.orderId);
      return NextResponse.json({ success: true, order: { id: order.id, orderNumber: order.orderNumber } });
    }

    const auth = await requireUser();
    if (auth.error) return auth.error;
    return NextResponse.json(await startStripePayment(body.orderId, auth.user.id));
  } catch (err) {
    if (err instanceof PaymentError) return jsonError(err.message, err.status);
    console.error("[stripe]", err);
    return jsonError("Could not reach the card processor — please try again", 502);
  }
}
