"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  averageRating: number;
  images: { url: string }[];
  category?: { name: string };
};

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}&type=products`)
      .then((r) => r.json())
      .then((d) => { setResults(d.products ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q]);

  if (!q) return (
    <div className="text-center py-24">
      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-400">Enter a search term to find products.</p>
    </div>
  );

  return (
    <>
      <p className="text-sm text-gray-500 mb-6">
        {loading ? "Searching…" : `${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"`}
      </p>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-3/4 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">No products found for "{q}".</p>
          <Link href="/shop" className="text-blue-600 hover:underline">Browse all products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((p) => (
            <Link key={p.id} href={`/shop/products/${p.slug}`}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden">
                {p.images[0] ? (
                  <Image src={p.images[0].url} alt={p.name} width={300} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>}
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-400 mb-0.5">{p.category?.name}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">{p.name}</p>
                <span className="font-black text-blue-600">रू {Number(p.basePrice).toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Search Results</h1>
      <Suspense fallback={<div className="text-gray-400">Loading…</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
