import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { transitionOrder, OrderTransitionError } from "@/app/lib/orders";

type Params = { params: Promise<{ id: string }> };

const StatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"]),
  note: z.string().trim().max(500).optional(),
  location: z.string().trim().max(200).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  carrier: z.string().trim().max(100).optional(),
});

// ─── PUT /api/admin/orders/:id/status ─────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = StatusSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { status, note, location, trackingNumber, carrier } = parsed.data;

  try {
    await transitionOrder(id, status, {
      note: note ?? null,
      location: location ?? null,
      ...(trackingNumber && { trackingNumber }),
      ...(carrier && { carrier }),
      ...(status === "CANCELLED" && { cancelReason: note ?? "Cancelled by PeaNut support" }),
    });
  } catch (err) {
    if (err instanceof OrderTransitionError) return jsonError(err.message, err.status);
    throw err;
  }

  const order = await prisma.order.findUniqueOrThrow({ where: { id }, select: { id: true, status: true, paymentStatus: true, trackingNumber: true } });
  return NextResponse.json({ order });
}

export const PATCH = PUT;
