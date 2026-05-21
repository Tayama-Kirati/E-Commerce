import { NextRequest, NextResponse } from "next/server";
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

    let categoryId: string | null = null;
    let excludeId: string | undefined = productId;

    // Use current product's category for recommendations
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { categoryId: true },
      });
      categoryId = product?.categoryId ?? null;
    }

    // Category-based recommendations
    if (categoryId) {
      const similar = await prisma.product.findMany({
        where: {
          categoryId,
          isActive: true,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        take: limit,
        orderBy: { totalSales: "desc" },
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          seller: { select: { id: true, storeName: true, isVerified: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      if (similar.length > 0) {
        return NextResponse.json({ products: similar });
      }
    }

    // Trending fallback
    const trending = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      take: limit,
      orderBy: { totalSales: "desc" },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        seller: { select: { id: true, storeName: true, isVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ products: trending });
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
