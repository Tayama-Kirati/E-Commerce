import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { z } from "zod";

async function requireSeller(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
  });
  return { session, seller };
}

export async function GET(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await prisma.seller.findUnique({
    where: { id: ctx.seller.id },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
      _count: {
        select: {
          products: true,
          orders: true,
        },
      },
    },
  });

  return NextResponse.json({ seller });
}

const UpdateSellerProfileSchema = z.object({
  storeName: z.string().min(3).max(100).optional(),
  storeDescription: z.string().max(1000).optional(),
  storeLogo: z.string().url().optional().nullable(),
  storeBanner: z.string().url().optional().nullable(),
  businessName: z.string().max(200).optional(),
  businessRegNo: z.string().max(50).optional(),
  panNumber: z.string().max(20).optional(),
  bankName: z.string().max(100).optional(),
  bankAccount: z.string().max(50).optional(),
  bankBranch: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
});

export async function PUT(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.seller.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Seller account not approved" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const data = UpdateSellerProfileSchema.parse(body);

  // Slug update if store name changes
  let storeSlug: string | undefined;
  if (data.storeName) {
    const base = data.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const existing = await prisma.seller.findFirst({
      where: { storeSlug: base, id: { not: ctx.seller.id } },
    });
    storeSlug = existing ? `${base}-${ctx.seller.id.slice(-4)}` : base;
  }

  const updated = await prisma.seller.update({
    where: { id: ctx.seller.id },
    data: { ...data, ...(storeSlug ? { storeSlug } : {}) },
  });

  return NextResponse.json({ seller: updated });
}

const OnboardingSchema = z.object({
  storeName: z.string().min(3).max(100),
  storeDescription: z.string().min(10).max(1000),
  businessName: z.string().min(2).max(200),
  businessRegNo: z.string().optional(),
  panNumber: z.string().optional(),
  bankName: z.string().min(2),
  bankAccount: z.string().min(8),
  bankBranch: z.string().optional(),
  city: z.string().min(2),
  district: z.string().min(2),
  province: z.string().min(2),
  acceptPolicy: z.literal(true),
});

export async function onboardingHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check not already a seller
  const existing = await prisma.seller.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: "You already have a seller account.",
        status: existing.status,
      },
      { status: 409 },
    );
  }

  const body = await req.json();
  const data = OnboardingSchema.parse(body);

  // Generate slug
  let base = data.storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  let slug = base;
  let attempt = 0;
  while (await prisma.seller.findUnique({ where: { storeSlug: slug } })) {
    slug = `${base}-${++attempt}`;
  }

  const seller = await prisma.$transaction(async (tx: any) => {
    const s = await tx.seller.create({
      data: {
        userId: session.user.id,
        storeName: data.storeName,
        storeSlug: slug,
        storeDescription: data.storeDescription,
        businessName: data.businessName,
        businessRegNo: data.businessRegNo,
        panNumber: data.panNumber,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankBranch: data.bankBranch,
        city: data.city,
        district: data.district,
        province: data.province,
        status: "PENDING",
      },
    });

    // Update user role
    await tx.user.update({
      where: { id: session.user.id },
      data: { role: "SELLER" },
    });

    // Notify admins
    const admins = await tx.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    await tx.notification.createMany({
      data: admins.map((a: any) => ({
        userId: a.id,
        type: "SYSTEM" as const,
        title: "New Seller Application",
        body: `${data.storeName} has applied to become a seller.`,
      })),
    });

    // Notify applicant
    await tx.notification.create({
      data: {
        userId: session.user.id,
        type: "SYSTEM",
        title: "Application Received! 🎉",
        body: "Your seller application is under review. We'll notify you within 24–48 hours.",
      },
    });

    return s;
  });

  return NextResponse.json(
    { seller, message: "Application submitted successfully!" },
    { status: 201 },
  );
}

