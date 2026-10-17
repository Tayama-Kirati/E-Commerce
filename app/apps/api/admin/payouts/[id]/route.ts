import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { notify } from "@/app/lib/notify";
import { sendNoticeEmail } from "@/app/lib/email";

type Params = { params: Promise<{ id: string }> };

const UpdateSchema = z
  .object({
    status: z.enum(["PROCESSING", "PAID", "REJECTED"]),
    reference: z.string().trim().max(100).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.status !== "PAID" || !!d.reference, { message: "Enter the bank transfer reference", path: ["reference"] })
  .refine((d) => d.status !== "REJECTED" || !!d.note, { message: "Give the seller a reason", path: ["note"] });

// ─── PUT /api/admin/payouts/:id — mark processing, paid, or rejected ─────────

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = UpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { status, reference, note } = parsed.data;

  const payout = await prisma.payout.findUnique({ where: { id }, include: { seller: { select: { storeName: true, userId: true, user: { select: { email: true } } } } } });
  if (!payout) return jsonError("Payout not found", 404);
  if (payout.status === "PAID" || payout.status === "REJECTED") return jsonError("This payout is already settled", 409);

  const updated = await prisma.payout.update({
    where: { id },
    data: { status, ...(reference && { reference }), ...(note && { note }), ...(status !== "PROCESSING" && { processedAt: new Date() }) },
  });

  const amount = `रू ${Number(payout.amount).toLocaleString()}`;
  const body = status === "PAID"
    ? `${amount} was sent to your bank account (ref ${reference}).`
    : status === "REJECTED" ? `Your withdrawal of ${amount} was declined: ${note}` : `Your withdrawal of ${amount} is being processed.`;
  await notify({
    userId: payout.seller.userId,
    type: "PAYMENT",
    title: `Payout ${status.toLowerCase()}`,
    body,
    email: () => sendNoticeEmail({ to: payout.seller.user.email, subject: `Payout ${status.toLowerCase()} — ${payout.seller.storeName}`, heading: `Payout ${status.toLowerCase()}`, body }),
  });

  return NextResponse.json({ payout: { ...updated, amount: Number(updated.amount) } });
}

export const PATCH = PUT;
