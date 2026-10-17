import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, SELLER_ROLES, jsonError, readJson, zodError, isAdmin } from "@/app/lib/api";
import { loadOrderForViewer, serializeOrderDetail } from "@/app/lib/order-view";
import { transitionOrder, OrderTransitionError } from "@/app/lib/orders";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/orders/:id — order detail for the buyer, an admin, or an involved seller ─

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const order = await loadOrderForViewer(id, auth.user);
  if (!order) return jsonError("Order not found", 404);
  return NextResponse.json(await serializeOrderDetail(order, auth.user));
}

// ─── PATCH /api/orders/:id — status / tracking updates by sellers and admins ─

const UpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  currentLocation: z.string().max(200).optional().nullable(),
  trackingNumber: z.string().max(100).optional().nullable(),
  carrier: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireUser(SELLER_ROLES);
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = UpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const data = parsed.data;

  const order = await loadOrderForViewer(id, auth.user);
  if (!order) return jsonError("Order not found", 404);
  if (!isAdmin(auth.user.role) && order.userId === auth.user.id) return jsonError("Forbidden", 403);
  // Refunds are an admin decision (they follow a return review)
  if (data.status === "REFUNDED" && !isAdmin(auth.user.role)) return jsonError("Only admins can refund orders", 403);

  try {
    if (data.status && data.status !== order.status) {
      await transitionOrder(order.id, data.status, {
        note: data.note,
        location: data.currentLocation,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
      });
    } else {
      // Tracking-only update (e.g. location changed while in transit)
      await prisma.order.update({
        where: { id: order.id },
        data: {
          ...(data.currentLocation !== undefined && { currentLocation: data.currentLocation }),
          ...(data.trackingNumber !== undefined && { trackingNumber: data.trackingNumber }),
          ...(data.carrier !== undefined && { carrier: data.carrier }),
        },
      });
      if (data.currentLocation) {
        await prisma.orderStatusEvent.create({ data: { orderId: order.id, status: order.status, location: data.currentLocation, note: data.note } });
      }
    }
  } catch (err) {
    if (err instanceof OrderTransitionError) return jsonError(err.message, err.status);
    throw err;
  }

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    select: { id: true, status: true, currentLocation: true, trackingNumber: true, carrier: true },
  });
  return NextResponse.json({ order: updated });
}
