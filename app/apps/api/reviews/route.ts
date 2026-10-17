import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError, readJson, zodError, pagination } from "@/app/lib/api";
import { refreshProductRating } from "@/app/lib/reviews";

// ─── GET /api/reviews?productId=|slug=|mine=1 ─────────────────────────────────

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 10, 50);

  const where: Prisma.ReviewWhereInput = {};
  if (sp.get("mine") === "1") {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    where.userId = auth.user.id;
  } else if (sp.get("productId")) {
    where.productId = sp.get("productId")!;
  } else if (sp.get("slug")) {
    where.product = { slug: sp.get("slug")! };
  } else {
    return jsonError("productId, slug or mine=1 is required", 400);
  }

  const rating = Number(sp.get("rating"));
  if (rating >= 1 && rating <= 5) where.rating = rating;

  const orderBy: Prisma.ReviewOrderByWithRelationInput =
    sp.get("sort") === "highest" ? { rating: "desc" } : sp.get("sort") === "lowest" ? { rating: "asc" } : { createdAt: "desc" };

  const [reviews, total, distribution] = await Promise.all([
    prisma.review.findMany({
      where, orderBy, skip, take: limit,
      include: {
        user: { select: { name: true, avatar: true } },
        product: { select: { id: true, name: true, slug: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } } },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ["rating"], where: { ...where, rating: undefined }, _count: { rating: true } }),
  ]);

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      ...r,
      // Only first names are shown publicly
      user: { name: r.user.name?.split(" ")[0] ?? "Customer", avatar: r.user.avatar },
      verified: true,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    distribution: Object.fromEntries([5, 4, 3, 2, 1].map((n) => [n, distribution.find((d) => d.rating === n)?._count.rating ?? 0])),
  });
}

// ─── POST /api/reviews — review a delivered product ───────────────────────────

const ReviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = ReviewSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { productId, orderId, rating, title, body: reviewBody } = parsed.data;

  // Only buyers whose order was delivered may review
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: auth.user.id, status: "DELIVERED" },
    include: { items: { where: { productId } } },
  });
  if (!order) return jsonError("Order not found or not yet delivered", 403);
  if (!order.items.length) return jsonError("Product not found in this order", 400);

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: auth.user.id, productId } },
    create: { userId: auth.user.id, productId, rating, title, body: reviewBody },
    update: { rating, title, body: reviewBody },
  });
  await refreshProductRating(productId);

  // Let the seller know
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, seller: { select: { userId: true } } } });
  if (product?.seller) {
    await prisma.notification.create({
      data: { userId: product.seller.userId, type: "REVIEW", title: `New ${rating}★ review`, body: `${product.name}: "${(title ?? reviewBody ?? "").slice(0, 80)}"` },
    });
  }

  return NextResponse.json({ review }, { status: 201 });
}
