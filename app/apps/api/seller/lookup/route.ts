import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// Public endpoint — returns only public seller fields needed for store navigation.
// Accepts ?email=xxx (from localStorage auth) since the app doesn't use NextAuth sessions.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const seller = await prisma.seller.findFirst({
    where: { user: { email } },
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      storeDescription: true,
      storeLogo: true,
      isVerified: true,
      status: true,
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  return NextResponse.json({ seller });
}
