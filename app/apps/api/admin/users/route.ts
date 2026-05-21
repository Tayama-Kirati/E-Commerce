import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

function requireAdmin(role?: string) {
 return role === "ADMIN" || role === "SUPER_ADMIN";
}

const AdminUserQuerySchema = z.object({
 page: z.coerce.number().default(1),
 limit: z.coerce.number().default(20),
 search: z.string().optional(),
 role: z.enum(["CUSTOMER", "SELLER", "ADMIN", "SUPER_ADMIN"]).optional(),
 isActive: z.coerce.boolean().optional(),
 isBanned: z.coerce.boolean().optional(),
 tier: z.string().optional(),
 sort: z
 .enum(["newest", "oldest", "name", "spent", "points"])
 .default("newest"),
});

export async function GET(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const { searchParams } = new URL(req.url);
 const params = AdminUserQuerySchema.parse(Object.fromEntries(searchParams));
 const { page, limit, search, role, isActive, isBanned, tier, sort } = params;

 const where: any = {};
 if (search) {
 where.OR = [
 { name: { contains: search, mode: "insensitive" } },
 { email: { contains: search, mode: "insensitive" } },
 { phone: { contains: search, mode: "insensitive" } },
 ];
 }
 if (role) where.role = role;
 if (isActive !== undefined) where.isActive = isActive;
 if (isBanned !== undefined) where.isBanned = isBanned;
 if (tier) where.loyaltyTier = tier;

 const orderBy: any =
 sort === "oldest"
 ? { createdAt: "asc" }
 : sort === "name"
 ? { name: "asc" }
 : sort === "spent"
 ? { totalSpent: "desc" }
 : sort === "points"
 ? { loyaltyPoints: "desc" }
 : { createdAt: "desc" };

 const [users, total] = await Promise.all([
 prisma.user.findMany({
 where,
 skip: (page - 1) * limit,
 take: limit,
 orderBy,
 select: {
 id: true,
 name: true,
 email: true,
 phone: true,
 avatar: true,
 role: true,
 isActive: true,
 isBanned: true,
 loyaltyPoints: true,
 loyaltyTier: true,
 totalSpent: true,
 emailVerified: true,
 lastLogin: true,
 createdAt: true,
 seller: { select: { id: true, storeName: true, status: true } },
 _count: {
 select: { orders: true, reviews: true },
 },
 },
 }),
 prisma.user.count({ where }),
 ]);

 // Summary stats for admin panel
 const [totalCustomers, totalSellers, totalBanned, newToday] =
 await Promise.all([
 prisma.user.count({ where: { role: "CUSTOMER" } }),
 prisma.user.count({ where: { role: "SELLER" } }),
 prisma.user.count({ where: { isBanned: true } }),
 prisma.user.count({
 where: {
 createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
 },
 }),
 ]);

 return NextResponse.json({
 users,
 total,
 page,
 limit,
 totalPages: Math.ceil(total / limit),
 stats: { totalCustomers, totalSellers, totalBanned, newToday },
 });
}

// Admin: get, update, ban/unban user
export async function getUserHandler(req: NextRequest, userId: string) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const user = await prisma.user.findUnique({
 where: { id: userId },
 include: {
 seller: {
 include: { products: { take: 5, orderBy: { createdAt: "desc" } } },
 },
 orders: {
 take: 10,
 orderBy: { createdAt: "desc" },
 include: { items: true },
 },
 addresses: true,
 loyaltyTxns: { take: 10, orderBy: { createdAt: "desc" } },
 notifications: { take: 5, orderBy: { createdAt: "desc" } },
 _count: {
 select: {
 orders: true,
 reviews: true,
 wishlistItems: true,
 supportTickets: true,
 },
 },
 },
 });

 if (!user)
 return NextResponse.json({ error: "User not found" }, { status: 404 });
 return NextResponse.json({ user });
}

