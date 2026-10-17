import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, readJson, zodError } from "@/app/lib/api";
import { getSettings, updateSettings } from "@/app/lib/settings";

const SettingsSchema = z
  .object({
    siteName: z.string().trim().min(2).max(60),
    siteTagline: z.string().trim().max(120),
    supportEmail: z.string().email(),
    commissionRate: z.number().min(0).max(50),
    minWithdrawal: z.number().min(0),
    maxWithdrawal: z.number().positive(),
    payoutCycle: z.number().int().min(0).max(90),
    freeShippingThreshold: z.number().min(0),
    maintenanceMode: z.boolean(),
    newSellerAuto: z.boolean(),
    loyaltyEnabled: z.boolean(),
    affiliateEnabled: z.boolean(),
    flashSaleEnabled: z.boolean(),
    referralRewardPoints: z.number().int().min(0).max(100000),
    returnWindowDays: z.number().int().min(0).max(90),
  })
  .partial()
  .refine((d) => d.minWithdrawal === undefined || d.maxWithdrawal === undefined || d.minWithdrawal <= d.maxWithdrawal, {
    message: "Minimum withdrawal can't exceed the maximum",
    path: ["minWithdrawal"],
  });

// ─── GET /api/admin/settings ──────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json({ settings: await getSettings() });
}

// ─── PUT /api/admin/settings ──────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = SettingsSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  return NextResponse.json({ settings: await updateSettings(parsed.data) });
}
