import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, pagination, isAdmin } from "@/app/lib/api";

// ─── GET /api/seller/reviews?rating=&replied= — reviews on the seller's products ─

export async function GET(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 30, 100);

  const where: Prisma.ReviewWhereInput = isAdmin(auth.user.role) && !auth.user.sellerId ? {} : { product: { sellerId: auth.user.sellerId! } };
  const rating = Number(sp.get("rating"));
  if (rating >= 1 && rating <= 5) where.rating = rating;
  if (sp.get("replied") === "0") where.sellerReply = null;
  if (sp.get("replied") === "1") where.sellerReply = { not: null };

  const [reviews, total, agg] = await Promise.all([
    prisma.review.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: limit,
      include: { user: { select: { name: true } }, product: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
  ]);

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      // First name + initial only
      user: r.user.name ? r.user.name.split(" ").map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(" ") : "Customer",
      rating: r.rating,
      title: r.title,
      body: r.body,
      product: r.product.name,
      productSlug: r.product.slug,
      time: r.createdAt,
      verified: true,
      sellerReply: r.sellerReply,
      sellerRepliedAt: r.sellerRepliedAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    averageRating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
  });
}
