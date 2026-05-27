// GET & PUT authenticated user profile
 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { redis } from "@/app/lib/redis";
import { z } from "zod";
import { generateReferralCode } from "@/app/lib/auth-utils";


export async function GET(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const user = await prisma.user.findUnique({
 where: { id: session.user.id },
 select: {
 id: true,
 email: true,
 firstName: true,
 lastName: true,
 name: true,
 phone: true,
 phoneVerified: true,
 birthDate: true,
 avatar: true,
 role: true,
 loyaltyPoints: true,
 loyaltyTier: true,
 totalSpent: true,
 language: true,
 currency: true,
 darkMode: true,
 emailVerified: true,
 createdAt: true,
 lastLogin: true,
 seller: {
 select: { id: true, storeName: true, storeSlug: true, status: true },
 },
 _count: {
 select: {
 orders: true,
 reviews: true,
 wishlistItems: true,
 },
 },
 },
 });

 if (!user)
 return NextResponse.json({ error: "User not found" }, { status: 404 });

 // Fetch referral code or create one
 let referral = await prisma.referral.findFirst({
 where: { referrerId: user.id },
 orderBy: { createdAt: "asc" },
 });
 const referralCode = referral?.code ?? generateReferralCode(user.id);

 return NextResponse.json({ user: { ...user, referralCode } });
}

const UpdateProfileSchema = z.object({
 firstName: z.string().min(2).max(50).optional(),
 lastName: z.string().min(2).max(50).optional(),
 phone: z
 .string()
 .regex(/^\+?[0-9]{10,15}$/)
 .optional()
 .nullable(),
 birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
 language: z.enum(["en", "ne", "hi"]).optional(),
 currency: z.enum(["NPR", "USD", "INR"]).optional(),
 darkMode: z.boolean().optional(),
 avatar: z.string().url().optional().nullable(), // Cloudinary URL
});

export async function PUT(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = await req.json();
 const data = UpdateProfileSchema.parse(body);

 // Phone uniqueness check
 if (data.phone) {
 const phoneUsed = await prisma.user.findFirst({
 where: { phone: data.phone, id: { not: session.user.id } },
 });
 if (phoneUsed) {
 return NextResponse.json(
 { error: "Phone number already in use." },
 { status: 409 },
 );
 }
 }

 const name =
 data.firstName || data.lastName
 ? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()
 : undefined;

 const updated = await prisma.user.update({
 where: { id: session.user.id },
 data: {
  ...data,
  ...(name ? { name } : {}),
  ...(data.birthDate !== undefined
   ? { birthDate: data.birthDate ? new Date(data.birthDate) : null }
   : {}),
 },
 select: {
 id: true,
 email: true,
 firstName: true,
 lastName: true,
 name: true,
 phone: true,
 birthDate: true,
 avatar: true,
 language: true,
 currency: true,
 darkMode: true,
 },
 });

 return NextResponse.json({ user: updated });
}

 
// Upload & update avatar via Cloudinary
export async function uploadAvatarHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { base64 } = await req.json();
 if (!base64)
 return NextResponse.json({ error: "No image provided" }, { status: 400 });

 const { url } = await uploadToCloudinary(base64, "peanut/avatars", {
 transformation: [
 { width: 400, height: 400, crop: "fill", gravity: "face" },
 ],
 });

 await prisma.user.update({
 where: { id: session.user.id },
 data: { avatar: url },
 });
 return NextResponse.json({ avatar: url });
}

 
// CRUD for user delivery addresses
const AddressSchema = z.object({
 label: z.enum(["Home", "Work", "Other"]).default("Home"),
 fullName: z.string().min(2).max(100),
 phone: z.string().regex(/^\+?[0-9]{10,15}$/),
 street: z.string().min(5).max(200),
 city: z.string().min(2).max(100),
 district: z.string().min(2).max(100),
 province: z.string().min(2).max(100),
 country: z.string().default("Nepal"),
 postalCode: z.string().optional(),
 isDefault: z.boolean().default(false),
 lat: z.number().optional(),
 lng: z.number().optional(),
});

export async function getAddressesHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const addresses = await prisma.address.findMany({
 where: { userId: session.user.id },
 orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
 });

 return NextResponse.json({ addresses });
}

