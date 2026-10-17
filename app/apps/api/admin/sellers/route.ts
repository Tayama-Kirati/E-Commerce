import { NextRequest, NextResponse } from "next/server";
import type { Prisma, SellerStatus } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, pagination } from "@/app/lib/api";

const STATUSES: SellerStatus[] = ["PENDING", "APPROVED", "SUSPENDED", "BANNED"];

// ─── GET /api/admin/sellers?status=&search=&page=&limit= ─────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 20, 100);

  const where: Prisma.SellerWhereInput = {};
  const status = sp.get("status")?.toUpperCase() as SellerStatus | undefined;
  if (status && STATUSES.includes(status)) where.status = status;
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { storeName: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [sellers, total, counts] = await Promise.all([
    prisma.seller.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { products: true } },
      },
    }),
    prisma.seller.count({ where }),
    prisma.seller.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const ids = sellers.map((s) => s.id);
  const [revenue, ratings] = await Promise.all([
    prisma.orderItem.findMany({
      where: { product: { sellerId: { in: ids } }, order: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] } } },
      select: { total: true, product: { select: { sellerId: true } } },
    }),
    Promise.all(ids.map((id) => prisma.review.aggregate({ where: { product: { sellerId: id } }, _avg: { rating: true }, _count: { rating: true } }))),
  ]);

  return NextResponse.json({
    sellers: sellers.map((s, idx) => {
      const avg = ratings[idx]._avg.rating ?? 0;
      return {
        ...s,
        bankAccountNumber: undefined,
        totalRevenue: revenue.filter((r) => r.product.sellerId === s.id).reduce((sum, r) => sum + Number(r.total), 0),
        averageRating: Math.round(avg * 10) / 10,
        totalReviews: ratings[idx]._count.rating,
        isTopRated: avg >= 4.5 && ratings[idx]._count.rating >= 10,
        isFastShipper: false,
      };
    }),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    statusCounts: Object.fromEntries(counts.map((c) => [c.status, c._count.status])),
  });
}
