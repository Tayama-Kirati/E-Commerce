import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/app/lib/api";
import { loadOrderForViewer, serializeOrderDetail } from "@/app/lib/order-view";

// ─── GET /api/orders/track?orderNumber= ───────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const orderNumber = req.nextUrl.searchParams.get("orderNumber")?.trim();
  if (!orderNumber) return jsonError("orderNumber required", 400);

  const order = await loadOrderForViewer(orderNumber, auth.user);
  if (!order) return jsonError("Order not found", 404);

  const { order: detail, timeline } = await serializeOrderDetail(order, auth.user);
  return NextResponse.json({ order: detail, timeline });
}