export async function createAddressHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = await req.json();
 const data = AddressSchema.parse(body);

 const address = await prisma.$transaction(async (tx: any) => {
 // If new address is default, unset existing default
 if (data.isDefault) {
 await tx.address.updateMany({
 where: { userId: session.user.id },
 data: { isDefault: false },
 });
 }
 return tx.address.create({
 data: { ...data, userId: session.user.id },
 });
 });

 return NextResponse.json({ address }, { status: 201 });
}

export async function updateAddressHandler(req: NextRequest, id: string) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const existing = await prisma.address.findUnique({ where: { id } });
 if (!existing || existing.userId !== session.user.id) {
 return NextResponse.json({ error: "Address not found" }, { status: 404 });
 }

 const body = await req.json();
 const data = AddressSchema.partial().parse(body);

 const address = await prisma.$transaction(async (tx: any) => {
 if (data.isDefault) {
 await tx.address.updateMany({
 where: { userId: session.user.id, id: { not: id } },
 data: { isDefault: false },
 });
 }
 return tx.address.update({ where: { id }, data });
 });

 return NextResponse.json({ address });
}

export async function deleteAddressHandler(req: NextRequest, id: string) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const existing = await prisma.address.findUnique({ where: { id } });
 if (!existing || existing.userId !== session.user.id) {
 return NextResponse.json({ error: "Address not found" }, { status: 404 });
 }

 await prisma.address.delete({ where: { id } });
 return NextResponse.json({ success: true });
}

 
export async function getNotificationsHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { searchParams } = new URL(req.url);
 const page = Number(searchParams.get("page")) || 1;
 const limit = Number(searchParams.get("limit")) || 20;
 const unreadOnly = searchParams.get("unread") === "true";

 const where: any = { userId: session.user.id };
 if (unreadOnly) where.isRead = false;

 const [notifications, total, unreadCount] = await Promise.all([
 prisma.notification.findMany({
 where,
 orderBy: { createdAt: "desc" },
 skip: (page - 1) * limit,
 take: limit,
 }),
 prisma.notification.count({ where }),
 prisma.notification.count({
 where: { userId: session.user.id, isRead: false },
 }),
 ]);

 return NextResponse.json({ notifications, total, unreadCount, page, limit });
}

export async function markNotificationsReadHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { ids } = await req.json(); // array of IDs, or empty to mark all

 if (ids && Array.isArray(ids) && ids.length > 0) {
 await prisma.notification.updateMany({
 where: { id: { in: ids }, userId: session.user.id },
 data: { isRead: true, readAt: new Date() },
 });
 } else {
 await prisma.notification.updateMany({
 where: { userId: session.user.id, isRead: false },
 data: { isRead: true, readAt: new Date() },
 });
 }

 return NextResponse.json({ success: true });
}

 
export async function getWishlistHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const items = await prisma.wishlistItem.findMany({
 where: { userId: session.user.id },
 orderBy: { addedAt: "desc" },
 include: {
 product: {
 include: {
 images: { where: { isPrimary: true }, take: 1 },
 category: { select: { name: true, slug: true } },
 seller: { select: { storeName: true, isVerified: true } },
 },
 },
 },
 });

 return NextResponse.json({ items });
}

