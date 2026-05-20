import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";
import { z } from "zod";

// ─── GET /api/products  

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const sort = searchParams.get("sort") || "newest";
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const isEco = searchParams.get("eco") === "true" ? true : undefined;
    const freeShipping = searchParams.get("freeShipping") === "true" ? true : undefined;
    const isFlashSale = searchParams.get("flashSale") === "true" ? true : undefined;
    const isFeatured = searchParams.get("featured") === "true" ? true : undefined;
    const seller = searchParams.get("seller") || undefined;

    const cacheKey = `products:${req.url}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached as string), {
        headers: { "X-Cache": "HIT" },
      });
    }

    const where: any = { isActive: true, status: "ACTIVE" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortDesc: { contains: search, mode: "insensitive" } },
        { tags: { some: { tag: { contains: search, mode: "insensitive" } } } },
      ];
    }
    if (category) where.category = { slug: category };
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }
    if (isEco !== undefined) where.isEco = isEco;
    if (freeShipping !== undefined) where.freeShipping = freeShipping;
    if (isFlashSale !== undefined) where.isFlashSale = isFlashSale;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (seller) where.seller = { storeSlug: seller };

    const orderBy: any =
      sort === "price_asc" ? { basePrice: "asc" } :
      sort === "price_desc" ? { basePrice: "desc" } :
      sort === "rating_desc" ? { averageRating: "desc" } :
      sort === "sales_desc" ? { totalSales: "desc" } :
      sort === "views_desc" ? { totalViews: "desc" } :
      { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDesc: true,
          basePrice: true,
          comparePrice: true,
          stock: true,
          averageRating: true,
          totalReviews: true,
          totalSales: true,
          isEco: true,
          isFeatured: true,
          isFlashSale: true,
          flashSaleEndsAt: true,
          freeShipping: true,
          hasVariants: true,
          createdAt: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, alt: true },
          },
          category: { select: { id: true, name: true, slug: true } },
          seller: {
            select: {
              storeName: true,
              storeSlug: true,
              isVerified: true,
              city: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await redis.setex(cacheKey, 120, JSON.stringify(result));
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/products ───────────────────────────────────────────────────────

const CreateProductSchema = z.object({
  name: z.string().min(3).max(300),
  categoryId: z.string().cuid(),
  shortDesc: z.string().max(500).optional(),
  description: z.string().min(10),
  basePrice: z.number().positive(),
  comparePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).default(5),
  sku: z.string().min(1).max(100).optional(),
  isEco: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  flashSaleEndsAt: z.string().datetime().nullable().optional(),
  freeShipping: z.boolean().default(false),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  attributes: z
    .array(z.object({ name: z.string(), value: z.string(), sortOrder: z.number().default(0) }))
    .default([]),
  tags: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });
    if (!seller || seller.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Approved seller account required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const data = CreateProductSchema.parse(body);

    // Generate unique slug from name
    const base = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let slug = base;
    let attempt = 0;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${base}-${++attempt}`;
    }

    const product = await prisma.$transaction(async (tx: any) => {
      const { tags, attributes, ...rest } = data;

      const created = await tx.product.create({
        data: {
          ...rest,
          slug,
          sellerId: seller.id,
          isActive: rest.status === "ACTIVE",
        },
      });

      if (tags.length > 0) {
        await tx.productTag.createMany({
          data: tags.map((tag: string) => ({
            productId: created.id,
            tag: tag.toLowerCase().trim(),
          })),
        });
      }

      if (attributes.length > 0) {
        await tx.productAttribute.createMany({
          data: attributes.map((a: any) => ({ productId: created.id, ...a })),
        });
      }

      return tx.product.findUnique({
        where: { id: created.id },
        include: {
          images: true,
          variants: true,
          attributes: true,
          tags: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      });
    });

    await redis.del(`products:*`);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 422 },
      );
    }
    console.error("[POST /api/products]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
