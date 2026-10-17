import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, readJson, zodError, jsonError } from "@/app/lib/api";
import { notifyAdmins } from "@/app/lib/notify";

type Params = { params: Promise<{ id: string }> };

// ─── POST /api/support/:id — the customer adds a follow-up message ───────────

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = z.object({ body: z.string().trim().min(1).max(5000) }).safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  const ticket = await prisma.supportTicket.findFirst({ where: { id, userId: auth.user.id } });
  if (!ticket) return jsonError("Ticket not found", 404);

  const reply = await prisma.ticketReply.create({ data: { ticketId: id, userId: auth.user.id, body: parsed.data.body, isStaff: false } });
  // A customer reply re-opens a resolved ticket
  await prisma.supportTicket.update({ where: { id }, data: { status: ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "OPEN" : ticket.status } });
  await notifyAdmins("Customer replied to ticket", ticket.subject);

  return NextResponse.json({ reply }, { status: 201 });
}
