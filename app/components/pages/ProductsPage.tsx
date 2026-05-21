"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { formatPrice, MOCK_PRODUCTS, useUIStore, useDebounce, apiGet, useCartStore, useWishlistStore } from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const MUTED    = "var(--color-muted)";
const IVORY    = "var(--color-surface-warm)";

function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
      <rect x="2" y="2" width="7" height="7" rx="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5"/>
    </svg>
  );
}

function IconList() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
      <rect x="2" y="3" width="16" height="3.5" rx="1.5"/>
      <rect x="2" y="8.25" width="16" height="3.5" rx="1.5"/>
      <rect x="2" y="13.5" width="16" height="3.5" rx="1.5"/>
    </svg>
  );
}

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : "currentColor"} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
    </svg>
  );
}

function ProductListCard({ product: p }: { product: any }) {
  const { addItem }   = useCartStore();
  const { nav }       = useUIStore();
  const { toggle: toggleWish, isIn: inWish } = useWishlistStore();
  const { cartItems } = useCartStore();
  const inCart = cartItems.some(i => i.id === p.id);
  const price  = Number(p.basePrice ?? p.price ?? 0);
  const orig   = Number(p.comparePrice ?? p.originalPrice ?? 0);
  const disc   = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
  const fav    = inWish(p.id);
  const rating = (p.rating ?? p.averageRating ?? 0);

  return (
    <div
      className="flex bg-white dark:bg-gray-900 rounded-2xl overflow-hidden group transition-all duration-300"
      style={{ border: `1px solid ${BORDER}` }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = GOLD;
        el.style.boxShadow   = "0 8px 28px rgba(198,131,19,0.12)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = BORDER;
        el.style.boxShadow   = "none";
      }}
    >
      {/* Image */}
      <div
        className="relative w-36 h-36 shrink-0 cursor-pointer overflow-hidden"
        style={{ backgroundColor: IVORY }}
        onClick={() => nav("product", p.slug)}
      >
        {p.images?.[0]?.url ? (
          <Image
            src={p.images[0].url}
            alt={p.images[0].alt ?? p.name}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl transition-transform duration-500 group-hover:scale-105">
            🛍️
          </div>
        )}
        {disc > 0 && (
          <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: "#1C1A16" }}>
            {disc}% off
          </span>
        )}
        {p.stock === 0 && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <span className="text-white font-bold text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-4 p-4 min-w-0">
        {/* Left: category + name + description */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] mb-0.5" style={{ color: MUTED }}>
            {p.category?.name ?? p.seller?.storeName}
          </p>
          <button
            onClick={() => nav("product", p.slug)}
            className="block text-sm font-bold text-left line-clamp-1 mb-1.5 w-full transition-colors duration-200"
            style={{ color: CHARCOAL }}
            onMouseEnter={e => e.currentTarget.style.color = GOLD}
            onMouseLeave={e => e.currentTarget.style.color = CHARCOAL}
          >
            {p.name}
          </button>
          {p.description && (
            <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: MUTED }}>
              {p.description}
            </p>
          )}
          {p.freeShipping && (
            <p className="text-[10px] font-semibold mt-1.5" style={{ color: "#16A34A" }}>🚚 Free shipping</p>
          )}
        </div>

        {/* Right: rating + price + buttons */}
        <div className="flex flex-col items-end justify-between shrink-0">
          {/* Rating */}
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <span key={s} className="text-xs" style={{ color: rating >= s ? GOLD : "#D1C5A8" }}>★</span>
            ))}
            <span className="text-[10px] ml-1 font-semibold" style={{ color: MUTED }}>{rating.toFixed(1)}</span>
          </div>

          {/* Price */}
          <div className="text-right">
            <div className="font-black text-base" style={{ color: GOLD }}>{formatPrice(price)}</div>
            {orig > price && (
              <div className="text-[11px] line-through" style={{ color: MUTED }}>{formatPrice(orig)}</div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleWish(p.id)}
              title="Save to Wishlist"
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 active:scale-90"
              style={{
                backgroundColor: fav ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.95)",
                border: `1px solid ${fav ? "#EF4444" : BORDER}`,
                color: fav ? "#EF4444" : CHARCOAL,
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "#EF4444"; e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={e => {
                if (!fav) {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.95)";
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.color = CHARCOAL;
                }
              }}
            >
              <IconHeart filled={fav} />
            </button>

            {p.stock > 0 && (
              <button
                onClick={() => addItem(p)}
                className="px-4 py-2 rounded-full text-xs font-black text-white transition-all duration-200 active:scale-95"
                style={{ backgroundColor: inCart ? "#9B6210" : GOLD }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = inCart ? "#9B6210" : "#A36810"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = inCart ? "#9B6210" : GOLD; }}
              >
                {inCart ? "✓ Added" : "Add to bag"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsPage() {
 const { searchQuery, pageData } = useUIStore();
 const [products, setProducts] = useState<any[]>(MOCK_PRODUCTS);
 const [categories, setCategories] = useState<any[]>([]);
 const [loading, setLoading] = useState(false);
 const [sort, setSort] = useState("newest");
 const [catSlug, setCatSlug] = useState<string>("");
 const [flashSale, setFlashSale] = useState(false);
 const [maxPrice, setMaxPrice] = useState(300000);
 const [minRating, setMinRating] = useState(0);
 const [inStock, setInStock] = useState(false);
 const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
 const dSearch = useDebounce(searchQuery, 400);

 // Apply category / flashSale passed from navbar nav()
 useEffect(() => {
   if (pageData?.category) setCatSlug(pageData.category);
   if (pageData?.flashSale) setFlashSale(true);
 }, [pageData]);

 // Load real categories from API
 useEffect(() => {
   apiGet("/api/categories", null).then((d) => {
     if (d?.categories) setCategories(d.categories);
   });
 }, []);

 // Fetch products — pass category + flashSale to API so filter is server-side
 useEffect(() => {
   setLoading(true);
   const p = new URLSearchParams({ limit: "50", sort });
   if (dSearch) p.set("search", dSearch);
   if (catSlug) p.set("category", catSlug);
   if (flashSale) p.set("flashSale", "true");
   apiGet(`/api/products?${p}`, null)
     .then((d) => { setProducts(d?.products ?? MOCK_PRODUCTS); setLoading(false); })
     .catch(() => setLoading(false));
 }, [sort, dSearch, catSlug, flashSale]);

 // Client-side filters: price, rating, stock only
 const filtered = products.filter((p) => {
   const price = Number(p.basePrice ?? p.price ?? 0);
   if (price > maxPrice) return false;
   if ((p.rating ?? p.averageRating ?? 0) < minRating) return false;
   if (inStock && (p.stock ?? 1) <= 0) return false;
   return true;
 });

 const activeFilters = [
   ...(catSlug ? [{
     key: `cat-${catSlug}`,
     label: categories.find((c) => c.slug === catSlug)?.name ?? catSlug,
     clear: () => setCatSlug(""),
   }] : []),
   ...(flashSale ? [{ key: "flash", label: "Flash Sale", clear: () => setFlashSale(false) }] : []),
   ...(minRating > 0 ? [{ key: "rating", label: `${minRating}+ Stars`, clear: () => setMinRating(0) }] : []),
   ...(inStock ? [{ key: "stock", label: "In Stock", clear: () => setInStock(false) }] : []),
 ];

 const clearAll = () => { setCatSlug(""); setFlashSale(false); setMinRating(0); setInStock(false); setMaxPrice(300000); };

 return (
 <div className="max-w-7xl mx-auto px-4 py-8">
 <div className="flex flex-col lg:flex-row gap-8">

 {/* Sidebar */}
 <aside className="lg:w-52 shrink-0">
 <h3 className="font-black text-gray-900 dark:text-white text-base mb-6">Filter Options</h3>

 {/* Price */}
 <div className="mb-5">
 <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Price</p>
 <p className="text-xs text-gray-400 mb-3">{formatPrice(0)} – {formatPrice(maxPrice)}</p>
 <input
 type="range"
 min={0}
 max={300000}
 step={5000}
 value={maxPrice}
 onChange={(e) => setMaxPrice(+e.target.value)}
 className="w-full accent-[#C68313]"
 />
 </div>

 <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

 {/* Review */}
 <div className="mb-5">
 <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Review</p>
 <div className="space-y-2.5">
 {[5, 4, 3, 2, 1].map((r) => (
 <label key={r} className="flex items-center gap-2 cursor-pointer group">
 <input
 type="radio"
 name="rating"
 checked={minRating === r}
 onChange={() => setMinRating(minRating === r ? 0 : r)}
 className="w-4 h-4 cursor-pointer accent-[#C68313]"
 />
 <span className="text-amber-400 text-sm leading-none">{"★".repeat(r)}{"☆".repeat(5 - r)}</span>
 <span className="text-xs text-gray-500">{r} Star</span>
 </label>
 ))}
 </div>
 </div>

 <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

 {/* By Promotions */}
 <div className="mb-5">
 <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">By Promotions</p>
 <div className="space-y-2.5">
 {["New Arrivals", "Best Sellers", "On Sale"].map((promo) => (
 <label key={promo} className="flex items-center gap-2.5 cursor-pointer">
 <input type="checkbox" className="w-4 h-4 rounded cursor-pointer accent-[#C68313]" />
 <span className="text-sm text-gray-600 dark:text-gray-400">{promo}</span>
 </label>
 ))}
 </div>
 </div>

 <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

 {/* Availability */}
 <div>
 <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Availability</p>
 <div className="space-y-2.5">
 <label className="flex items-center gap-2.5 cursor-pointer">
 <input
 type="checkbox"
 checked={inStock}
 onChange={() => setInStock((v) => !v)}
 className="w-4 h-4 rounded cursor-pointer accent-[#C68313]"
 />
 <span className="text-sm text-gray-600 dark:text-gray-400">In Stock</span>
 </label>
 <label className="flex items-center gap-2.5 cursor-pointer">
 <input type="checkbox" className="w-4 h-4 rounded cursor-pointer accent-[#C68313]" />
 <span className="text-sm text-gray-600 dark:text-gray-400">Out of Stocks</span>
 </label>
 </div>
 </div>
 </aside>

 {/* Main content */}
 <div className="flex-1 min-w-0">
 {/* Top bar */}
 <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
 <p className="text-sm text-gray-500 dark:text-gray-400">
 Showing 1–{Math.min(filtered.length, 12)} of{" "}
 <span className="font-semibold text-gray-700 dark:text-gray-300">{filtered.length}</span> results
 </p>
 <div className="flex items-center gap-3">
 {/* View toggle */}
 <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
 <button
 onClick={() => setViewMode("grid")}
 title="Grid view"
 className="w-9 h-9 flex items-center justify-center transition-all duration-200"
 style={{
 backgroundColor: viewMode === "grid" ? "#1C1A16" : "transparent",
 color: viewMode === "grid" ? "#fff" : MUTED,
 }}
 >
 <IconGrid />
 </button>
 <button
 onClick={() => setViewMode("list")}
 title="List view"
 className="w-9 h-9 flex items-center justify-center transition-all duration-200"
 style={{
 backgroundColor: viewMode === "list" ? "#1C1A16" : "transparent",
 color: viewMode === "list" ? "#fff" : MUTED,
 }}
 >
 <IconList />
 </button>
 </div>

 {/* Sort */}
 <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
 <span>Sort by :</span>
 <select
 value={sort}
 onChange={(e) => setSort(e.target.value)}
 className="bg-transparent font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
 >
 <option value="newest">Default Sorting</option>
 <option value="price_asc">Price: Low → High</option>
 <option value="price_desc">Price: High → Low</option>
 <option value="rating_desc">Top Rated</option>
 <option value="sales_desc">Best Selling</option>
 </select>
 </div>
 </div>
 </div>

 {/* Active filter tags */}
 {activeFilters.length > 0 && (
 <div className="flex items-center gap-2 flex-wrap mb-5">
 <span className="text-sm text-gray-500 dark:text-gray-400">Active Filter</span>
 {activeFilters.map((f) => (
 <button
 key={f.key}
 onClick={f.clear}
 className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-opacity hover:opacity-80"
 style={{ backgroundColor: GOLD }}
 >
 {f.label} ×
 </button>
 ))}
 <button onClick={clearAll} className="text-xs font-semibold underline transition-opacity hover:opacity-70" style={{ color: GOLD }}>
 Clear All
 </button>
 </div>
 )}

 {/* Products */}
 {loading ? (
 viewMode === "list" ? (
 <div className="flex flex-col gap-3">
 {[...Array(4)].map((_, i) => (
 <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 {[...Array(6)].map((_, i) => (
 <div key={i} className="aspect-3/4 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
 ))}
 </div>
 )
 ) : filtered.length === 0 ? (
 <div className="text-center py-24">
 <div className="text-6xl mb-4">🔍</div>
 <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No products found</h3>
 <p className="text-gray-400">Try adjusting your filters</p>
 </div>
 ) : viewMode === "list" ? (
 <div className="flex flex-col gap-3">
 {filtered.map((p) => <ProductListCard key={p.id} product={p} />)}
 </div>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
