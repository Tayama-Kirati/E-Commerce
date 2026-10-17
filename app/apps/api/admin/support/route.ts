import { NextRequest, NextResponse } from "next/server";
import type { Prisma, TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, pagination } from "@/app/lib/api";

const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// ─── GET /api/admin/support?status=&priority=&search= ─────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 20, 100);

  const where: Prisma.SupportTicketWhereInput = {};
  const status = sp.get("status")?.toUpperCase() as TicketStatus | undefined;
  if (status && STATUSES.includes(status)) where.status = status;
  const priority = sp.get("priority")?.toUpperCase() as TicketPriority | undefined;
  if (priority && PRIORITIES.includes(priority)) where.priority = priority;
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [tickets, total, counts] = await Promise.all([
    prisma.supportTicket.findMany({
      where, skip, take: limit,
      // Most urgent first, then oldest waiting
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
      include: {
        user: { select: { id: true, name: true, email: true } },
        replies: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
      },
    }),
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  return NextResponse.json({
    tickets: tickets.map((t) => ({ ...t, user: t.user ?? { id: null, name: t.name, email: t.email } })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    statusCounts: Object.fromEntries(counts.map((c) => [c.status, c._count.status])),
  });
}
