import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/frontend/web/lib/prisma";
import { redis } from "@/frontend/web/lib/redis";

const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().default(10),
  type: z.enum(["all", "products", "categories", "sellers"]).default("all"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { q, limit, type } = SearchQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    const cacheKey = `search:${q}:${type}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached as string));

    const results: any = {};

    if (type === "all" || type === "products") {
      results.products = await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { shortDesc: { contains: q, mode: "insensitive" } },
            { tags: { some: { tag: { contains: q, mode: "insensitive" } } } },
          ],
        },
        take: limit,
        orderBy: { totalSales: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          averageRating: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
          category: { select: { name: true, slug: true } },
        },
      });
    }

    if (type === "all" || type === "categories") {
      results.categories = await prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: "insensitive" },
        },
        take: 5,
        select: { id: true, name: true, slug: true, icon: true, image: true },
      });
    }

    if (type === "all" || type === "sellers") {
      results.sellers = await prisma.seller.findMany({
        where: {
          status: "APPROVED",
          storeName: { contains: q, mode: "insensitive" },
        },
        take: 3,
        select: {
          id: true,
          storeName: true,
          storeSlug: true,
          storeLogo: true,
          averageRating: true,
          isVerified: true,
        },
      });
    }

    // Trending searches (track in Redis sorted set)
    await redis.zincrby("search:trending", 1, q.toLowerCase());

    await redis.setex(cacheKey, 60, JSON.stringify(results));
    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
