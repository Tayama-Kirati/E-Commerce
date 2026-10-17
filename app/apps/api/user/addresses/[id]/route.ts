import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError, readJson, zodError } from "@/app/lib/api";
import { AddressSchema } from "@/app/lib/validation";

type Params = { params: Promise<{ id: string }> };

// ─── PUT /api/user/addresses/:id — edit, or { isDefault: true } to make default ─

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;
  const userId = auth.user.id;

  const parsed = AddressSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  const existing = await prisma.address.findFirst({ where: { id, userId, isArchived: false } });
  if (!existing) return jsonError("Address not found", 404);

  const address = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.update({ where: { id }, data: parsed.data });
  });
  return NextResponse.json({ address });
}

export const PATCH = PUT;

// ─── DELETE /api/user/addresses/:id ───────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;
  const userId = auth.user.id;

  const existing = await prisma.address.findFirst({
    where: { id, userId, isArchived: false },
    include: { _count: { select: { orders: true } } },
  });
  if (!existing) return jsonError("Address not found", 404);

  await prisma.$transaction(async (tx) => {
    if (existing._count.orders > 0) {
      // Past orders still point at this address — hide it instead of deleting
      await tx.address.update({ where: { id }, data: { isArchived: true, isDefault: false } });
    } else {
      await tx.address.delete({ where: { id } });
    }
    if (existing.isDefault) {
      const next = await tx.address.findFirst({ where: { userId, isArchived: false }, orderBy: { id: "asc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  return NextResponse.json({ success: true });
}
