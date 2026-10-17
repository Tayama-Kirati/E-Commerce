import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError, readJson, zodError } from "@/app/lib/api";
import { unitFor } from "@/app/lib/cart";

type Params = { params: Promise<{ id: string }> };

const UpdateSchema = z
  .object({
    quantity: z.number().int().min(0).max(99).optional(),
    savedForLater: z.boolean().optional(),
  })
  .refine((d) => d.quantity !== undefined || d.savedForLater !== undefined, { message: "Nothing to update" });

async function findOwnItem(userId: string, id: string) {
  return prisma.cartItem.findFirst({
    where: { id, userId },
    include: {
      product: { select: { basePrice: true, comparePrice: true, stock: true, isActive: true } },
      variant: { select: { price: true, comparePrice: true, stock: true } },
    },
  });
}

// ─── PATCH /api/cart/:id — change quantity or move to/from "saved for later" ─

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = UpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  const item = await findOwnItem(auth.user.id, id);
  if (!item) return jsonError("Cart item not found", 404);

  if (parsed.data.quantity === 0) {
    await prisma.cartItem.delete({ where: { id } });
    return NextResponse.json({ success: true, removed: true });
  }

  const { price, stock } = unitFor(item.product, item.variant);
  if (parsed.data.quantity !== undefined && parsed.data.quantity > stock) {
    return jsonError(`Only ${stock} unit${stock !== 1 ? "s" : ""} available`, 400, { maxQty: stock });
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: {
      ...(parsed.data.quantity !== undefined && { quantity: parsed.data.quantity }),
      ...(parsed.data.savedForLater !== undefined && { savedForLater: parsed.data.savedForLater }),
      price,
    },
  });
  return NextResponse.json({ item: updated });
}

// The single-page app sends quantity updates as POST.
export const POST = PATCH;

// ─── DELETE /api/cart/:id ─────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const { count } = await prisma.cartItem.deleteMany({ where: { id, userId: auth.user.id } });
  if (!count) return jsonError("Cart item not found", 404);
  return NextResponse.json({ success: true });
}
