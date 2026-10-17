import { prisma } from "@/app/lib/prisma";
import { quoteShipping } from "@/app/lib/shipping";

const cartInclude = {
  product: {
    select: {
      id: true, name: true, slug: true, basePrice: true, comparePrice: true, stock: true,
      isActive: true, isFlashSale: true, flashSaleEndsAt: true, freeShipping: true, isEco: true,
      seller: { select: { id: true, storeName: true, storeSlug: true, isVerified: true } },
      images: { orderBy: { order: "asc" as const }, take: 1, select: { url: true, alt: true } },
    },
  },
  variant: { select: { id: true, name: true, price: true, comparePrice: true, stock: true, image: true, attributes: true } },
};

/** Effective price/stock for a product or one of its variants. */
export function unitFor(product: { basePrice: unknown; comparePrice: unknown; stock: number }, variant?: { price: unknown; comparePrice: unknown; stock: number } | null) {
  const price = Number(variant?.price ?? product.basePrice);
  const compare = variant ? variant.comparePrice : product.comparePrice;
  return {
    price,
    originalPrice: compare != null ? Number(compare) : undefined,
    stock: variant ? variant.stock : product.stock,
  };
}

export async function getCart(userId: string, province?: string | null) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    include: cartInclude,
    orderBy: { createdAt: "asc" },
  });

  const enriched = rows.map((item) => {
    const { price, originalPrice, stock } = unitFor(item.product, item.variant);
    const available = item.product.isActive && stock > 0;
    const maxQty = Math.min(stock, 99);
    return {
      ...item,
      price,
      originalPrice,
      discountPercent: originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
      stock,
      available,
      maxQty,
      qtyValid: item.quantity <= maxQty,
      stockWarning: stock > 0 && stock <= 5 ? `Only ${stock} left!` : undefined,
    };
  });

  const items = enriched.filter((i) => !i.savedForLater);
  const savedItems = enriched.filter((i) => i.savedForLater);
  const purchasable = items.filter((i) => i.available);

  const subtotal = purchasable.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const savings = purchasable.reduce((s, i) => s + ((i.originalPrice ?? i.price) - i.price) * i.quantity, 0);
  const shipping = await quoteShipping({
    subtotal,
    allItemsFreeShipping: purchasable.length > 0 && purchasable.every((i) => i.product.freeShipping),
    province,
  });

  return {
    items,
    savedItems,
    summary: {
      subtotal,
      totalItems,
      savings,
      shippingCost: shipping.cost,
      freeShipping: shipping.free,
      total: subtotal + shipping.cost,
      threshold: shipping.remainingForFree,
      estimatedDays: shipping.estimatedDays,
      hasUnavailable: items.some((i) => !i.available),
    },
  };
}

/** Validates that a product (and optional variant) can be added, returning its unit price and stock. */
export async function resolvePurchasable(productId: string, variantId?: string | null) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true, basePrice: true, comparePrice: true, stock: true, hasVariants: true, variants: { select: { id: true, price: true, comparePrice: true, stock: true, name: true } } },
  });
  if (!product) return { error: "Product not found or unavailable" as const };
  const variant = variantId ? product.variants.find((v) => v.id === variantId) ?? null : null;
  if (variantId && !variant) return { error: "Selected option is no longer available" as const };
  // Without a variant the base product's price and stock apply (the SPA product page has no variant picker)
  return { product, variant, ...unitFor(product, variant) };
}
