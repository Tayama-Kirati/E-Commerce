import { NextRequest, NextResponse } from "next/server";
import { reconcilePendingPayments } from "@/app/lib/payments";

/**
 * GET /api/payments/reconcile — run every few minutes by a scheduler (see vercel.json).
 * Confirms Khalti/Stripe payments whose customer never returned to the site and
 * cancels unpaid online orders after an hour. Requires `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await reconcilePendingPayments());
}
