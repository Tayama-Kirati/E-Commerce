import { prisma } from "@/app/lib/prisma";
import { DEFAULT_FREE_SHIPPING_THRESHOLD } from "@/app/lib/pricing";

// Platform settings live in the SiteSetting table as one row per key.
// Missing keys fall back to these defaults, so a fresh database works as-is.
export const DEFAULT_SETTINGS = {
  siteName: "PeaNut",
  siteTagline: "Nepal's AI-Powered Marketplace",
  supportEmail: "support@peanut.com",
  commissionRate: 8,
  minWithdrawal: 500,
  maxWithdrawal: 500000,
  payoutCycle: 15,
  freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
  maintenanceMode: false,
  newSellerAuto: false,
  loyaltyEnabled: true,
  affiliateEnabled: true,
  flashSaleEnabled: true,
  referralRewardPoints: 200,
  returnWindowDays: 7,
};

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof Settings;

let cache: { value: Settings; at: number } | null = null;
const TTL_MS = 30_000;

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let rows: { key: string; value: unknown }[] = [];
  try {
    rows = await prisma.siteSetting.findMany();
  } catch (err) {
    // Fall back to defaults (and retry on the next call) rather than failing every page
    console.error("[settings] could not load settings, using defaults", err);
    return { ...DEFAULT_SETTINGS };
  }
  const value = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in value) (value as Record<string, unknown>)[row.key] = row.value;
  }
  cache = { value, at: Date.now() };
  return value;
}

export async function updateSettings(patch: Partial<Settings>) {
  const entries = Object.entries(patch).filter(([k]) => k in DEFAULT_SETTINGS);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value as never },
        update: { value: value as never },
      }),
    ),
  );
  cache = null;
  return getSettings();
}
