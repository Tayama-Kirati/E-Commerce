import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireUser, readJson, zodError, jsonError } from "@/app/lib/api";
import { sendPasswordChangedEmail } from "@/app/lib/email";
import { PasswordSchema } from "@/app/lib/validation";

const ChangeSchema = z
  .object({ currentPassword: z.string().min(1), newPassword: PasswordSchema, confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

// ─── POST /api/auth/change-password ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = ChangeSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: auth.user.id } });
  if (!user.passwordHash) return jsonError("This account uses Google sign-in and has no password.", 400);
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return jsonError("Current password is incorrect.", 400);
  }
  if (await bcrypt.compare(parsed.data.newPassword, user.passwordHash)) {
    return jsonError("New password must be different from your current password.", 400);
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) } });
  sendPasswordChangedEmail({ to: user.email, name: user.firstName ?? "there" }).catch(console.error);
  return NextResponse.json({ message: "Password changed successfully." });
}
