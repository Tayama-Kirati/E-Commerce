import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Server-side route protection. The proxy sees the URL before next.config
// rewrites, so each area is matched by both its clean path and its /apps path.
// Handlers still re-check permissions against the database (role changes and
// bans apply immediately there); this layer stops pages from rendering at all.

const ADMIN = ["ADMIN", "SUPER_ADMIN"];
const SELLER = ["SELLER", ...ADMIN];

type Rule = { test: RegExp; roles: string[] | "any"; api: boolean };

const RULES: Rule[] = [
  { test: /^\/(apps\/)?api\/admin(\/|$)/, roles: ADMIN, api: true },
  // Public seller endpoints: store pages and the lookup used on product pages
  { test: /^\/(apps\/)?api\/seller\/(store|lookup)(\/|$)/, roles: [], api: true },
  { test: /^\/(apps\/)?api\/seller\/onboarding(\/|$)/, roles: "any", api: true },
  { test: /^\/(apps\/)?api\/seller(\/|$)/, roles: SELLER, api: true },
  { test: /^\/(apps\/)?admin(\/|$)/, roles: ADMIN, api: false },
  { test: /^\/seller\/onboarding(\/|$)|^\/apps\/shop\/seller\/onboarding(\/|$)/, roles: "any", api: false },
  { test: /^\/(apps\/)?seller(\/|$)/, roles: SELLER, api: false },
  { test: /^\/(apps\/)?account(\/|$)/, roles: "any", api: false },
  { test: /^\/checkout$|^\/apps\/shop\/checkout(\/|$)/, roles: "any", api: false },
];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const rule = RULES.find((r) => r.test.test(pathname));
  if (!rule || (Array.isArray(rule.roles) && rule.roles.length === 0)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = typeof token?.role === "string" ? token.role : null;

  if (!token) {
    if (rule.api) return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
    const login = new URL("/", req.url);
    login.searchParams.set("page", "login");
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }

  if (rule.roles !== "any" && (!role || !rule.roles.includes(role))) {
    if (rule.api) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Signed in but not allowed here: send them to the storefront instead of an error page
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin", "/admin/:path*", "/apps/admin", "/apps/admin/:path*",
    "/seller/:path*", "/apps/seller/:path*", "/apps/shop/seller/:path*",
    "/account/:path*", "/apps/account/:path*",
    "/checkout", "/apps/shop/checkout",
    "/api/admin/:path*", "/apps/api/admin/:path*",
    "/api/seller/:path*", "/apps/api/seller/:path*",
  ],
};
