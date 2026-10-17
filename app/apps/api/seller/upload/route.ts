import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, readJson, zodError, jsonError, isAdmin } from "@/app/lib/api";
import { saveImage, ImageError } from "@/app/lib/storage";

const UploadSchema = z.object({
  images: z.array(z.string().max(14_000_000)).min(1).max(10),
  // When given, the uploaded images are appended to this product's gallery
  productId: z.string().optional(),
});

// ─── POST /api/seller/upload — { images: dataURI[] } → { urls } ──────────────

export async function POST(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;

  const parsed = UploadSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { images, productId } = parsed.data;

  let product: { id: string; name: string } | null = null;
  if (productId) {
    product = await prisma.product.findFirst({
      where: { id: productId, ...(isAdmin(auth.user.role) ? {} : { sellerId: auth.user.sellerId! }) },
      select: { id: true, name: true },
    });
    if (!product) return jsonError("Product not found", 404);
  }

  let urls: string[];
  try {
    urls = await Promise.all(images.map((img) => saveImage(img, "peanut/products")));
  } catch (err) {
    if (err instanceof ImageError) return jsonError(err.message, 400);
    console.error("[seller upload]", err);
    return jsonError("Upload failed", 500);
  }

  if (product) {
    const last = await prisma.productImage.findFirst({ where: { productId: product.id }, orderBy: { order: "desc" }, select: { order: true } });
    const start = (last?.order ?? -1) + 1;
    await prisma.productImage.createMany({
      data: urls.map((url, i) => ({ productId: product!.id, url, alt: product!.name, order: start + i })),
    });
  }

  return NextResponse.json({ urls }, { status: 201 });
}
