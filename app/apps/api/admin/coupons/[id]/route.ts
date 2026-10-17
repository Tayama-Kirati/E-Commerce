import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { serializeCoupon } from "@/app/lib/coupons";
import { CouponBaseSchema, CouponInputSchema, couponData } from "@/app/lib/admin-schemas";

type Params = { params: Promise<{ id: string }> };

// ─── PUT /api/admin/coupons/:id — full edit or partial (e.g. { isActive }) ───

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  // The refinements need the whole form, so partial updates skip them
  const body = (await readJson<Record<string, unknown>>(req)) ?? {};
  const isFullForm = "code" in body && "type" in body;
  const parsed = isFullForm ? CouponInputSchema.safeParse(body) : CouponBaseSchema.partial().safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  try {
    const coupon = await prisma.coupon.update({ where: { id }, data: couponData(parsed.data) });
    return NextResponse.json({ coupon: serializeCoupon(coupon) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") return jsonError("Coupon not found", 404);
      if (err.code === "P2002") return jsonError("A coupon with this code already exists", 409);
    }
    throw err;
  }
}

export const PATCH = PUT;

// ─── DELETE /api/admin/coupons/:id — deactivates if it was ever used ─────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const coupon = await prisma.coupon.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } });
  if (!coupon) return jsonError("Coupon not found", 404);
  if (coupon._count.redemptions > 0) {
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, deactivated: true });
  }
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
