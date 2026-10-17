import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { readJson, zodError, jsonError } from "@/app/lib/api";
import { rateLimit } from "@/app/lib/rate-limit";
import { issueToken } from "@/app/lib/tokens";
import { sendVerificationEmail } from "@/app/lib/email";

const ResendSchema = z.object({ email: z.string().email().toLowerCase().trim() });

// ─── POST /api/auth/resend-verification ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(`resend:${ip}`, 3, 600);
  if (!success) return jsonError("Too many requests.", 429);

  const parsed = ResendSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && !user.emailVerified) {
    const token = await issueToken("verify-email", user.id, 86400);
    sendVerificationEmail({ to: user.email, name: user.firstName ?? "there", token }).catch(console.error);
  }
  return NextResponse.json({ message: "If this email needs verifying, a new link was sent." });
}
