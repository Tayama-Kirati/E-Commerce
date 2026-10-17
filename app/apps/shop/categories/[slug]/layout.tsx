import type { Metadata } from "next";
import { prisma } from "@/app/lib/prisma";
import { siteUrl } from "@/app/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug }, select: { name: true, _count: { select: { products: true } } } });
  if (!category) return { title: "Category not found", robots: { index: false } };
  const description = `Shop ${category.name} on PeaNut — ${category._count.products} products with fast delivery across Nepal.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: siteUrl(`/categories/${slug}`) },
    openGraph: { title: `${category.name} | PeaNut`, description, url: siteUrl(`/categories/${slug}`) },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
