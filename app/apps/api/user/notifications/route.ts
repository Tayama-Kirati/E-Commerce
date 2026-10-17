import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(50, Number(new URL(req.url).searchParams.get("limit")) || 20);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH /api/user/notifications — mark all as read, or only { ids: [...] }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : null;

  const { count } = await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false, ...(ids && { id: { in: ids } }) },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true, updated: count });
}

// DELETE /api/user/notifications — clear all read notifications
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count } = await prisma.notification.deleteMany({ where: { userId: session.user.id, isRead: true } });
  return NextResponse.json({ success: true, deleted: count });
}
