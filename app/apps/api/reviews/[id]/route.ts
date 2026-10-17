import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError, readJson, zodError, isAdmin } from "@/app/lib/api";
import { refreshProductRating } from "@/app/lib/reviews";

type Params = { params: Promise<{ id: string }> };

const EditSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).nullable().optional(),
  body: z.string().max(2000).nullable().optional(),
});

// ─── PUT /api/reviews/:id — the author edits their review ─────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = EditSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review || review.userId !== auth.user.id) return jsonError("Review not found", 404);

  const updated = await prisma.review.update({ where: { id }, data: parsed.data });
  if (parsed.data.rating !== undefined) await refreshProductRating(review.productId);
  return NextResponse.json({ review: updated });
}

export const PATCH = PUT;

// ─── DELETE /api/reviews/:id — the author or an admin ─────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review || (review.userId !== auth.user.id && !isAdmin(auth.user.role))) return jsonError("Review not found", 404);

  await prisma.review.delete({ where: { id } });
  await refreshProductRating(review.productId);
  return NextResponse.json({ success: true });
}
