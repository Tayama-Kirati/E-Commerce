import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";

function requireAdmin(role?: string) {
  return ["ADMIN", "SUPER_ADMIN"].includes(role ?? "");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || undefined;
  const isActive = searchParams.get("isActive");
  const category = searchParams.get("category") || undefined;
  const sellerId = searchParams.get("sellerId") || undefined;
  const sort = searchParams.get("sort") || "newest";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { seller: { storeName: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (isActive !== null && isActive !== undefined)
    where.isActive = isActive === "true";
  if (category) where.categoryId = category;
  if (sellerId) where.sellerId = sellerId;

  const orderBy: any =
    sort === "price_desc"  ? { basePrice: "desc" } :
    sort === "price_asc"   ? { basePrice: "asc" } :
    sort === "sales_desc"  ? { totalSales: "desc" } :
    sort === "rating_desc" ? { averageRating: "desc" } :
    { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
        category: { select: { name: true, slug: true } },
        seller: { select: { id: true, storeName: true, storeSlug: true, isVerified: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const [active, outOfStock] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stock: 0, isActive: true } }),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      total: await prisma.product.count(),
      active,
      outOfStock,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { productId, isActive, note } = await req.json();
  if (!productId || typeof isActive !== "boolean") {
    return NextResponse.json({ error: "productId and isActive required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: { include: { user: true } } },
  });
  if (!product)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.$transaction(async (tx: any) => {
    await tx.product.update({
      where: { id: productId },
      data: { isActive },
    });

    if (product.seller?.userId) {
      await tx.notification.create({
        data: {
          userId: product.seller.userId,
          type: "SYSTEM",
          title: isActive
            ? `✅ Product Approved: ${product.name}`
            : `❌ Product Rejected: ${product.name}`,
          body: isActive
            ? `Your product "${product.name}" has been approved and is now live!`
            : `Your product "${product.name}" was rejected.${note ? ` Reason: ${note}` : " Please review our listing guidelines."}`,
        },
      });
    }
  });

  await redis.del(`product:${product.slug}`);

  return NextResponse.json({ success: true, isActive });
}
