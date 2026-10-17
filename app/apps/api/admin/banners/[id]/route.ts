import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { BannerSchema, toDate } from "@/app/lib/content-schemas";

type Params = { params: Promise<{ id: string }> };

// ─── PUT /api/admin/banners/:id ───────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const parsed = BannerSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { startsAt, endsAt, ...rest } = parsed.data;
  const { count } = await prisma.banner.updateMany({
    where: { id },
    data: { ...rest, ...(startsAt !== undefined && { startsAt: toDate(startsAt) }), ...(endsAt !== undefined && { endsAt: toDate(endsAt) }) },
  });
  if (!count) return jsonError("Banner not found", 404);
  return NextResponse.json({ banner: await prisma.banner.findUniqueOrThrow({ where: { id } }) });
}

export const PATCH = PUT;

// ─── DELETE /api/admin/banners/:id ────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const { count } = await prisma.banner.deleteMany({ where: { id } });
  if (!count) return jsonError("Banner not found", 404);
  return NextResponse.json({ success: true });
}
