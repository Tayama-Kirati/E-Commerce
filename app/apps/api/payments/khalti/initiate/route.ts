import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError, readJson } from "@/app/lib/api";
import { startKhaltiPayment, PaymentError } from "@/app/lib/payments";

// ─── POST /api/payments/khalti/initiate — { orderId } → { paymentUrl } ───────

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const body = await readJson<{ orderId?: string }>(req);
  if (!body?.orderId) return jsonError("orderId is required", 400);

  try {
    return NextResponse.json(await startKhaltiPayment(body.orderId, auth.user.id));
  } catch (err) {
    if (err instanceof PaymentError) return jsonError(err.message, err.status);
    console.error("[khalti initiate]", err);
    return jsonError("Could not reach Khalti — please try again", 502);
  }
}
