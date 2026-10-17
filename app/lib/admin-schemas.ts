import { z } from "zod";

// Matches the admin coupons form (type/value/usageLimit) and maps onto the Coupon table
export const CouponBaseSchema = z.object({
    code: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only").transform((c) => c.toUpperCase()),
    description: z.string().max(300).optional().nullable(),
    type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
    value: z.number().min(0),
    minOrderAmount: z.number().min(0).optional().nullable(),
    maxDiscount: z.number().positive().optional().nullable(),
    usageLimit: z.number().int().min(0).optional().nullable(),
    perUserLimit: z.number().int().min(0).default(1),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    appliesToAll: z.boolean().optional(),
});

export const CouponInputSchema = CouponBaseSchema
  .refine((d) => d.type !== "PERCENTAGE" || (d.value > 0 && d.value <= 100), { message: "Percentage must be between 1 and 100", path: ["value"] })
  .refine((d) => d.type === "FREE_SHIPPING" || d.value > 0, { message: "Enter a discount value", path: ["value"] })
  .refine((d) => !d.startsAt || !d.expiresAt || new Date(d.startsAt) < new Date(d.expiresAt), { message: "Expiry must be after the start date", path: ["expiresAt"] });

export type CouponInput = z.infer<typeof CouponInputSchema>;

const date = (s?: string | null) => (s ? new Date(s) : null);

export function couponData(d: Partial<CouponInput>) {
  return {
    ...(d.code !== undefined && { code: d.code }),
    ...(d.description !== undefined && { description: d.description }),
    ...(d.type !== undefined && { type: d.type }),
    ...(d.value !== undefined && { discount: d.value }),
    ...(d.minOrderAmount !== undefined && { minOrder: d.minOrderAmount ?? 0 }),
    ...(d.maxDiscount !== undefined && { maxDiscount: d.maxDiscount }),
    ...(d.usageLimit !== undefined && { maxUses: d.usageLimit ?? 0 }),
    ...(d.perUserLimit !== undefined && { perUserLimit: d.perUserLimit }),
    ...(d.startsAt !== undefined && { startsAt: date(d.startsAt) }),
    ...(d.expiresAt !== undefined && { expiresAt: date(d.expiresAt) }),
    ...(d.isActive !== undefined && { isActive: d.isActive }),
  };
}
