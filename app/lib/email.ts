import { Resend } from "resend";

const FROM   = process.env.EMAIL_FROM ?? "PeaNut <onboarding@resend.dev>";
const BASE   = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Created lazily so a missing RESEND_API_KEY doesn't crash every route that imports this file.
let client: Resend | null = null;
const resend = {
  emails: {
    send: async (payload: Parameters<Resend["emails"]["send"]>[0]) => {
      if (!process.env.RESEND_API_KEY) {
        console.warn(`[email] RESEND_API_KEY not set — skipped "${payload.subject}" to ${payload.to}`);
        return null;
      }
      client ??= new Resend(process.env.RESEND_API_KEY);
      const { error } = await client.emails.send(payload);
      if (error) throw new Error(`[email] ${error.message}`);
      return null;
    },
  },
};

export async function sendVerificationEmail({
  to, name, token,
}: { to: string; name: string; token: string }) {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: "Verify your PeaNut account",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif; background: #F8F7FC; margin: 0; padding: 40px 16px;">
        <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 24px; padding: 40px; border: 1px solid #E8E6F0;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 28px; font-weight: 700; color: #1A1523;">Pea<span style="color: #C68313;">Nut</span></span>
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #1A1523; margin-bottom: 12px;">Hi ${name}! 👋</h1>
          <p style="color: #6B6878; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
            Welcome to PeaNut! Click the button below to verify your email address and activate your account.
          </p>
          <p style="color: #6B6878; font-size: 14px; margin-bottom: 28px;">This link expires in <strong>24 hours</strong>.</p>
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${BASE}/api/auth/verify-email?token=${token}"
               style="display: inline-block; background: linear-gradient(135deg, #C68313, #E8A020); color: #fff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 50px;">
              Verify My Email →
            </a>
          </div>
          <p style="color: #9B97A8; font-size: 12px; text-align: center;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #E8E6F0; margin: 24px 0;">
          <p style="color: #9B97A8; font-size: 12px; text-align: center;">
            PeaNut — Nepal's Premium Marketplace<br>
            Kathmandu, Nepal
          </p>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail({
  to, name, token,
}: { to: string; name: string; token: string }) {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: "Reset your PeaNut password",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif; background: #F8F7FC; margin: 0; padding: 40px 16px;">
        <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 24px; padding: 40px; border: 1px solid #E8E6F0;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 28px; font-weight: 700; color: #1A1523;">Pea<span style="color: #C68313;">Nut</span></span>
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #1A1523; margin-bottom: 12px;">Password reset request</h1>
          <p style="color: #6B6878; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
            Hi ${name}, we received a request to reset the password for your PeaNut account.
            Click below to choose a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${BASE}/reset-password?token=${token}"
               style="display: inline-block; background: linear-gradient(135deg, #C68313, #E8A020); color: #fff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 50px;">
              Reset My Password →
            </a>
          </div>
          <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="color: #D97706; font-size: 13px; margin: 0;">
              ⚠️ If you didn't request this, please ignore this email. Your password will not change.
            </p>
          </div>
          <p style="color: #9B97A8; font-size: 12px; text-align: center;">
            For security, this link can only be used once and expires in 1 hour.
          </p>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordChangedEmail({ to, name }: { to: string; name: string }) {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: "Your PeaNut password was changed",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px;">
        <h1 style="color: #1A1523;">Password changed ✅</h1>
        <p style="color: #6B6878;">Hi ${name}, your PeaNut password was successfully changed.</p>
        <p style="color: #6B6878;">If you didn't do this, please <a href="${BASE}/forgot-password" style="color: #3B82F6;">reset your password immediately</a> and contact support.</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail({
  to, name, orderNumber, total, items,
}: {
  to: string; name: string; orderNumber: string;
  total: number; items: { name: string; quantity: number; price: number }[];
}) {
  const itemRows = items
    .map((i) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #F0EDF8; color: #1A1523; font-size: 14px;">${i.name}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #F0EDF8; color: #6B6878; font-size: 14px; text-align: center;">${i.quantity}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #F0EDF8; color: #3B82F6; font-size: 14px; text-align: right; font-weight: 600;">रू ${(i.price * i.quantity).toLocaleString()}</td>
      </tr>
    `)
    .join("");

  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Order Confirmed — ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif; background: #F8F7FC; margin: 0; padding: 40px 16px;">
        <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 24px; padding: 40px; border: 1px solid #E8E6F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: 700; color: #1A1523;">Pea<span style="color: #C68313;">Nut</span></span>
          </div>
          <div style="background: linear-gradient(135deg, #3B82F6, #F59E0B); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 8px;">Order confirmed! 🎉</p>
            <p style="color: #fff; font-size: 24px; font-weight: 700; margin: 0;">${orderNumber}</p>
          </div>
          <p style="color: #6B6878; font-size: 15px; margin-bottom: 24px;">Hi ${name}, thank you for your order! We'll notify you when it ships.</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #F8F7FC;">
                <th style="padding: 10px; text-align: left; font-size: 12px; color: #9B97A8; font-weight: 600; text-transform: uppercase;">Item</th>
                <th style="padding: 10px; text-align: center; font-size: 12px; color: #9B97A8; font-weight: 600; text-transform: uppercase;">Qty</th>
                <th style="padding: 10px; text-align: right; font-size: 12px; color: #9B97A8; font-weight: 600; text-transform: uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="text-align: right; margin-bottom: 28px;">
            <p style="font-size: 18px; font-weight: 700; color: #3B82F6;">Total: रू ${total.toLocaleString()}</p>
          </div>
          <div style="text-align: center;">
            <a href="${BASE}/account/orders"
               style="display: inline-block; background: #C68313; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 50px;">
              Track My Order →
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}



// ── Shared layout for transactional emails ───────────────────────────────────

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(heading: string, bodyHtml: string, cta?: { label: string; href: string }) {
  return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif; background: #F8F7FC; margin: 0; padding: 40px 16px;">
        <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 24px; padding: 40px; border: 1px solid #E8E6F0;">
          <div style="text-align: center; margin-bottom: 28px;">
            <span style="font-size: 28px; font-weight: 700; color: #1A1523;">Pea<span style="color: #C68313;">Nut</span></span>
          </div>
          <h1 style="font-size: 20px; font-weight: 700; color: #1A1523; margin-bottom: 12px;">${heading}</h1>
          <div style="color: #6B6878; font-size: 15px; line-height: 1.6;">${bodyHtml}</div>
          ${cta ? `
          <div style="text-align: center; margin: 28px 0 8px;">
            <a href="${cta.href}" style="display: inline-block; background: #C68313; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 50px;">${cta.label}</a>
          </div>` : ""}
          <hr style="border: none; border-top: 1px solid #E8E6F0; margin: 24px 0;">
          <p style="color: #9B97A8; font-size: 12px; text-align: center;">PeaNut — Nepal's Premium Marketplace<br>Kathmandu, Nepal</p>
        </div>
      </body>
      </html>
    `;
}

const STATUS_COPY: Record<string, { subject: string; heading: string; line: string }> = {
  CONFIRMED:        { subject: "Order confirmed",        heading: "Your order is confirmed",   line: "We've received your payment and the seller is preparing your items." },
  PROCESSING:       { subject: "Order being prepared",   heading: "Your order is being packed", line: "The seller is packing your items for dispatch." },
  SHIPPED:          { subject: "Order shipped",          heading: "Your order is on its way",  line: "Your package has left the seller and is on its way to you." },
  OUT_FOR_DELIVERY: { subject: "Out for delivery",       heading: "Arriving today",            line: "Your package is out for delivery. Please keep your phone reachable." },
  DELIVERED:        { subject: "Order delivered",        heading: "Delivered!",                line: "Your package has been delivered. We hope you love it — leave a review to help other shoppers." },
  CANCELLED:        { subject: "Order cancelled",        heading: "Your order was cancelled",  line: "Your order has been cancelled. Any online payment will be refunded to the original method." },
  REFUNDED:         { subject: "Refund processed",       heading: "Your refund is on its way", line: "We've processed your refund. It can take 3–7 business days to reach your account." },
};

export async function sendOrderStatusEmail({
  to, name, orderId, orderNumber, status, trackingNumber, carrier, note,
}: {
  to: string; name: string; orderId: string; orderNumber: string; status: string;
  trackingNumber?: string | null; carrier?: string | null; note?: string | null;
}) {
  const copy = STATUS_COPY[status];
  if (!copy) return;
  const tracking = trackingNumber
    ? `<p style="margin-top: 16px;">Tracking number: <strong>${escapeHtml(trackingNumber)}</strong>${carrier ? ` (${escapeHtml(carrier)})` : ""}</p>`
    : "";
  const extra = note ? `<p style="margin-top: 12px;">${escapeHtml(note)}</p>` : "";
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${copy.subject} — ${orderNumber}`,
    html: layout(copy.heading, `<p>Hi ${escapeHtml(name)},</p><p>${copy.line}</p><p>Order: <strong>${orderNumber}</strong></p>${tracking}${extra}`,
      { label: "View Order →", href: `${BASE}/account/orders/${orderId}` }),
  });
}

export async function sendBackInStockEmail({ to, productName, productSlug }: { to: string; productName: string; productSlug: string }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Back in stock: ${productName}`,
    html: layout("It's back!", `<p><strong>${escapeHtml(productName)}</strong> is available again. Stock is limited, so grab it before it sells out.</p>`,
      { label: "Shop Now →", href: `${BASE}/products/${productSlug}` }),
  });
}

