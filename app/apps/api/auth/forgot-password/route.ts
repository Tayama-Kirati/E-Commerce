import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { readJson, zodError, jsonError } from "@/app/lib/api";
import { rateLimit } from "@/app/lib/rate-limit";
import { issueToken } from "@/app/lib/tokens";
import { sendPasswordResetEmail } from "@/app/lib/email";

const ForgotSchema = z.object({ email: z.string().email().toLowerCase().trim() });

// ─── POST /api/auth/forgot-password ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(`forgot:${ip}`, 5, 600);
  if (!success) return jsonError("Too many requests. Please try again in a few minutes.", 429);

  const parsed = ForgotSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  // Same response whether or not the account exists, so emails can't be enumerated
  const response = NextResponse.json({
    message: "If an account with that email exists, a password reset link has been sent.",
  });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.isBanned) return response;

  const token = await issueToken("reset-password", user.id, 3600);
  try {
    await sendPasswordResetEmail({ to: user.email, name: user.firstName ?? user.name ?? "there", token });
  } catch (err) {
    console.error("[forgot-password]", err);
  }
  return response;
}
