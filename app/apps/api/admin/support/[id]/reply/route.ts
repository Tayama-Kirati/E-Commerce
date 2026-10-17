import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { sendTicketReplyEmail } from "@/app/lib/email";

type Params = { params: Promise<{ id: string }> };

const ReplySchema = z.object({
  body: z.string().trim().min(1).max(5000),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

// ─── POST /api/admin/support/:id/reply — staff reply (emails the customer) ───

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = ReplySchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { body, status, priority } = parsed.data;

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return jsonError("Ticket not found", 404);

  const [reply] = await prisma.$transaction([
    prisma.ticketReply.create({ data: { ticketId: id, userId: auth.user.id, body, isStaff: true } }),
    prisma.supportTicket.update({
      where: { id },
      data: { status: status ?? (ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status), ...(priority && { priority }) },
    }),
  ]);

  if (ticket.userId) {
    await prisma.notification.create({
      data: { userId: ticket.userId, type: "SYSTEM", title: "Support replied", body: `Re: ${ticket.subject}` },
    });
  }
  sendTicketReplyEmail({ to: ticket.email, name: ticket.name, subject: ticket.subject, reply: body }).catch(console.error);

  return NextResponse.json({ reply }, { status: 201 });
}
