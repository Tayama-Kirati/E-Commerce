import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError } from "@/app/lib/api";
import { BannerSchema, toDate } from "@/app/lib/content-schemas";

// ─── GET /api/admin/banners ───────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const banners = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ banners });
}

// ─── POST /api/admin/banners ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = BannerSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { startsAt, endsAt, ...rest } = parsed.data;
  const banner = await prisma.banner.create({ data: { ...rest, startsAt: toDate(startsAt), endsAt: toDate(endsAt) } });
  return NextResponse.json({ banner }, { status: 201 });
}
