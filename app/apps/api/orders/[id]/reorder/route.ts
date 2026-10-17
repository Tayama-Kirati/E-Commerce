import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError } from "@/app/lib/api";
import { resolvePurchasable } from "@/app/lib/cart";

type Params = { params: Promise<{ id: string }> };

// ─── POST /api/orders/:id/reorder — put a past order's items back in the cart ─

export async function POST(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: auth.user.id },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (!order) return jsonError("Order not found", 404);

  const added: string[] = [];
  const unavailable: string[] = [];
  for (const item of order.items) {
    const resolved = await resolvePurchasable(item.productId, item.variantId);
    if ("error" in resolved || resolved.stock <= 0) {
      unavailable.push(item.product.name);
      continue;
    }
    const variantKey = item.variantId ?? "";
    const key = { userId_productId_variantKey: { userId: auth.user.id, productId: item.productId, variantKey } };
    const existing = await prisma.cartItem.findUnique({ where: key });
    const quantity = Math.min((existing?.quantity ?? 0) + item.quantity, resolved.stock, 99);
    await prisma.cartItem.upsert({
      where: key,
      update: { quantity, price: resolved.price, savedForLater: false },
      create: { userId: auth.user.id, productId: item.productId, variantId: item.variantId, variantKey, quantity, price: resolved.price },
    });
    added.push(item.product.name);
  }

  if (!added.length) return jsonError("None of these items are available right now", 409, { unavailable });
  return NextResponse.json({
    added: added.length,
    unavailable,
    message: unavailable.length
      ? `${added.length} item(s) added to your cart. ${unavailable.length} item(s) are no longer available.`
      : `${added.length} item(s) added to your cart.`,
  });
}
