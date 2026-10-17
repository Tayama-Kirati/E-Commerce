import { NextRequest, NextResponse } from "next/server";
import type { PayoutStatus, Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, pagination } from "@/app/lib/api";

const STATUSES: PayoutStatus[] = ["PENDING", "PROCESSING", "PAID", "REJECTED"];

// ─── GET /api/admin/payouts?status= ───────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 20, 100);

  const where: Prisma.PayoutWhereInput = {};
  const status = sp.get("status")?.toUpperCase() as PayoutStatus | undefined;
  if (status && STATUSES.includes(status)) where.status = status;

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where, skip, take: limit, orderBy: { requestedAt: "desc" },
      include: { seller: { select: { id: true, storeName: true, user: { select: { email: true } } } } },
    }),
    prisma.payout.count({ where }),
  ]);
  return NextResponse.json({ payouts: payouts.map((p) => ({ ...p, amount: Number(p.amount) })), total, page, totalPages: Math.ceil(total / limit) });
}
