import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireUser, jsonError } from "@/app/lib/api";
import { saveImage, ImageError } from "@/app/lib/storage";

// ─── POST /api/user/avatar — { base64 } JSON or multipart "file" ─────────────

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let dataUri: string | null = null;
  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    const file = (await req.formData()).get("file");
    if (file instanceof File) dataUri = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  } else {
    const body = await req.json().catch(() => null);
    dataUri = typeof body?.base64 === "string" ? body.base64 : null;
  }
  if (!dataUri) return jsonError("No image provided", 400);

  try {
    const avatar = await saveImage(dataUri, "peanut/avatars");
    await prisma.user.update({ where: { id: auth.user.id }, data: { avatar } });
    return NextResponse.json({ avatar });
  } catch (err) {
    if (err instanceof ImageError) return jsonError(err.message, 400);
    console.error("[avatar]", err);
    return jsonError("Upload failed", 500);
  }
}

// ─── DELETE /api/user/avatar ──────────────────────────────────────────────────

export async function DELETE() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  await prisma.user.update({ where: { id: auth.user.id }, data: { avatar: null } });
  return NextResponse.json({ avatar: null });
}
