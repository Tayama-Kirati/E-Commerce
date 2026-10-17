import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { readJson, zodError, jsonError } from "@/app/lib/api";
import { consumeToken } from "@/app/lib/tokens";
import { sendPasswordChangedEmail } from "@/app/lib/email";
import { PasswordSchema } from "@/app/lib/validation";

const ResetSchema = z
  .object({ token: z.string().min(32), password: PasswordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

// ─── POST /api/auth/reset-password ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const parsed = ResetSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  const userId = await consumeToken("reset-password", parsed.data.token);
  if (!userId) return jsonError("This reset link is invalid or has expired. Please request a new one.", 400);

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: userId },
      // Following the emailed link proves ownership of the address
      data: { passwordHash, emailVerified: new Date() },
    });
    await tx.session.deleteMany({ where: { userId } });
    return u;
  });

  sendPasswordChangedEmail({ to: user.email, name: user.firstName ?? "there" }).catch(console.error);
  return NextResponse.json({ message: "Password reset successfully. You can now sign in." });
}
