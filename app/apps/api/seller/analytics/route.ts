import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, jsonError } from "@/app/lib/api";
import { bucketByDay, periodDays, pctChange } from "@/app/lib/analytics";

const COUNTED = ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

// ─── GET /api/seller/analytics?period=7|30|90 ─────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  const sellerId = auth.user.sellerId;
  if (!sellerId) return jsonError("Seller profile not found", 403);

  const days = periodDays(req.nextUrl.searchParams.get("period"));
  const since = new Date(Date.now() - days * 86_400_000);
  const prevSince = new Date(since.getTime() - days * 86_400_000);

  const [items, prevItems, products, reviewAgg] = await Promise.all([
    prisma.orderItem.findMany({
      where: { product: { sellerId }, order: { createdAt: { gte: since }, status: { in: [...COUNTED] } } },
      select: { orderId: true, productId: true, quantity: true, total: true, order: { select: { createdAt: true } } },
    }),
    prisma.orderItem.findMany({
      where: { product: { sellerId }, order: { createdAt: { gte: prevSince, lt: since }, status: { in: [...COUNTED] } } },
      select: { orderId: true, total: true },
    }),
    prisma.product.findMany({ where: { sellerId }, select: { id: true, name: true, slug: true, totalViews: true, stock: true } }),
    prisma.review.aggregate({ where: { product: { sellerId } }, _avg: { rating: true }, _count: { rating: true } }),
  ]);

  const revenue = items.reduce((s, i) => s + Number(i.total), 0);
  const prevRevenue = prevItems.reduce((s, i) => s + Number(i.total), 0);
  const orderIds = new Set(items.map((i) => i.orderId));
  const prevOrderIds = new Set(prevItems.map((i) => i.orderId));
  const totalViews = products.reduce((s, p) => s + p.totalViews, 0);

  // One entry per order per day for the chart
  const perOrder = new Map<string, { createdAt: Date; total: number }>();
  for (const i of items) {
    const o = perOrder.get(i.orderId) ?? { createdAt: i.order.createdAt, total: 0 };
    o.total += Number(i.total);
    perOrder.set(i.orderId, o);
  }

  const byProduct = new Map<string, { quantity: number; revenue: number }>();
  for (const i of items) {
    const p = byProduct.get(i.productId) ?? { quantity: 0, revenue: 0 };
    p.quantity += i.quantity;
    p.revenue += Number(i.total);
    byProduct.set(i.productId, p);
  }
  const topProducts = [...byProduct.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id, v]) => {
      const p = products.find((x) => x.id === id);
      return { id, name: p?.name ?? "Product", slug: p?.slug, totalSales: v.quantity, revenue: v.revenue, stock: p?.stock ?? 0 };
    });

  return NextResponse.json({
    period: days,
    revenue,
    revenueChange: pctChange(revenue, prevRevenue),
    orders: orderIds.size,
    ordersChange: pctChange(orderIds.size, prevOrderIds.size),
    avgOrderValue: orderIds.size ? Math.round(revenue / orderIds.size) : 0,
    totalViews,
    conversionRate: totalViews ? Math.round((orderIds.size / totalViews) * 10000) / 100 : 0,
    revenueByDay: bucketByDay([...perOrder.values()], days, (o) => o.total),
    topProducts,
    reviewStats: {
      averageRating: Math.round((reviewAgg._avg.rating ?? 0) * 10) / 10,
      totalReviews: reviewAgg._count.rating,
    },
  });
}
