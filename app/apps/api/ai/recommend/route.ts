import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const RequestSchema = z.object({
  productId: z.string().optional(),
  limit: z.number().int().min(1).max(20).default(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, limit } = RequestSchema.parse(body);

    const session = await getServerSession(authOptions);
    let recommendedIds: string[] = [];

    if (session?.user) {
      // Personalized: based on user's view history
      const recentViews = await prisma.productView.findMany({
        where: { userId: session.user.id },
        orderBy: { viewedAt: "desc" },
        take: 20,
        select: { productId: true },
      });

      if (recentViews.length > 0) {
        const viewedProducts = await prisma.product.findMany({
          where: { id: { in: recentViews.map((v: any) => v.productId) } },
          select: { embedding: true },
        });

        const avgEmbedding = viewedProducts[0]?.embedding ?? [];
        if (Array.isArray(avgEmbedding) && avgEmbedding.length > 0) {
          const { getAIRecommendations } = await import("@/app/lib/openai");
          recommendedIds = await getAIRecommendations(
            avgEmbedding as number[],
            recentViews.map((v: any) => v.productId),
            limit,
          );
        }
      }
    }

    // Content-based fallback from current product
    if (recommendedIds.length === 0 && productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { categoryId: true, embedding: true },
      });

      if (product?.embedding && Array.isArray(product.embedding) && product.embedding.length > 0) {
        const { getAIRecommendations } = await import("@/app/lib/openai");
        recommendedIds = await getAIRecommendations(
          product.embedding as number[],
          [productId],
          limit,
        );
      } else if (product?.categoryId) {
        // Category-based fallback
        const similar = await prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: productId },
            status: "ACTIVE",
            isActive: true,
          },
          take: limit,
          orderBy: { totalSales: "desc" },
          select: { id: true },
        });
        recommendedIds = similar.map((p: any) => p.id);
      }
    }

    // Trending fallback if still empty
    if (recommendedIds.length === 0) {
      const trending = await prisma.product.findMany({
        where: { status: "ACTIVE", isActive: true },
        take: limit,
        orderBy: { totalSales: "desc" },
        select: { id: true },
      });
      recommendedIds = trending.map((p: any) => p.id);
    }

    const products = await prisma.product.findMany({
      where: { id: { in: recommendedIds }, status: "ACTIVE", isActive: true },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { id: true, storeName: true, isVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 422 },
      );
    }
    console.error("[POST /api/ai/recommend]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
