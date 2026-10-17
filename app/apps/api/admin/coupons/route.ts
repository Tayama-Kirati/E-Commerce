import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { serializeCoupon } from "@/app/lib/coupons";
import { CouponInputSchema, couponData } from "@/app/lib/admin-schemas";

// ─── GET /api/admin/coupons ───────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons: coupons.map(serializeCoupon) });
}

// ─── POST /api/admin/coupons ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const parsed = CouponInputSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  try {
    const coupon = await prisma.coupon.create({
      data: { ...couponData(parsed.data), code: parsed.data.code, type: parsed.data.type, discount: parsed.data.value, isActive: parsed.data.isActive ?? true },
    });
    return NextResponse.json({ coupon: serializeCoupon(coupon) }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return jsonError("A coupon with this code already exists", 409);
    throw err;
  }
}
