import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, action } = await req.json();

  if (action === "verify") {
    const { refId } = await req.json();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "COMPLETED",
        status: "CONFIRMED",
        paidAt: new Date(),
        paymentGateway: "esewa",
        paymentRef: refId,
      },
    });

    return NextResponse.json({ success: true });
  }

  // Initiate
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: session.user.id },
  });
  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const amount = Number(order.total);
  const params = {
    amt: amount,
    psc: 0,
    pdc: 0,
    txAmt: 0,
    tAmt: amount,
    pid: order.id,
    scd: process.env.ESEWA_MERCHANT_CODE ?? "EPAYTEST",
    su: `${process.env.NEXTAUTH_URL}/checkout/verify?gateway=esewa&orderId=${order.id}`,
    fu: `${process.env.NEXTAUTH_URL}/checkout?orderId=${order.id}&failed=1`,
  };

  return NextResponse.json({ params, gateway: "esewa" });
}
