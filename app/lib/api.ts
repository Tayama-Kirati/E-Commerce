import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ZodError } from "zod";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
export const SELLER_ROLES = ["SELLER", ...ADMIN_ROLES] as const;

export function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

export function zodError(err: ZodError) {
  return jsonError("Validation failed", 422, { details: err.issues });
}

/** Reads a JSON body, returning null (instead of throwing) when it is missing or malformed. */
export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export type AuthedUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  sellerId: string | null;
};

type AuthResult = { user: AuthedUser; error?: never } | { user?: never; error: NextResponse };

/**
 * Resolves the signed-in user from the database, so role changes and bans take
 * effect immediately instead of waiting for the JWT to expire.
 */
export async function requireUser(roles?: readonly string[]): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: jsonError("Please sign in to continue", 401) };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, role: true, phone: true, isBanned: true,
      sellerProfile: { select: { id: true } },
    },
  });
  if (!user) return { error: jsonError("Account not found", 401) };
  if (user.isBanned) return { error: jsonError("Account suspended", 403) };
  if (roles && !roles.includes(user.role)) return { error: jsonError("Forbidden", 403) };

  return {
    user: {
      id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone,
      sellerId: user.sellerProfile?.id ?? null,
    },
  };
}

export const requireAdmin = () => requireUser(ADMIN_ROLES);

/** A seller (or an admin acting as one). Sellers without a store profile are rejected. */
export async function requireSeller(): Promise<AuthResult> {
  const auth = await requireUser(SELLER_ROLES);
  if (auth.error) return auth;
  if (auth.user.role === "SELLER" && !auth.user.sellerId) {
    return { error: jsonError("Seller profile not found — finish onboarding first", 403) };
  }
  return auth;
}

export function isAdmin(role: string) {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function pagination(searchParams: URLSearchParams, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(searchParams.get("limit")) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function appUrl(path = "") {
  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}
