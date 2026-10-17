import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireUser, readJson, zodError } from "@/app/lib/api";
import { AddressSchema } from "@/app/lib/validation";

// ─── GET /api/user/addresses ──────────────────────────────────────────────────

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const addresses = await prisma.address.findMany({
    where: { userId: auth.user.id, isArchived: false },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return NextResponse.json({ addresses });
}

// ─── POST /api/user/addresses ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = AddressSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const userId = auth.user.id;

  const address = await prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId, isArchived: false } });
    const isDefault = parsed.data.isDefault ?? count === 0;
    if (isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.create({ data: { ...parsed.data, userId, isDefault } });
  });

  return NextResponse.json({ address }, { status: 201 });
}
