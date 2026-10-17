import { NextRequest, NextResponse } from "next/server";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, pagination } from "@/app/lib/api";
import { totalSpentFor } from "@/app/lib/admin";

const ROLES: Role[] = ["CUSTOMER", "SELLER", "ADMIN", "SUPER_ADMIN"];
// ─── GET /api/admin/users?search=&role=&tier=&isBanned=&isActive=&emailVerified=&sort= ─

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pagination(sp, 20, 100);

  const where: Prisma.UserWhereInput = {};
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }
  const role = sp.get("role") as Role | null;
  if (role && ROLES.includes(role)) where.role = role;
  if (sp.get("tier")) where.loyaltyTier = sp.get("tier")!;
  // Query-string booleans: only the literal "true"/"false" count
  if (sp.get("isBanned") === "true") where.isBanned = true;
  if (sp.get("isBanned") === "false" || sp.get("isActive") === "true") where.isBanned = false;
  if (sp.get("emailVerified") === "false") where.emailVerified = null;
  if (sp.get("emailVerified") === "true") where.emailVerified = { not: null };

  const sort = sp.get("sort");
  const orderBy: Prisma.UserOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" }
    : sort === "name" ? { name: "asc" }
    : sort === "points" ? { loyaltyPoints: "desc" }
    : { createdAt: "desc" };

  const [users, total, totalCustomers, totalSellers, totalBanned, newToday] = await Promise.all([
    prisma.user.findMany({
      where, orderBy, skip, take: limit,
      select: {
        id: true, name: true, email: true, phone: true, avatar: true, role: true, isBanned: true,
        loyaltyPoints: true, loyaltyTier: true, emailVerified: true, lastLogin: true, createdAt: true,
        sellerProfile: { select: { id: true, storeName: true, status: true } },
        _count: { select: { orders: true, reviews: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  const spent = await totalSpentFor(users.map((u) => u.id));
  return NextResponse.json({
    users: users.map(({ sellerProfile, ...u }) => ({ ...u, seller: sellerProfile, totalSpent: spent.get(u.id) ?? 0 })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: { totalCustomers, totalSellers, totalBanned, newToday },
  });
}
