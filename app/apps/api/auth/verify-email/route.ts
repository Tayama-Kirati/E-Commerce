import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { appUrl } from "@/app/lib/api";
import { consumeToken } from "@/app/lib/tokens";

// ─── GET /api/auth/verify-email?token= — the link in the verification email ──

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const userId = await consumeToken("verify-email", token);
  if (!userId) return NextResponse.redirect(appUrl("/?page=login&verified=expired"));

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
  await prisma.notification.create({
    data: { userId, type: "SYSTEM", title: "Email verified", body: "Thanks for confirming your email address." },
  });
  return NextResponse.redirect(appUrl("/?page=login&verified=1"));
}
