import { prisma } from "@/app/lib/prisma";
import { computeShipping, type ShippingZoneRule } from "@/app/lib/pricing";
import { getSettings } from "@/app/lib/settings";

/** The active zone covering a province, falling back to a zone with no provinces listed. */
export async function findShippingZone(province?: string | null): Promise<ShippingZoneRule | null> {
  const zones = await prisma.shippingZone.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  if (!zones.length) return null;
  const p = province?.trim().toLowerCase();
  const match =
    (p && zones.find((z) => z.provinces.some((zp) => zp.toLowerCase() === p))) ||
    zones.find((z) => z.provinces.length === 0) ||
    null;
  if (!match) return null;
  return {
    rate: Number(match.rate),
    freeAbove: match.freeAbove != null ? Number(match.freeAbove) : null,
    estimatedDays: match.estimatedDays,
  };
}

export async function quoteShipping(opts: { subtotal: number; allItemsFreeShipping: boolean; province?: string | null }) {
  const [zone, settings] = await Promise.all([findShippingZone(opts.province), getSettings()]);
  return computeShipping({
    subtotal: opts.subtotal,
    allItemsFreeShipping: opts.allItemsFreeShipping,
    zone,
    defaultFreeAbove: Number(settings.freeShippingThreshold),
  });
}
