import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, pagination } from "@/app/lib/api";
import { getSettings } from "@/app/lib/settings";
import { sellerNet } from "@/app/lib/pricing";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];

// ─── GET /api/seller/orders?status=&search=&page=&limit= ─────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  const sellerId = auth.user.sellerId;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 20, 100);

  // Admins without a store see nothing here (they use /api/admin/orders)
  if (!sellerId) return NextResponse.json({ orders: [], total: 0, page, totalPages: 0, stats: null });

  const mine: Prisma.OrderWhereInput = { items: { some: { product: { sellerId } } } };
  const where: Prisma.OrderWhereInput = { ...mine };
  const status = sp.get("status")?.toUpperCase() as OrderStatus | undefined;
  if (status && STATUSES.includes(status)) where.status = status;
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [orders, total, settings, earnedItems, counts] = await Promise.all([
    prisma.order.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: limit,
      select: {
        id: true, orderNumber: true, status: true, paymentMethod: true, paymentStatus: true,
        currentLocation: true, trackingNumber: true, carrier: true, total: true, createdAt: true, updatedAt: true,
        user: { select: { name: true, email: true } },
        address: { select: { fullName: true, phone: true, street: true, city: true, district: true, province: true } },
        items: {
          where: { product: { sellerId } },
          select: {
            id: true, quantity: true, price: true, total: true, variantName: true,
            product: { select: { id: true, name: true, slug: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
    getSettings(),
    prisma.orderItem.findMany({
      where: { product: { sellerId }, order: { status: { notIn: ["CANCELLED", "REFUNDED"] } } },
      select: { total: true, order: { select: { status: true } } },
    }),
    prisma.order.groupBy({ by: ["status"], where: mine, _count: { status: true } }),
  ]);

  const commission = Number(settings.commissionRate);
  const totalRevenue = earnedItems.reduce((s, i) => s + Number(i.total), 0);
  const count = (s: OrderStatus) => counts.find((c) => c.status === s)?._count.status ?? 0;

  return NextResponse.json({
    orders: orders.map((o) => {
      const sellerTotal = o.items.reduce((s, i) => s + Number(i.total), 0);
      const first = o.items[0];
      return {
        ...o,
        total: Number(o.total),
        sellerTotal,
        items: o.items.map((i) => ({ ...i, price: Number(i.price), total: Number(i.total), variant: i.variantName ? { name: i.variantName } : null })),
        // Row-style fields used by the seller dashboard's orders table
        order: { id: o.id, orderNumber: o.orderNumber, status: o.status, createdAt: o.createdAt, user: o.user, address: o.address },
        product: first?.product ?? null,
        variant: first?.variantName ? { name: first.variantName } : null,
        quantity: o.items.reduce((s, i) => s + i.quantity, 0),
      };
    }),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalOrders: counts.reduce((s, c) => s + c._count.status, 0),
      pendingOrders: count("PENDING") + count("CONFIRMED") + count("PROCESSING"),
      shippedOrders: count("SHIPPED") + count("OUT_FOR_DELIVERY"),
      deliveredOrders: count("DELIVERED"),
      totalRevenue,
      totalEarnings: sellerNet(totalRevenue, commission),
      commissionRate: commission,
    },
  });
}