export async function getSellerProductsHandler(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const sort = searchParams.get("sort") || "newest";
  const category = searchParams.get("category") || undefined;

  const where: any = { sellerId: ctx.seller.id };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status === "LOW_STOCK") {
    where.stock = { gt: 0, lte: 5 };
  } else if (status === "OUT_OF_STOCK") {
    where.stock = 0;
  } else if (status && status !== "all") {
    where.status = status;
  }
  if (category) where.categoryId = category;

  const orderBy: any =
    sort === "price_asc"
      ? { basePrice: "asc" }
      : sort === "price_desc"
        ? { basePrice: "desc" }
        : sort === "stock_asc"
          ? { stock: "asc" }
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
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        variants: {
          select: { id: true, name: true, stock: true, price: true },
          where: { isActive: true },
        },
        _count: {
          select: { reviews: true, orderItems: true, wishlistItems: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Aggregate stats for the seller
  const stats = await prisma.product.aggregate({
    where: { sellerId: ctx.seller.id },
    _count: { id: true },
    _sum: { stock: true, totalSales: true, totalViews: true },
  });

  const lowStock = await prisma.product.count({
    where: { sellerId: ctx.seller.id, stock: { gt: 0, lte: 5 } },
  });
  const outOfStock = await prisma.product.count({
    where: { sellerId: ctx.seller.id, stock: 0, isActive: true },
  });

  return NextResponse.json({
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      total: stats._count.id,
      totalStock: stats._sum.stock ?? 0,
      totalSales: stats._sum.totalSales ?? 0,
      totalViews: stats._sum.totalViews ?? 0,
      lowStock,
      outOfStock,
    },
  });
}

const VariantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  attributes: z.record(z.string(), z.string()),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function manageVariantsHandler(
  req: NextRequest,
  productId: string,
) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.sellerId !== ctx.seller.id) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (req.method === "GET") {
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ variants });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const data = VariantSchema.parse(body);

    const skuExists = await prisma.productVariant.findUnique({
      where: { sku: data.sku },
    });
    if (skuExists)
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 409 },
      );

    const variant = await prisma.$transaction(async (tx: any) => {
      const v = await tx.productVariant.create({
        data: { ...data, productId },
      });
      await tx.product.update({
        where: { id: productId },
        data: { hasVariants: true },
      });
      return v;
    });

    return NextResponse.json({ variant }, { status: 201 });
  }

  // PUT — bulk update variants
  if (req.method === "PUT") {
    const { variants } = await req.json();
    const updated = await prisma.$transaction(
      variants.map((v: any) =>
        prisma.productVariant.update({ where: { id: v.id }, data: v }),
      ),
    );
    return NextResponse.json({ variants: updated });
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function getSellerOrdersHandler(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = { sellerId: ctx.seller.id };
  if (status && status !== "all") where.order = { status };
  if (from || to) {
    where.order = { ...where.order, createdAt: {} };
    if (from) where.order.createdAt.gte = new Date(from);
    if (to) where.order.createdAt.lte = new Date(to);
  }
  if (search) {
    where.order = {
      ...where.order,
      OR: [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ],
    };
  }

  const [items, total] = await Promise.all([
    prisma.orderItem.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { order: { createdAt: "desc" } },
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            address: {
              select: {
                city: true,
                district: true,
                fullName: true,
                phone: true,
                street: true,
              },
            },
          },
        },
        product: { select: { name: true, slug: true } },
        variant: { select: { name: true } },
      },
    }),
    prisma.orderItem.count({ where }),
  ]);

  // Revenue stats
  const revenueAgg = await prisma.orderItem.aggregate({
    where: { sellerId: ctx.seller.id },
    _sum: { total: true, sellerEarnings: true },
    _count: { id: true },
  });

  const pendingAgg = await prisma.orderItem.aggregate({
    where: { sellerId: ctx.seller.id, order: { status: "PENDING" } },
    _count: { id: true },
  });

  return NextResponse.json({
    orders: items,
    total,
    page,
    limit,
    stats: {
      totalRevenue: Number(revenueAgg._sum.total ?? 0),
      totalEarnings: Number(revenueAgg._sum.sellerEarnings ?? 0),
      totalOrders: revenueAgg._count.id,
      pendingOrders: pendingAgg._count.id,
    },
  });
}

const ShipSchema = z.object({
  trackingNumber: z.string().min(3),
  trackingUrl: z.string().url().optional(),
  courier: z.string().optional(),
  note: z.string().optional(),
});

