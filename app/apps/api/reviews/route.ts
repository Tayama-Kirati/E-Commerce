import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const ReviewSchema = z.object({
  productId: z.string().min(1),
  orderId:   z.string().min(1),
  rating:    z.number().int().min(1).max(5),
  title:     z.string().max(200).optional(),
  body:      z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 422 });
  }
  const { productId, orderId, rating, title, body: reviewBody } = parsed.data;

  // Verify order belongs to user and is delivered
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id, status: "DELIVERED" },
    include: { items: { where: { productId } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found or not yet delivered" }, { status: 403 });
  }
  if (!order.items.length) {
    return NextResponse.json({ error: "Product not found in this order" }, { status: 400 });
  }

  // Upsert so a user can update their review
  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId, rating, title, body: reviewBody },
    update: { rating, title, body: reviewBody },
  });

  // Recalculate product average rating
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: agg._avg.rating ?? 0,
      totalReviews:  agg._count.rating,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
