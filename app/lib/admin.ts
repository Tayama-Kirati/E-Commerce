import { prisma } from "@/app/lib/prisma";

const PAID_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

/** Lifetime spend per user (paid, non-cancelled orders). */
export async function totalSpentFor(userIds: string[]) {
  if (!userIds.length) return new Map<string, number>();
  const rows = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds }, status: { in: [...PAID_STATUSES] } },
    _sum: { total: true },
  });
  return new Map(rows.map((r) => [r.userId, Number(r._sum.total ?? 0)]));
}