export async function shipOrderHandler(req: NextRequest, orderId: string) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = ShipSchema.parse(body);

  // Verify this order belongs to seller
  const orderItem = await prisma.orderItem.findFirst({
    where: { orderId, sellerId: ctx.seller.id },
  });
  if (!orderItem)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const order = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "SHIPPED",
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
      },
      include: { user: true },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "SHIPPED",
        note:
          data.note ??
          `Shipped via ${data.courier ?? "courier"}. Tracking: ${data.trackingNumber}`,
        updatedBy: ctx.session.user.id,
      },
    });

    await tx.notification.create({
      data: {
        userId: updated.userId,
        type: "ORDER_SHIPPED",
        title: `Order Shipped! 🚚`,
        body: `Your order ${updated.orderNumber} is on its way! Tracking: ${data.trackingNumber}`,
        data: { orderId, trackingNumber: data.trackingNumber },
      },
    });

    return updated;
  });

  return NextResponse.json({ order, message: "Order marked as shipped." });
}

export async function getSellerAnalyticsHandler(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = parseInt(searchParams.get("period") ?? "30", 10);
  const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

  const [
    revenueByDay,
    topProducts,
    revenueByCategory,
    ordersByStatus,
    reviewStats,
    conversionData,
  ] = await Promise.all([
    // Daily revenue
    prisma.$queryRaw<{ date: string; revenue: number; orders: number }[]>`
      SELECT
        DATE(o.created_at)::text AS date,
        COALESCE(SUM(oi.total), 0)::float AS revenue,
        COUNT(DISTINCT oi.order_id)::int AS orders
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.seller_id = ${ctx.seller.id}
        AND o.created_at >= ${since}
        AND o.payment_status = 'COMPLETED'
      GROUP BY DATE(o.created_at)
      ORDER BY DATE(o.created_at)
    `,

    // Top products
    prisma.product.findMany({
      where: { sellerId: ctx.seller.id, isActive: true },
      orderBy: { totalSales: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        totalSales: true,
        totalViews: true,
        averageRating: true,
        totalReviews: true,
        stock: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    }),

    // Revenue by category
    prisma.$queryRaw<{ name: string; revenue: number }[]>`
      SELECT c.name, COALESCE(SUM(oi.total), 0)::float AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE oi.seller_id = ${ctx.seller.id}
        AND oi.created_at >= ${since}
      GROUP BY c.name ORDER BY revenue DESC LIMIT 5
    `,

    // Orders by status
    prisma.orderItem
      .groupBy({
        by: ["orderId"],
        where: {
          sellerId: ctx.seller.id,
          order: { createdAt: { gte: since } },
        },
      })
      .then(async (items: any) => {
        const orderIds = items.map((i: any) => i.orderId);
        return prisma.order.groupBy({
          by: ["status"],
          where: { id: { in: orderIds } },
          _count: { status: true },
        });
      }),

    // Review stats
    prisma.review.aggregate({
      where: { product: { sellerId: ctx.seller.id } },
      _avg: { rating: true },
      _count: { id: true },
    }),

    // Views vs orders (conversion proxy)
    prisma.product.aggregate({
      where: { sellerId: ctx.seller.id },
      _sum: { totalViews: true, totalSales: true },
    }),
  ]);

  const conversionRate =
    conversionData._sum.totalViews && conversionData._sum.totalSales
      ? (
          (conversionData._sum.totalSales / conversionData._sum.totalViews) *
          100
        ).toFixed(2)
      : "0.00";

  return NextResponse.json({
    revenueByDay,
    topProducts,
    revenueByCategory,
    ordersByStatus,
    reviewStats: {
      averageRating: reviewStats._avg.rating ?? 0,
      totalReviews: reviewStats._count.id,
    },
    conversionRate: parseFloat(conversionRate),
    totalViews: conversionData._sum.totalViews ?? 0,
    totalSales: conversionData._sum.totalSales ?? 0,
  });
}

export async function getPayoutsHandler(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Total earnings
  const earningsAgg = await prisma.orderItem.aggregate({
    where: { sellerId: ctx.seller.id, order: { paymentStatus: "COMPLETED" } },
    _sum: { sellerEarnings: true, commissionAmt: true, total: true },
  });

  // Simulated payout history (in production this comes from a Payouts model)
  const payoutHistory = [
    {
      id: "P001",
      amount: 45000,
      bank: "NIC Asia ****4521",
      date: new Date(Date.now() - 30 * 86400000),
      status: "COMPLETED",
    },
    {
      id: "P002",
      amount: 38500,
      bank: "NIC Asia ****4521",
      date: new Date(Date.now() - 45 * 86400000),
      status: "COMPLETED",
    },
    {
      id: "P003",
      amount: 52200,
      bank: "NIC Asia ****4521",
      date: new Date(Date.now() - 60 * 86400000),
      status: "COMPLETED",
    },
  ];

  const totalPaid = payoutHistory.reduce((s: any, p: any) => s + p.amount, 0);
  const totalEarnings = Number(earningsAgg._sum.sellerEarnings ?? 0);
  const available = Math.max(0, totalEarnings - totalPaid);

  return NextResponse.json({
    available,
    pending: totalEarnings * 0.05, // 5% simulated pending clearance
    totalEarnings,
    totalPlatformFee: Number(earningsAgg._sum.commissionAmt ?? 0),
    payoutHistory,
    bankDetails: {
      name: ctx.seller.bankName,
      account: ctx.seller.bankAccount,
      branch: ctx.seller.bankBranch,
    },
  });
}

const WithdrawSchema = z.object({
  amount: z.number().positive().min(500),
  bankAccount: z.string().min(8),
  note: z.string().optional(),
});

export async function requestWithdrawHandler(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = WithdrawSchema.parse(body);

  // In production: create Payout record, trigger bank transfer API
  // For now: return success
  return NextResponse.json({
    message: `Withdrawal of रू ${data.amount.toLocaleString()} requested. Expected in 2–3 business days.`,
    referenceId: `WD-${Date.now()}`,
  });
}

export async function uploadHandler(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { images, folder = "products" } = await req.json();

  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "No images provided" }, { status: 400 });
  }
  if (images.length > 10) {
    return NextResponse.json(
      { error: "Max 10 images at once" },
      { status: 400 },
    );
  }

  const uploaded = await Promise.all(
    images.map((base64: string) =>
      uploadToCloudinary(
        base64,
        `nexmart/sellers/${ctx.seller!.id}/${folder}`,
        {
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto:good", fetch_format: "auto" },
          ],
        },
      ),
    ),
  );

  return NextResponse.json({ urls: uploaded.map((u: any) => u.url) });
}

