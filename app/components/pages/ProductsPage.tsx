"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { formatPrice, useUIStore, useDebounce, apiGet, useCartStore, useWishlistStore } from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const MUTED    = "var(--color-muted)";
const IVORY    = "var(--color-surface-warm)";

// Colors assigned per product id for filtering
const PRODUCT_COLORS: Record<string, string[]> = {
  "1":  ["Black", "White", "Gold"],
  "2":  ["Black", "Silver"],
  "3":  ["Silver", "Space Gray"],
  "4":  ["White", "Black", "Red"],
  "5":  ["Black"],
  "6":  ["Green"],
  "7":  ["Black", "Orange", "White"],
  "8":  ["Blue", "Black", "Grey"],
  "9":  ["Black"],
  "10": ["Purple", "Silver"],
  "11": ["White", "Black"],
  "12": ["White"],
};

const COLOR_DOT: Record<string, string> = {
  Black: "#1C1C1C", White: "#F5F5F5", Gold: "#C68313", Silver: "#A8A9AD",
  Red: "#EF4444", Blue: "#3B82F6", Green: "#22C55E", Orange: "#F97316",
  Grey: "#9CA3AF", Purple: "#8B5CF6", "Space Gray": "#4B5563",
};

const ALL_COLORS = ["Black","White","Silver","Gold","Red","Blue","Green","Orange","Grey","Purple","Space Gray"];

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
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = GOLD; el.style.boxShadow = "0 8px 28px rgba(198,131,19,0.12)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = BORDER; el.style.boxShadow = "none"; }}
    >
      <div className="relative w-36 h-36 shrink-0 cursor-pointer overflow-hidden" style={{ backgroundColor: IVORY }} onClick={() => nav("product", p.slug)}>
        {p.images?.[0]?.url ? (
          <Image src={p.images[0].url} alt={p.images[0].alt ?? p.name} fill sizes="144px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl transition-transform duration-500 group-hover:scale-105">🛍️</div>
        )}
        {disc > 0 && (
          <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#1C1A16" }}>{disc}% off</span>
        )}
        {p.stock === 0 && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <span className="text-white font-bold text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>Out of Stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-4 p-4 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] mb-0.5" style={{ color: MUTED }}>{p.category?.name ?? p.seller?.storeName}</p>
          <button onClick={() => nav("product", p.slug)}
            className="block text-sm font-bold text-left line-clamp-1 mb-1.5 w-full transition-colors duration-200"
            style={{ color: CHARCOAL }}
            onMouseEnter={e => e.currentTarget.style.color = GOLD}
            onMouseLeave={e => e.currentTarget.style.color = CHARCOAL}>
            {p.name}
          </button>
          {p.description && <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: MUTED }}>{p.description}</p>}
          {p.freeShipping && <p className="text-[10px] font-semibold mt-1.5" style={{ color: "#16A34A" }}>🚚 Free shipping</p>}
          {(PRODUCT_COLORS[p.id] ?? []).length > 0 && (
            <div className="flex gap-1 mt-2">
              {(PRODUCT_COLORS[p.id] ?? []).map(c => (
                <span key={c} title={c} className="w-3.5 h-3.5 rounded-full border border-white shadow-sm shrink-0"
                  style={{ backgroundColor: COLOR_DOT[c] ?? "#ccc" }} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end justify-between shrink-0">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <span key={s} className="text-xs" style={{ color: rating >= s ? GOLD : "#D1C5A8" }}>★</span>
            ))}
            <span className="text-[10px] ml-1 font-semibold" style={{ color: MUTED }}>{rating.toFixed(1)}</span>
          </div>
          <div className="text-right">
            <div className="font-black text-base" style={{ color: GOLD }}>{formatPrice(price)}</div>
            {orig > price && <div className="text-[11px] line-through" style={{ color: MUTED }}>{formatPrice(orig)}</div>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleWish(p.id)} title="Save to Wishlist"
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 active:scale-90"
              style={{ backgroundColor: fav ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.95)", border: `1px solid ${fav ? "#EF4444" : BORDER}`, color: fav ? "#EF4444" : CHARCOAL }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "#EF4444"; e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={e => { if (!fav) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.95)"; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL; } }}>
              <IconHeart filled={fav} />
            </button>
            {p.stock > 0 && (
              <button onClick={() => addItem(p)}
                className="px-4 py-2 rounded-full text-xs font-black text-white transition-all duration-200 active:scale-95"
                style={{ backgroundColor: inCart ? "#9B6210" : GOLD }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = inCart ? "#9B6210" : "#A36810"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = inCart ? "#9B6210" : GOLD; }}>
                {inCart ? "✓ Added" : "Add to bag"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-bold mb-3" style={{ color: CHARCOAL }}>{title}</p>
      {children}
      <div className="border-t border-gray-200 dark:border-gray-700 mt-5" />
    </div>
  );
}

export function ProductsPage() {
  const { searchQuery, pageData } = useUIStore();
  const [products, setProducts]   = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sort, setSort]           = useState("newest");
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [catSlug, setCatSlug]     = useState<string>("");
  const [flashSale, setFlashSale] = useState(false);
  const [maxPrice, setMaxPrice]   = useState(300000);
  const [minPrice, setMinPrice]   = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock]     = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode]   = useState<"grid" | "list">("grid");

  // AI search state
  const [aiQuery, setAiQuery]         = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiActive, setAiActive]       = useState(false);
  const [aiUnderstood, setAiUnderstood] = useState<string>("");

  const dSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    setCatSlug(pageData?.category ?? "");
    setFlashSale(!!pageData?.flashSale);
    if (pageData?.sort) setSort(pageData.sort);
    setPage(1);
    // Clear AI search when navigating via category
    setAiActive(false);
    setAiUnderstood("");
  }, [pageData]);

  useEffect(() => {
    apiGet("/api/categories", null).then((d) => {
      if (d?.categories) setCategories(d.categories);
    });
  }, []);

  useEffect(() => { setPage(1); }, [sort, dSearch, catSlug, flashSale]);

  // Regular keyword search fetch
  useEffect(() => {
    if (aiActive) return; // AI search overrides regular fetch
    setLoading(true);
    const p = new URLSearchParams({ limit: "24", sort, page: String(page) });
    if (dSearch)   p.set("search", dSearch);
    if (catSlug)   p.set("category", catSlug);
    if (flashSale) p.set("flashSale", "true");
    apiGet(`/api/products?${p}`, null)
      .then((d) => {
        setProducts(d?.products ?? []);
        setTotalPages(d?.totalPages ?? 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sort, dSearch, catSlug, flashSale, page, aiActive]);

  // AI search handler
  const runAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiActive(false);
    try {
      const res  = await fetch("/api/ai/search", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query: aiQuery }),
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products ?? []);
        setTotalPages(1);
        setAiActive(true);
        // Build a human-readable summary of what Claude understood
        const p = data.params ?? {};
        const parts = [];
        if (p.keywords)    parts.push(`"${p.keywords}"`);
        if (p.category)    parts.push(p.category);
        if (p.maxPrice)    parts.push(`under रू ${Number(p.maxPrice).toLocaleString()}`);
        if (p.minPrice)    parts.push(`above रू ${Number(p.minPrice).toLocaleString()}`);
        if (p.minRating)   parts.push(`${p.minRating}+ stars`);
        if (p.freeShipping) parts.push("free shipping");
        if (p.isFlashSale)  parts.push("flash sale");
        setAiUnderstood(parts.join(" · ") || aiQuery);
      }
    } catch { /* fallback: do nothing, regular search still works */ }
    setAiLoading(false);
  };

  const clearAiSearch = () => {
    setAiActive(false);
    setAiQuery("");
    setAiUnderstood("");
  };

  // Unique brands from loaded products
  const brands = Array.from(new Set(products.map(p => p.seller?.storeName ?? "PeaNut Store").filter(Boolean)));

  const toggleBrand = (b: string) => setSelectedBrands(prev => {
    const s = new Set(prev); s.has(b) ? s.delete(b) : s.add(b); return s;
  });
  const toggleColor = (c: string) => setSelectedColors(prev => {
    const s = new Set(prev); s.has(c) ? s.delete(c) : s.add(c); return s;
  });

  const filtered = products.filter((p) => {
    // Category — use slug if available (real API data), otherwise fuzzy-match name
    if (catSlug) {
      const pSlug = p.category?.slug as string | undefined;
      if (pSlug) {
        if (pSlug !== catSlug && !pSlug.startsWith(catSlug)) return false;
      } else {
        const pName = (p.category?.name ?? "").toLowerCase();
        const base  = catSlug.split("-")[0]; // "home" from "home-living"
        if (!pName.includes(base) && !base.includes(pName)) return false;
      }
    }
    const price = Number(p.basePrice ?? p.price ?? 0);
    if (price < minPrice || price > maxPrice) return false;
    if ((p.rating ?? p.averageRating ?? 0) < minRating) return false;
    if (flashSale && !p.isFlashSale) return false;
    if (inStock && (p.stock ?? 1) <= 0) return false;
    if (selectedBrands.size > 0 && !selectedBrands.has(p.seller?.storeName ?? "PeaNut Store")) return false;
    if (selectedColors.size > 0) {
      const pColors = PRODUCT_COLORS[p.id];
      if (pColors && !pColors.some(c => selectedColors.has(c))) return false;
    }
    return true;
  });

  const activeFilters = [
    ...(catSlug       ? [{ key: `cat-${catSlug}`, label: categories.find(c => c.slug === catSlug)?.name ?? catSlug, clear: () => setCatSlug("") }] : []),
    ...(flashSale     ? [{ key: "flash",  label: "Flash Sale",         clear: () => setFlashSale(false) }] : []),
    ...(minRating > 0 ? [{ key: "rating", label: `${minRating}+ Stars`, clear: () => setMinRating(0)   }] : []),
    ...(inStock       ? [{ key: "stock",  label: "In Stock",            clear: () => setInStock(false)  }] : []),
    ...[...selectedBrands].map(b => ({ key: `brand-${b}`, label: b, clear: () => toggleBrand(b) })),
    ...[...selectedColors].map(c => ({ key: `color-${c}`, label: c, clear: () => toggleColor(c) })),
  ];

  const clearAll = () => {
    setCatSlug(""); setFlashSale(false); setMinRating(0); setInStock(false);
    setMaxPrice(300000); setMinPrice(0); setSelectedBrands(new Set()); setSelectedColors(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Filter Sidebar ─────────────────────────────────────────── */}
        <aside className="lg:w-52 shrink-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-base" style={{ color: CHARCOAL }}>Filters</h3>
            {activeFilters.length > 0 && (
              <button onClick={clearAll} className="text-xs font-bold hover:underline" style={{ color: GOLD }}>Clear All</button>
            )}
          </div>

          {/* Price */}
          <FilterSection title="Price (रू)">
            <div className="flex gap-2 mb-3">
              <input type="number" value={minPrice} min={0} max={maxPrice}
                onChange={e => setMinPrice(+e.target.value)}
                placeholder="Min" className="w-full px-2 py-1.5 text-xs rounded-lg outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = BORDER} />
              <input type="number" value={maxPrice} min={minPrice} max={300000}
                onChange={e => setMaxPrice(+e.target.value)}
                placeholder="Max" className="w-full px-2 py-1.5 text-xs rounded-lg outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
            <input type="range" min={0} max={300000} step={5000} value={maxPrice}
              onChange={e => setMaxPrice(+e.target.value)} className="w-full accent-[#C68313]" />
            <p className="text-[11px] mt-1" style={{ color: MUTED }}>{formatPrice(minPrice)} – {formatPrice(maxPrice)}</p>
          </FilterSection>

          {/* Rating */}
          <FilterSection title="Rating">
            <div className="space-y-2">
              {[5,4,3,2,1].map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rating" checked={minRating === r}
                    onChange={() => setMinRating(minRating === r ? 0 : r)}
                    className="w-4 h-4 cursor-pointer accent-[#C68313]" />
                  <span className="text-amber-400 text-sm leading-none">{"★".repeat(r)}{"☆".repeat(5-r)}</span>
                  <span className="text-xs" style={{ color: MUTED }}>&amp; up</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Brand */}
          <FilterSection title="Brand">
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {brands.map(b => (
                <label key={b} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={selectedBrands.has(b)} onChange={() => toggleBrand(b)}
                    className="w-4 h-4 rounded cursor-pointer accent-[#C68313]" />
                  <span className="text-xs truncate" style={{ color: CHARCOAL }}>{b}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Color */}
          <FilterSection title="Color">
            <div className="flex flex-wrap gap-2">
              {ALL_COLORS.map(c => (
                <button key={c} title={c} onClick={() => toggleColor(c)}
                  className="w-6 h-6 rounded-full transition-all shrink-0"
                  style={{
                    backgroundColor: COLOR_DOT[c] ?? "#ccc",
                    border: selectedColors.has(c) ? `2.5px solid ${GOLD}` : "2px solid #E8D5A8",
                    boxShadow: selectedColors.has(c) ? `0 0 0 1px ${GOLD}` : "none",
                    transform: selectedColors.has(c) ? "scale(1.2)" : "scale(1)",
                  }} />
              ))}
            </div>
            {selectedColors.size > 0 && (
              <p className="text-[11px] mt-2" style={{ color: MUTED }}>{[...selectedColors].join(", ")}</p>
            )}
          </FilterSection>

          {/* Availability */}
          <FilterSection title="Availability">
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={inStock} onChange={() => setInStock(v => !v)}
                  className="w-4 h-4 rounded cursor-pointer accent-[#C68313]" />
                <span className="text-xs" style={{ color: CHARCOAL }}>In Stock Only</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={flashSale} onChange={() => setFlashSale(v => !v)}
                  className="w-4 h-4 rounded cursor-pointer accent-[#C68313]" />
                <span className="text-xs" style={{ color: CHARCOAL }}>Flash Sale</span>
              </label>
            </div>
          </FilterSection>
        </aside>

        {/* ── Main content ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* AI Search bar */}
          <div className="mb-5 rounded-2xl p-4" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: IVORY }}>
            <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: GOLD }}>✦ AI Search</p>
            <div className="flex gap-2">
              <input
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runAiSearch()}
                placeholder='Try: "wireless headphones under 50000" or "gifts for kids"'
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "var(--color-bg)" }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
              <button
                onClick={runAiSearch}
                disabled={aiLoading || !aiQuery.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: GOLD }}
              >
                {aiLoading ? "…" : "Search"}
              </button>
              {aiActive && (
                <button onClick={clearAiSearch}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}>
                  ✕ Clear
                </button>
              )}
            </div>
            {aiActive && aiUnderstood && (
              <p className="text-xs mt-2 font-medium" style={{ color: MUTED }}>
                AI understood: <span style={{ color: GOLD }}>{aiUnderstood}</span>
              </p>
            )}
            {!aiActive && (
              <p className="text-xs mt-2" style={{ color: MUTED }}>
                Describe what you need in plain words — AI will find matching products for you.
              </p>
            )}
          </div>

          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm" style={{ color: MUTED }}>
              Showing <span className="font-semibold" style={{ color: CHARCOAL }}>{filtered.length}</span> results
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                <button onClick={() => setViewMode("grid")} title="Grid view"
                  className="w-9 h-9 flex items-center justify-center transition-all duration-200"
                  style={{ backgroundColor: viewMode === "grid" ? "#1C1A16" : "transparent", color: viewMode === "grid" ? "#fff" : MUTED }}>
                  <IconGrid />
                </button>
                <button onClick={() => setViewMode("list")} title="List view"
                  className="w-9 h-9 flex items-center justify-center transition-all duration-200"
                  style={{ backgroundColor: viewMode === "list" ? "#1C1A16" : "transparent", color: viewMode === "list" ? "#fff" : MUTED }}>
                  <IconList />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                <span>Sort by:</span>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="bg-transparent font-semibold outline-none cursor-pointer" style={{ color: CHARCOAL }}>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="rating_desc">Top Rated</option>
                  <option value="sales_desc">Best Selling</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <span className="text-xs" style={{ color: MUTED }}>Active:</span>
              {activeFilters.map(f => (
                <button key={f.key} onClick={f.clear}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: GOLD }}>
                  {f.label} ×
                </button>
              ))}
            </div>
          )}

          {/* Products */}
          {loading ? (
            viewMode === "list" ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-3/4 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-black mb-2" style={{ color: CHARCOAL }}>No products found</h3>
              <p style={{ color: MUTED }}>Try adjusting your filters</p>
              <button onClick={clearAll} className="mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white" style={{ backgroundColor: GOLD }}>
                Clear Filters
              </button>
            </div>
          ) : viewMode === "list" ? (
            <div className="flex flex-col gap-3">
              {filtered.map(p => <ProductListCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all disabled:opacity-30"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
                onMouseEnter={e => { if (page > 1) e.currentTarget.style.borderColor = GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "…" ? (
                    <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm" style={{ color: MUTED }}>…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all"
                      style={{
                        border: `1.5px solid ${page === n ? GOLD : BORDER}`,
                        backgroundColor: page === n ? GOLD : "transparent",
                        color: page === n ? "#fff" : CHARCOAL,
                      }}
                    >
                      {n}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all disabled:opacity-30"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
                onMouseEnter={e => { if (page < totalPages) e.currentTarget.style.borderColor = GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