export async function toggleWishlistHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { productId } = await req.json();
 if (!productId)
 return NextResponse.json({ error: "productId required" }, { status: 400 });

 const existing = await prisma.wishlistItem.findUnique({
 where: { userId_productId: { userId: session.user.id, productId } },
 });

 if (existing) {
 await prisma.$transaction([
 prisma.wishlistItem.delete({
 where: { userId_productId: { userId: session.user.id, productId } },
 }),
 prisma.product.update({
 where: { id: productId },
 data: { wishlistCount: { decrement: 1 } },
 }),
 ]);
 return NextResponse.json({ wishlisted: false });
 } else {
 await prisma.$transaction([
 prisma.wishlistItem.create({
 data: { userId: session.user.id, productId },
 }),
 prisma.product.update({
 where: { id: productId },
 data: { wishlistCount: { increment: 1 } },
 }),
 ]);
 return NextResponse.json({ wishlisted: true });
 }
}

 
// Loyalty points, history, spin wheel 
export async function getLoyaltyHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const user = await prisma.user.findUnique({
 where: { id: session.user.id },
 select: { loyaltyPoints: true, loyaltyTier: true, totalSpent: true },
 });

 const history = await prisma.loyaltyTransaction.findMany({
 where: { userId: session.user.id },
 orderBy: { createdAt: "desc" },
 take: 20,
 });

 const tierThresholds = {
 BRONZE: 0,
 SILVER: 1000,
 GOLD: 5000,
 PLATINUM: 20000,
 };
 const tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
 const currentIndex = tiers.indexOf(user?.loyaltyTier ?? "BRONZE");
 const nextTier = tiers[currentIndex + 1];
 const nextThreshold = nextTier
 ? tierThresholds[nextTier as keyof typeof tierThresholds]
 : null;

 return NextResponse.json({
 points: user?.loyaltyPoints ?? 0,
 tier: user?.loyaltyTier ?? "BRONZE",
 totalSpent: user?.totalSpent ?? 0,
 nextTier,
 nextThreshold,
 redeemableNPR: Math.floor((user?.loyaltyPoints ?? 0) / 10),
 history,
 });
}

// Daily spin wheel — one spin per day
export async function spinWheelHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const spinKey = `spin:${session.user.id}:${new Date().toDateString()}`;
 const alreadySpun = await redis.get(spinKey);
 if (alreadySpun) {
 return NextResponse.json(
 { error: "You've already spun today! Come back tomorrow." },
 { status: 429 },
 );
 }

 // Wheel prizes: weighted random
 const prizes = [
 { points: 50, label: "50 Points", weight: 30 },
 { points: 100, label: "100 Points", weight: 25 },
 { points: 200, label: "200 Points", weight: 20 },
 { points: 350, label: "350 Points", weight: 12 },
 { points: 500, label: "500 Points", weight: 8 },
 { points: 1000, label: "1000 Points", weight: 4 },
 { points: 0, label: "Try Again", weight: 1 }, // rare no-win
 ];

 const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
 let rand = Math.random() * totalWeight;
 let winner = prizes[0];
 for (const prize of prizes) {
 rand -= prize.weight;
 if (rand <= 0) {
 winner = prize;
 break;
 }
 }

 if (winner.points > 0) {
 await prisma.$transaction([
 prisma.user.update({
 where: { id: session.user.id },
 data: { loyaltyPoints: { increment: winner.points } },
 }),
 prisma.loyaltyTransaction.create({
 data: {
 userId: session.user.id,
 points: winner.points,
 type: "SPIN",
 description: `Daily spin reward: ${winner.label}`,
 expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
 },
 }),
 ]);
 }

 // Lock for today
 await redis.setex(spinKey, 86400, "1");

 // Update loyalty tier
 await updateLoyaltyTier(session.user.id);

 return NextResponse.json({
 prize: winner,
 message:
 winner.points > 0
 ? `🎉 You won ${winner.points} points!`
 : "Better luck tomorrow!",
 });
}

async function updateLoyaltyTier(userId: string) {
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { loyaltyPoints: true },
 });
 const pts = user?.loyaltyPoints ?? 0;
 const tier =
 pts >= 20000
 ? "PLATINUM"
 : pts >= 5000
 ? "GOLD"
 : pts >= 1000
 ? "SILVER"
 : "BRONZE";

 await prisma.user.update({
 where: { id: userId },
 data: { loyaltyTier: tier },
 });
}

// User's own order history with filtering
 
