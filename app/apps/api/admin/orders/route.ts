import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, pagination } from "@/app/lib/api";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];
const PAYMENT: PaymentStatus[] = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"];

// ─── GET /api/admin/orders?status=&paymentStatus=&search=&from=&to= ──────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 20, 100);

  const where: Prisma.OrderWhereInput = {};
  const status = sp.get("status")?.toUpperCase() as OrderStatus | undefined;
  if (status && STATUSES.includes(status)) where.status = status;
  const pay = sp.get("paymentStatus")?.toUpperCase() as PaymentStatus | undefined;
  if (pay && PAYMENT.includes(pay)) where.paymentStatus = pay;
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { trackingNumber: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) where.createdAt = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: { select: { city: true, district: true, province: true } },
        items: { select: { id: true, quantity: true, total: true, variantName: true, product: { select: { name: true, seller: { select: { storeName: true } } } } } },
        returnRequests: { select: { id: true, status: true }, take: 1, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal), shippingCost: Number(o.shippingCost), discount: Number(o.discount), total: Number(o.total),
      items: o.items.map((i) => ({ ...i, total: Number(i.total) })),
      returnRequest: o.returnRequests[0] ?? null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    statusCounts: Object.fromEntries(counts.map((c) => [c.status, c._count.status])),
  });
}
