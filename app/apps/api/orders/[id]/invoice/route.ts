import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/app/lib/api";
import { loadOrderForViewer } from "@/app/lib/order-view";
import { getSettings } from "@/app/lib/settings";

type Params = { params: Promise<{ id: string }> };

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const npr = (n: unknown) => `NPR ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_LABEL: Record<string, string> = {
  KHALTI: "Khalti", STRIPE: "Card (Stripe)", CASH_ON_DELIVERY: "Cash on Delivery",
};

// ─── GET /api/orders/:id/invoice — printable invoice (Save as PDF from the print dialog) ─

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const order = await loadOrderForViewer(id, auth.user);
  if (!order) return jsonError("Order not found", 404);
  if (order.paymentStatus !== "COMPLETED" && order.paymentMethod !== "CASH_ON_DELIVERY") {
    return jsonError("The invoice is available once payment is complete", 400);
  }

  const { siteName, supportEmail } = await getSettings();
  const invoiceNo = `INV-${order.orderNumber}`;
  const issued = (order.paidAt ?? order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const a = order.address;
  const rows = order.items
    .map(
      (i) => `<tr>
        <td>${esc(i.product.name)}${i.variantName ? `<div class="muted">${esc(i.variantName)}</div>` : ""}</td>
        <td class="c">${i.quantity}</td>
        <td class="r">${npr(i.price)}</td>
        <td class="r">${npr(i.total)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${invoiceNo}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Inter, sans-serif; color: #1A1523; margin: 0; padding: 40px; background: #fff; }
  .wrap { max-width: 760px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .brand { font-size: 26px; font-weight: 800; } .brand span { color: #C68313; }
  h1 { font-size: 20px; margin: 0 0 4px; text-align: right; }
  .muted { color: #6B6878; font-size: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; font-size: 14px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6B6878; border-bottom: 2px solid #E8E6F0; padding: 8px 6px; }
  td { padding: 10px 6px; border-bottom: 1px solid #F0EDF8; vertical-align: top; }
  .c { text-align: center; } .r { text-align: right; }
  .totals { margin-left: auto; width: 280px; margin-top: 16px; font-size: 14px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { font-weight: 800; font-size: 16px; border-top: 2px solid #1A1523; margin-top: 6px; padding-top: 8px; }
  footer { margin-top: 40px; font-size: 12px; color: #6B6878; text-align: center; }
  @media print { body { padding: 0; } .noprint { display: none; } }
</style></head>
<body><div class="wrap">
  <header>
    <div><div class="brand">Pea<span>Nut</span></div><div class="muted">${esc(siteName)} · Kathmandu, Nepal<br>${esc(supportEmail)}</div></div>
    <div><h1>Tax Invoice</h1><div class="muted" style="text-align:right">${invoiceNo}<br>Issued ${issued}<br>Order ${esc(order.orderNumber)}</div></div>
  </header>
  <div class="grid">
    <div><strong>Billed to</strong><br>${a ? `${esc(a.fullName)}<br>${esc(a.street)}, ${esc(a.city)}<br>${esc(a.district)}, ${esc(a.province)}<br>${esc(a.phone)}` : esc(order.user.name ?? order.user.email)}</div>
    <div><strong>Payment</strong><br>${esc(PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod)}<br>Status: ${esc(order.paymentStatus)}${order.paymentRef ? `<br><span class="muted">Ref: ${esc(order.paymentRef)}</span>` : ""}</div>
  </div>
  <table><thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <div><span>Subtotal</span><span>${npr(order.subtotal)}</span></div>
    <div><span>Shipping</span><span>${Number(order.shippingCost) === 0 ? "Free" : npr(order.shippingCost)}</span></div>
    ${Number(order.discount) > 0 ? `<div><span>Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}</span><span>− ${npr(order.discount)}</span></div>` : ""}
    <div class="grand"><span>Total</span><span>${npr(order.total)}</span></div>
  </div>
  <footer>Thank you for shopping with PeaNut. Questions? Contact ${esc(supportEmail)}.</footer>
  <p class="noprint" style="text-align:center;margin-top:24px"><button onclick="window.print()" style="padding:10px 22px;border-radius:999px;border:0;background:#C68313;color:#fff;font-weight:600;cursor:pointer">Download / Print PDF</button></p>
</div>
${req.nextUrl.searchParams.get("print") === "0" ? "" : "<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300))</script>"}
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${invoiceNo}.html"`,
      "Cache-Control": "private, no-store",
    },
  });
}
