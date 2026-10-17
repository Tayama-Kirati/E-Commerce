import type { Coupon } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { computeCouponDiscount, normalizeCouponType } from "@/app/lib/pricing";

export type CouponCheck =
  | { ok: true; coupon: Coupon; discount: number; freeShipping: boolean }
  | { ok: false; error: string; status: number };

/**
 * Validates a coupon for a specific user and order. Used both for the
 * "apply coupon" preview and again (authoritatively) when the order is placed.
 */
export async function checkCoupon(opts: {
  code: string;
  userId: string;
  subtotal: number;
  shippingCost: number;
}): Promise<CouponCheck> {
  const code = opts.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Coupon code is required", status: 400 };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) return { ok: false, error: "Invalid coupon code", status: 404 };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: "This coupon is not active yet", status: 400 };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, error: "This coupon has expired", status: 400 };
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "This coupon has reached its usage limit", status: 400 };
  }

  if (coupon.perUserLimit > 0) {
    const used = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId: opts.userId } });
    if (used >= coupon.perUserLimit) {
      return { ok: false, error: "You have already used this coupon", status: 400 };
    }
  }

  const minOrder = Number(coupon.minOrder);
  if (minOrder > 0 && opts.subtotal < minOrder) {
    return { ok: false, error: `Minimum order amount is रू ${minOrder.toLocaleString()}`, status: 400 };
  }

  const discount = computeCouponDiscount({
    type: coupon.type,
    value: Number(coupon.discount),
    maxDiscount: coupon.maxDiscount != null ? Number(coupon.maxDiscount) : null,
    subtotal: opts.subtotal,
    shippingCost: opts.shippingCost,
  });
  return { ok: true, coupon, discount, freeShipping: normalizeCouponType(coupon.type) === "FREE_SHIPPING" };
}

/** Shape used by the admin coupons page. */
export function serializeCoupon(c: Coupon) {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    type: normalizeCouponType(c.type),
    value: Number(c.discount),
    maxDiscount: c.maxDiscount != null ? Number(c.maxDiscount) : null,
    minOrderAmount: Number(c.minOrder),
    usageLimit: c.maxUses || null,
    usageCount: c.usedCount,
    perUserLimit: c.perUserLimit,
    isActive: c.isActive,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    createdAt: c.createdAt,
  };
}
