"use client";
import { useState, useEffect } from "react";
import {
  cn,
  formatPrice,
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  useUIStore,
  useDebounce,
  apiGet,
} from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

export function ProductsPage() {
  const { searchQuery } = useUIStore();
  const [products, setProducts] = useState<any[]>(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("newest");
  const [catFilt, setCatFilt] = useState("all");
  const [maxPrice, setMaxPrice] = useState(300000);
  const [minRating, setMinRating] = useState(0);
  const dSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "50", sort });
    if (dSearch) p.set("search", dSearch);
    if (catFilt !== "all") p.set("category", catFilt);
    apiGet(`/api/products?${p}`, null)
      .then((d) => {
        if (d?.products?.length) setProducts(d.products);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sort, catFilt, dSearch]);

  const filtered = products.filter((p) => {
    if (Number(p.basePrice ?? p.price ?? 0) > maxPrice) return false;
    if ((p.rating ?? p.averageRating ?? 0) < minRating) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-60 shrink-0 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <h3 className="font-black text-gray-900 dark:text-white mb-4">
              Filters
            </h3>
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Category
              </p>
              {[
                { id: "all", name: "All Categories", icon: "🏪" },
                ...MOCK_CATEGORIES,
              ].map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 py-1.5 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="cat"
                    value={c.id}
                    checked={catFilt === c.id}
                    onChange={() => setCatFilt(c.id)}
                    className="accent-violet-600"
                  />
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      catFilt === c.id
                        ? "text-violet-600 font-semibold"
                        : "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    {c.icon} {c.name}
                  </span>
                </label>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Max Price:{" "}
                <span className="text-violet-600">{formatPrice(maxPrice)}</span>
              </p>
              <input
                type="range"
                min={0}
                max={300000}
                step={5000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(+e.target.value)}
                className="w-full accent-violet-600"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Min Rating
              </p>
              {[0, 3, 4, 4.5].map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 py-1 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === r}
                    onChange={() => setMinRating(r)}
                    className="accent-violet-600"
                  />
                  <span className="text-sm text-amber-500">
                    {r === 0
                      ? "Any Rating"
                      : "★".repeat(Math.round(r)) +
                        "☆".repeat(5 - Math.round(r)) +
                        `+ (${r}★)`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filtered.length} products
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating_desc">Top Rated</option>
              <option value="sales_desc">Best Selling</option>
            </select>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-3/4 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
