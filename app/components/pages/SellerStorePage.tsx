"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { cn, useUIStore, useAuthStore, apiGet, MOCK_PRODUCTS, formatPrice } from "@/app/lib/store";

import { Grid2x2, Grid3x3 } from "lucide-react";
import { EmojiIcon, EmojiText } from "@/app/components/ui/EmojiIcon";
const GOLD     = "#C68313";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const CHARCOAL = "var(--color-heading)";
const MUTED    = "var(--color-muted)";

const STORE_PROFILES: Record<string, any> = {
  techstore:    { storeName:"TechStore Nepal",   emoji:"💻", followers:12500, rating:96, joined:"2022-03-01", location:"Kathmandu, Bagmati Province", services:["Original Products","Fast Delivery","7-Day Returns","24/7 Support"], description:"Your one-stop shop for genuine Apple, Samsung and all top tech brands in Nepal. Fast delivery, original products guaranteed." },
  electrohub:   { storeName:"ElectroHub",        emoji:"📱", followers:8200,  rating:94, joined:"2022-06-10", location:"Lalitpur, Bagmati Province",  services:["Authorized Dealer","Same-Day Delivery","Warranty Support"],        description:"Premium electronics at the best prices. Authorized dealer for Samsung & Xiaomi products." },
  sonynepal:    { storeName:"Sony Nepal",         emoji:"🎧", followers:5600,  rating:97, joined:"2021-11-20", location:"Kathmandu, Bagmati Province", services:["100% Genuine","Official Warranty","Express Delivery"],              description:"Official Sony products including headphones, cameras, speakers and more. 100% genuine." },
  gadgetworld:  { storeName:"GadgetWorld",        emoji:"🔌", followers:9800,  rating:92, joined:"2022-01-15", location:"Bhaktapur, Bagmati Province", services:["Wide Selection","Free Shipping Above रू 500","Easy Returns"],        description:"All your accessories in one place. Phone cases, chargers, cables and more at unbeatable prices." },
  homeapp:      { storeName:"Home Appliances",    emoji:"🏠", followers:6700,  rating:95, joined:"2021-09-05", location:"Pokhara, Gandaki Province",   services:["Installation Service","1-Year Warranty","EMI Available"],           description:"Trusted home appliances retailer. Washing machines, ACs, refrigerators & TVs from top brands." },
  gaminghub:    { storeName:"GamingHub",          emoji:"🎮", followers:9100,  rating:95, joined:"2021-10-15", location:"Kathmandu, Bagmati Province", services:["Genuine Products","Fast Dispatch","Game Downloads Support"],         description:"Nepal's premier gaming store. PS5, Xbox, gaming accessories and more. All genuine." },
};

const DEFAULT_SERVICES = ["Genuine Products", "Fast Delivery", "7-Day Returns", "Customer Support"];

const FALLBACK_REVIEWS = [
  { id:"rv1", rating:5, title:"Excellent seller!", body:"Very fast shipping and the product was exactly as described. Highly recommend!", user:{name:"Arun Sharma"},    createdAt:"2025-05-01T00:00:00Z" },
  { id:"rv2", rating:4, title:"Great quality",    body:"Packaging was excellent and the item arrived in perfect condition. Will buy again.",    user:{name:"Priya Thapa"},  createdAt:"2025-04-22T00:00:00Z" },
  { id:"rv3", rating:5, title:"Genuine product",  body:"Smooth transaction. Product is genuine and works perfectly. Great seller!",            user:{name:"Sita Maharjan"},createdAt:"2025-04-15T00:00:00Z" },
  { id:"rv4", rating:4, title:"Happy purchase",   body:"Good seller, responsive communication. Minor delay in shipping but overall satisfied.", user:{name:"Ram Bahadur"},  createdAt:"2025-04-10T00:00:00Z" },
  { id:"rv5", rating:5, title:"Top notch!",       body:"Best online shopping experience so far. Product is authentic and exactly what I needed.", user:{name:"Bikash Rai"}, createdAt:"2025-03-30T00:00:00Z" },
];

