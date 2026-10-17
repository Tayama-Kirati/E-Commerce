import { NextRequest, NextResponse } from "next/server";
import type { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, pagination } from "@/app/lib/api";

const SORTS: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  price_asc: { basePrice: "asc" },
  price_desc: { basePrice: "desc" },
  sales_desc: { totalSales: "desc" },
  rating_desc: { averageRating: "desc" },
  stock_asc: { stock: "asc" },
};
const STATUSES: ProductStatus[] = ["DRAFT", "PENDING", "ACTIVE", "INACTIVE", "REJECTED"];

// ─── GET /api/admin/products?search=&status=&category=&sort=&page=&limit= ────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 20, 100);

  const where: Prisma.ProductWhereInput = {};
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { seller: { storeName: { contains: search, mode: "insensitive" } } },
    ];
  }
  const status = sp.get("status")?.toUpperCase();
  if (status === "PENDING_REVIEW") where.status = "PENDING";
  else if (status === "OUT_OF_STOCK") where.stock = { lte: 0 };
  else if (status && STATUSES.includes(status as ProductStatus)) where.status = status as ProductStatus;
  const category = sp.get("category");
  if (category) where.category = { OR: [{ slug: category }, { id: category }] };

  const [products, total, all, active, outOfStock, pendingReview] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: limit,
      orderBy: SORTS[sp.get("sort") ?? "newest"] ?? SORTS.newest,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, storeName: true, storeSlug: true } },
        images: { orderBy: { order: "asc" }, take: 1, select: { url: true, alt: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({ ...p, basePrice: Number(p.basePrice), comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: { total: all, active, outOfStock, pendingReview },
  });
}
