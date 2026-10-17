import type { MetadataRoute } from "next";
import { prisma } from "@/app/lib/prisma";
import { siteUrl } from "@/app/lib/site";

// Regenerated at most once an hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 45000 }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  return [
    { url: siteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...["/terms", "/privacy", "/refund-policy"].map((p) => ({ url: siteUrl(p), changeFrequency: "yearly" as const, priority: 0.2 })),
    ...categories.map((c) => ({ url: siteUrl(`/categories/${c.slug}`), changeFrequency: "daily" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: siteUrl(`/products/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
