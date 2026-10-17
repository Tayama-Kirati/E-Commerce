import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  coupon: { findUnique: vi.fn() },
  couponRedemption: { count: vi.fn() },
}));
vi.mock("@/app/lib/prisma", () => ({ prisma: db }));

import { checkCoupon } from "@/app/lib/coupons";

const base = {
  id: "c1", code: "SAVE10", description: null, type: "PERCENTAGE", discount: 10, maxDiscount: null,
  minOrder: 0, maxUses: 0, perUserLimit: 1, usedCount: 0, isActive: true, startsAt: null, expiresAt: null, createdAt: new Date(),
};

describe("checkCoupon", () => {
  beforeEach(() => {
    db.coupon.findUnique.mockReset();
    db.couponRedemption.count.mockReset().mockResolvedValue(0);
  });

  it("applies a valid coupon (case-insensitive code)", async () => {
    db.coupon.findUnique.mockResolvedValue(base);
    const r = await checkCoupon({ code: " save10 ", userId: "u1", subtotal: 2000, shippingCost: 150 });
    expect(db.coupon.findUnique).toHaveBeenCalledWith({ where: { code: "SAVE10" } });
    expect(r).toMatchObject({ ok: true, discount: 200 });
  });

  it("rejects unknown and inactive coupons", async () => {
    db.coupon.findUnique.mockResolvedValue(null);
    expect(await checkCoupon({ code: "NOPE", userId: "u1", subtotal: 100, shippingCost: 0 })).toMatchObject({ ok: false, status: 404 });
    db.coupon.findUnique.mockResolvedValue({ ...base, isActive: false });
    expect(await checkCoupon({ code: "SAVE10", userId: "u1", subtotal: 100, shippingCost: 0 })).toMatchObject({ ok: false, status: 404 });
  });

  it("rejects expired and not-yet-started coupons", async () => {
    db.coupon.findUnique.mockResolvedValue({ ...base, expiresAt: new Date(Date.now() - 1000) });
    expect(await checkCoupon({ code: "SAVE10", userId: "u1", subtotal: 100, shippingCost: 0 })).toMatchObject({ ok: false, error: "This coupon has expired" });
    db.coupon.findUnique.mockResolvedValue({ ...base, startsAt: new Date(Date.now() + 86_400_000) });
    expect(await checkCoupon({ code: "SAVE10", userId: "u1", subtotal: 100, shippingCost: 0 })).toMatchObject({ ok: false });
  });

  it("enforces the global usage limit", async () => {
    db.coupon.findUnique.mockResolvedValue({ ...base, maxUses: 5, usedCount: 5 });
    expect(await checkCoupon({ code: "SAVE10", userId: "u1", subtotal: 100, shippingCost: 0 })).toMatchObject({ ok: false });
  });

  it("stops one customer reusing a single-use coupon", async () => {
    db.coupon.findUnique.mockResolvedValue(base);
    db.couponRedemption.count.mockResolvedValue(1);
    expect(await checkCoupon({ code: "SAVE10", userId: "u1", subtotal: 2000, shippingCost: 0 })).toMatchObject({ ok: false, error: "You have already used this coupon" });
  });

  it("enforces the minimum order", async () => {
    db.coupon.findUnique.mockResolvedValue({ ...base, minOrder: 1500 });
    const r = await checkCoupon({ code: "SAVE10", userId: "u1", subtotal: 1000, shippingCost: 0 });
    expect(r.ok).toBe(false);
  });
});