const AdminUpdateUserSchema = z.object({
 role: z.enum(["CUSTOMER", "SELLER", "ADMIN"]).optional(),
 isActive: z.boolean().optional(),
 isBanned: z.boolean().optional(),
 banReason: z.string().optional(),
 loyaltyTier: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]).optional(),
 loyaltyPointsAdjust: z.number().int().optional(), // positive or negative
 adjustReason: z.string().optional(),
});

export async function updateUserHandler(req: NextRequest, userId: string) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const body = await req.json();
 const data = AdminUpdateUserSchema.parse(body);

 const { loyaltyPointsAdjust, adjustReason, ...rest } = data;

 const user = await prisma.$transaction(async (tx: any) => {
 const updated = await tx.user.update({
 where: { id: userId },
 data: rest,
 });

 // Loyalty manual adjustment
 if (loyaltyPointsAdjust !== undefined && loyaltyPointsAdjust !== 0) {
 await tx.user.update({
 where: { id: userId },
 data: { loyaltyPoints: { increment: loyaltyPointsAdjust } },
 });
 await tx.loyaltyTransaction.create({
 data: {
 userId: userId,
 points: loyaltyPointsAdjust,
 type: "BONUS",
 description:
 adjustReason ?? `Admin adjustment by ${session.user.email}`,
 },
 });
 }

 // Send notification if banned
 if (rest.isBanned) {
 await tx.notification.create({
 data: {
 userId,
 type: "SYSTEM",
 title: "Account Suspended",
 body: `Your account has been suspended. Reason: ${rest.banReason ?? "Policy violation"}`,
 },
 });
 }

 return updated;
 });

 return NextResponse.json({ user });
}

 
// Admin: list and approve/reject 
export async function getSellersHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const { searchParams } = new URL(req.url);
 const status = searchParams.get("status") ?? "PENDING";
 const page = Number(searchParams.get("page")) || 1;
 const limit = Number(searchParams.get("limit")) || 20;

 const [sellers, total] = await Promise.all([
 prisma.seller.findMany({
 where: status !== "ALL" ? { status: status as any } : undefined,
 skip: (page - 1) * limit,
 take: limit,
 orderBy: { createdAt: "desc" },
 include: {
 user: {
 select: {
 name: true,
 email: true,
 phone: true,
 avatar: true,
 createdAt: true,
 },
 },
 _count: { select: { products: true } },
 },
 }),
 prisma.seller.count({
 where: status !== "ALL" ? { status: status as any } : undefined,
 }),
 ]);

 return NextResponse.json({ sellers, total, page, limit });
}

export async function updateSellerStatusHandler(
 req: NextRequest,
 sellerId: string,
) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const { status, reason } = await req.json();
 if (!["APPROVED", "REJECTED", "SUSPENDED"].includes(status)) {
 return NextResponse.json({ error: "Invalid status" }, { status: 400 });
 }

 const seller = await prisma.seller.update({
 where: { id: sellerId },
 data: {
 status: status as any,
 rejectionReason: reason,
 approvedAt: status === "APPROVED" ? new Date() : undefined,
 },
 include: { user: true },
 });

 // Notify seller
 await prisma.notification.create({
 data: {
 userId: seller.userId,
 type: "SYSTEM",
 title:
 status === "APPROVED"
 ? "🎉 Seller Account Approved!"
 : "Seller Application Update",
 body:
 status === "APPROVED"
 ? "Your seller account has been approved! You can now list products and start selling on PeaNut."
 : `Your seller application was ${status.toLowerCase()}. ${reason ? `Reason: ${reason}` : ""}`,
 },
 });

 return NextResponse.json({ seller });
}

