import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { rateLimit } from "@/app/lib/rate-limit";

// ─── GET /api/auth/check-email?email= — live availability check on sign-up ──

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(`check-email:${ip}`, 30, 60);
  if (!success) return NextResponse.json({ available: false, message: "Too many requests" }, { status: 429 });

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email || !z.string().email().safeParse(email).success) {
    return NextResponse.json({ available: false, message: "Invalid email" });
  }
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return NextResponse.json({ available: !exists });
}
