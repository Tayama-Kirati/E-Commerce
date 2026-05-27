"use client";
import { useState, useEffect } from "react";
import { cn, useUIStore, apiGet } from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

const GOLD = "#C68313";

type Seller = {
  id: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  isVerified: boolean;
  city?: string;
  district?: string;
  province?: string;
  createdAt: string;
  _count?: { products: number; orders: number };
  user?: { name: string };
};

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-800 w-full" />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-64" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-96" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

const SORTS = [
  { value: "newest",     label: "Newest" },
  { value: "sales_desc", label: "Best Selling" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating_desc",label: "Top Rated" },
];

export function SellerStorePage() {
  const { pageData, nav } = useUIStore();
  const storeSlug: string = pageData ?? "";

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!storeSlug) return;
    setLoading(true);

    Promise.all([
      apiGet(`/api/seller/store/${storeSlug}`, null),
      apiGet(`/api/products?seller=${storeSlug}&sort=${sort}&page=${page}&limit=20`, null),
    ]).then(([sellerData, prodData]) => {
      if (sellerData?.seller) setSeller(sellerData.seller);
      if (prodData?.products) {
        setProducts(prodData.products);
        setTotal(prodData.total ?? 0);
        setTotalPages(prodData.totalPages ?? 1);
      }
    }).finally(() => setLoading(false));
  }, [storeSlug, sort, page]);

  if (loading) return <Skeleton />;

  if (!seller) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <p className="text-5xl mb-4">🏪</p>
      <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Store not found</h2>
      <button onClick={() => nav("products")} className="mt-4 px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: GOLD }}>
        Back to Shop
      </button>
    </div>
  );

  const location = [seller.city, seller.district].filter(Boolean).join(", ");
  const joined = seller.createdAt
    ? new Date(seller.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div
        className="relative h-48 md:h-64 w-full bg-gradient-to-r from-amber-500 to-orange-600"
        style={seller.storeBanner ? { backgroundImage: `url(${seller.storeBanner})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        <div className="absolute inset-0 bg-black/30" />
        {/* Breadcrumb */}
        <nav className="absolute top-4 left-4 flex items-center gap-2 text-sm text-white/80">
          <button onClick={() => nav("home")} className="hover:text-white transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => nav("products")} className="hover:text-white transition-colors">Shop</button>
          <span>/</span>
          <span className="text-white font-semibold">{seller.storeName}</span>
        </nav>
      </div>

      {/* Store header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start gap-5 flex-wrap">
            {/* Logo */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden shrink-0 -mt-10">
              {seller.storeLogo ? (
                <img src={seller.storeLogo} alt={seller.storeName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">🏪</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">{seller.storeName}</h1>
                {seller.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>

              {seller.storeDescription && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
                  {seller.storeDescription}
                </p>
              )}

              <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-gray-400">
                {location && <span>📍 {location}</span>}
                {joined && <span>🗓 Joined {joined}</span>}
                <span>📦 {total.toLocaleString()} product{total !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-bold text-gray-900 dark:text-white">{products.length}</span> of <span className="font-bold text-gray-900 dark:text-white">{total}</span> products
          </p>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 outline-none focus:border-amber-400 transition-colors"
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">No products yet</p>
            <p className="text-sm text-gray-400 mt-1">This seller hasn't listed any products.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:border-amber-400 transition-colors"
                >
                  ← Prev
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={cn(
                        "w-9 h-9 rounded-xl text-sm font-bold transition-colors",
                        page === pg
                          ? "text-white"
                          : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-400",
                      )}
                      style={page === pg ? { backgroundColor: GOLD } : {}}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:border-amber-400 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
