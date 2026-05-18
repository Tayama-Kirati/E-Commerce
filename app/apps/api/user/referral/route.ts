import { generateReferralCode } from "@/app/lib/auth-utils";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function getReferralHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let referral = await prisma.referral.findFirst({
    where: { referrerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!referral) {
    const code = generateReferralCode(session.user.id);
    referral = await prisma.referral.create({
      data: {
        referrerId: session.user.id,
        referredId: session.user.id, // placeholder — updated on conversion
        code,
      },
    });
  }

  const totalReferrals = await prisma.referral.count({
    where: { referrerId: session.user.id, isConverted: true },
  });

  const totalEarned = await prisma.loyaltyTransaction.aggregate({
    where: { userId: session.user.id, type: "REFERRAL" },
    _sum: { points: true },
  });

  return NextResponse.json({
    code: referral.code,
    referralUrl: `${process.env.NEXTAUTH_URL}/register?ref=${referral.code}`,
    totalReferrals,
    totalPointsEarned: totalEarned._sum.points ?? 0,
  });
}
