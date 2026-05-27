import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum([
    "PENDING","CONFIRMED","PROCESSING","SHIPPED",
    "OUT_FOR_DELIVERY","DELIVERED","CANCELLED","REFUNDED",
  ]).optional(),
  currentLocation: z.string().max(200).optional().nullable(),
  trackingNumber: z.string().max(100).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, sellerProfile: { select: { id: true } } },
  });

  if (!user || !["SELLER","ADMIN","SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, items: { select: { product: { select: { sellerId: true } } } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Sellers can only update orders that contain their products
  if (user.role === "SELLER") {
    const sellerId = user.sellerProfile?.id;
    const isSellersOrder = order.items.some(i => i.product.sellerId === sellerId);
    if (!isSellersOrder) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.status && { status: parsed.data.status }),
      ...(parsed.data.currentLocation !== undefined && { currentLocation: parsed.data.currentLocation }),
      ...(parsed.data.trackingNumber !== undefined && { trackingNumber: parsed.data.trackingNumber }),
      ...(parsed.data.status === "DELIVERED" && { deliveredAt: new Date() }),
    },
    select: { id: true, status: true, currentLocation: true, trackingNumber: true },
  });

  return NextResponse.json({ order: updated });
}
