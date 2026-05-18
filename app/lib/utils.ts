 
import { type ClassValue, clsx } from "clsx";
import { twMerge }               from "tailwind-merge";

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Nepali Rupees.
 *  formatPrice(195000) → "रू 1,95,000"
 */
export function formatPrice(amount: number | string, currency = "NPR"): string {
  const n = Number(amount) || 0;
  if (currency === "NPR") return `रू ${n.toLocaleString("ne-NP")}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

/** Human-readable elapsed time.
 *  timeAgo(new Date(Date.now() - 3600000)) → "1h ago"
 */
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "";
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60)    return "Just now";
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800)return `${Math.floor(secs / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-NP", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/** Generate a customer-facing order number. */
export function generateOrderNumber(): string {
  return `NX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}

/** Generate an invoice number. */
export function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

/** Clamp a number to [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Truncate string with ellipsis. */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

/** Slugify a display name → url-safe string. */
export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Safely parse a Prisma Decimal (comes back as string) to a JS number. */
export function toNumber(val: unknown): number {
  return Number(val) || 0;
}

/** Discount percentage between original and sale price. */
export function discountPercent(original: number, sale: number): number {
  if (!original || original <= sale) return 0;
  return Math.round(((original - sale) / original) * 100);
}

/** Discount % from basePrice to comparePrice (comparePrice is the higher "was" price). */
export function calculateDiscount(basePrice: number, comparePrice: number): number {
  if (!comparePrice || comparePrice <= basePrice) return 0;
  return Math.round(((comparePrice - basePrice) / comparePrice) * 100);
}