import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, readJson, zodError, jsonError } from "@/app/lib/api";
import { ensureReferralCode } from "@/app/lib/referrals";
import { totalSpentFor } from "@/app/lib/admin";

const profileSelect = {
  id: true, email: true, firstName: true, lastName: true, name: true, phone: true, birthDate: true,
  avatar: true, role: true, loyaltyPoints: true, loyaltyTier: true, emailVerified: true,
  createdAt: true, lastLogin: true, referralCode: true,
  sellerProfile: { select: { id: true, storeName: true, storeSlug: true, status: true } },
  _count: { select: { orders: true, reviews: true, wishlistItems: true } },
} as const;

// ─── GET /api/user/profile ────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const [user, referralCode, spent] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: auth.user.id }, select: profileSelect }),
    ensureReferralCode(auth.user.id),
    totalSpentFor([auth.user.id]),
  ]);
  const { sellerProfile, ...rest } = user;
  return NextResponse.json({
    user: { ...rest, seller: sellerProfile, referralCode, totalSpent: spent.get(user.id) ?? 0, language: "en", currency: "NPR" },
  });
}

// ─── PUT /api/user/profile ────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(50).optional(),
  lastName: z.string().trim().min(2).max(50).optional(),
  // The single-page app sends a combined name
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number").optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

export async function PUT(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = UpdateProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { birthDate, name: fullName, ...data } = parsed.data;

  if (data.phone) {
    const taken = await prisma.user.findFirst({ where: { phone: data.phone, id: { not: auth.user.id } }, select: { id: true } });
    if (taken) return jsonError("Phone number already in use.", 409);
  }

  let firstName = data.firstName;
  let lastName = data.lastName;
  if (fullName && !firstName && !lastName) {
    const [first, ...others] = fullName.split(/\s+/);
    firstName = first;
    lastName = others.join(" ") || undefined;
  }
  const current = await prisma.user.findUniqueOrThrow({ where: { id: auth.user.id }, select: { firstName: true, lastName: true } });
  const name = firstName || lastName
    ? `${firstName ?? current.firstName ?? ""} ${lastName ?? current.lastName ?? ""}`.trim()
    : undefined;

  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      ...data,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(name && { name }),
      ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
    },
    select: profileSelect,
  });
  return NextResponse.json({ user });
}
