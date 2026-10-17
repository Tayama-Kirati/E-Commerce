import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { redis } from "@/app/lib/redis";
import { notifyBackInStock } from "@/app/lib/orders";

type Params = { params: Promise<{ id: string }> };

const ModerateSchema = z
  .object({
    status: z.enum(["ACTIVE", "REJECTED", "INACTIVE", "PENDING"]),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.status !== "REJECTED" || !!d.note, { message: "Give the seller a reason for the rejection", path: ["note"] });

// ─── PUT /api/admin/products/:id/moderate — approve, reject or unlist ────────

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = ModerateSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { status, note } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, isActive: true, seller: { select: { userId: true } } },
  });
  if (!product) return jsonError("Product not found", 404);

  const updated = await prisma.product.update({
    where: { id },
    data: { status, isActive: status === "ACTIVE", moderationNote: note ?? null },
    select: { id: true, status: true, isActive: true, moderationNote: true },
  });

  if (product.seller) {
    const messages: Record<string, { title: string; body: string }> = {
      ACTIVE: { title: `Product approved: ${product.name}`, body: `"${product.name}" is now live.` },
      REJECTED: { title: `Product rejected: ${product.name}`, body: `"${product.name}" was rejected. Reason: ${note}` },
      INACTIVE: { title: `Product unlisted: ${product.name}`, body: `"${product.name}" was unlisted by an admin.${note ? ` Reason: ${note}` : ""}` },
      PENDING: { title: `Product under review: ${product.name}`, body: `"${product.name}" is being reviewed.` },
    };
    await prisma.notification.create({ data: { userId: product.seller.userId, type: "SYSTEM", ...messages[status] } });
  }

  try { await redis.del(`product:${product.slug}`); } catch { /* non-fatal */ }
  if (status === "ACTIVE" && !product.isActive) notifyBackInStock(product.id).catch(console.error);

  return NextResponse.json({ product: updated });
}

export const POST = PUT;
