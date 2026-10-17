import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/app/lib/prisma";
import { getStripe } from "@/app/lib/stripe";
import { confirmStripeSession, PaymentError } from "@/app/lib/payments";
import { transitionOrder } from "@/app/lib/orders";

/**
 * POST /api/payments/stripe/webhook — Stripe calls this directly, so orders are
 * confirmed even if the customer closes the tab after paying.
 * Register it in the Stripe dashboard for checkout.session.completed,
 * checkout.session.async_payment_succeeded and checkout.session.expired.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    // Signature verification needs the raw, unparsed body
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    console.error("[stripe webhook] bad signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Stripe retries deliveries; skip events we've already handled
  const seen = await prisma.webhookEvent.findUnique({ where: { id: event.id } });
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") await confirmStripeSession(session.id);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, paymentStatus: true } }) : null;
      if (orderId && order?.status === "PENDING" && order.paymentStatus === "PENDING") {
        await transitionOrder(orderId, "CANCELLED", { cancelReason: "Card payment session expired" });
      }
    }
  } catch (err) {
    // Business errors (e.g. order already cancelled) are acknowledged so Stripe stops retrying
    if (!(err instanceof PaymentError)) {
      console.error("[stripe webhook]", err);
      return NextResponse.json({ error: "Handler failed" }, { status: 500 });
    }
    console.warn("[stripe webhook]", err.message);
  }

  await prisma.webhookEvent.create({ data: { id: event.id, provider: "stripe", type: event.type } });
  return NextResponse.json({ received: true });
}
