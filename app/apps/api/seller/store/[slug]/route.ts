import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const seller = await prisma.seller.findUnique({
    where: { storeSlug: params.slug },
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      storeDescription: true,
      storeLogo: true,
      storeBanner: true,
      isVerified: true,
      city: true,
      district: true,
      province: true,
      createdAt: true,
      user: { select: { name: true } },
      _count: { select: { products: true } },
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json({ seller });
}
