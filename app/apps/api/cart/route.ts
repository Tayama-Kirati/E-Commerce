import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError, readJson, zodError } from "@/app/lib/api";
import { getCart, resolvePurchasable } from "@/app/lib/cart";

// ─── GET /api/cart ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const province = req.nextUrl.searchParams.get("province");
  return NextResponse.json(await getCart(auth.user.id, province));
}

// ─── POST /api/cart — add (or set) a product/variant quantity ────────────────

const AddItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).nullish(),
  quantity: z.number().int().min(1).max(99).default(1),
  replace: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = AddItemSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { productId, quantity, replace } = parsed.data;
  const variantId = parsed.data.variantId ?? null;

  const resolved = await resolvePurchasable(productId, variantId);
  if ("error" in resolved) return jsonError(resolved.error!, 404);

  const key = { userId_productId_variantKey: { userId: auth.user.id, productId, variantKey: variantId ?? "" } };
  const existing = await prisma.cartItem.findUnique({ where: key });
  const newQty = replace ? quantity : (existing?.quantity ?? 0) + quantity;

  if (newQty > resolved.stock) {
    return jsonError(`Only ${resolved.stock} unit${resolved.stock !== 1 ? "s" : ""} available`, 400, {
      maxQty: resolved.stock,
      currentQty: existing?.quantity ?? 0,
    });
  }

  const item = await prisma.cartItem.upsert({
    where: key,
    update: { quantity: newQty, price: resolved.price, savedForLater: false },
    create: { userId: auth.user.id, productId, variantId, variantKey: variantId ?? "", quantity: newQty, price: resolved.price },
    include: {
      product: { select: { name: true, basePrice: true, images: { orderBy: { order: "asc" }, take: 1, select: { url: true } } } },
      variant: { select: { name: true } },
    },
  });

  return NextResponse.json({ item, message: "Added to cart!", quantity: newQty }, { status: existing ? 200 : 201 });
}

// ─── DELETE /api/cart[?productId=] — clear the cart or one product ──────────

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const productId = req.nextUrl.searchParams.get("productId");
  await prisma.cartItem.deleteMany({
    // Clearing the cart keeps "saved for later" items
    where: productId ? { userId: auth.user.id, productId } : { userId: auth.user.id, savedForLater: false },
  });
  return NextResponse.json({ success: true });
}
