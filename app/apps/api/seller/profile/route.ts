import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, readJson, zodError, jsonError } from "@/app/lib/api";

const mask = (acct: string | null) => (acct ? `•••• ${acct.slice(-4)}` : null);

async function loadSeller(sellerId: string) {
  const seller = await prisma.seller.findUniqueOrThrow({
    where: { id: sellerId },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
      _count: { select: { products: true } },
    },
  });
  const [reviews, orders] = await Promise.all([
    prisma.review.aggregate({ where: { product: { sellerId } }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.order.count({ where: { items: { some: { product: { sellerId } } } } }),
  ]);
  const averageRating = Math.round((reviews._avg.rating ?? seller.rating) * 10) / 10;
  return {
    ...seller,
    // Field names used by the seller dashboard
    storeDescription: seller.description,
    storeLogo: seller.logo,
    storeBanner: seller.banner,
    bankAccount: mask(seller.bankAccountNumber),
    averageRating,
    totalReviews: reviews._count.rating,
    isTopRated: averageRating >= 4.5 && reviews._count.rating >= 10,
    isFastShipper: false,
    _count: { ...seller._count, orders },
    bankAccountNumber: undefined,
  };
}

// ─── GET /api/seller/profile ──────────────────────────────────────────────────

export async function GET() {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  if (!auth.user.sellerId) return jsonError("Seller profile not found", 404);
  return NextResponse.json({ seller: await loadSeller(auth.user.sellerId) });
}

// ─── PUT /api/seller/profile ──────────────────────────────────────────────────

const UpdateSellerProfileSchema = z.object({
  storeName: z.string().trim().min(3).max(100).optional(),
  storeDescription: z.string().max(1000).optional().nullable(),
  storeLogo: z.string().url().optional().nullable(),
  storeBanner: z.string().url().optional().nullable(),
  businessName: z.string().max(200).optional().nullable(),
  businessRegNo: z.string().max(50).optional().nullable(),
  panNumber: z.string().max(20).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  bankAccountName: z.string().max(100).optional().nullable(),
  // The masked value ("•••• 1234") is sent back unchanged when the seller didn't edit it
  bankAccount: z.string().max(50).optional().nullable(),
  bankBranch: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
});

export async function PUT(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  const sellerId = auth.user.sellerId;
  if (!sellerId) return jsonError("Seller profile not found", 404);

  const current = await prisma.seller.findUniqueOrThrow({ where: { id: sellerId }, select: { status: true } });
  if (current.status === "BANNED" || current.status === "SUSPENDED") {
    return jsonError("Your store is suspended — contact support", 403);
  }

  const parsed = UpdateSellerProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { storeDescription, storeLogo, storeBanner, bankAccount, storeName, ...rest } = parsed.data;

  let storeSlug: string | undefined;
  if (storeName) {
    const base = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const taken = await prisma.seller.findFirst({ where: { storeSlug: base, id: { not: sellerId } }, select: { id: true } });
    storeSlug = taken ? `${base}-${sellerId.slice(-4)}` : base;
  }

  await prisma.seller.update({
    where: { id: sellerId },
    data: {
      ...rest,
      ...(storeName && { storeName, storeSlug }),
      ...(storeDescription !== undefined && { description: storeDescription }),
      ...(storeLogo !== undefined && { logo: storeLogo }),
      ...(storeBanner !== undefined && { banner: storeBanner }),
      ...(bankAccount && !bankAccount.includes("•") && { bankAccountNumber: bankAccount.replace(/\s/g, "") }),
    },
  });

  return NextResponse.json({ seller: await loadSeller(sellerId) });
}
