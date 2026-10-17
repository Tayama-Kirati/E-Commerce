// SMS via Sparrow SMS (https://sparrowsms.com), the common gateway for Nepali numbers.
// Disabled (logs only) until SPARROW_SMS_TOKEN and SPARROW_SMS_FROM are set.

const SPARROW_URL = "https://api.sparrowsms.com/v2/sms/";

/** Normalises to the 10-digit local format Sparrow expects (98XXXXXXXX). */
export function normalizeNepaliPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "").replace(/^977/, "");
  return /^9[78]\d{8}$/.test(digits) ? digits : null;
}

export async function sendSms(phone: string | null | undefined, text: string) {
  if (!phone) return;
  const to = normalizeNepaliPhone(phone);
  if (!to) return;

  const token = process.env.SPARROW_SMS_TOKEN;
  const from = process.env.SPARROW_SMS_FROM;
  if (!token || !from) {
    console.warn(`[sms] SPARROW_SMS_TOKEN/SPARROW_SMS_FROM not set — skipped SMS to ${to}`);
    return;
  }

  const res = await fetch(SPARROW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token, from, to, text }),
  });
  if (!res.ok) throw new Error(`[sms] Sparrow responded ${res.status}: ${await res.text()}`);
}
