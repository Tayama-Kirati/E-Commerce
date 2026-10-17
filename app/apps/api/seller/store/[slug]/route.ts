import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const seller = await prisma.seller.findUnique({
    where: { storeSlug: slug },
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      description: true,
      logo: true,
      banner: true,
      isVerified: true,
      rating: true,
      totalSales: true,
      createdAt: true,
      user: { select: { name: true } },
      _count: { select: { products: true } },
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { product: { sellerId: seller.id } },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      user: { select: { name: true } },
      product: {
        select: {
          name: true,
          slug: true,
          images: { orderBy: { order: "asc" }, take: 1, select: { url: true, alt: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ seller, reviews });
}
