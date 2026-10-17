import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, readJson, zodError, jsonError } from "@/app/lib/api";
import { totalSpentFor } from "@/app/lib/admin";
import { loyaltyTierFor } from "@/app/lib/pricing";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true, role: true, isBanned: true, banReason: true,
      loyaltyPoints: true, loyaltyTier: true, emailVerified: true, lastLogin: true, createdAt: true,
      sellerProfile: { select: { id: true, storeName: true, storeSlug: true, status: true } },
      addresses: { where: { isArchived: false } },
      orders: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, orderNumber: true, status: true, total: true, createdAt: true } },
      loyaltyTransactions: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { orders: true, reviews: true, returnRequests: true, supportTickets: true } },
    },
  });
  if (!user) return jsonError("User not found", 404);

  const spent = await totalSpentFor([id]);
  const { sellerProfile, ...rest } = user;
  return NextResponse.json({
    user: { ...rest, seller: sellerProfile, totalSpent: spent.get(id) ?? 0, orders: rest.orders.map((o) => ({ ...o, total: Number(o.total) })) },
  });
}

// ─── PUT /api/admin/users/:id — ban/unban, change role, adjust points ────────

const UpdateSchema = z.object({
  isBanned: z.boolean().optional(),
  banReason: z.string().trim().max(500).optional(),
  role: z.enum(["CUSTOMER", "SELLER", "ADMIN", "SUPER_ADMIN"]).optional(),
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/).optional().nullable(),
  loyaltyPointsAdjust: z.number().int().refine((n) => n !== 0, "Enter a non-zero amount").optional(),
  adjustReason: z.string().trim().max(200).optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = UpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const d = parsed.data;

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, loyaltyPoints: true } });
  if (!target) return jsonError("User not found", 404);
  if (id === auth.user.id && (d.isBanned || (d.role && d.role !== auth.user.role))) {
    return jsonError("You can't ban yourself or change your own role", 400);
  }
  // Only super admins can create or modify other admins
  const touchesAdmin = ["ADMIN", "SUPER_ADMIN"].includes(target.role) || ["ADMIN", "SUPER_ADMIN"].includes(d.role ?? "");
  if (touchesAdmin && auth.user.role !== "SUPER_ADMIN" && (d.role || d.isBanned !== undefined)) {
    return jsonError("Only a super admin can change admin accounts", 403);
  }
  if (d.loyaltyPointsAdjust && target.loyaltyPoints + d.loyaltyPointsAdjust < 0) {
    return jsonError("The user doesn't have that many points", 400);
  }

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        ...(d.isBanned !== undefined && { isBanned: d.isBanned, banReason: d.isBanned ? d.banReason ?? "Policy violation" : null }),
        ...(d.role && { role: d.role }),
        ...(d.name && { name: d.name }),
        ...(d.phone !== undefined && { phone: d.phone }),
        ...(d.loyaltyPointsAdjust && { loyaltyPoints: { increment: d.loyaltyPointsAdjust } }),
      },
      select: { id: true, name: true, role: true, isBanned: true, banReason: true, loyaltyPoints: true },
    });
    if (d.loyaltyPointsAdjust) {
      await tx.user.update({ where: { id }, data: { loyaltyTier: loyaltyTierFor(updated.loyaltyPoints) } });
      await tx.loyaltyTransaction.create({
        data: { userId: id, points: d.loyaltyPointsAdjust, type: "ADJUSTMENT", description: d.adjustReason || "Adjusted by PeaNut support" },
      });
      await tx.notification.create({
        data: { userId: id, type: "PROMO", title: "Points updated", body: `${d.loyaltyPointsAdjust > 0 ? "+" : ""}${d.loyaltyPointsAdjust} points — ${d.adjustReason || "adjusted by support"}` },
      });
    }
    if (d.isBanned) await tx.session.deleteMany({ where: { userId: id } });
    return updated;
  });

  return NextResponse.json({ user });
}

export const PATCH = PUT;
