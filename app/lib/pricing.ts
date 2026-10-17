// Pure pricing rules shared by the cart, checkout and order APIs. No I/O here,
// so every rule is unit-testable (see tests/pricing.test.ts).

export const DEFAULT_SHIPPING_RATE = 150;
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 1000;
/** 1 loyalty point per रू 100 spent. */
export const POINTS_PER_RUPEE = 1 / 100;
/** Each redeemed point is worth रू 1, capped at this share of the subtotal. */
export const MAX_POINTS_REDEMPTION_SHARE = 0.2;

export type ShippingZoneRule = {
  rate: number;
  freeAbove: number | null;
  estimatedDays: string;
};

export function computeShipping(opts: {
  subtotal: number;
  allItemsFreeShipping: boolean;
  zone: ShippingZoneRule | null;
  defaultFreeAbove?: number;
}) {
  const rate = opts.zone?.rate ?? DEFAULT_SHIPPING_RATE;
  const freeAbove = opts.zone ? opts.zone.freeAbove : (opts.defaultFreeAbove ?? DEFAULT_FREE_SHIPPING_THRESHOLD);
  const free = opts.subtotal <= 0 || opts.allItemsFreeShipping || (freeAbove != null && opts.subtotal >= freeAbove);
  return {
    cost: free ? 0 : rate,
    free,
    estimatedDays: opts.zone?.estimatedDays ?? "2-4",
    /** How much more the customer must spend for free shipping (0 when already free). */
    remainingForFree: free || freeAbove == null ? 0 : Math.max(0, freeAbove - opts.subtotal),
  };
}

export type CouponKind = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

export function normalizeCouponType(type: string): CouponKind {
  const t = type.toUpperCase();
  if (t === "PERCENT" || t === "PERCENTAGE") return "PERCENTAGE";
  if (t === "FREE_SHIPPING") return "FREE_SHIPPING";
  return "FIXED";
}

/** Discount (in रू) a coupon gives on this order. Never exceeds the subtotal. */
export function computeCouponDiscount(opts: {
  type: string;
  value: number;
  maxDiscount?: number | null;
  subtotal: number;
  shippingCost: number;
}) {
  const kind = normalizeCouponType(opts.type);
  let discount: number;
  if (kind === "PERCENTAGE") discount = Math.round(opts.subtotal * (opts.value / 100));
  else if (kind === "FREE_SHIPPING") discount = opts.shippingCost;
  else discount = opts.value;

  if (opts.maxDiscount != null && opts.maxDiscount > 0) discount = Math.min(discount, opts.maxDiscount);
  const cap = kind === "FREE_SHIPPING" ? opts.shippingCost : opts.subtotal;
  return Math.max(0, Math.min(discount, cap));
}

export function computePointsRedemption(requested: number, available: number, subtotal: number) {
  const maxBySubtotal = Math.floor(subtotal * MAX_POINTS_REDEMPTION_SHARE);
  return Math.max(0, Math.min(Math.floor(requested), available, maxBySubtotal));
}

export function computePointsEarned(total: number) {
  return Math.max(0, Math.floor(total * POINTS_PER_RUPEE));
}

export function loyaltyTierFor(points: number) {
  if (points >= 10000) return "PLATINUM";
  if (points >= 5000) return "GOLD";
  if (points >= 1500) return "SILVER";
  return "BRONZE";
}

export function computeOrderTotals(opts: {
  subtotal: number;
  shippingCost: number;
  couponDiscount: number;
  pointsDiscount: number;
}) {
  const discount = opts.couponDiscount + opts.pointsDiscount;
  const total = Math.max(0, opts.subtotal + opts.shippingCost - discount);
  return { discount, total };
}

/** Seller earnings after the platform commission. */
export function sellerNet(gross: number, commissionRatePct: number) {
  return Math.round(gross * (1 - commissionRatePct / 100));
}
