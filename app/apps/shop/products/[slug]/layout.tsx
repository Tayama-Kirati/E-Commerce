import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/app/lib/prisma";
import { siteUrl } from "@/app/lib/site";

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

const loadProduct = cache((slug: string) =>
  prisma.product.findFirst({
    where: { slug, isActive: true },
    select: {
      name: true, slug: true, shortDesc: true, description: true, basePrice: true, stock: true, sku: true,
      averageRating: true, totalReviews: true,
      images: { orderBy: { order: "asc" }, take: 4, select: { url: true } },
      category: { select: { name: true } },
      seller: { select: { storeName: true } },
    },
  }),
);

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const product = await loadProduct((await params).slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const description = (product.shortDesc ?? product.description ?? `Buy ${product.name} on PeaNut.`).slice(0, 160);
  const images = product.images.map((i) => i.url);
  return {
    title: product.name,
    description,
    alternates: { canonical: siteUrl(`/products/${product.slug}`) },
    openGraph: { type: "website", title: product.name, description, url: siteUrl(`/products/${product.slug}`), images },
    twitter: { card: "summary_large_image", title: product.name, description, images },
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const product = await loadProduct((await params).slug);
  // schema.org Product data lets search engines show price, stock and rating
  const jsonLd = product && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc ?? product.description ?? undefined,
    image: product.images.map((i) => i.url),
    sku: product.sku ?? undefined,
    category: product.category?.name,
    brand: product.seller ? { "@type": "Brand", name: product.seller.storeName } : undefined,
    offers: {
      "@type": "Offer",
      url: siteUrl(`/products/${product.slug}`),
      priceCurrency: "NPR",
      price: Number(product.basePrice),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.totalReviews > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.averageRating, reviewCount: product.totalReviews },
    }),
  };
  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}
      {children}
    </>
  );
}
