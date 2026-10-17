import { NextRequest, NextResponse } from "next/server";
import type { Prisma, ReturnStatus } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, pagination } from "@/app/lib/api";

const STATUSES: ReturnStatus[] = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"];

// ─── GET /api/admin/returns?status= ───────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 20, 100);

  const where: Prisma.ReturnRequestWhereInput = {};
  const status = sp.get("status")?.toUpperCase() as ReturnStatus | undefined;
  if (status && STATUSES.includes(status)) where.status = status;

  const [returns, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where, skip, take: limit, orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        order: { select: { id: true, orderNumber: true, paymentMethod: true, paymentStatus: true, total: true } },
        items: { include: { orderItem: { select: { quantity: true, total: true, variantName: true, product: { select: { name: true } } } } } },
      },
    }),
    prisma.returnRequest.count({ where }),
  ]);
  return NextResponse.json({ returns, total, page, totalPages: Math.ceil(total / limit) });
}
