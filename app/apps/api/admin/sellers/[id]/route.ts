import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { notify } from "@/app/lib/notify";
import { sendSellerStatusEmail } from "@/app/lib/email";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/sellers/:id ───────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const seller = await prisma.seller.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      products: { select: { id: true, name: true, slug: true, status: true, stock: true, totalSales: true }, orderBy: { totalSales: "desc" }, take: 10 },
      payouts: { orderBy: { requestedAt: "desc" }, take: 10 },
      _count: { select: { products: true } },
    },
  });
  if (!seller) return jsonError("Seller not found", 404);
  return NextResponse.json({ seller });
}

// ─── PUT /api/admin/sellers/:id — approve, suspend, ban, or verify ───────────

const UpdateSchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "SUSPENDED", "BANNED"]).optional(),
    reason: z.string().trim().max(500).optional(),
    isVerified: z.boolean().optional(),
  })
  .refine((d) => !["SUSPENDED", "BANNED"].includes(d.status ?? "") || !!d.reason, { message: "A reason is required", path: ["reason"] });

const COPY: Record<string, { title: string; body: (reason?: string) => string }> = {
  APPROVED: { title: "Your store is approved", body: () => "Congratulations! Your store is verified and payouts are unlocked." },
  SUSPENDED: { title: "Your store is suspended", body: (r) => `Your products are hidden while we review your store. Reason: ${r}` },
  BANNED: { title: "Your store has been closed", body: (r) => `Your seller account was closed. Reason: ${r}` },
  PENDING: { title: "Your store is under review", body: () => "We're reviewing your store. This usually takes one business day." },
};

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = UpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { status, reason, isVerified } = parsed.data;

  const seller = await prisma.seller.findUnique({ where: { id }, include: { user: { select: { id: true, email: true, name: true } } } });
  if (!seller) return jsonError("Seller not found", 404);

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.seller.update({
      where: { id },
      data: {
        ...(status && { status, statusReason: reason ?? null }),
        ...(status === "APPROVED" && { isVerified: true }),
        ...((status === "SUSPENDED" || status === "BANNED") && { isVerified: false }),
        ...(isVerified !== undefined && { isVerified }),
      },
    });
    // Hide a suspended/banned store's products; restore them when re-approved
    if (status === "SUSPENDED" || status === "BANNED") {
      await tx.product.updateMany({ where: { sellerId: id, status: "ACTIVE" }, data: { isActive: false } });
    } else if (status === "APPROVED" && (seller.status === "SUSPENDED" || seller.status === "BANNED")) {
      await tx.product.updateMany({ where: { sellerId: id, status: "ACTIVE" }, data: { isActive: true } });
    }
    return s;
  });

  if (status && status !== seller.status) {
    const copy = COPY[status];
    await notify({
      userId: seller.user.id,
      type: "SYSTEM",
      title: copy.title,
      body: copy.body(reason),
      email: () => sendSellerStatusEmail({ to: seller.user.email, storeName: seller.storeName, title: copy.title, body: copy.body(reason) }),
    });
  }
  return NextResponse.json({ seller: updated });
}

export const PATCH = PUT;
