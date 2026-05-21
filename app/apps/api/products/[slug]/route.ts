import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";
import { z } from "zod";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const cacheKey = `product:${slug}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached as string), {
        headers: { "X-Cache": "HIT" },
      });
    }

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { order: "asc" } },
        variants: true,
        tags: true,
        category: {
          include: {
            parent: { include: { parent: true } },
            children: { select: { id: true, name: true, slug: true } },
          },
        },
        seller: {
          select: {
            id: true,
            storeName: true,
            storeSlug: true,
            logo: true,
            banner: true,
            isVerified: true,
            rating: true,
            totalSales: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 8,
      orderBy: { totalSales: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        comparePrice: true,
        averageRating: true,
        totalReviews: true,
        isEco: true,
        isFlashSale: true,
        images: {
          orderBy: { order: "asc" },
          take: 1,
          select: { url: true, alt: true },
        },
      },
    });

    const ratingDist = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId: product.id },
      _count: { rating: true },
    });

    const result = {
      product: {
        ...product,
        tags: product.tags.map((t: any) => t.tag),
        ratingDistribution: [5, 4, 3, 2, 1].map((r) => ({
          rating: r,
          count: ratingDist.find((d) => d.rating === r)?._count.rating ?? 0,
        })),
      },
      related,
    };

    await redis.setex(cacheKey, 300, JSON.stringify(result));
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/products/[slug]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT /api/products/[slug] ─────────────────────────────────────────────────

const UpdateProductSchema = z.object({
  name: z.string().min(3).max(300).optional(),
  categoryId: z.string().optional(),
  shortDesc: z.string().max(500).optional(),
  description: z.string().min(10).optional(),
  basePrice: z.number().positive().optional(),
  comparePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  isEco: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isFlashSale: z.boolean().optional(),
  flashSaleEndsAt: z.string().nullable().optional(),
  freeShipping: z.boolean().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { seller: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const isOwner = product.seller?.userId === session.user.id;
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = UpdateProductSchema.parse(body);

    const updated = await prisma.$transaction(async (tx: any) => {
      if (data.tags !== undefined) {
        await tx.productTag.deleteMany({ where: { productId: product.id } });
        await tx.productTag.createMany({
          data: data.tags.map((tag) => ({
            productId: product.id,
            tag: tag.toLowerCase().trim(),
          })),
        });
      }

      const { tags: _t, ...rest } = data;
      return tx.product.update({
        where: { id: product.id },
        data: rest,
        include: {
          images: { orderBy: { order: "asc" } },
          variants: true,
          tags: true,
        },
      });
    });

    await redis.del(`product:${slug}`);
    await redis.del(`products:*`);

    return NextResponse.json({ product: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 422 },
      );
    }
    console.error("[PUT /api/products/[slug]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/products/[slug] ──────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { seller: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const isOwner = product.seller?.userId === session.user.id;
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { isActive: false },
    });

    await redis.del(`product:${slug}`);
    await redis.del(`products:*`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/products/[slug]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
