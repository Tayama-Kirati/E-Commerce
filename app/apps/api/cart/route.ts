import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id, savedForLater: false },
    orderBy: { addedAt: "desc" },
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
          status: true,
          isFlashSale: true,
          flashSaleEndsAt: true,
          freeShipping: true,
          isEco: true,
          seller: {
            select: {
              id: true,
              storeName: true,
              storeSlug: true,
              isVerified: true,
            },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          price: true,
          comparePrice: true,
          stock: true,
          attributes: true,
          image: true,
          isActive: true,
        },
      },
    },
  });

  const savedItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id, savedForLater: true },
    orderBy: { addedAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          stock: true,
          isActive: true,
          status: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
        },
      },
      variant: { select: { id: true, name: true, price: true, stock: true } },
    },
  });

  // Enrich with live pricing and availability
  const enriched = items.map((item: any) => {
    const price = item.variant
      ? Number(item.variant.price)
      : Number(item.product.basePrice);
    const origPrice = item.variant
      ? Number(item.variant.comparePrice)
      : Number(item.product.comparePrice);
    const stock = item.variant ? item.variant.stock : item.product.stock;
    const available =
      item.product.isActive &&
      item.product.status === "ACTIVE" &&
      stock > 0 &&
      (!item.variant || item.variant.isActive);
    const maxQty = Math.min(stock, 99);
    const qtyValid = item.quantity <= maxQty;

    return {
      ...item,
      price,
      originalPrice: origPrice || undefined,
      discountPercent: origPrice
        ? Math.round(((origPrice - price) / origPrice) * 100)
        : 0,
      stock,
      available,
      maxQty,
      qtyValid,
      stockWarning: stock > 0 && stock <= 5 ? `Only ${stock} left!` : undefined,
    };
  });

  // Summary
  const subtotal = enriched.reduce(
    (s: any, i: any) => s + i.price * i.quantity,
    0,
  );
  const totalItems = enriched.reduce((s: any, i: any) => s + i.quantity, 0);
  const savings = enriched.reduce(
    (s: any, i: any) =>
      s + ((i.originalPrice ?? i.price) - i.price) * i.quantity,
    0,
  );
  const freeShipping =
    subtotal >= 1000 || enriched.every((i: any) => i.product.freeShipping);
  const shippingCost = freeShipping ? 0 : 150;
  const hasUnavailable = enriched.some((i: any) => !i.available);

  return NextResponse.json({
    items: enriched,
    savedItems,
    summary: {
      subtotal,
      totalItems,
      savings,
      shippingCost,
      freeShipping,
      total: subtotal + shippingCost,
      threshold: freeShipping ? 0 : Math.max(0, 1000 - subtotal),
      hasUnavailable,
    },
  });
}

const AddItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().min(1).max(99).default(1),
  replace: z.boolean().default(false), // replace qty instead of incrementing
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = AddItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const { productId, variantId, quantity, replace } = parsed.data;

  // Validate product exists & is purchasable
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true, status: "ACTIVE" },
    include: { variants: variantId ? { where: { id: variantId } } : false },
  });
  if (!product)
    return NextResponse.json(
      { error: "Product not found or unavailable" },
      { status: 404 },
    );

  const variant = variantId ? (product.variants as any)?.[0] : undefined;
  if (variantId && !variant)
    return NextResponse.json(
      { error: "Product variant not found" },
      { status: 404 },
    );
  if (variant && !variant.isActive)
    return NextResponse.json(
      { error: "This variant is out of stock" },
      { status: 400 },
    );

  const stock = variant ? variant.stock : product.stock;

  // Check if already in cart
  const existing = await prisma.cartItem.findUnique({
    where: {
      userId_productId_variantId: {
        userId: session.user.id,
        productId,
        variantId: variantId ?? null,
      },
    },
  });

  const newQty = replace ? quantity : (existing?.quantity ?? 0) + quantity;

  if (newQty > stock) {
    return NextResponse.json(
      {
        error: `Only ${stock} unit${stock !== 1 ? "s" : ""} available`,
        maxQty: stock,
        currentQty: existing?.quantity ?? 0,
      },
      { status: 400 },
    );
  }

  const item = await prisma.cartItem.upsert({
    where: {
      userId_productId_variantId: {
        userId: session.user.id,
        productId,
        variantId: variantId ?? null,
      },
    },
    update: { quantity: newQty, savedForLater: false },
    create: { userId: session.user.id, productId, variantId, quantity: newQty },
    include: {
      product: {
        select: {
          name: true,
          basePrice: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
        },
      },
      variant: { select: { name: true, price: true } },
    },
  });

  return NextResponse.json(
    {
      item,
      message: `Added to cart!`,
      quantity: newQty,
    },
    { status: existing ? 200 : 201 },
  );
}

