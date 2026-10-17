import { z } from "zod";

export const ShippingZoneSchema = z.object({
  name: z.string().trim().min(2).max(80),
  provinces: z.array(z.string().trim().min(1)).default([]),
  rate: z.number().min(0),
  freeAbove: z.number().min(0).nullable().optional(),
  estimatedDays: z.string().trim().max(20).default("2-4"),
  isActive: z.boolean().default(true),
});

export const BannerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(200).nullable().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  linkUrl: z.string().trim().max(500).nullable().optional(),
  ctaLabel: z.string().trim().max(40).nullable().optional(),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export const toDate = (s?: string | null) => (s === undefined ? undefined : s ? new Date(s) : null);
