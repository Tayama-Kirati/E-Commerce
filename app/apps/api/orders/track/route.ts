import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  if (!orderNumber) {
    return NextResponse.json({ error: "orderNumber required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      user: { email: session.user.email },
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      currentLocation: true,
      trackingNumber: true,
      createdAt: true,
      updatedAt: true,
      deliveredAt: true,
      total: true,
      subtotal: true,
      shippingCost: true,
      discount: true,
      items: {
        select: {
          quantity: true,
          price: true,
          product: { select: { name: true, images: { take: 1, select: { url: true } } } },
        },
      },
      address: {
        select: { fullName: true, street: true, city: true, district: true, province: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
