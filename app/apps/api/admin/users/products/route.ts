import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";
import { z } from "zod";

function requireAdmin(role?: string) {
  return ["ADMIN", "SUPER_ADMIN"].includes(role ?? "");
}

export async function GET(req: NextRequest) {
  return adminGetProductsHandler(req);
}

export async function POST(req: NextRequest) {
  return moderateProductHandler(req, (await req.json()).productId);
}

async function adminGetProductsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const sellerId = searchParams.get("sellerId") || undefined;
  const sort = searchParams.get("sort") || "newest";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { seller: { storeName: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status) where.status = status;
  if (category) where.categoryId = category;
  if (sellerId) where.sellerId = sellerId;

  const orderBy: any =
    sort === "price_desc"
      ? { basePrice: "desc" }
      : sort === "price_asc"
        ? { basePrice: "asc" }
        : sort === "sales_desc"
          ? { totalSales: "desc" }
          : sort === "rating_desc"
            ? { averageRating: "desc" }
            : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        category: { select: { name: true, slug: true } },
        seller: {
          select: {
            id: true,
            storeName: true,
            storeSlug: true,
            isVerified: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Stats
  const [pendingReview, active, outOfStock] = await Promise.all([
    prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.product.count({ where: { status: "ACTIVE", isActive: true } }),
    prisma.product.count({ where: { stock: 0, isActive: true } }),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      total: await prisma.product.count(),
      pendingReview,
      active,
      outOfStock,
    },
  });
}

export async function moderateProductHandler(
  req: NextRequest,
  productId: string,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, note } = await req.json();
  if (!["ACTIVE", "REJECTED", "INACTIVE"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: { include: { user: true } } },
  });
  if (!product)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.$transaction(async (tx: any) => {
    await tx.product.update({
      where: { id: productId },
      data: { status: status as any },
    });

    // Notify seller
    if (product.seller?.userId) {
      await tx.notification.create({
        data: {
          userId: product.seller.userId,
          type: "SYSTEM",
          title:
            status === "ACTIVE"
              ? `✅ Product Approved: ${product.name}`
              : `❌ Product Rejected: ${product.name}`,
          body:
            status === "ACTIVE"
              ? `Your product "${product.name}" has been approved and is now live!`
              : `Your product "${product.name}" was rejected. ${note ? `Reason: ${note}` : "Please review our listing guidelines."}`,
          data: { productId: product.id },
        },
      });
    }
  });

  // Invalidate caches
  await redis.del(`product:${product.slug}`);

  return NextResponse.json({ success: true, status });
}


const BannerCreateSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  imageUrl: z.string().url().optional(),
  mobileImageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional().or(z.literal("")),
  position: z.string().default("HOME_HERO"),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export async function getBannersHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ banners });
}

export async function createBannerHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = BannerCreateSchema.parse(body);

  const banner = await prisma.banner.create({
    data: {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    },
  });

  // Invalidate banner cache
  await redis.del("banners:active");

  return NextResponse.json({ banner }, { status: 201 });
}

export async function updateBannerHandler(req: NextRequest, bannerId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = BannerCreateSchema.partial().parse(body);
  const banner = await prisma.banner.update({ where: { id: bannerId }, data });
  await redis.del("banners:active");
  return NextResponse.json({ banner });
}

export async function deleteBannerHandler(req: NextRequest, bannerId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.banner.delete({ where: { id: bannerId } });
  await redis.del("banners:active");
  return NextResponse.json({ success: true });
}


const CouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(20)
    .transform((s) => s.toUpperCase()),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().positive(),
  minOrderAmount: z.number().optional(),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().int().optional(),
  perUserLimit: z.number().int().default(1),
  startsAt: z.string().transform((s) => new Date(s)),
  expiresAt: z.string().transform((s) => new Date(s)),
  isActive: z.boolean().default(true),
  appliesToAll: z.boolean().default(true),
  categoryIds: z.array(z.string()).default([]),
  productIds: z.array(z.string()).default([]),
  userIds: z.array(z.string()).default([]),
});

export async function getCouponsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  });

  return NextResponse.json({ coupons });
}

export async function createCouponHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = CouponSchema.parse(body);

  const existing = await prisma.coupon.findUnique({
    where: { code: data.code },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Coupon code already exists" },
      { status: 409 },
    );
  }

  const coupon = await prisma.coupon.create({ data });
  return NextResponse.json({ coupon }, { status: 201 });
}

export async function updateCouponHandler(req: NextRequest, couponId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const coupon = await prisma.coupon.update({
    where: { id: couponId },
    data: body,
  });
  return NextResponse.json({ coupon });
}

export async function deleteCouponHandler(req: NextRequest, couponId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}

const CategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  icon: z.string().optional(),
  parentId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
});

export async function adminGetCategoriesHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { name: true } },
      children: { select: { id: true, name: true } },
      _count: { select: { products: true } },
      attributes: true,
    },
  });

  return NextResponse.json({ categories });
}

export async function createCategoryHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = CategorySchema.parse(body);

  // Auto-generate slug
  const slug =
    data.slug ??
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing)
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const category = await prisma.category.create({ data: { ...data, slug } });
  await redis.del("categories:tree");
  return NextResponse.json({ category }, { status: 201 });
}

