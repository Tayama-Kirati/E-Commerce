import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError, readJson, zodError } from "@/app/lib/api";
import { isReturnable } from "@/app/lib/order-status";
import { getSettings } from "@/app/lib/settings";
import { notifyAdmins } from "@/app/lib/notify";
import { saveImage, ImageError } from "@/app/lib/storage";

type Params = { params: Promise<{ id: string }> };

const ReturnSchema = z.object({
  reason: z.enum(["WRONG_ITEM", "DAMAGED", "NOT_AS_DESCRIBED", "CHANGED_MIND", "QUALITY_ISSUE", "MISSING_PARTS", "OTHER"]),
  description: z.string().min(10).max(1000),
  itemIds: z.array(z.string()).min(1),
  // Data URIs from the browser (uploaded below) or already-hosted URLs
  images: z.array(z.string().max(14_000_000)).max(5).default([]),
});

// ─── POST /api/orders/:id/return — request a return for delivered items ──────

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = ReturnSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const data = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id, userId: auth.user.id },
    include: { items: true, returnRequests: { where: { status: { not: "REJECTED" } } } },
  });
  if (!order) return jsonError("Order not found", 404);

  const { returnWindowDays } = await getSettings();
  if (!isReturnable(order.status, order.deliveredAt, Number(returnWindowDays))) {
    return jsonError(`Returns are only possible within ${returnWindowDays} days of delivery`, 400);
  }
  if (order.returnRequests.length) return jsonError("A return is already open for this order", 409);

  const chosen = order.items.filter((i) => data.itemIds.includes(i.id));
  if (chosen.length !== data.itemIds.length) return jsonError("Some selected items are not part of this order", 400);

  let images: string[];
  try {
    images = await Promise.all(data.images.map((img) => saveImage(img, "peanut/returns")));
  } catch (err) {
    if (err instanceof ImageError) return jsonError(err.message, 400);
    throw err;
  }

  const refundAmount = chosen.reduce((s, i) => s + Number(i.total), 0);
  const request = await prisma.returnRequest.create({
    data: {
      orderId: order.id,
      userId: auth.user.id,
      reason: data.reason,
      description: data.description,
      images,
      refundAmount,
      items: { create: chosen.map((i) => ({ orderItemId: i.id, quantity: i.quantity })) },
    },
  });

  await prisma.notification.create({
    data: {
      userId: auth.user.id,
      type: "ORDER",
      title: "Return requested",
      body: `We've received your return request for order ${order.orderNumber}. We'll review it within 2 business days.`,
    },
  });
  await notifyAdmins("New return request", `Order ${order.orderNumber} — ${data.reason.replace(/_/g, " ").toLowerCase()}`, "ORDER");

  return NextResponse.json({ returnRequest: request, message: "Return requested" }, { status: 201 });
}