export async function sendLowStockEmail({ to, storeName, products }: { to: string; storeName: string; products: { name: string; stock: number }[] }) {
  const rows = products.map((p) => `<li><strong>${escapeHtml(p.name)}</strong> — ${p.stock} left</li>`).join("");
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Low stock alert — ${storeName}`,
    html: layout("Some products are running low", `<p>These products in <strong>${escapeHtml(storeName)}</strong> are almost sold out:</p><ul>${rows}</ul><p>Restock soon so you don't miss sales.</p>`,
      { label: "Manage Inventory →", href: `${BASE}/seller/dashboard` }),
  });
}

export async function sendTicketReplyEmail({ to, name, subject, reply }: { to: string; name: string; subject: string; reply: string }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Re: ${subject}`,
    html: layout("Our support team replied", `<p>Hi ${escapeHtml(name)},</p><blockquote style="border-left: 3px solid #C68313; margin: 16px 0; padding-left: 12px;">${escapeHtml(reply).replace(/\n/g, "<br>")}</blockquote>`),
  });
}

/** Generic one-paragraph notice (returns, payouts, account changes). */
export async function sendNoticeEmail({ to, subject, heading, body, cta }: { to: string; subject: string; heading: string; body: string; cta?: { label: string; path: string } }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: layout(escapeHtml(heading), `<p>${escapeHtml(body)}</p>`, cta ? { label: cta.label, href: `${BASE}${cta.path}` } : undefined),
  });
}

export async function sendSellerStatusEmail({ to, storeName, title, body }: { to: string; storeName: string; title: string; body: string }) {
  await sendNoticeEmail({ to, subject: `${title} — ${storeName}`, heading: title, body, cta: { label: "Open Seller Hub →", path: "/seller/dashboard" } });
}
