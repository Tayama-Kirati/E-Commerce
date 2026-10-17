import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError, readJson, zodError } from "@/app/lib/api";

// ─── GET /api/user/wishlist ───────────────────────────────────────────────────

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const items = await prisma.wishlistItem.findMany({
    where: { userId: auth.user.id },
    orderBy: { id: "desc" },
    include: {
      product: {
        select: {
          id: true, name: true, slug: true, basePrice: true, comparePrice: true, stock: true,
          isActive: true, averageRating: true, totalReviews: true, freeShipping: true, isFlashSale: true,
          images: { orderBy: { order: "asc" }, take: 1, select: { url: true, alt: true } },
          seller: { select: { storeName: true, storeSlug: true } },
        },
      },
    },
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      product: { ...i.product, basePrice: Number(i.product.basePrice), comparePrice: i.product.comparePrice != null ? Number(i.product.comparePrice) : null },
      inStock: i.product.isActive && i.product.stock > 0,
    })),
    ids: items.map((i) => i.productId),
  });
}

// ─── POST /api/user/wishlist — toggle (or force with { wishlisted }) ─────────

const ToggleSchema = z.object({ productId: z.string().min(1), wishlisted: z.boolean().optional() });

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = ToggleSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { productId } = parsed.data;

  const key = { userId_productId: { userId: auth.user.id, productId } };
  const existing = await prisma.wishlistItem.findUnique({ where: key });
  const want = parsed.data.wishlisted ?? !existing;

  if (want && !existing) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return jsonError("Product not found", 404);
    await prisma.wishlistItem.create({ data: { userId: auth.user.id, productId } });
  } else if (!want && existing) {
    await prisma.wishlistItem.delete({ where: key });
  }

  return NextResponse.json({ wishlisted: want, productId });
}

// ─── DELETE /api/user/wishlist?productId= ─────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return jsonError("productId is required", 400);
  await prisma.wishlistItem.deleteMany({ where: { userId: auth.user.id, productId } });
  return NextResponse.json({ wishlisted: false, productId });
}
