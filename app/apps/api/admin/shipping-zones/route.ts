import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError } from "@/app/lib/api";
import { ShippingZoneSchema } from "@/app/lib/content-schemas";

const serialize = (z: { rate: unknown; freeAbove: unknown }) => ({ ...z, rate: Number(z.rate), freeAbove: z.freeAbove != null ? Number(z.freeAbove) : null });

// ─── GET /api/admin/shipping-zones ────────────────────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const zones = await prisma.shippingZone.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ zones: zones.map(serialize) });
}

// ─── POST /api/admin/shipping-zones ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = ShippingZoneSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const zone = await prisma.shippingZone.create({ data: parsed.data });
  return NextResponse.json({ zone: serialize(zone) }, { status: 201 });
}
