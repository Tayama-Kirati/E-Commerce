import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { requireUser, readJson, zodError, jsonError } from "@/app/lib/api";
import { rateLimit } from "@/app/lib/rate-limit";
import { notifyAdmins } from "@/app/lib/notify";

// ─── GET /api/support — the signed-in user's tickets ─────────────────────────

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: auth.user.id },
    orderBy: { updatedAt: "desc" },
    include: { replies: { orderBy: { createdAt: "asc" }, select: { id: true, body: true, isStaff: true, createdAt: true } } },
  });
  return NextResponse.json({ tickets });
}

// ─── POST /api/support — open a ticket (guests may too, with name + email) ───

const TicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(5000),
  category: z.enum(["ORDER", "PAYMENT", "RETURN", "ACCOUNT", "SELLER", "TECHNICAL", "GENERAL"]).default("GENERAL"),
  orderNumber: z.string().trim().max(50).optional(),
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().email().toLowerCase().trim().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(`support:${ip}`, 5, 3600);
  if (!success) return jsonError("Too many tickets — please wait before opening another", 429);

  const parsed = TicketSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const d = parsed.data;

  const session = await getServerSession(authOptions);
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true } })
    : null;
  const name = user?.name ?? d.name;
  const email = user?.email ?? d.email;
  if (!name || !email) return jsonError("Please give your name and email so we can reply", 400);

  let orderId: string | null = null;
  if (d.orderNumber && user) {
    const order = await prisma.order.findFirst({ where: { orderNumber: d.orderNumber, userId: user.id }, select: { id: true } });
    orderId = order?.id ?? null;
  }

  // Payment and order problems are time-sensitive
  const priority = d.category === "PAYMENT" ? "HIGH" : d.category === "ORDER" || d.category === "RETURN" ? "MEDIUM" : "LOW";
  const ticket = await prisma.supportTicket.create({
    data: { userId: user?.id ?? null, name, email, subject: d.subject, body: d.body, category: d.category, priority, orderId },
  });
  await notifyAdmins("New support ticket", `${d.category}: ${d.subject}`);

  return NextResponse.json({ ticket: { id: ticket.id, status: ticket.status }, message: "Thanks — our team will reply within 24 hours." }, { status: 201 });
}
