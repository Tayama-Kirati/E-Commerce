import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const SESSION_COOKIES = [
  "next-auth.session-token", "__Secure-next-auth.session-token",
  "next-auth.csrf-token", "__Host-next-auth.csrf-token",
  "next-auth.callback-url", "__Secure-next-auth.callback-url",
];

// ─── POST /api/auth/logout — ends the session server-side ────────────────────

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    await prisma.session.deleteMany({ where: { userId: session.user.id } });
  }
  const res = NextResponse.json({ success: true });
  // Sessions are JWTs, so clearing the cookie is what actually signs the browser out
  for (const name of SESSION_COOKIES) {
    res.cookies.set(name, "", { path: "/", maxAge: 0, secure: name.startsWith("__"), httpOnly: true, sameSite: "lax" });
  }
  return res;
}