export async function getUserOrdersHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { searchParams } = new URL(req.url);
 const page = Number(searchParams.get("page")) || 1;
 const limit = Number(searchParams.get("limit")) || 10;
 const status = searchParams.get("status");

 const where: any = { userId: session.user.id };
 if (status) where.status = status;

 const [orders, total] = await Promise.all([
 prisma.order.findMany({
 where,
 orderBy: { createdAt: "desc" },
 skip: (page - 1) * limit,
 take: limit,
 include: {
 items: {
 include: {
 product: {
 select: {
 name: true,
 slug: true,
 images: {
 where: { isPrimary: true },
 take: 1,
 select: { url: true },
 },
 },
 },
 },
 },
 address: { select: { city: true, district: true, fullName: true } },
 invoice: { select: { invoiceNo: true, pdfUrl: true } },
 },
 }),
 prisma.order.count({ where }),
 ]);

 return NextResponse.json({
 orders,
 total,
 page,
 limit,
 totalPages: Math.ceil(total / limit),
 });
}

 
// Single order detail for tracking
export async function getOrderDetailHandler(req: NextRequest, orderId: string) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const order = await prisma.order.findUnique({
 where: { id: orderId, userId: session.user.id },
 include: {
 items: {
 include: {
 product: {
 select: {
 name: true,
 slug: true,
 images: { where: { isPrimary: true }, take: 1 },
 },
 },
 seller: { select: { storeName: true, storeSlug: true } },
 },
 },
 address: true,
 invoice: true,
 returnRequest: true,
 statusHistory: { orderBy: { createdAt: "asc" } },
 },
 });

 if (!order)
 return NextResponse.json({ error: "Order not found" }, { status: 404 });
 return NextResponse.json({ order });
}

 
export async function cancelOrderHandler(req: NextRequest, orderId: string) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const order = await prisma.order.findUnique({
 where: { id: orderId, userId: session.user.id },
 include: { items: true },
 });

 if (!order)
 return NextResponse.json({ error: "Order not found" }, { status: 404 });

 if (!["PENDING", "CONFIRMED"].includes(order.status)) {
 return NextResponse.json(
 { error: "This order can no longer be cancelled." },
 { status: 400 },
 );
 }

 const { reason } = await req.json();

 await prisma.$transaction(async (tx: any) => {
 await tx.order.update({
 where: { id: orderId },
 data: {
 status: "CANCELLED",
 cancelledAt: new Date(),
 cancelReason: reason,
 },
 });

 // Restore stock
 for (const item of order.items) {
 if (item.variantId) {
 await tx.productVariant.update({
 where: { id: item.variantId },
 data: { stock: { increment: item.quantity } },
 });
 } else {
 await tx.product.update({
 where: { id: item.productId },
 data: { stock: { increment: item.quantity } },
 });
 }
 }

 // If paid, initiate refund
 if (order.paymentStatus === "COMPLETED") {
 await tx.order.update({
 where: { id: orderId },
 data: { paymentStatus: "REFUNDED" },
 });
 // TODO: trigger payment gateway refund
 }

 // Notification
 await tx.notification.create({
 data: {
 userId: session.user.id,
 type: "ORDER_CANCELLED",
 title: "Order Cancelled",
 body: `Your order #${order.orderNumber} has been cancelled.`,
 data: { orderId: order.id },
 },
 });

 await tx.orderStatusHistory.create({
 data: {
 orderId: order.id,
 status: "CANCELLED",
 note: reason ?? "Cancelled by customer",
 updatedBy: session.user.id,
 },
 });
 });

 return NextResponse.json({
 success: true,
 message: "Order cancelled successfully.",
 });
}


// Return & refund request
const ReturnSchema = z.object({
 reason: z.enum([
 "WRONG_ITEM",
 "DAMAGED",
 "NOT_AS_DESCRIBED",
 "CHANGED_MIND",
 "QUALITY_ISSUE",
 "OTHER",
 ]),
 description: z.string().min(10).max(500).optional(),
 images: z.array(z.string().url()).max(5).default([]),
});