// Admin: platform-wide analytics
export async function getAnalyticsHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const { searchParams } = new URL(req.url);
 const period = searchParams.get("period") ?? "30"; // days
 const days = parseInt(period, 10);
 const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

 const [
 totalRevenue,
 totalOrders,
 totalUsers,
 newUsers,
 totalSellers,
 activeSellers,
 totalProducts,
 pendingOrders,
 revenueByDay,
 ordersByStatus,
 topProducts,
 topSellers,
 revenueByCategory,
 ] = await Promise.all([
 // Total revenue from completed orders
 prisma.order.aggregate({
 where: { paymentStatus: "COMPLETED", createdAt: { gte: since } },
 _sum: { total: true },
 }),
 // Total orders in period
 prisma.order.count({ where: { createdAt: { gte: since } } }),
 // Total active users
 prisma.user.count({ where: { isActive: true, isBanned: false } }),
 // New users in period
 prisma.user.count({ where: { createdAt: { gte: since } } }),
 // Total sellers
 prisma.seller.count(),
 // Active sellers (had an order in period)
 prisma.seller.count({
 where: { orders: { some: { order: { createdAt: { gte: since } } } } },
 }),
 // Total active products
 prisma.product.count({ where: { status: "ACTIVE", isActive: true } }),
 // Pending orders
 prisma.order.count({ where: { status: "PENDING" } }),
 // Revenue by day (last N days)
 prisma.$queryRaw<{ date: string; revenue: number; orders: number }[]>`
 SELECT
 DATE(created_at)::text AS date,
 COALESCE(SUM(total), 0)::float AS revenue,
 COUNT(*)::int AS orders
 FROM orders
 WHERE created_at >= ${since}
 AND payment_status = 'COMPLETED'
 GROUP BY DATE(created_at)
 ORDER BY DATE(created_at)
 `,
 // Orders by status
 prisma.order.groupBy({
 by: ["status"],
 where: { createdAt: { gte: since } },
 _count: { status: true },
 }),
 // Top selling products
 prisma.product.findMany({
 where: { status: "ACTIVE", isActive: true },
 orderBy: { totalSales: "desc" },
 take: 10,
 select: {
 id: true,
 name: true,
 slug: true,
 totalSales: true,
 basePrice: true,
 images: { where: { isPrimary: true }, take: 1, select: { url: true } },
 },
 }),
 // Top sellers by revenue
 prisma.seller.findMany({
 orderBy: { totalRevenue: "desc" },
 take: 10,
 select: {
 id: true,
 storeName: true,
 storeSlug: true,
 totalRevenue: true,
 totalSales: true,
 averageRating: true,
 isVerified: true,
 },
 }),
 // Revenue by category
 prisma.$queryRaw<
 { categoryName: string; revenue: number; orders: number }[]
 >`
 SELECT
 c.name AS "categoryName",
 COALESCE(SUM(oi.total), 0)::float AS revenue,
 COUNT(oi.id)::int AS orders
 FROM order_items oi
 JOIN products p ON oi.product_id = p.id
 JOIN categories c ON p.category_id = c.id
 JOIN orders o ON oi.order_id = o.id
 WHERE o.created_at >= ${since}
 AND o.payment_status = 'COMPLETED'
 GROUP BY c.name
 ORDER BY revenue DESC
 LIMIT 8
 `,
 ]);

 return NextResponse.json({
 overview: {
 totalRevenue: Number(totalRevenue._sum.total ?? 0),
 totalOrders,
 totalUsers,
 newUsers,
 totalSellers,
 activeSellers,
 totalProducts,
 pendingOrders,
 },
 revenueByDay,
 ordersByStatus: ordersByStatus.map((s: any) => ({
 status: s.status,
 count: s._count.status,
 })),
 topProducts,
 topSellers,
 revenueByCategory,
 });
}

 
// Admin: manage all orders
export async function adminGetOrdersHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const { searchParams } = new URL(req.url);
 const page = Number(searchParams.get("page")) || 1;
 const limit = Number(searchParams.get("limit")) || 20;
 const status = searchParams.get("status");
 const search = searchParams.get("search");

 const where: any = {};
 if (status) where.status = status;
 if (search) {
 where.OR = [
 { orderNumber: { contains: search, mode: "insensitive" } },
 { user: { email: { contains: search, mode: "insensitive" } } },
 { user: { name: { contains: search, mode: "insensitive" } } },
 ];
 }

 const [orders, total] = await Promise.all([
 prisma.order.findMany({
 where,
 skip: (page - 1) * limit,
 take: limit,
 orderBy: { createdAt: "desc" },
 include: {
 user: { select: { name: true, email: true, avatar: true } },
 address: { select: { city: true, district: true } },
 items: {
 select: { id: true, name: true, quantity: true, total: true },
 },
 },
 }),
 prisma.order.count({ where }),
 ]);

 return NextResponse.json({ orders, total, page, limit });
}

