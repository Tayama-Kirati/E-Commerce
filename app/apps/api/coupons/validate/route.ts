import { NextRequest, NextResponse } from "next/server";
import { requireUser, readJson } from "@/app/lib/api";
import { checkCoupon } from "@/app/lib/coupons";
import { quoteShipping } from "@/app/lib/shipping";
import { getCart } from "@/app/lib/cart";

type Body = { code?: string; orderTotal?: number; orderAmount?: number; subtotal?: number; province?: string };

// ─── POST /api/coupons/validate (also served at /api/orders/validate-coupon) ─

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = (await readJson<Body>(req)) ?? {};
  let subtotal = Number(body.orderTotal ?? body.orderAmount ?? body.subtotal ?? NaN);
  let allFree = false;
  if (!Number.isFinite(subtotal)) {
    // Fall back to the server-side cart when the page doesn't send a total
    const cart = await getCart(auth.user.id, body.province);
    subtotal = cart.summary.subtotal;
    allFree = cart.summary.freeShipping;
  }
  const shipping = await quoteShipping({ subtotal, allItemsFreeShipping: allFree, province: body.province });

  const check = await checkCoupon({ code: body.code ?? "", userId: auth.user.id, subtotal, shippingCost: shipping.cost });
  if (!check.ok) return NextResponse.json({ valid: false, error: check.error }, { status: check.status });

  return NextResponse.json({
    valid: true,
    coupon: { id: check.coupon.id, code: check.coupon.code, type: check.coupon.type, discount: Number(check.coupon.discount) },
    discountAmount: check.discount,
    discount: check.discount,
    freeShipping: check.freeShipping,
    message: `Coupon ${check.coupon.code} applied — you save रू ${check.discount.toLocaleString()}`,
  });
}
