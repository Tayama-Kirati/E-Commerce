import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { notify } from "@/app/lib/notify";
import { sendNoticeEmail } from "@/app/lib/email";
import { transitionOrder, OrderTransitionError } from "@/app/lib/orders";

type Params = { params: Promise<{ id: string }> };

// Allowed review steps: REQUESTED → APPROVED|REJECTED → RECEIVED → REFUNDED
const NEXT: Record<string, string[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED", "REJECTED"],
  RECEIVED: ["REFUNDED"],
  REJECTED: [],
  REFUNDED: [],
};

const UpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "RECEIVED", "REFUNDED"]),
  adminNote: z.string().trim().max(1000).optional(),
  refundAmount: z.number().min(0).optional(),
});

const COPY: Record<string, string> = {
  APPROVED: "Your return was approved. Please hand the items to our courier when they call — keep the original packaging.",
  REJECTED: "Your return request was not approved.",
  RECEIVED: "We've received your returned items and are checking them.",
  REFUNDED: "Your refund has been issued.",
};

// ─── PUT /api/admin/returns/:id ───────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = UpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { status, adminNote, refundAmount } = parsed.data;

  const ret = await prisma.returnRequest.findUnique({
    where: { id },
    include: { order: { select: { id: true, orderNumber: true, status: true, total: true } }, user: { select: { email: true } } },
  });
  if (!ret) return jsonError("Return request not found", 404);
  if (!NEXT[ret.status].includes(status)) return jsonError(`Cannot move a return from ${ret.status} to ${status}`, 400);
  if (refundAmount !== undefined && refundAmount > Number(ret.order.total)) return jsonError("Refund can't exceed the order total", 400);

  const updated = await prisma.returnRequest.update({
    where: { id },
    data: { status, ...(adminNote !== undefined && { adminNote }), ...(refundAmount !== undefined && { refundAmount }) },
  });

  if (status === "REFUNDED" && ret.order.status === "DELIVERED") {
    try {
      await transitionOrder(ret.order.id, "REFUNDED", { note: `Refund for return ${ret.id}` });
    } catch (err) {
      if (!(err instanceof OrderTransitionError)) throw err;
    }
  }

  const body = `Order ${ret.order.orderNumber}: ${COPY[status]}${adminNote ? ` Note: ${adminNote}` : ""}`;
  await notify({
    userId: ret.userId,
    type: "ORDER",
    title: `Return ${status.toLowerCase()}`,
    body,
    email: () => sendNoticeEmail({ to: ret.user.email, subject: `Return update — ${ret.order.orderNumber}`, heading: `Return ${status.toLowerCase()}`, body, cta: { label: "View Order →", path: `/account/orders/${ret.order.id}` } }),
  });

  return NextResponse.json({ returnRequest: updated });
}

export const PATCH = PUT;