// ═══════════════════════════════════════════════════════════════════════════
// apps/web/app/api/seller/bulk/route.ts
// Bulk product operations (status update, delete, price update)
// ═══════════════════════════════════════════════════════════════════════════

const BulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum([
    "activate",
    "deactivate",
    "delete",
    "update_price",
    "update_stock",
  ]),
  value: z.any().optional(), // for price/stock updates
});

export async function bulkProductHandler(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx?.seller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = BulkSchema.parse(body);

  // Verify ownership
  const products = await prisma.product.findMany({
    where: { id: { in: data.ids }, sellerId: ctx.seller.id },
    select: { id: true },
  });
  if (products.length !== data.ids.length) {
    return NextResponse.json(
      { error: "Some products not found or unauthorized" },
      { status: 400 },
    );
  }

  const ids = products.map((p: any) => p.id);

  switch (data.action) {
    case "activate":
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { isActive: true, status: "ACTIVE" },
      });
      break;
    case "deactivate":
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false, status: "INACTIVE" },
      });
      break;
    case "delete":
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false, status: "INACTIVE" },
      });
      break;
    case "update_price":
      if (typeof data.value !== "number")
        return NextResponse.json(
          { error: "Price value required" },
          { status: 400 },
        );
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { basePrice: data.value },
      });
      break;
    case "update_stock":
      if (typeof data.value !== "number")
        return NextResponse.json(
          { error: "Stock value required" },
          { status: 400 },
        );
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { stock: data.value },
      });
      break;
  }

  return NextResponse.json({ success: true, affected: ids.length });
}
