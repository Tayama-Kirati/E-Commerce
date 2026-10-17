import { prisma } from "@/app/lib/prisma";
import { getSettings } from "@/app/lib/settings";
import { sellerNet } from "@/app/lib/pricing";

const DAY = 86_400_000;

/**
 * Seller balance from their share of order items:
 * - available: delivered longer ago than the payout cycle, minus requested/paid payouts
 * - pending:   delivered within the cycle, or confirmed/shipped but not delivered yet
 */
export async function sellerBalance(sellerId: string) {
  const settings = await getSettings();
  const commission = Number(settings.commissionRate);
  const cycleCutoff = new Date(Date.now() - Number(settings.payoutCycle) * DAY);

  const items = await prisma.orderItem.findMany({
    where: {
      product: { sellerId },
      order: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] } },
    },
    select: { total: true, order: { select: { status: true, deliveredAt: true } } },
  });

  let cleared = 0;
  let pending = 0;
  for (const it of items) {
    const net = sellerNet(Number(it.total), commission);
    if (it.order.status === "DELIVERED" && it.order.deliveredAt && it.order.deliveredAt <= cycleCutoff) cleared += net;
    else pending += net;
  }

  const payouts = await prisma.payout.groupBy({
    by: ["status"],
    where: { sellerId, status: { in: ["PENDING", "PROCESSING", "PAID"] } },
    _sum: { amount: true },
  });
  const sum = (s: string) => Number(payouts.find((p) => p.status === s)?._sum.amount ?? 0);
  const paidOut = sum("PAID");
  const inFlight = sum("PENDING") + sum("PROCESSING");

  return {
    available: Math.max(0, cleared - paidOut - inFlight),
    pending,
    inFlight,
    paidOut,
    totalEarnings: cleared + pending,
    commissionRate: commission,
    minWithdrawal: Number(settings.minWithdrawal),
    maxWithdrawal: Number(settings.maxWithdrawal),
  };
}
