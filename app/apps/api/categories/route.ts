import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";

export async function GET() {
  try {
    try {
      const cached = await redis.get("categories:all");
      if (cached) return NextResponse.json(JSON.parse(cached as string));
    } catch { /* cache miss, continue to DB */ }

    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
        children: {
          include: { _count: { select: { products: true } } },
          orderBy: { name: "asc" },
        },
      },
    });

    const result = { categories };
    try { await redis.setex("categories:all", 300, JSON.stringify(result)); } catch { /* non-fatal */ }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, icon, parentId } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    // Generate unique slug from name
    const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let slug = base;
    let attempt = 0;
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${base}-${++attempt}`;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        icon: icon?.trim() || null,
        parentId: parentId || null,
      },
    });

    try { await redis.del("categories:all"); } catch { /* non-fatal */ }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/categories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
