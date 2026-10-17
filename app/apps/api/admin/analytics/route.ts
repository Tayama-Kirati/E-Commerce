import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/api";
import { bucketByDay, periodDays, pctChange } from "@/app/lib/analytics";

const COUNTED = ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

// ─── GET /api/admin/analytics?period=7|30|90|365 ──────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const days = periodDays(req.nextUrl.searchParams.get("period"));
  const since = new Date(Date.now() - days * 86_400_000);
  const prevSince = new Date(since.getTime() - days * 86_400_000);
  const paidInWindow = { createdAt: { gte: since }, status: { in: [...COUNTED] } };

  const [
    orders, prevAgg, totalOrders, pendingOrders, totalUsers, newUsers, prevNewUsers,
    totalSellers, activeSellers, pendingSellers, byStatus, items, openTickets, openReturns, pendingPayouts,
  ] = await Promise.all([
    prisma.order.findMany({ where: paidInWindow, select: { createdAt: true, total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: prevSince, lt: since }, status: { in: [...COUNTED] } }, _sum: { total: true }, _count: true }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    prisma.seller.count(),
    prisma.seller.count({ where: { status: "APPROVED", products: { some: { isActive: true } } } }),
    prisma.seller.count({ where: { status: "PENDING" } }),
    prisma.order.groupBy({ by: ["status"], where: { createdAt: { gte: since } }, _count: { status: true } }),
    prisma.orderItem.findMany({
      where: { order: paidInWindow },
      select: {
        quantity: true, total: true,
        product: { select: { id: true, name: true, slug: true, category: { select: { name: true } }, seller: { select: { id: true, storeName: true } } } },
      },
    }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.returnRequest.count({ where: { status: "REQUESTED" } }),
    prisma.payout.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
  ]);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const prevRevenue = Number(prevAgg._sum.total ?? 0);

  const tally = <K extends string>(key: (i: (typeof items)[number]) => K | null) => {
    const m = new Map<K, { revenue: number; quantity: number }>();
    for (const i of items) {
      const k = key(i);
      if (k == null) continue;
      const v = m.get(k) ?? { revenue: 0, quantity: 0 };
      v.revenue += Number(i.total);
      v.quantity += i.quantity;
      m.set(k, v);
    }
    return [...m.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  };

  return NextResponse.json({
    period: days,
    overview: {
      totalRevenue,
      revenueChange: pctChange(totalRevenue, prevRevenue),
      totalOrders,
      periodOrders: orders.length,
      ordersChange: pctChange(orders.length, prevAgg._count),
      avgOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
      pendingOrders,
      totalUsers,
      newUsers,
      usersChange: pctChange(newUsers, prevNewUsers),
      totalSellers,
      activeSellers,
      pendingSellers,
      openTickets,
      openReturns,
      pendingPayouts,
    },
    revenueByDay: bucketByDay(orders, days, (o) => Number(o.total)),
    ordersByStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
    revenueByCategory: tally((i) => i.product.category?.name ?? "Uncategorised").slice(0, 8)
      .map(([name, v]) => ({ name, revenue: v.revenue, share: totalRevenue ? Math.round((v.revenue / totalRevenue) * 1000) / 10 : 0 })),
    topProducts: tally((i) => i.product.id).slice(0, 5).map(([id, v]) => {
      const p = items.find((i) => i.product.id === id)!.product;
      return { id, name: p.name, slug: p.slug, totalSales: v.quantity, revenue: v.revenue };
    }),
    topSellers: tally((i) => i.product.seller?.id ?? null).slice(0, 5).map(([id, v]) => {
      const s = items.find((i) => i.product.seller?.id === id)!.product.seller!;
      return { id, storeName: s.storeName, revenue: v.revenue, totalSales: v.quantity };
    }),
  });
}
