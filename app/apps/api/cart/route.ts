import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          comparePrice: true,
          stock: true,
          isActive: true,
          isFlashSale: true,
          flashSaleEndsAt: true,
          freeShipping: true,
          isEco: true,
          seller: {
            select: { id: true, storeName: true, storeSlug: true, isVerified: true },
          },
          images: {
            orderBy: { order: "asc" },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      },
    },
  });

  const enriched = items.map((item: any) => {
    const price = Number(item.product.basePrice);
    const origPrice = item.product.comparePrice
      ? Number(item.product.comparePrice)
      : undefined;
    const stock = item.product.stock;
    const available = item.product.isActive && stock > 0;
    const maxQty = Math.min(stock, 99);

    return {
      ...item,
      price,
      originalPrice: origPrice,
      discountPercent: origPrice
        ? Math.round(((origPrice - price) / origPrice) * 100)
        : 0,
      stock,
      available,
      maxQty,
      qtyValid: item.quantity <= maxQty,
      stockWarning: stock > 0 && stock <= 5 ? `Only ${stock} left!` : undefined,
    };
  });

  const subtotal = enriched.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const totalItems = enriched.reduce((s: number, i: any) => s + i.quantity, 0);
  const savings = enriched.reduce(
    (s: number, i: any) => s + ((i.originalPrice ?? i.price) - i.price) * i.quantity,
    0,
  );
  const freeShipping =
    subtotal >= 1000 || enriched.every((i: any) => i.product.freeShipping);
  const shippingCost = freeShipping ? 0 : 150;

  return NextResponse.json({
    items: enriched,
    summary: {
      subtotal,
      totalItems,
      savings,
      shippingCost,
      freeShipping,
      total: subtotal + shippingCost,
      threshold: freeShipping ? 0 : Math.max(0, 1000 - subtotal),
      hasUnavailable: enriched.some((i: any) => !i.available),
    },
  });
}

const AddItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(99).default(1),
  replace: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = AddItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 422 },
    );
  }
  const { productId, quantity, replace } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
  });
  if (!product)
    return NextResponse.json(
      { error: "Product not found or unavailable" },
      { status: 404 },
    );

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  const newQty = replace ? quantity : (existing?.quantity ?? 0) + quantity;

  if (newQty > product.stock) {
    return NextResponse.json(
      {
        error: `Only ${product.stock} unit${product.stock !== 1 ? "s" : ""} available`,
        maxQty: product.stock,
        currentQty: existing?.quantity ?? 0,
      },
      { status: 400 },
    );
  }

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    update: { quantity: newQty, price: product.basePrice },
    create: {
      userId: session.user.id,
      productId,
      quantity: newQty,
      price: product.basePrice,
    },
    include: {
      product: {
        select: {
          name: true,
          basePrice: true,
          images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });

  return NextResponse.json(
    { item, message: "Added to cart!", quantity: newQty },
    { status: existing ? 200 : 201 },
  );
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (productId) {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id, productId },
    });
  } else {
    await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
  }

  return NextResponse.json({ success: true });
}