type StoreTab = "store" | "products" | "profile";

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  return (
    <span className={size === "lg" ? "text-xl" : "text-xs"}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= rating ? GOLD : "#D1D5DB" }}><EmojiIcon emoji="★" /></span>
      ))}
    </span>
  );
}

function SaleCard({ product: p, onClick }: { product: any; onClick: () => void }) {
  const price = Number(p.basePrice ?? 0);
  const orig  = Number(p.comparePrice ?? 0);
  const disc  = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className="text-left group block w-full"
      style={{ backgroundColor:"var(--color-bg)", borderRadius:12, border:`1px solid ${BORDER}`, overflow:"hidden" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = GOLD; el.style.boxShadow = "0 6px 20px rgba(198,131,19,0.12)"; el.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = BORDER; el.style.boxShadow = "none"; el.style.transform = "none"; }}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio:"1/1", backgroundColor: IVORY }}>
        {p.images?.[0]?.url ? (
          <Image src={p.images[0].url} alt={p.name} fill sizes="200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl"><EmojiIcon emoji={p.emoji ?? "🛍️"} /></div>
        )}
        {disc > 0 && (
          <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor:"#1C1A16" }}>
            -{disc}%
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs line-clamp-2 mb-1" style={{ color: CHARCOAL, lineHeight:"1.4" }}>{p.name}</p>
        <p className="text-sm font-black" style={{ color: GOLD }}>{formatPrice(price)}</p>
        {orig > price && <p className="text-[10px] line-through mt-0.5" style={{ color: MUTED }}>{formatPrice(orig)}</p>}
        <div className="flex items-center gap-1 mt-1">
          <Stars rating={Math.round(p.rating ?? p.averageRating ?? 4)} />
          <span className="text-[10px]" style={{ color: MUTED }}>({(p.totalReviews ?? 0).toLocaleString()})</span>
        </div>
      </div>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-44 w-full" style={{ background:"linear-gradient(135deg,#1C1A16,#2D2418)" }} />
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 mt-6">
          {[...Array(12)].map((_,i) => <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

export function SellerStorePage() {
  const { pageData, nav } = useUIStore();
  const { user: authUser } = useAuthStore();
  const raw: string = typeof pageData === "string" ? pageData : "";
  // pageData can be a storeSlug ("my-store") or an email fallback ("user@mail.com")
  const isEmailLookup = raw.includes("@");
  const storeSlug = isEmailLookup ? "" : raw;

  const [seller,   setSeller]   = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews,  setReviews]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<StoreTab>("store");
  const [sort,     setSort]     = useState("newest");
  const [search,   setSearch]   = useState("");
  const [followed,  setFollowed]  = useState(false);
  const [gridDense, setGridDense] = useState(true);

  const doLoad = (slug: string) => {
    setSeller(null); setProducts([]); setReviews([]);
    setLoading(true); setTab("store"); setSearch("");

    Promise.all([
      apiGet(`/api/seller/store/${slug}`, null),
      apiGet(`/api/products?seller=${slug}&limit=50`, null),
    ]).then(([sd, pd]) => {
      if (sd?.seller) {
        const profile = STORE_PROFILES[slug];
        setSeller({ ...sd.seller, location: profile?.location, services: profile?.services });
        setReviews(sd.reviews?.length ? sd.reviews : FALLBACK_REVIEWS);
      } else {
        const mock    = MOCK_PRODUCTS.filter((p: any) => p.seller?.storeSlug === slug);
        const profile = STORE_PROFILES[slug];
        if (mock.length > 0 || profile) {
          const s = mock[0]?.seller ?? {};
          setSeller({
            id: slug, storeName: profile?.storeName ?? s.storeName ?? slug,
            storeSlug: slug, emoji: profile?.emoji ?? "🏪",
            description: profile?.description ?? `${s.storeName ?? slug} — trusted seller on PeaNut.`,
            followers: profile?.followers ?? 0, rating: profile?.rating ?? 92,
            isVerified: true, totalSales: profile?.totalSales ?? mock.length * 80,
            createdAt: profile?.joined ? `${profile.joined}T00:00:00Z` : "2022-01-01T00:00:00Z",
            location: profile?.location ?? null,
            services: profile?.services ?? DEFAULT_SERVICES,
            _count: { products: mock.length },
          });
          setReviews(FALLBACK_REVIEWS);
        }
      }
      const apiProds: any[] = pd?.products ?? [];
      const relevant = apiProds.filter((p: any) => p.seller?.storeSlug === slug);
      setProducts(relevant.length > 0
        ? relevant
        : MOCK_PRODUCTS.filter((p: any) => p.seller?.storeSlug === slug),
      );

      // If nothing resolved seller, build from auth as last resort
      setSeller((prev: any) => {
        if (prev) return prev;
        const base = authUser?.name ?? "My";
        return {
          id: "local", storeName: `${base}'s Store`, storeSlug: slug,
          emoji: "🏪", description: "Welcome to our store on PeaNut marketplace.",
          followers: 0, rating: 92, isVerified: false,
          createdAt: new Date().toISOString(), location: null, services: null,
          _count: { products: 0 },
        };
      });
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (storeSlug) { doLoad(storeSlug); return; }
    // Use the email embedded in pageData first, fall back to the logged-in user's email
    const email = isEmailLookup ? raw : (authUser?.email ?? "");
    if (!email) { setLoading(false); return; }
    fetch(`/api/seller/lookup?email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.seller?.storeSlug) {
          doLoad(d.seller.storeSlug);
        } else {
          // No DB seller record yet — build a minimal store from auth data
          const base = d?.seller?.storeName ?? authUser?.name ?? "My";
          setSeller({
            id:          d?.seller?.id ?? "local",
            storeName:   base.includes("Store") ? base : `${base}'s Store`,
            storeSlug:   "",
            emoji:       "🏪",
            description: "Welcome to our store on PeaNut marketplace.",
            followers:   0,
            rating:      92,
            isVerified:  d?.seller?.isVerified ?? false,
            createdAt:   new Date().toISOString(),
            location:    null,
            services:    null,
            _count:      { products: 0 },
          });
          setReviews([]);
          setProducts([]);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [raw, authUser?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.category?.name?.toLowerCase().includes(q));
    }
    if (sort === "price_asc")   list.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    if (sort === "price_desc")  list.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    if (sort === "rating_desc") list.sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
    return list;
  }, [products, search, sort]);

  const topReviews = useMemo(() =>
    [...reviews].sort((a, b) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3),
    [reviews],
  );

  if (loading) return <Skeleton />;

  if (!seller) {
    const isSeller = authUser?.role === "SELLER";
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4"><EmojiIcon emoji="🏪" /></p>
        <h2 className="text-xl font-black mb-2" style={{ color: CHARCOAL }}>
          {isSeller ? "Your store isn't active yet" : "Store not found"}
        </h2>
        <p className="text-sm mb-6" style={{ color: MUTED }}>
          {isSeller
            ? "Complete your seller onboarding to activate your public store page."
            : "This store may not exist or the link is invalid."}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {isSeller && (
            <button onClick={() => nav("onboarding")}
              className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: GOLD }}>
              Complete Onboarding
            </button>
          )}
          <button
            onClick={() => nav(isSeller ? "seller" : "products")}
            className="px-6 py-3 rounded-xl font-bold"
            style={{ border:`1px solid ${BORDER}`, color: CHARCOAL }}
          >
            {isSeller ? "Back to Dashboard" : "Back to Shop"}
          </button>
        </div>
      </div>
    );
  }

  const joined = seller.createdAt
    ? new Date(seller.createdAt).toLocaleDateString("en-US", { month:"long", year:"numeric" })
    : "";

  const avgRating = reviews.length
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : Number(seller.rating ?? 4.8).toFixed(1);

  const ratingDist = [5,4,3,2,1].map(star => ({
    star, count: reviews.filter((r: any) => r.rating === star).length,
  }));
  const maxCount = Math.max(...ratingDist.map(d => d.count), 1);

  const services: string[] = seller.services ?? DEFAULT_SERVICES;
  const location: string   = seller.location ?? "Kathmandu, Nepal";

  const gridClass = gridDense
    ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";

  return (
    <div className="min-h-screen" style={{ backgroundColor:"var(--color-bg)" }}>

      {/* ── Banner ───────────────────────────────────────────────────── */}
      <div
        className="relative h-40 md:h-48 w-full overflow-hidden"
        style={{ background:"linear-gradient(135deg, #1C1A16 0%, #2D2418 55%, #4A3010 100%)" }}
      >
        {/* Decorative mascot */}
        <div className="absolute right-8 bottom-0 hidden md:flex items-end opacity-25 select-none pointer-events-none">
          <span className="text-[7rem] leading-none"><EmojiIcon emoji={seller.emoji ?? "🏪"} /></span>
        </div>
        {/* Breadcrumb */}
        <nav className="absolute top-4 left-4 flex items-center gap-2 text-sm text-white/70">
          <button onClick={() => nav("home")} className="hover:text-white transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => nav("products")} className="hover:text-white transition-colors">Shop</button>
          <span>/</span>
          <span className="text-white/90 font-semibold truncate max-w-40">{seller.storeName}</span>
        </nav>
      </div>

      {/* ── Store info card (overlaps banner) ───────────────────────── */}
      <div className="bg-white dark:bg-gray-900" style={{ borderBottom:`1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4">

          {/* Main info row */}
          <div className="flex items-center gap-4 pt-3 pb-4 flex-wrap">

            {/* Logo — pulled up over banner */}
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 flex items-center justify-center overflow-hidden shrink-0 -mt-10 shadow-xl bg-white"
              style={{ borderColor: BORDER }}
            >
              {seller.logo
                ? <img src={seller.logo} alt={seller.storeName} className="w-full h-full object-cover" />
                : <span className="text-3xl md:text-4xl"><EmojiIcon emoji={seller.emoji ?? "🏪"} /></span>
              }
            </div>

            {/* Name + quick stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black leading-tight" style={{ color: CHARCOAL }}>{seller.storeName}</h1>
                {seller.isVerified && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                    style={{ color:"#2563EB", borderColor:"#BFDBFE", backgroundColor:"#EFF6FF" }}>
                    <EmojiIcon emoji="✓" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 flex-wrap text-xs" style={{ color: MUTED }}>
                {seller.followers > 0 && (
                  <span><strong style={{ color: CHARCOAL }}>{(seller.followers ?? 0).toLocaleString()}</strong> Followers</span>
                )}
                <span><strong style={{ color: CHARCOAL }}>{seller.rating ?? 92}%</strong> Seller Rating</span>
                {reviews.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Stars rating={Math.round(Number(avgRating))} />
                    <strong style={{ color: CHARCOAL }}>{avgRating}</strong>
                    <span>({reviews.length} reviews)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Follow button only — chat removed */}
            <button
              onClick={() => setFollowed(f => !f)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all shrink-0"
              style={{ backgroundColor: followed ? "#9B6210" : GOLD }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#9B6210"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = followed ? "#9B6210" : GOLD; }}
            >
              {followed ? (
                <><span><EmojiIcon emoji="✓" /></span> Following</>
              ) : (
                <><span className="text-lg leading-none">+</span> Follow</>
              )}
            </button>
          </div>

          {/* ── Tab bar + search + view toggle ───────────────────────── */}
          <div className="flex items-center justify-between gap-4 border-t" style={{ borderColor: BORDER }}>
            <div className="flex">
              {(["store","products","profile"] as StoreTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-5 py-3 text-sm font-bold capitalize transition-colors border-b-2",
                    tab === t ? "border-[#C68313] text-[#C68313]" : "border-transparent"
                  )}
                  style={{ color: tab === t ? GOLD : MUTED }}
                >
                  {t === "products" ? `Products (${products.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 py-2 shrink-0">
              {/* Grid density toggle */}
              <div className="flex rounded-lg overflow-hidden" style={{ border:`1px solid ${BORDER}` }}>
                {/* Dense (5-6 per row) */}
                <button
                  onClick={() => setGridDense(true)}
                  title="Compact — 5–6 per row"
                  className="px-2 py-1.5 transition-colors"
                  style={{ backgroundColor: gridDense ? GOLD : "transparent", color: gridDense ? "#fff" : MUTED }}
                >
                  <Grid3x3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
                {/* Spacious (2-3 per row) */}
                <button
                  onClick={() => setGridDense(false)}
                  title="Spacious — 2–3 per row"
                  className="px-2 py-1.5 transition-colors"
                  style={{ backgroundColor: !gridDense ? GOLD : "transparent", color: !gridDense ? "#fff" : MUTED }}
                >
                  <Grid2x2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>

              {/* Search in store */}
              <div className="relative hidden sm:block">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search In Store"
                  className="pl-4 pr-10 py-2 text-sm rounded-xl outline-none"
                  style={{ border:`1px solid ${BORDER}`, color: CHARCOAL, backgroundColor:"var(--color-bg)", width:200 }}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── STORE tab ─ "Just For You" ───────────────────────────── */}
        {tab === "store" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black" style={{ color: CHARCOAL }}>Just For You</h2>
              <button onClick={() => setTab("products")} className="text-sm font-bold hover:underline" style={{ color: GOLD }}>
                View All <EmojiIcon emoji="→" />
              </button>
            </div>
            {displayed.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3"><EmojiIcon emoji="📭" /></p>
                <p className="font-bold" style={{ color: CHARCOAL }}>No products yet</p>
              </div>
            ) : (
              <div className={gridClass}>
                {displayed.map((p: any) => (
                  <SaleCard key={p.id} product={p} onClick={() => nav("product", p.slug)} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── PRODUCTS tab ─ full grid with sort ───────────────────── */}
        {tab === "products" && (
          <section>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <p className="text-sm" style={{ color: MUTED }}>
                Showing <strong style={{ color: CHARCOAL }}>{displayed.length}</strong> products
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Mobile search */}
                <div className="relative sm:hidden">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                    className="pl-3 pr-8 py-2 text-sm rounded-xl outline-none"
                    style={{ border:`1px solid ${BORDER}`, color: CHARCOAL, backgroundColor:"var(--color-bg)", width:160 }} />
                </div>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="text-sm rounded-xl px-3 py-2 outline-none"
                  style={{ border:`1px solid ${BORDER}`, color: CHARCOAL, backgroundColor:"var(--color-bg)" }}>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="rating_desc">Top Rated</option>
                </select>
              </div>
            </div>
            {displayed.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3"><EmojiIcon emoji="🔍" /></p>
                <p className="font-bold" style={{ color: CHARCOAL }}>No products found</p>
                <button onClick={() => setSearch("")} className="mt-3 text-sm font-bold" style={{ color: GOLD }}>Clear search</button>
              </div>
            ) : (
              <div className={gridClass}>
                {displayed.map((p: any) => (
                  <SaleCard key={p.id} product={p} onClick={() => nav("product", p.slug)} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── PROFILE tab ──────────────────────────────────────────── */}
        {tab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

            {/* Left column */}
            <div className="space-y-6">

              {/* Overall rating + distribution */}
              <div className="rounded-2xl p-6" style={{ border:`1px solid ${BORDER}`, backgroundColor:"var(--color-bg)" }}>
                <h3 className="font-black text-base mb-5" style={{ color: CHARCOAL }}>Ratings &amp; Reviews</h3>
                <div className="flex items-start gap-8 flex-wrap">
                  {/* Big average */}
                  <div className="text-center shrink-0">
                    <p className="text-6xl font-black leading-none mb-2" style={{ color: GOLD }}>{avgRating}</p>
                    <Stars rating={Math.round(Number(avgRating))} size="lg" />
                    <p className="text-xs mt-2" style={{ color: MUTED }}>{reviews.length} reviews</p>
                  </div>
                  {/* Bar distribution */}
                  <div className="flex-1 min-w-40 space-y-2">
                    {ratingDist.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-right font-semibold shrink-0" style={{ color: MUTED }}>{star}</span>
                        <span style={{ color: GOLD }}><EmojiIcon emoji="★" /></span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
                          <div className="h-full rounded-full" style={{ width:`${(count/maxCount)*100}%`, backgroundColor: GOLD }} />
                        </div>
                        <span className="w-5 shrink-0" style={{ color: MUTED }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top reviews */}
              <div className="rounded-2xl p-6" style={{ border:`1px solid ${BORDER}`, backgroundColor:"var(--color-bg)" }}>
                <h3 className="font-black text-base mb-4" style={{ color: CHARCOAL }}>Top Reviews</h3>
                {topReviews.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-4xl mb-3"><EmojiIcon emoji="💬" /></p>
                    <p className="text-sm" style={{ color: MUTED }}>No reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {topReviews.map((r: any) => (
                      <div key={r.id} className="flex gap-4 pb-5 border-b last:border-b-0" style={{ borderColor: BORDER }}>
                        <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-black text-white"
                          style={{ backgroundColor: GOLD }}>
                          {r.user?.name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{r.user?.name ?? "Customer"}</p>
                              <Stars rating={r.rating} />
                            </div>
                            <span className="text-[11px] shrink-0" style={{ color: MUTED }}>
                              {new Date(r.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                            </span>
                          </div>
                          {r.product && (
                            <button onClick={() => nav("product", r.product.slug)}
                              className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: IVORY, color: GOLD, border:`1px solid ${BORDER}` }}>
                              {r.product.name}
                            </button>
                          )}
                          {r.title && <p className="text-sm font-semibold mt-2" style={{ color: CHARCOAL }}>{r.title}</p>}
                          {r.body  && <p className="text-sm mt-0.5 leading-relaxed" style={{ color: MUTED }}>{r.body}</p>}
                        </div>
                      </div>
                    ))}
                    {reviews.length > 3 && (
                      <p className="text-xs text-center pt-1" style={{ color: MUTED }}>
                        + {reviews.length - 3} more reviews
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">

              {/* Store location */}
              <div className="rounded-2xl p-5" style={{ border:`1px solid ${BORDER}`, backgroundColor:"var(--color-bg)" }}>
                <h4 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: CHARCOAL }}>
                  <span className="text-base"><EmojiIcon emoji="📍" /></span> Store Location
                </h4>
                <p className="text-sm" style={{ color: MUTED }}>{location}</p>
              </div>

              {/* Services */}
              <div className="rounded-2xl p-5" style={{ border:`1px solid ${BORDER}`, backgroundColor:"var(--color-bg)" }}>
                <h4 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: CHARCOAL }}>
                  <span className="text-base"><EmojiIcon emoji="🛡️" /></span> Services Provided
                </h4>
                <ul className="space-y-2">
                  {services.map((svc: string) => (
                    <li key={svc} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                        style={{ backgroundColor: GOLD }}><EmojiIcon emoji="✓" /></span>
                      {svc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* About */}
              <div className="rounded-2xl p-5" style={{ border:`1px solid ${BORDER}`, backgroundColor:"var(--color-bg)" }}>
                <h4 className="font-black text-sm mb-2" style={{ color: CHARCOAL }}>About the Store</h4>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                  {seller.description ?? `${seller.storeName} is a trusted seller on PeaNut marketplace.`}
                </p>
                <div className="mt-4 pt-4 border-t space-y-2 text-xs" style={{ borderColor: BORDER }}>
                  {[
                    { label:"Joined",       value: joined || "—" },
                    { label:"Seller Score", value: `${seller.rating ?? 92}%` },
                    { label:"Verified",     value: seller.isVerified ? "Yes ✓" : "No" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: MUTED }}><EmojiText>{label}</EmojiText></span>
                      <span className="font-semibold" style={{ color: CHARCOAL }}><EmojiText>{value}</EmojiText></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