export async function createReturnHandler(req: NextRequest, orderId: string) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const order = await prisma.order.findUnique({
 where: { id: orderId, userId: session.user.id },
 include: { returnRequest: true },
 });

 if (!order)
 return NextResponse.json({ error: "Order not found" }, { status: 404 });

 if (order.status !== "DELIVERED") {
 return NextResponse.json(
 { error: "Only delivered orders can be returned." },
 { status: 400 },
 );
 }

 if (order.returnRequest) {
 return NextResponse.json(
 { error: "A return request already exists for this order." },
 { status: 409 },
 );
 }

 const deliveredAt = order.deliveredAt;
 if (deliveredAt) {
 const daysSinceDelivery =
 (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
 if (daysSinceDelivery > 7) {
 return NextResponse.json(
 {
 error:
 "Return window has closed. Returns must be requested within 7 days of delivery.",
 },
 { status: 400 },
 );
 }
 }

 const body = await req.json();
 const data = ReturnSchema.parse(body);

 const returnRequest = await prisma.$transaction(async (tx: any) => {
 const rr = await tx.returnRequest.create({
 data: {
 orderId: orderId,
 userId: session.user.id,
 reason: data.reason,
 description: data.description,
 images: data.images,
 status: "REQUESTED",
 refundAmount: order.total,
 },
 });

 await tx.order.update({
 where: { id: orderId },
 data: { status: "RETURN_REQUESTED" },
 });

 await tx.notification.create({
 data: {
 userId: session.user.id,
 type: "ORDER_CANCELLED",
 title: "Return Request Submitted",
 body: `Your return request for order #${order.orderNumber} has been received. We'll review it within 24 hours.`,
 data: { orderId: order.id },
 },
 });

 return rr;
 });

 return NextResponse.json({ returnRequest }, { status: 201 });
}

 
// Create & manage user reviews 
const ReviewSchema = z.object({
 productId: z.string().cuid(),
 orderId: z.string().cuid().optional(),
 rating: z.number().int().min(1).max(5),
 title: z.string().min(3).max(100).optional(),
 body: z.string().min(10).max(2000).optional(),
 images: z.array(z.string().url()).max(5).default([]),
});

export async function createReviewHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = await req.json();
 const data = ReviewSchema.parse(body);

 // Check if already reviewed
 const existing = await prisma.review.findFirst({
 where: { userId: session.user.id, productId: data.productId },
 });
 if (existing) {
 return NextResponse.json(
 { error: "You have already reviewed this product." },
 { status: 409 },
 );
 }

 // Verify purchase for "verified buyer" badge
 let isVerified = false;
 if (data.orderId) {
 const orderItem = await prisma.orderItem.findFirst({
 where: {
 orderId: data.orderId,
 productId: data.productId,
 order: { userId: session.user.id, status: "DELIVERED" },
 },
 });
 isVerified = !!orderItem;
 }

 const review = await prisma.$transaction(async (tx: any) => {
 const created = await tx.review.create({
 data: {
 productId: data.productId,
 userId: session.user.id,
 orderId: data.orderId,
 rating: data.rating,
 title: data.title,
 body: data.body,
 images: data.images,
 isVerified,
 },
 include: { user: { select: { name: true, avatar: true } } },
 });

 // Update product aggregates
 const agg = await tx.review.aggregate({
 where: { productId: data.productId, isVisible: true },
 _avg: { rating: true },
 _count: { rating: true },
 });

 await tx.product.update({
 where: { id: data.productId },
 data: {
 averageRating: agg._avg.rating ?? 0,
 totalReviews: agg._count.rating,
 },
 });

 // Mark order item as reviewed
 if (data.orderId) {
 await tx.orderItem.updateMany({
 where: { orderId: data.orderId, productId: data.productId },
 data: { isReviewed: true },
 });
 }

 // Reward loyalty points for review
 await tx.user.update({
 where: { id: session.user.id },
 data: { loyaltyPoints: { increment: 50 } },
 });
 await tx.loyaltyTransaction.create({
 data: {
 userId: session.user.id,
 points: 50,
 type: "REVIEW",
 description: `Reward for reviewing a product`,
 },
 });

 return created;
 });

 return NextResponse.json({ review }, { status: 201 });
}

 
// Support ticket creation
const TicketSchema = z.object({
 subject: z.string().min(5).max(200),
 body: z.string().min(10).max(2000),
 category: z
 .enum(["ORDER", "PAYMENT", "PRODUCT", "ACCOUNT", "GENERAL"])
 .default("GENERAL"),
 orderId: z.string().cuid().optional(),
 priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export async function createTicketHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = await req.json();
 const data = TicketSchema.parse(body);

 const ticket = await prisma.supportTicket.create({
 data: {
 userId: session.user.id,
 orderId: data.orderId,
 subject: data.subject,
 body: data.body,
 category: data.category,
 priority: data.priority,
 status: "OPEN",
 },
 });

 await prisma.notification.create({
 data: {
 userId: session.user.id,
 type: "SYSTEM",
 title: `Ticket #${ticket.id.slice(-6).toUpperCase()} Created`,
 body: "Our support team will respond within 24 hours.",
 },
 });

 return NextResponse.json({ ticket }, { status: 201 });
}

 