import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// ─── GET /api/products/search?q=&limit= — lightweight type-ahead suggestions ─

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 6));
  if (q.length < 2) return NextResponse.json({ products: [] });

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { contains: q, mode: "insensitive" } } } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    // Best sellers first so the most likely match is on top
    orderBy: [{ totalSales: "desc" }, { averageRating: "desc" }],
    take: limit,
    select: {
      id: true, name: true, slug: true, basePrice: true, comparePrice: true, stock: true, averageRating: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
      category: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
      image: p.images[0]?.url ?? null,
    })),
  });
}
