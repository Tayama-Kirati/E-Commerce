import { NextRequest, NextResponse } from "next/server";
import { quoteShipping } from "@/app/lib/shipping";

// ─── GET /api/shipping/quote?subtotal=&province=&freeShipping=1 ───────────────

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const subtotal = Math.max(0, Number(sp.get("subtotal")) || 0);
  const quote = await quoteShipping({ subtotal, allItemsFreeShipping: sp.get("freeShipping") === "1", province: sp.get("province") });
  return NextResponse.json(quote);
}
