import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
 const body = await req.json();
 if (body.action === "verify") return verifyHandler(body);
 return initiateHandler(body);
}

async function initiateHandler(body: { orderId: string }) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { orderId } = body;
 const order = await prisma.order.findUnique({
 where: { id: orderId, userId: session.user.id },
 include: { user: true },
 });
 if (!order)
 return NextResponse.json({ error: "Order not found" }, { status: 404 });

 const { initiateKhaltiPayment } = await import("@/app/lib/khalti");
 const payment = await initiateKhaltiPayment({
 orderId: order.id,
 amount: Number(order.total) * 100,
 orderName: `PeaNut Order ${order.orderNumber}`,
 returnUrl: `${process.env.NEXTAUTH_URL}/checkout/verify?gateway=khalti&orderId=${order.id}`,
 customerName: order.user.name ?? "Customer",
 customerEmail: order.user.email!,
 customerPhone: order.user.phone ?? "9800000000",
 });

 await prisma.order.update({
 where: { id: order.id },
 data: { paymentRef: payment.pidx },
 });

 return NextResponse.json({ paymentUrl: payment.payment_url, pidx: payment.pidx });
}

async function verifyHandler(body: { pidx: string; orderId: string }) {
 const { pidx, orderId } = body;
 const { verifyKhaltiPayment } = await import("@/app/lib/khalti");
 const result = await verifyKhaltiPayment(pidx);

 if (result.status !== "Completed") {
 return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
 }

 const order = await prisma.order.update({
 where: { id: orderId },
 data: {
 paymentStatus: "COMPLETED",
 status: "CONFIRMED",
 paidAt: new Date(),
 paymentGateway: "khalti",
 },
 });

 const user = await prisma.user.findUnique({ where: { id: order.userId } });
 if (user && order.pointsEarned > 0) {
 await prisma.$transaction([
 prisma.user.update({
 where: { id: order.userId },
 data: {
 loyaltyPoints: { increment: order.pointsEarned },
 totalSpent: { increment: order.total },
 },
 }),
 prisma.loyaltyTransaction.create({
 data: {
 userId: order.userId,
 points: order.pointsEarned,
 type: "PURCHASE",
 description: `Points earned for order ${order.orderNumber}`,
 orderId: order.id,
 },
 }),
 ]);
 }

 return NextResponse.json({
 success: true,
 order: { id: order.id, orderNumber: order.orderNumber },
 });
}
