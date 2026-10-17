import { prisma } from "@/app/lib/prisma";
import { appUrl } from "@/app/lib/api";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "@/app/lib/khalti";
import { getStripe, isStripeConfigured, toStripeAmount } from "@/app/lib/stripe";
import { markOrderPaid, transitionOrder } from "@/app/lib/orders";

export class PaymentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

async function payableOrder(orderId: string, userId: string, method: "KHALTI" | "STRIPE") {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { user: true, items: { include: { product: { select: { name: true } } } } },
  });
  if (!order) throw new PaymentError("Order not found", 404);
  if (order.paymentStatus === "COMPLETED") throw new PaymentError("This order is already paid", 409);
  if (order.status === "CANCELLED") throw new PaymentError("This order was cancelled", 409);
  if (order.paymentMethod !== method) throw new PaymentError("This order uses a different payment method", 400);
  return order;
}

// ── Khalti ───────────────────────────────────────────────────────────────────

export async function startKhaltiPayment(orderId: string, userId: string) {
  if (!process.env.KHALTI_SECRET_KEY) throw new PaymentError("Khalti payments are not configured", 503);
  const order = await payableOrder(orderId, userId, "KHALTI");
  const payment = await initiateKhaltiPayment({
    orderId: order.id,
    amount: Math.round(Number(order.total) * 100),
    orderName: `PeaNut Order ${order.orderNumber}`,
    returnUrl: appUrl(`/checkout/verify?gateway=khalti&orderId=${order.id}`),
    customerName: order.user.name ?? "Customer",
    customerEmail: order.user.email,
    customerPhone: order.user.phone ?? "9800000000",
  });
  await prisma.order.update({ where: { id: order.id }, data: { paymentRef: payment.pidx, paymentGateway: "khalti" } });
  return { paymentUrl: payment.payment_url, pidx: payment.pidx };
}

/**
 * Confirms a Khalti payment with Khalti's lookup API. The pidx must be the one
 * we issued for this order and the paid amount must match the order total, so a
 * forged return URL can't mark an order paid.
 */
export async function confirmKhaltiPayment(orderId: string, pidx: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new PaymentError("Order not found", 404);
  if (order.paymentStatus === "COMPLETED") return { order, alreadyPaid: true };
  if (!order.paymentRef || order.paymentRef !== pidx) throw new PaymentError("Payment reference does not match this order");

  const result = await verifyKhaltiPayment(pidx);
  if (result.status !== "Completed") {
    throw new PaymentError(result.status === "Pending" ? "Payment is still pending — please wait a moment" : `Payment ${result.status.toLowerCase()}`);
  }
  if (result.total_amount !== Math.round(Number(order.total) * 100)) {
    console.error(`[khalti] amount mismatch for ${order.orderNumber}: paid ${result.total_amount}, expected ${Number(order.total) * 100}`);
    throw new PaymentError("Paid amount does not match the order total — please contact support");
  }
  await markOrderPaid(order.id, { gateway: "khalti", ref: result.transaction_id ?? pidx });
  return { order, alreadyPaid: false };
}

// ── Stripe ───────────────────────────────────────────────────────────────────

export async function startStripePayment(orderId: string, userId: string) {
  if (!isStripeConfigured()) throw new PaymentError("Card payments are not available right now", 503);
  const order = await payableOrder(orderId, userId, "STRIPE");

  // Charge the order total as a single line so discounts and shipping always match
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: order.user.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.orderNumber } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "npr",
          unit_amount: toStripeAmount(Number(order.total)),
          product_data: {
            name: `PeaNut order ${order.orderNumber}`,
            description: order.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ").slice(0, 500),
          },
        },
      },
    ],
    success_url: appUrl(`/checkout/verify?gateway=stripe&orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: appUrl(`/?page=orders&payment=cancelled`),
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  });
  await prisma.order.update({ where: { id: order.id }, data: { paymentRef: session.id, paymentGateway: "stripe" } });
  return { paymentUrl: session.url, sessionId: session.id };
}

/** Confirms a Stripe Checkout session (from the return page or the webhook). */
export async function confirmStripeSession(sessionId: string, expectedOrderId?: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId || (expectedOrderId && orderId !== expectedOrderId)) throw new PaymentError("Payment does not belong to this order");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new PaymentError("Order not found", 404);
  if (order.paymentStatus === "COMPLETED") return { order, alreadyPaid: true };
  if (session.payment_status !== "paid") throw new PaymentError("Payment not completed yet");
  if (session.amount_total !== toStripeAmount(Number(order.total))) {
    throw new PaymentError("Paid amount does not match the order total — please contact support");
  }

  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  await markOrderPaid(order.id, { gateway: "stripe", ref: paymentIntent ?? session.id });
  return { order, alreadyPaid: false };
}

// ── Reconciliation ───────────────────────────────────────────────────────────

const UNPAID_TTL_MS = 60 * 60 * 1000;

/**
 * Settles online payments whose customer never came back to the return page,
 * and cancels unpaid online orders after an hour so their stock is released.
 */
export async function reconcilePendingPayments() {
  const pending = await prisma.order.findMany({
    where: { paymentStatus: "PENDING", status: "PENDING", paymentMethod: { in: ["KHALTI", "STRIPE"] }, createdAt: { lt: new Date(Date.now() - 2 * 60 * 1000) } },
    select: { id: true, orderNumber: true, paymentMethod: true, paymentRef: true, createdAt: true },
    take: 100,
  });

  const summary = { checked: pending.length, paid: 0, cancelled: 0, errors: 0 };
  for (const o of pending) {
    try {
      let paid = false;
      if (o.paymentMethod === "KHALTI" && o.paymentRef && process.env.KHALTI_SECRET_KEY) {
        const r = await verifyKhaltiPayment(o.paymentRef);
        if (r.status === "Completed") {
          await confirmKhaltiPayment(o.id, o.paymentRef);
          paid = true;
        }
      } else if (o.paymentMethod === "STRIPE" && o.paymentRef?.startsWith("cs_") && isStripeConfigured()) {
        const s = await getStripe().checkout.sessions.retrieve(o.paymentRef);
        if (s.payment_status === "paid") {
          await confirmStripeSession(o.paymentRef, o.id);
          paid = true;
        }
      }
      if (paid) summary.paid++;
      else if (Date.now() - o.createdAt.getTime() > UNPAID_TTL_MS) {
        await transitionOrder(o.id, "CANCELLED", { cancelReason: "Payment was not completed within 1 hour" });
        summary.cancelled++;
      }
    } catch (err) {
      summary.errors++;
      console.error(`[reconcile] ${o.orderNumber}`, err);
    }
  }
  return summary;
}
