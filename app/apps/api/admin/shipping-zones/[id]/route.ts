import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { ShippingZoneSchema } from "@/app/lib/content-schemas";

type Params = { params: Promise<{ id: string }> };

// ─── PUT /api/admin/shipping-zones/:id ────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const parsed = ShippingZoneSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { count } = await prisma.shippingZone.updateMany({ where: { id }, data: parsed.data });
  if (!count) return jsonError("Shipping zone not found", 404);
  const zone = await prisma.shippingZone.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({ zone: { ...zone, rate: Number(zone.rate), freeAbove: zone.freeAbove != null ? Number(zone.freeAbove) : null } });
}

export const PATCH = PUT;

// ─── DELETE /api/admin/shipping-zones/:id ─────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const { count } = await prisma.shippingZone.deleteMany({ where: { id } });
  if (!count) return jsonError("Shipping zone not found", 404);
  return NextResponse.json({ success: true });
}
