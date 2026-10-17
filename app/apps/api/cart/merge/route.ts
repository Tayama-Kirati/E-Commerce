import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, readJson, zodError } from "@/app/lib/api";
import { getCart, resolvePurchasable } from "@/app/lib/cart";

const MergeSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).nullish(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .max(100),
});

/**
 * POST /api/cart/merge — after login, folds the guest's local cart into their
 * account cart. Quantities are combined and capped at available stock; items
 * that no longer exist are skipped and reported back.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = MergeSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  const skipped: string[] = [];
  let merged = 0;

  for (const line of parsed.data.items) {
    const variantId = line.variantId ?? null;
    const resolved = await resolvePurchasable(line.productId, variantId);
    if ("error" in resolved || resolved.stock <= 0) {
      skipped.push(line.productId);
      continue;
    }
    const key = { userId_productId_variantKey: { userId: auth.user.id, productId: line.productId, variantKey: variantId ?? "" } };
    const existing = await prisma.cartItem.findUnique({ where: key });
    // The guest cart and the account cart are often the same items (re-login on the same
    // device), so take the larger quantity rather than adding them together.
    const quantity = Math.min(Math.max(existing?.quantity ?? 0, line.quantity), resolved.stock, 99);
    await prisma.cartItem.upsert({
      where: key,
      update: { quantity, price: resolved.price, savedForLater: false },
      create: { userId: auth.user.id, productId: line.productId, variantId, variantKey: variantId ?? "", quantity, price: resolved.price },
    });
    merged++;
  }

  return NextResponse.json({ merged, skipped, ...(await getCart(auth.user.id)) });
}
