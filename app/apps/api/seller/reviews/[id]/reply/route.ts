import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, readJson, zodError, jsonError, isAdmin } from "@/app/lib/api";

type Params = { params: Promise<{ id: string }> };

const ReplySchema = z.object({ reply: z.string().trim().max(1000) });

// ─── POST /api/seller/reviews/:id/reply — public reply (empty string removes it) ─

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = ReplySchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  const review = await prisma.review.findUnique({
    where: { id },
    include: { product: { select: { name: true, sellerId: true } } },
  });
  if (!review || (review.product.sellerId !== auth.user.sellerId && !isAdmin(auth.user.role))) {
    return jsonError("Review not found", 404);
  }

  const reply = parsed.data.reply || null;
  const updated = await prisma.review.update({
    where: { id },
    data: { sellerReply: reply, sellerRepliedAt: reply ? new Date() : null },
  });

  if (reply && !review.sellerReply) {
    await prisma.notification.create({
      data: { userId: review.userId, type: "REVIEW", title: "The seller replied to your review", body: `${review.product.name}: "${reply.slice(0, 100)}"` },
    });
  }
  return NextResponse.json({ review: updated });
}

export const PUT = POST;