export async function adminUpdateOrderStatusHandler(
 req: NextRequest,
 orderId: string,
) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const { status, note, trackingNumber, trackingUrl } = await req.json();

 const order = await prisma.$transaction(async (tx: any) => {
 const updated = await tx.order.update({
 where: { id: orderId },
 data: {
 status: status as any,
 trackingNumber: trackingNumber ?? undefined,
 trackingUrl: trackingUrl ?? undefined,
 deliveredAt: status === "DELIVERED" ? new Date() : undefined,
 },
 });

 await tx.orderStatusHistory.create({
 data: {
 orderId,
 status: status as any,
 note,
 updatedBy: session.user.id,
 },
 });

 // Notify customer
 const notifBody: Record<string, string> = {
 CONFIRMED: "Your order has been confirmed and is being processed.",
 SHIPPED: `Your order has been shipped! Tracking: ${trackingNumber ?? "N/A"}`,
 OUT_FOR_DELIVERY: "Your order is out for delivery! Expected today.",
 DELIVERED: "Your order has been delivered! Enjoy your purchase. 🎉",
 CANCELLED: `Your order has been cancelled. ${note ? `Reason: ${note}` : ""}`,
 };

 if (notifBody[status]) {
 await tx.notification.create({
 data: {
 userId: updated.userId,
 type: status === "DELIVERED" ? "ORDER_DELIVERED" : "ORDER_PLACED",
 title: `Order ${status.replace("_", " ")} — ${updated.orderNumber}`,
 body: notifBody[status],
 data: { orderId: updated.id },
 },
 });
 }

 return updated;
 });

 return NextResponse.json({ order });
}


// Admin: support ticket management
export async function adminGetTicketsHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const { searchParams } = new URL(req.url);
 const status = searchParams.get("status") ?? "OPEN";
 const priority = searchParams.get("priority");
 const page = Number(searchParams.get("page")) || 1;
 const limit = Number(searchParams.get("limit")) || 20;

 const where: any = {};
 if (status !== "ALL") where.status = status;
 if (priority) where.priority = priority;

 const [tickets, total] = await Promise.all([
 prisma.supportTicket.findMany({
 where,
 skip: (page - 1) * limit,
 take: limit,
 orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
 include: {
 user: { select: { name: true, email: true, avatar: true } },
 replies: { take: 1, orderBy: { createdAt: "desc" } },
 },
 }),
 prisma.supportTicket.count({ where }),
 ]);

 return NextResponse.json({ tickets, total, page, limit });
}

export async function replyToTicketHandler(req: NextRequest, ticketId: string) {
 const session = await getServerSession(authOptions);
 if (!session?.user || !requireAdmin(session.user.role)) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const { body, status } = await req.json();

 const [reply] = await prisma.$transaction([
 prisma.ticketReply.create({
 data: { ticketId, userId: session.user.id, body, isStaff: true },
 }),
 prisma.supportTicket.update({
 where: { id: ticketId },
 data: { status: status ?? "IN_PROGRESS", updatedAt: new Date() },
 }),
 ]);

 // Notify user
 const ticket = await prisma.supportTicket.findUnique({
 where: { id: ticketId },
 select: { userId: true, subject: true },
 });
 if (ticket) {
 await prisma.notification.create({
 data: {
 userId: ticket.userId,
 type: "SYSTEM",
 title: "Support Reply Received",
 body: `PeaNut support replied to your ticket: "${ticket.subject}"`,
 },
 });
 }

 return NextResponse.json({ reply });
}
