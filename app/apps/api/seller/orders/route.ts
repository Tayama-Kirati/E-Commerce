import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seller = await prisma.seller.findFirst({
    where: { user: { email: session.user.email } },
    select: { id: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 403 });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10), 100);
  const page  = Math.max(parseInt(req.nextUrl.searchParams.get("page")  ?? "1",  10), 1);
  const skip  = (page - 1) * limit;

  const orders = await prisma.order.findMany({
    where: { items: { some: { product: { sellerId: seller.id } } } },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    select: {
      id:              true,
      orderNumber:     true,
      status:          true,
      currentLocation: true,
      trackingNumber:  true,
      total:           true,
      createdAt:       true,
      updatedAt:       true,
      items: {
        where: { product: { sellerId: seller.id } },
        select: {
          quantity: true,
          price:    true,
          product:  { select: { name: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ orders });
}
