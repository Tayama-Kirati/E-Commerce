import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireUser, appUrl } from "@/app/lib/api";
import { ensureReferralCode } from "@/app/lib/referrals";
import { getSettings } from "@/app/lib/settings";

// ─── GET /api/user/referral — the user's referral code and results ───────────

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const [code, settings, referrals, earned] = await Promise.all([
    ensureReferralCode(auth.user.id),
    getSettings(),
    prisma.referral.findMany({
      where: { referrerId: auth.user.id },
      orderBy: { createdAt: "desc" },
      include: { referred: { select: { name: true, createdAt: true } } },
    }),
    prisma.loyaltyTransaction.aggregate({ where: { userId: auth.user.id, type: "REFERRAL" }, _sum: { points: true } }),
  ]);

  return NextResponse.json({
    code,
    referralUrl: appUrl(`/register?ref=${code}`),
    rewardPoints: Number(settings.referralRewardPoints),
    totalReferrals: referrals.filter((r) => r.isConverted).length,
    pendingReferrals: referrals.filter((r) => !r.isConverted).length,
    totalPointsEarned: earned._sum.points ?? 0,
    referrals: referrals.map((r) => ({
      name: r.referred.name ?? "New member",
      joinedAt: r.referred.createdAt,
      converted: r.isConverted,
      rewardPoints: r.rewardPoints,
    })),
  });
}
