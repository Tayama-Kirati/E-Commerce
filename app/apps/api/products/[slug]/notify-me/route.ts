import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { jsonError, readJson, zodError } from "@/app/lib/api";
import { rateLimit } from "@/app/lib/rate-limit";

type Params = { params: Promise<{ slug: string }> };

const NotifySchema = z.object({ email: z.string().email().toLowerCase().trim().optional() });

async function findProduct(slugOrId: string) {
  return prisma.product.findFirst({ where: { OR: [{ slug: slugOrId }, { id: slugOrId }] }, select: { id: true, stock: true, isActive: true } });
}

// ─── POST /api/products/:slug/notify-me — "email me when it's back in stock" ─

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(`notify-me:${ip}`, 10, 600);
  if (!success) return jsonError("Too many requests", 429);

  const parsed = NotifySchema.safeParse((await readJson(req)) ?? {});
  if (!parsed.success) return zodError(parsed.error);

  const session = await getServerSession(authOptions);
  const email = parsed.data.email ?? session?.user?.email;
  if (!email) return jsonError("Enter your email address", 400);

  const product = await findProduct(slug);
  if (!product) return jsonError("Product not found", 404);
  if (product.stock > 0 && product.isActive) return jsonError("This product is in stock — you can order it now", 409);

  await prisma.stockAlert.upsert({
    where: { productId_email: { productId: product.id, email } },
    create: { productId: product.id, email, userId: session?.user?.id ?? null },
    // Re-subscribing after a previous alert re-arms it
    update: { notifiedAt: null },
  });
  return NextResponse.json({ subscribed: true, message: "We'll email you as soon as it's back in stock." });
}

// ─── DELETE /api/products/:slug/notify-me ─────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return jsonError("Please sign in to manage stock alerts", 401);
  const product = await findProduct(slug);
  if (!product) return jsonError("Product not found", 404);
  await prisma.stockAlert.deleteMany({ where: { productId: product.id, email: email.toLowerCase() } });
  return NextResponse.json({ subscribed: false });
}
