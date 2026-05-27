import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// Calls Claude to turn a natural-language query into structured DB filters
async function extractSearchParams(query: string): Promise<{
  keywords: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  minRating?: number;
  freeShipping?: boolean;
  isFlashSale?: boolean;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `You are a product search assistant for a Nepali e-commerce site called PeaNut.
Extract search intent from the user's query and return ONLY a valid JSON object with these fields:
- keywords: string (main search words, trimmed)
- category: string or null (one of: electronics, fashion, home-living, health-beauty, sports, books, or null)
- maxPrice: number or null (in NPR)
- minPrice: number or null (in NPR)
- minRating: number or null (1-5)
- freeShipping: boolean or null
- isFlashSale: boolean or null

Return only the JSON, no explanation.`,
      messages: [{ role: "user", content: query }],
    }),
  });

  if (!res.ok) throw new Error("Claude API error");

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "{}";

  // Strip any markdown code fences Claude might add
  const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const params = await extractSearchParams(query.trim());

    const where: any = { isActive: true };

    // Keyword search
    if (params.keywords) {
      where.OR = [
        { name:      { contains: params.keywords, mode: "insensitive" } },
        { shortDesc: { contains: params.keywords, mode: "insensitive" } },
        { description: { contains: params.keywords, mode: "insensitive" } },
        { tags: { some: { tag: { contains: params.keywords, mode: "insensitive" } } } },
      ];
    }

    // Category
    if (params.category) {
      const cat = await prisma.category.findFirst({
        where: { slug: { contains: params.category, mode: "insensitive" } },
        include: { children: { select: { id: true } } },
      });
      if (cat) {
        where.categoryId = { in: [cat.id, ...cat.children.map((c) => c.id)] };
      }
    }

    // Price range
    if (params.minPrice != null || params.maxPrice != null) {
      where.basePrice = {};
      if (params.minPrice != null) where.basePrice.gte = params.minPrice;
      if (params.maxPrice != null) where.basePrice.lte = params.maxPrice;
    }

    // Rating
    if (params.minRating != null) {
      where.averageRating = { gte: params.minRating };
    }

    if (params.freeShipping) where.freeShipping = true;
    if (params.isFlashSale)  where.isFlashSale  = true;

    const products = await prisma.product.findMany({
      where,
      take: 24,
      orderBy: { totalSales: "desc" },
      select: {
        id: true, name: true, slug: true,
        basePrice: true, comparePrice: true,
        stock: true, freeShipping: true, isFlashSale: true,
        averageRating: true, totalReviews: true, totalSales: true,
        isEco: true, isFeatured: true,
        shortDesc: true, description: true,
        images:   { orderBy: { order: "asc" }, take: 1, select: { url: true, alt: true } },
        category: { select: { id: true, name: true, slug: true } },
        seller:   { select: { id: true, storeName: true, storeSlug: true, isVerified: true } },
        tags:     { select: { tag: true } },
      },
    });

    return NextResponse.json({
      products,
      total: products.length,
      params, // send back so the UI can show what was understood
    });
  } catch (err: any) {
    console.error("[AI search]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Search failed" }, { status: 500 });
  }
}
