import { describe, expect, it } from "vitest";
import {
  computeCouponDiscount, computeOrderTotals, computePointsEarned, computePointsRedemption,
  computeShipping, loyaltyTierFor, normalizeCouponType, sellerNet,
} from "@/app/lib/pricing";

describe("computeShipping", () => {
  it("charges the default rate below the free-shipping threshold", () => {
    expect(computeShipping({ subtotal: 500, allItemsFreeShipping: false, zone: null })).toMatchObject({ cost: 150, free: false, remainingForFree: 500 });
  });

  it("is free at or above the threshold", () => {
    expect(computeShipping({ subtotal: 1000, allItemsFreeShipping: false, zone: null }).cost).toBe(0);
  });

  it("is free when every item ships free", () => {
    expect(computeShipping({ subtotal: 10, allItemsFreeShipping: true, zone: null }).cost).toBe(0);
  });

  it("uses the zone's rate and threshold", () => {
    const zone = { rate: 300, freeAbove: 5000, estimatedDays: "4-6" };
    expect(computeShipping({ subtotal: 2000, allItemsFreeShipping: false, zone })).toMatchObject({ cost: 300, remainingForFree: 3000, estimatedDays: "4-6" });
    expect(computeShipping({ subtotal: 5000, allItemsFreeShipping: false, zone }).cost).toBe(0);
  });

  it("never makes a zone without a threshold free", () => {
    const zone = { rate: 200, freeAbove: null, estimatedDays: "5-7" };
    expect(computeShipping({ subtotal: 999999, allItemsFreeShipping: false, zone })).toMatchObject({ cost: 200, remainingForFree: 0 });
  });

  it("respects a custom default threshold from settings", () => {
    expect(computeShipping({ subtotal: 1500, allItemsFreeShipping: false, zone: null, defaultFreeAbove: 2000 }).cost).toBe(150);
  });
});

describe("coupons", () => {
  it("normalises legacy coupon types", () => {
    expect(normalizeCouponType("percent")).toBe("PERCENTAGE");
    expect(normalizeCouponType("fixed")).toBe("FIXED");
    expect(normalizeCouponType("FREE_SHIPPING")).toBe("FREE_SHIPPING");
  });

  it("applies a percentage, capped by maxDiscount", () => {
    expect(computeCouponDiscount({ type: "PERCENTAGE", value: 10, subtotal: 2000, shippingCost: 150 })).toBe(200);
    expect(computeCouponDiscount({ type: "PERCENTAGE", value: 50, maxDiscount: 300, subtotal: 2000, shippingCost: 150 })).toBe(300);
  });

  it("never discounts more than the subtotal", () => {
    expect(computeCouponDiscount({ type: "FIXED", value: 5000, subtotal: 1200, shippingCost: 0 })).toBe(1200);
  });

  it("free-shipping coupons cover only the shipping cost", () => {
    expect(computeCouponDiscount({ type: "FREE_SHIPPING", value: 0, subtotal: 800, shippingCost: 150 })).toBe(150);
    expect(computeCouponDiscount({ type: "FREE_SHIPPING", value: 0, subtotal: 800, shippingCost: 0 })).toBe(0);
  });
});

describe("loyalty points", () => {
  it("earns 1 point per रू 100", () => {
    expect(computePointsEarned(2599)).toBe(25);
    expect(computePointsEarned(99)).toBe(0);
  });

  it("caps redemption by balance and by 20% of the subtotal", () => {
    expect(computePointsRedemption(500, 10000, 1000)).toBe(200);
    expect(computePointsRedemption(500, 120, 10000)).toBe(120);
    expect(computePointsRedemption(-5, 100, 1000)).toBe(0);
  });

  it("assigns tiers", () => {
    expect(loyaltyTierFor(0)).toBe("BRONZE");
    expect(loyaltyTierFor(1500)).toBe("SILVER");
    expect(loyaltyTierFor(5000)).toBe("GOLD");
    expect(loyaltyTierFor(10000)).toBe("PLATINUM");
  });
});

describe("order totals", () => {
  it("subtracts coupon and points from subtotal + shipping", () => {
    expect(computeOrderTotals({ subtotal: 2000, shippingCost: 150, couponDiscount: 200, pointsDiscount: 50 })).toEqual({ discount: 250, total: 1900 });
  });

  it("never goes below zero", () => {
    expect(computeOrderTotals({ subtotal: 100, shippingCost: 0, couponDiscount: 100, pointsDiscount: 20 }).total).toBe(0);
  });

  it("computes seller earnings after commission", () => {
    expect(sellerNet(10000, 8)).toBe(9200);
  });
});
