import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/app/lib/api";
import { loadOrderForViewer, serializeOrderDetail } from "@/app/lib/order-view";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/orders/:idOrNumber/track ────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const order = await loadOrderForViewer(decodeURIComponent(id).trim(), auth.user);
  if (!order) return jsonError("Order not found. Check the order number and try again.", 404);

  const { order: detail, timeline } = await serializeOrderDetail(order, auth.user);
  return NextResponse.json({ order: detail, timeline });
}
