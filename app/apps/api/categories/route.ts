import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";

export async function GET() {
  try {
    const cached = await redis.get("categories:all");
    if (cached) return NextResponse.json(JSON.parse(cached as string));

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
        children: {
          include: { _count: { select: { products: true } } },
        },
      },
    });

    const result = { categories };
    await redis.setex("categories:all", 300, JSON.stringify(result));
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
