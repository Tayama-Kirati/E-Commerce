import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, pagination } from "@/app/lib/api";

const SORTS: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { basePrice: "asc" },
  price_desc: { basePrice: "desc" },
  sales_desc: { totalSales: "desc" },
  stock_asc: { stock: "asc" },
};

// ─── GET /api/seller/products?search=&status=&sort=&page=&limit= ─────────────

export async function GET(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  const sellerId = auth.user.sellerId;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 15, 100);
  if (!sellerId) return NextResponse.json({ products: [], total: 0, page, totalPages: 0, stats: null });

  const base: Prisma.ProductWhereInput = { sellerId };
  const where: Prisma.ProductWhereInput = { ...base };
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [{ name: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }];
  }
  switch (sp.get("status")) {
    case "ACTIVE": where.isActive = true; where.stock = { gt: 0 }; break;
    case "INACTIVE": where.status = "INACTIVE"; break;
    case "DRAFT": where.status = "DRAFT"; break;
    case "PENDING_REVIEW": where.status = "PENDING"; break;
    case "REJECTED": where.status = "REJECTED"; break;
    case "OUT_OF_STOCK": where.stock = { lte: 0 }; break;
    case "LOW_STOCK": where.AND = [{ stock: { gt: 0 } }, { stock: { lte: 5 } }]; break;
  }

  const [products, total, all] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: limit,
      orderBy: SORTS[sp.get("sort") ?? "newest"] ?? SORTS.newest,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { order: "asc" }, take: 4 },
        variants: true,
        tags: { select: { tag: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({ where: base, select: { stock: true, totalSales: true, isActive: true, lowStockThreshold: true, status: true } }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
      lowStockAlert: p.lowStockThreshold,
      tags: p.tags.map((t) => t.tag),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      total: all.length,
      active: all.filter((p) => p.isActive).length,
      totalStock: all.reduce((s, p) => s + Math.max(0, p.stock), 0),
      totalSales: all.reduce((s, p) => s + p.totalSales, 0),
      lowStock: all.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
      outOfStock: all.filter((p) => p.stock <= 0).length,
      pendingReview: all.filter((p) => p.status === "PENDING").length,
    },
  });
}
