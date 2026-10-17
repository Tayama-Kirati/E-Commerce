import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// ─── GET /api/banners — active homepage banners (public) ─────────────────────

export async function GET() {
  const now = new Date();
  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, subtitle: true, imageUrl: true, linkUrl: true, ctaLabel: true },
  });
  return NextResponse.json({ banners }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
