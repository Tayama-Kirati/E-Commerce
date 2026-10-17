/** Public base URL for canonical links, the sitemap and Open Graph tags. */
export function siteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}
