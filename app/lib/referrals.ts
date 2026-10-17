import type { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { generateReferralCode } from "@/app/lib/auth-utils";
import { getSettings } from "@/app/lib/settings";

/** Returns the user's referral code, creating it on first use. */
export async function ensureReferralCode(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });
  if (user.referralCode) return user.referralCode;
  let code = generateReferralCode(userId);
  // Hash prefixes can collide; fall back to a longer suffix
  if (await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } })) {
    code = `${code}${userId.slice(-3).toUpperCase()}`;
  }
  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

/** Links a newly registered user to whoever referred them (no reward yet). */
export async function attachReferral(tx: Prisma.TransactionClient, newUserId: string, code?: string | null) {
  if (!code) return;
  const referrer = await tx.user.findUnique({ where: { referralCode: code.trim().toUpperCase() }, select: { id: true } });
  if (!referrer || referrer.id === newUserId) return;
  await tx.user.update({ where: { id: newUserId }, data: { referredById: referrer.id } });
  await tx.referral.create({ data: { referrerId: referrer.id, referredId: newUserId, code: code.trim().toUpperCase() } });
}

/**
 * Rewards the referrer once the referred user's first order is delivered,
 * so fake sign-ups don't earn points.
 */
export async function convertReferral(referredUserId: string) {
  const settings = await getSettings();
  if (!settings.affiliateEnabled) return;
  const points = Number(settings.referralRewardPoints);
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.referral.updateMany({
      where: { referredId: referredUserId, isConverted: false },
      data: { isConverted: true, convertedAt: new Date(), rewardPoints: points },
    });
    if (!claimed.count) return;
    const ref = await tx.referral.findUniqueOrThrow({ where: { referredId: referredUserId } });
    await tx.user.update({ where: { id: ref.referrerId }, data: { loyaltyPoints: { increment: points } } });
    await tx.loyaltyTransaction.create({
      data: { userId: ref.referrerId, points, type: "REFERRAL", description: "Referral reward — your friend completed their first order" },
    });
    await tx.notification.create({
      data: { userId: ref.referrerId, type: "PROMO", title: "Referral reward", body: `You earned ${points} points because your friend completed their first order.` },
    });
  });
}
