"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { formatPrice, useUIStore, useDebounce, apiGet, useCartStore, MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/app/lib/store";

// Returns all slugs that belong to catSlug and every descendant category
function getDescendantSlugs(cats: any[], targetSlug: string): string[] {
  function find(list: any[]): any | null {
    for (const c of list) {
      if (c.slug === targetSlug) return c;
      const found = find(c.children ?? []);
      if (found) return found;
    }
    return null;
  }
  function collect(c: any, acc: string[]) {
    acc.push(c.slug);
    (c.children ?? []).forEach((ch: any) => collect(ch, acc));
  }
  const node = find(cats);
  if (!node) return [targetSlug];
  const slugs: string[] = [];
  collect(node, slugs);
  return slugs;
}
import { ProductCard } from "./ProductCard";

import { LayoutGrid, List } from "lucide-react";
import { EmojiIcon, EmojiText } from "@/app/components/ui/EmojiIcon";
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


function IconGrid() {
  return <LayoutGrid className="w-4 h-4" strokeWidth={1.75} />;
}

function IconList() {
  return <List className="w-4 h-4" strokeWidth={1.75} />;
}


function ProductListCard({ product: p }: { product: any }) {
  const { addItem }   = useCartStore();
  const { nav }       = useUIStore();
  const { cartItems } = useCartStore();
  const inCart = cartItems.some(i => i.id === p.id);
  const price  = Number(p.basePrice ?? p.price ?? 0);
  const orig   = Number(p.comparePrice ?? p.originalPrice ?? 0);
  const disc   = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
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
          <div className="w-full h-full flex items-center justify-center text-5xl transition-transform duration-500 group-hover:scale-105"><EmojiIcon emoji="🛍️" /></div>
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
          {p.freeShipping && <p className="text-[10px] font-semibold mt-1.5" style={{ color: "#16A34A" }}><EmojiIcon emoji="🚚" /> Free shipping</p>}
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
              <span key={s} className="text-xs" style={{ color: rating >= s ? GOLD : "#D1C5A8" }}><EmojiIcon emoji="★" /></span>
            ))}
            <span className="text-[10px] ml-1 font-semibold" style={{ color: MUTED }}>{rating.toFixed(1)}</span>
          </div>
          <div className="text-right">
            <div className="font-black text-base" style={{ color: GOLD }}>{formatPrice(price)}</div>
            {orig > price && <div className="text-[11px] line-through" style={{ color: MUTED }}>{formatPrice(orig)}</div>}
          </div>
          <div className="flex items-center gap-2">
            {p.stock > 0 && (
              <button onClick={() => addItem(p)}
                className="px-4 py-2 rounded-full text-xs font-black text-white transition-all duration-200 active:scale-95"
                style={{ backgroundColor: inCart ? "#9B6210" : GOLD }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = inCart ? "#9B6210" : "#A36810"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = inCart ? "#9B6210" : GOLD; }}>
                <EmojiText>{inCart ? "✓ Added" : "Add to bag"}</EmojiText>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export function ProductsPage() {
  const { searchQuery, setSearchQuery, pageData } = useUIStore();
  const [products, setProducts]   = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sort, setSort]           = useState("newest");
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [catSlug, setCatSlug]     = useState<string>("");
  const [flashSale, setFlashSale] = useState(false);
  const [viewMode, setViewMode]   = useState<"grid" | "list">("grid");

  const dSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    setCatSlug(pageData?.category ?? "");
    setFlashSale(!!pageData?.flashSale);
    if (pageData?.sort) setSort(pageData.sort);
    setPage(1);
  }, [pageData]);

  useEffect(() => {
    apiGet("/api/categories", null).then((d) => {
      if (d?.categories) setCategories(d.categories);
    });
  }, []);

  useEffect(() => { setPage(1); }, [sort, dSearch, catSlug, flashSale]);

  // Keyword search fetch
  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "24", sort, page: String(page) });
    if (dSearch)   p.set("search", dSearch);
    if (catSlug)   p.set("category", catSlug);
    if (flashSale) p.set("flashSale", "true");
    apiGet(`/api/products?${p}`, null)
      .then((d) => {
        const api: any[] = d?.products ?? [];

        // Only accept API results that actually belong to the selected category
        // (or any of its descendants) — DB slugs may not match mock slugs.
        const relevantSlugs = catSlug ? getDescendantSlugs(MOCK_CATEGORIES, catSlug) : [];
        const relevant = catSlug
          ? api.filter((item: any) => relevantSlugs.includes(item.category?.slug))
          : api;

        if (relevant.length > 0) {
          setProducts(relevant);
          setTotalPages(catSlug ? 1 : d?.totalPages ?? 1);
        } else if (!catSlug && api.length > 0) {
          // No category filter — show everything the API returned
          setProducts(api);
          setTotalPages(d?.totalPages ?? 1);
        } else {
          // Nothing matched → fall back to mock data, matching the clicked
          // category AND all its subcategories/sub-subcategories
          const mock = catSlug
            ? (() => {
                const slugs = getDescendantSlugs(MOCK_CATEGORIES, catSlug);
                const hits = MOCK_PRODUCTS.filter((mp: any) => slugs.includes(mp.category?.slug));
                return hits.length > 0 ? hits : MOCK_PRODUCTS;
              })()
            : MOCK_PRODUCTS;
          setProducts(mock);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(() => {
        const mock = catSlug
          ? (() => {
              const slugs = getDescendantSlugs(MOCK_CATEGORIES, catSlug);
              const hits = MOCK_PRODUCTS.filter((mp: any) => slugs.includes(mp.category?.slug));
              return hits.length > 0 ? hits : MOCK_PRODUCTS;
            })()
          : MOCK_PRODUCTS;
        setProducts(mock);
        setLoading(false);
      });
  }, [sort, dSearch, catSlug, flashSale, page]);

  const filtered = products.filter((p) => {
    if (flashSale && !p.isFlashSale) return false;
    return true;
  });

  const activeFilters = [
    ...(catSlug   ? [{ key: `cat-${catSlug}`, label: categories.find((c: any) => c.slug === catSlug)?.name ?? catSlug, clear: () => setCatSlug("") }] : []),
    ...(flashSale ? [{ key: "flash", label: "Flash Sale", clear: () => setFlashSale(false) }] : []),
  ];

  const clearAll = () => { setCatSlug(""); setFlashSale(false); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex-1 min-w-0">

          {/* Search bar */}
          <div className="mb-5 flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: MUTED }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "var(--color-bg)" }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                >×</button>
              )}
            </div>
          </div>

          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm" style={{ color: MUTED }}>
              Showing <span className="font-semibold" style={{ color: CHARCOAL }}>{filtered.length}</span> results
            </p>
            <div className="relative flex items-center gap-3">

              {/* View toggle + Filter button */}
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
              <div className="text-6xl mb-4"><EmojiIcon emoji="🔍" /></div>
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
  );
}
