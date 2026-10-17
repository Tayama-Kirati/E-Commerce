import { prisma } from "@/app/lib/prisma";

/** Keeps Product.averageRating / totalReviews in sync after any review change. */
export async function refreshProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { averageRating: Math.round((agg._avg.rating ?? 0) * 10) / 10, totalReviews: agg._count.rating },
  });
}
