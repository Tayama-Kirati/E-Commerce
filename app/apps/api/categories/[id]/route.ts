import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const category = await prisma.category.findUnique({
      where: { id: id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${category._count.products} product(s) are assigned to this category. Remove or reassign them first.` },
        { status: 400 },
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this category has ${category._count.children} subcategor${category._count.children === 1 ? "y" : "ies"}. Delete them first.` },
        { status: 400 },
      );
    }

    await prisma.category.delete({ where: { id: id } });

    try { await redis.del("categories:all"); } catch { /* non-fatal */ }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/categories/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
