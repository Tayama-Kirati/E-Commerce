import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM   = "PeaNut <noreply@peanut.com>";
const BASE   = process.env.NEXTAUTH_URL!;

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
            <span style="font-size: 28px; font-weight: 700; color: #3B82F6;">Nex<span style="color: #F59E0B;">Mart</span></span>
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #1A1523; margin-bottom: 12px;">Hi ${name}! 👋</h1>
          <p style="color: #6B6878; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
            Welcome to PeaNut! Click the button below to verify your email address and activate your account.
          </p>
          <p style="color: #6B6878; font-size: 14px; margin-bottom: 28px;">This link expires in <strong>24 hours</strong>.</p>
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${BASE}/api/auth/verify-email?token=${token}"
               style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #60A5FA); color: #fff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 50px;">
              Verify My Email →
            </a>
          </div>
          <p style="color: #9B97A8; font-size: 12px; text-align: center;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #E8E6F0; margin: 24px 0;">
          <p style="color: #9B97A8; font-size: 12px; text-align: center;">
            PeaNut — Nepal's AI-Powered Marketplace<br>
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
            <span style="font-size: 28px; font-weight: 700; color: #3B82F6;">Nex<span style="color: #F59E0B;">Mart</span></span>
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #1A1523; margin-bottom: 12px;">Password reset request</h1>
          <p style="color: #6B6878; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
            Hi ${name}, we received a request to reset the password for your PeaNut account.
            Click below to choose a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${BASE}/reset-password?token=${token}"
               style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #60A5FA); color: #fff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 50px;">
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
            <span style="font-size: 28px; font-weight: 700; color: #3B82F6;">Nex<span style="color: #F59E0B;">Mart</span></span>
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
               style="display: inline-block; background: #3B82F6; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 50px;">
              Track My Order →
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