// ─── DELETE /api/cart  —  Clear entire cart  

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const savedOnly = searchParams.get("saved") === "true";

  await prisma.cartItem.deleteMany({
    where: {
      userId: session.user.id,
      savedForLater: savedOnly ? true : undefined,
    },
  });

  return NextResponse.json({ success: true });
}

const UpdateItemSchema = z.object({
  quantity: z.number().int().min(0).max(99).optional(),
  savedForLater: z.boolean().optional(),
});

export async function updateCartItemHandler(req: NextRequest, itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true, variant: true },
  });
  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  const body = await req.json();
  const data = UpdateItemSchema.parse(body);

  // Quantity = 0 means remove
  if (data.quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true, removed: true });
  }

  // Stock check
  if (data.quantity !== undefined) {
    const stock = item.variant ? item.variant.stock : item.product.stock;
    if (data.quantity > stock) {
      return NextResponse.json(
        { error: `Only ${stock} available`, maxQty: stock },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: {
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
      ...(data.savedForLater !== undefined
        ? { savedForLater: data.savedForLater }
        : {}),
    },
    include: {
      product: { select: { name: true, basePrice: true } },
      variant: { select: { name: true, price: true } },
    },
  });

  return NextResponse.json({ item: updated });
}

export async function removeCartItemHandler(req: NextRequest, itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}

const MergeSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      variantId: z.string().cuid().optional(),
      quantity: z.number().int().min(1).max(99),
    }),
  ),
});

export async function mergeCartHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = MergeSchema.parse(body);

  if (!data.items.length) return NextResponse.json({ merged: 0 });

  const productIds = [...new Set(data.items.map((i: any) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true, status: "ACTIVE" },
    include: { variants: true },
  });

  let merged = 0;
  for (const guestItem of data.items) {
    const product = products.find((p: any) => p.id === guestItem.productId);
    if (!product) continue;

    const variant = product.variants.find(
      (v: any) => v.id === guestItem.variantId,
    );
    const stock = variant ? variant.stock : product.stock;
    if (stock === 0) continue;

    try {
      const existing = await prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId: session.user.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId ?? null,
          },
        },
      });

      const newQty = Math.min(
        (existing?.quantity ?? 0) + guestItem.quantity,
        stock,
      );

      await prisma.cartItem.upsert({
        where: {
          userId_productId_variantId: {
            userId: session.user.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId ?? null,
          },
        },
        update: { quantity: newQty },
        create: {
          userId: session.user.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
        },
      });
      merged++;
    } catch {
      /* skip conflicts */
    }
  }

  return NextResponse.json({ merged, total: data.items.length });
}

export async function cartCountHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ count: 0 });

  const cacheKey = `cart:count:${session.user.id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json({ count: Number(cached) });

  const agg = await prisma.cartItem.aggregate({
    where: { userId: session.user.id, savedForLater: false },
    _sum: { quantity: true },
  });

  const count = agg._sum.quantity ?? 0;
  await redis.setex(cacheKey, 60, count);
  return NextResponse.json({ count });
}
