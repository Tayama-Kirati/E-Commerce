import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, jsonError, readJson, zodError, isAdmin } from "@/app/lib/api";
import { transitionOrder, OrderTransitionError } from "@/app/lib/orders";

type Params = { params: Promise<{ id: string }> };

const ShipSchema = z.object({
  trackingNumber: z.string().trim().min(3, "Tracking number is required").max(100),
  courier: z.string().trim().max(100).optional(),
  carrier: z.string().trim().max(100).optional(),
  trackingUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional(),
});

// ─── POST /api/seller/orders/:id/ship — hand the parcel to a courier ─────────

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = ShipSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const data = parsed.data;

  const order = await prisma.order.findFirst({
    where: {
      id,
      ...(isAdmin(auth.user.role) ? {} : { items: { some: { product: { sellerId: auth.user.sellerId! } } } }),
    },
    select: { id: true, status: true, paymentMethod: true, paymentStatus: true },
  });
  if (!order) return jsonError("Order not found", 404);

  // Never ship an online order that hasn't been paid
  if (order.paymentMethod !== "CASH_ON_DELIVERY" && order.paymentStatus !== "COMPLETED") {
    return jsonError("This order hasn't been paid yet — don't ship it", 400);
  }

  const carrier = data.courier || data.carrier || null;
  const note = [data.note, data.trackingUrl ? `Track: ${data.trackingUrl}` : null].filter(Boolean).join(" — ") || null;
  try {
    await transitionOrder(order.id, "SHIPPED", { trackingNumber: data.trackingNumber, carrier, note });
  } catch (err) {
    if (err instanceof OrderTransitionError) return jsonError(err.message, err.status);
    throw err;
  }
  return NextResponse.json({ success: true, message: "Order marked as shipped" });
}