export async function updateCategoryHandler(
  req: NextRequest,
  categoryId: string,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = CategorySchema.partial().parse(body);
  const cat = await prisma.category.update({ where: { id: categoryId }, data });
  await redis.del("categories:tree");
  return NextResponse.json({ category: cat });
}

 
// Admin: security audit log
export async function getSecurityLogsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Simulated security events (in production, store in DB or external logging)
  const logs = [
    {
      id: "1",
      event: "LOGIN_SUCCESS",
      user: "admin@nexmart.com",
      ip: "203.0.113.1",
      ua: "Chrome/macOS",
      time: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      event: "SELLER_APPROVED",
      user: "admin@nexmart.com",
      ip: "203.0.113.1",
      detail: "TechStore Nepal",
      time: new Date(Date.now() - 7200000),
    },
    {
      id: "3",
      event: "LOGIN_FAILED",
      user: "hacker@bad.com",
      ip: "198.51.100.5",
      ua: "Python/3.11",
      time: new Date(Date.now() - 14400000),
    },
    {
      id: "4",
      event: "PRODUCT_REJECTED",
      user: "admin@nexmart.com",
      ip: "203.0.113.1",
      detail: "Fake Nike Shoes",
      time: new Date(Date.now() - 21600000),
    },
    {
      id: "5",
      event: "COUPON_CREATED",
      user: "admin@nexmart.com",
      ip: "203.0.113.1",
      detail: "FLASH50",
      time: new Date(Date.now() - 28800000),
    },
    {
      id: "6",
      event: "BULK_BAN",
      user: "admin@nexmart.com",
      ip: "203.0.113.1",
      detail: "3 spam accounts",
      time: new Date(Date.now() - 86400000),
    },
    {
      id: "7",
      event: "LOGIN_FAILED",
      user: "admin@nexmart.com",
      ip: "185.220.101.1",
      ua: "unknown",
      time: new Date(Date.now() - 172800000),
    },
    {
      id: "8",
      event: "PASSWORD_RESET",
      user: "sita@seller.com",
      ip: "27.34.65.100",
      ua: "Firefox/Linux",
      time: new Date(Date.now() - 259200000),
    },
  ];

  return NextResponse.json({ logs });
}


export async function getReturnsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;

  const where: any = {};
  if (status && status !== "ALL") where.status = status;

  const [returns, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true } },
            items: {
              take: 1,
              include: { product: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.returnRequest.count({ where }),
  ]);

  return NextResponse.json({ returns, total, page, limit });
}

export async function updateReturnHandler(req: NextRequest, returnId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, adminNote, refundAmount } = await req.json();

  const returnReq = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: status as any,
        adminNote,
        refundAmount: refundAmount ?? undefined,
        resolvedAt: ["COMPLETED", "REFUNDED", "REJECTED"].includes(status)
          ? new Date()
          : undefined,
      },
      include: { order: { include: { user: true } } },
    });

    // Update order status
    const orderStatus =
      status === "APPROVED"
        ? "RETURN_REQUESTED"
        : status === "COMPLETED"
          ? "RETURNED"
          : status === "REFUNDED"
            ? "REFUNDED"
            : undefined;

    if (orderStatus) {
      await tx.order.update({
        where: { id: updated.orderId },
        data: {
          status: orderStatus as any,
          paymentStatus: status === "REFUNDED" ? "REFUNDED" : undefined,
        },
      });
    }

    // Notify customer
    await tx.notification.create({
      data: {
        userId: updated.order.userId,
        type: "ORDER_CANCELLED",
        title: `Return ${status.charAt(0) + status.slice(1).toLowerCase()}`,
        body:
          status === "APPROVED"
            ? "Your return request has been approved! We'll arrange pickup soon."
            : status === "REJECTED"
              ? `Your return request was rejected. ${adminNote ? `Reason: ${adminNote}` : ""}`
              : status === "REFUNDED"
                ? `Your refund of ${formatPrice(Number(updated.refundAmount ?? 0))} has been processed!`
                : `Return status updated to: ${status}`,
        data: { orderId: updated.orderId },
      },
    });

    return updated;
  });

  return NextResponse.json({ returnRequest: returnReq });
}


export async function getPaymentsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const method = searchParams.get("method");
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;

  const where: any = {};
  if (status && status !== "all") where.paymentStatus = status;
  if (method && method !== "all") where.paymentMethod = method;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentRef: true,
        paymentGateway: true,
        paidAt: true,
        total: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  // Revenue summaries
  const [completed, refunded] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "COMPLETED" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "REFUNDED" },
      _sum: { total: true },
    }),
  ]);

  return NextResponse.json({
    payments: orders,
    total,
    page,
    limit,
    summary: {
      totalCollected: Number(completed._sum.total ?? 0),
      totalRefunded: Number(refunded._sum.total ?? 0),
    },
  });
}

export async function initiateAdminRefundHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId, amount, reason } = await req.json();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus !== "COMPLETED") {
    return NextResponse.json(
      { error: "Order has not been paid" },
      { status: 400 },
    );
  }

  // In production: call payment gateway refund API
  // For now: update status
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "REFUNDED" },
    }),
    prisma.notification.create({
      data: {
        userId: order.userId,
        type: "PAYMENT_FAILED",
        title: "Refund Processed",
        body: `Your refund of ${formatPrice(amount ?? Number(order.total))} for order #${order.orderNumber} has been initiated. Allow 3-5 business days.`,
        data: { orderId },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: `Refund of ${formatPrice(amount ?? Number(order.total))} initiated.`,
  });
}

 
function formatPrice(amount: number, currency = "NPR"): string {
  if (currency === "NPR") return `रू ${amount.toLocaleString("ne-NP")}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
}
