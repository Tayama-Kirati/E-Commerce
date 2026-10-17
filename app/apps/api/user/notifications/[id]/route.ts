import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError, readJson } from "@/app/lib/api";

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/user/notifications/:id — { isRead } (defaults to marking read) ─

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;
  const body = await readJson<{ isRead?: boolean }>(req);

  const { count } = await prisma.notification.updateMany({
    where: { id, userId: auth.user.id },
    data: { isRead: body?.isRead ?? true },
  });
  if (!count) return jsonError("Notification not found", 404);
  return NextResponse.json({ success: true });
}

// ─── DELETE /api/user/notifications/:id ───────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const { count } = await prisma.notification.deleteMany({ where: { id, userId: auth.user.id } });
  if (!count) return jsonError("Notification not found", 404);
  return NextResponse.json({ success: true });
}
