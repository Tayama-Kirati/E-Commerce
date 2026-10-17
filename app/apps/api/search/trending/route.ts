import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";

// ─── GET /api/search/trending — most-searched terms (falls back to best sellers) ─

export async function GET() {
  let terms: string[] = [];
  try {
    // /api/search records every query in this sorted set
    const raw = await redis.zrange<string[]>("search:trending", 0, 9, { rev: true });
    terms = raw.map(String).filter((t) => t.length >= 2);
  } catch { /* Redis unavailable — use the fallback below */ }

  if (terms.length < 5) {
    const best = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { totalSales: "desc" },
      take: 8,
      select: { name: true },
    });
    for (const p of best) {
      const short = p.name.split(" ").slice(0, 3).join(" ");
      if (!terms.some((t) => t.toLowerCase() === short.toLowerCase())) terms.push(short);
    }
  }

  return NextResponse.json(
    { trending: terms.slice(0, 8) },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
