import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, readJson, zodError, jsonError, isAdmin } from "@/app/lib/api";
import { notifyBackInStock } from "@/app/lib/orders";
import { getSettings } from "@/app/lib/settings";

const BulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  action: z.enum(["activate", "deactivate", "delete", "flash_on", "flash_off", "free_shipping_on", "free_shipping_off", "set_stock"]),
  stock: z.number().int().min(0).optional(),
});

// ─── POST /api/seller/bulk — apply one action to many of the seller's products ─

export async function POST(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;

  const parsed = BulkSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { ids, action, stock } = parsed.data;
  if (action === "set_stock" && stock === undefined) return jsonError("stock is required for set_stock", 400);

  if (action === "flash_on" && !isAdmin(auth.user.role) && !(await getSettings()).flashSaleEnabled) {
    return jsonError("Flash sales are currently disabled", 403);
  }

  // Sellers may only touch their own products; rejected products stay hidden until an admin approves them
  const owned = { id: { in: ids }, ...(isAdmin(auth.user.role) ? {} : { sellerId: auth.user.sellerId! }) };

  const wasEmpty = action === "activate" || action === "set_stock"
    ? await prisma.product.findMany({ where: { ...owned, OR: [{ stock: { lte: 0 } }, { isActive: false }] }, select: { id: true } })
    : [];

  let affected = 0;
  switch (action) {
    case "activate":
      affected = (await prisma.product.updateMany({ where: { ...owned, status: { not: "REJECTED" } }, data: { isActive: true, status: "ACTIVE" } })).count;
      break;
    case "deactivate":
    case "delete":
      // "delete" is a soft delete so past orders keep their product
      affected = (await prisma.product.updateMany({ where: owned, data: { isActive: false, status: "INACTIVE" } })).count;
      break;
    case "flash_on":
    case "flash_off":
      affected = (await prisma.product.updateMany({ where: owned, data: { isFlashSale: action === "flash_on" } })).count;
      break;
    case "free_shipping_on":
    case "free_shipping_off":
      affected = (await prisma.product.updateMany({ where: owned, data: { freeShipping: action === "free_shipping_on" } })).count;
      break;
    case "set_stock":
      affected = (await prisma.product.updateMany({ where: owned, data: { stock } })).count;
      break;
  }

  for (const p of wasEmpty) notifyBackInStock(p.id).catch((err) => console.error("[back-in-stock]", err));
  return NextResponse.json({ affected });
}
