import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireUser, pagination } from "@/app/lib/api";
import { loyaltyTierFor, MAX_POINTS_REDEMPTION_SHARE } from "@/app/lib/pricing";

const NEXT_TIER: Record<string, { name: string; at: number } | null> = {
  BRONZE: { name: "SILVER", at: 1500 },
  SILVER: { name: "GOLD", at: 5000 },
  GOLD: { name: "PLATINUM", at: 10000 },
  PLATINUM: null,
};

// ─── GET /api/user/loyalty — balance, tier progress and points history ───────

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { page, limit, skip } = pagination(req.nextUrl.searchParams, 20, 100);

  const [user, transactions, total, earned, redeemed] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: auth.user.id }, select: { loyaltyPoints: true } }),
    prisma.loyaltyTransaction.findMany({ where: { userId: auth.user.id }, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.loyaltyTransaction.count({ where: { userId: auth.user.id } }),
    prisma.loyaltyTransaction.aggregate({ where: { userId: auth.user.id, points: { gt: 0 } }, _sum: { points: true } }),
    prisma.loyaltyTransaction.aggregate({ where: { userId: auth.user.id, type: "REDEEMED" }, _sum: { points: true } }),
  ]);

  const tier = loyaltyTierFor(user.loyaltyPoints);
  const next = NEXT_TIER[tier];
  return NextResponse.json({
    points: user.loyaltyPoints,
    tier,
    nextTier: next ? { name: next.name, pointsNeeded: Math.max(0, next.at - user.loyaltyPoints) } : null,
    pointValue: 1,
    maxRedemptionShare: MAX_POINTS_REDEMPTION_SHARE,
    lifetimeEarned: earned._sum.points ?? 0,
    lifetimeRedeemed: Math.abs(redeemed._sum.points ?? 0),
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
