import { NextResponse } from "next/server";
import { getSettings } from "@/app/lib/settings";

// ─── GET /api/settings/public — the settings the storefront needs (no secrets) ─

export async function GET() {
  const s = await getSettings();
  return NextResponse.json(
    {
      siteName: s.siteName,
      siteTagline: s.siteTagline,
      supportEmail: s.supportEmail,
      maintenanceMode: s.maintenanceMode,
      freeShippingThreshold: s.freeShippingThreshold,
      loyaltyEnabled: s.loyaltyEnabled,
      flashSaleEnabled: s.flashSaleEnabled,
      returnWindowDays: s.returnWindowDays,
    },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
