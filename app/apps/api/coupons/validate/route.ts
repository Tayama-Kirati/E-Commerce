import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const code: string = (body.code ?? "").trim().toUpperCase();
  const orderTotal: number = Number(body.orderTotal ?? 0);

  if (!code) return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });

  const coupon = await prisma.coupon.findFirst({
    where: { code, isActive: true },
  });

  if (!coupon) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
  }
  const minOrder = Number(coupon.minOrder);
  if (minOrder > 0 && orderTotal < minOrder) {
    return NextResponse.json(
      { error: `Minimum order amount is रू ${minOrder.toLocaleString()}` },
      { status: 400 }
    );
  }

  const discountPct = Number(coupon.discount);
  const discountAmount =
    coupon.type === "percent"
      ? Math.round(orderTotal * (discountPct / 100))
      : Math.min(discountPct, orderTotal);

  return NextResponse.json({
    valid: true,
    coupon: { id: coupon.id, code: coupon.code, type: coupon.type, discount: discountPct },
    discountAmount,
  });
}
