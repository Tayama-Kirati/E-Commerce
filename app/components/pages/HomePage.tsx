"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { MOCK_PRODUCTS, useUIStore, apiGet, formatPrice } from "@/app/lib/store";

import { EmojiIcon } from "@/app/components/ui/EmojiIcon";
const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";

export function HomePage() {
  const { nav } = useUIStore();
  const [products,   setProducts]   = useState<any[]>([]);
  const [flash,      setFlash]      = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loaded,     setLoaded]     = useState(false);
  const [slide,      setSlide]      = useState(0);
  const [countdown,  setCountdown]  = useState({ h: 4, m: 23, s: 14 });

  useEffect(() => {
    Promise.all([
      apiGet("/api/products?limit=12", null),
      apiGet("/api/products?isFlashSale=true&limit=8", null),
      apiGet("/api/categories", null),
    ]).then(([all, sale, cats]) => {
      if (all?.products?.length)    setProducts(all.products);
      if (sale?.products?.length)   setFlash(sale.products);
      if (cats?.categories?.length) setCategories(cats.categories);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(p => {
      let { h, m, s } = p;
      s--;
      if (s < 0) { s = 59; m--; }
      if (m < 0) { m = 59; h--; }
      if (h < 0) { h = 4; m = 59; s = 59; }
      return { h, m, s };
    }), 1000);
    return () => clearInterval(t);
  }, []);

  // Banners managed in Admin → Settings replace the built-in slides when any are active
  const [banners, setBanners] = useState<any[]>([]);
  useEffect(() => {
    apiGet("/api/banners", null).then((d: any) => setBanners(d?.banners ?? []));
  }, []);

  const SLIDES: { headline: string; sub: string; emoji: string; cta: string; imageUrl?: string | null; linkUrl?: string | null }[] =
    banners.length
      ? banners.map((b) => ({ headline: b.title, sub: b.subtitle ?? "", emoji: "🛍️", cta: b.ctaLabel || "Shop now", imageUrl: b.imageUrl, linkUrl: b.linkUrl }))
      : [
          { headline: "Biggest Sale of the Year",    sub: "Up to 70% off on Electronics",   emoji: "⚡", cta: "Shop Electronics" },
          { headline: "New Arrivals — Fashion 2025", sub: "Styles that define the season",   emoji: "✨", cta: "Explore Fashion"   },
          { headline: "Eco-Friendly Living",         sub: "Sustainable picks, happy planet", emoji: "🌿", cta: "Shop Green"        },
        ];

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [SLIDES.length]);

  const sl = SLIDES[slide % SLIDES.length];
  const openSlide = () => {
    if (sl.linkUrl) window.location.href = sl.linkUrl;
    else nav("products");
  };

  const displayFlash = (flash.length > 0 ? flash : MOCK_PRODUCTS.filter((p: any) => p.isFlashSale));
  const displayCats  = categories.slice(0, 16);
  const displayAll   = products.length > 0 ? products : MOCK_PRODUCTS;

  return (
    <div>
      {/* ── Hero banner ─────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1C1A16 0%, #2D2418 60%, #3D2A0E 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, transparent 40%, rgba(198,131,19,0.06) 60%, transparent 80%)" }}
        />
        <div className="max-w-7xl mx-auto px-8 py-12 md:py-16 relative z-10 flex items-center justify-between">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: GOLD }}>
              PeaNut Exclusive
            </p>
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight text-white">{sl.headline}</h1>
            <p className="text-base md:text-lg mb-8" style={{ color: "#BBA882" }}>{sl.sub}</p>
            <button
              onClick={openSlide}
              className="font-bold px-8 py-3 rounded-2xl text-white text-sm"
              style={{ backgroundColor: GOLD }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#9B6210"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(198,131,19,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
            >
              {sl.cta} <EmojiIcon emoji="→" />
            </button>
          </div>
          {sl.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sl.imageUrl} alt="" className="hidden sm:block max-h-56 rounded-2xl object-cover" />
          ) : (
            <div
              className="text-8xl md:text-9xl hidden sm:block select-none"
              style={{ filter: "drop-shadow(0 0 32px rgba(198,131,19,0.3))" }}
            >
              <EmojiIcon emoji={sl.emoji} />
            </div>
          )}
        </div>
        <div className="flex justify-center gap-2 pb-5 relative z-10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: slide === i ? "24px" : "6px", backgroundColor: slide === i ? GOLD : "rgba(255,255,255,0.25)" }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">

        {/* ── On Sale Now ─────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black" style={{ color: CHARCOAL }}>
                <EmojiIcon emoji="⚡" /> On Sale Now
              </h2>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ backgroundColor: IVORY, border: `1px solid ${BORDER}` }}>
                {[countdown.h, countdown.m, countdown.s].map((v, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-white text-xs font-black px-2 py-0.5 rounded-lg tabular-nums" style={{ backgroundColor: GOLD }}>
                      {String(v).padStart(2, "0")}
                    </span>
                    {i < 2 && <span className="font-black text-xs" style={{ color: GOLD }}>:</span>}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => nav("products", { flashSale: true })}
              className="text-xs font-bold px-4 py-2 rounded-xl border transition-all"
              style={{ borderColor: GOLD, color: GOLD }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = GOLD; }}
            >
              SHOP ALL PRODUCTS
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {!loaded
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" style={{ aspectRatio: "3/4" }} />
                ))
              : displayFlash.slice(0, 6).map((p: any) => (
                  <SaleCard key={p.id} product={p} onClick={() => nav("product", p.slug)} />
                ))
            }
          </div>
        </section>

        {/* ── Gold divider ─────────────────────────────── */}
        <div className="divider-gold" />

        {/* ── Categories grid ─────────────────────────── */}
        <section>
          <h2 className="text-xl font-black mb-5" style={{ color: CHARCOAL }}>Categories</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {displayCats.map((c: any) => (
              <button
                key={c.id}
                onClick={() => nav("products", { category: c.slug })}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-full aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all duration-200 group-hover:scale-105"
                  style={{ backgroundColor: IVORY, border: `1px solid ${BORDER}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = GOLD; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 14px rgba(198,131,19,0.15)`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  <EmojiIcon emoji={c.icon ?? "📦"} />
                </div>
                <span className="text-center leading-tight w-full" style={{ color: CHARCOAL, fontSize: "11px" }}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Gold divider ─────────────────────────────── */}
        <div className="divider-gold" />

        {/* ── Trending Now ────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1" style={{ color: GOLD }}>Curated for You</p>
              <h2 className="text-xl font-black" style={{ color: CHARCOAL }}><EmojiIcon emoji="🔥" /> Trending Now</h2>
            </div>
            <button
              onClick={() => nav("products")}
              className="text-sm font-bold hover:underline"
              style={{ color: GOLD }}
            >
              View All <EmojiIcon emoji="→" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {!loaded
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" style={{ aspectRatio: "3/4" }} />
                ))
              : displayAll.slice(0, 12).map((p: any) => (
                  <SaleCard key={p.id} product={p} onClick={() => nav("product", p.slug)} />
                ))
            }
          </div>
        </section>

      </div>
    </div>
  );
}

function SaleCard({ product: p, onClick }: { product: any; onClick: () => void }) {
  const price = Number(p.basePrice ?? p.price ?? 0);
  const orig  = Number(p.comparePrice ?? p.originalPrice ?? 0);
  const disc  = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="text-left group block w-full"
      style={{ backgroundColor: "var(--color-bg)", borderRadius: "12px", border: `1px solid ${BORDER}`, overflow: "hidden" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(198,131,19,0.12)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "1/1", backgroundColor: IVORY }}>
        {p.images?.[0]?.url ? (
          <Image
            src={p.images[0].url}
            alt={p.name}
            fill
            sizes="(max-width: 640px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-105">
            <EmojiIcon emoji={p.emoji ?? "🛍️"} />
          </div>
        )}
        {disc > 0 && (
          <span
            className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: "#1C1A16" }}
          >
            -{disc}%
          </span>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs line-clamp-2 mb-1" style={{ color: "var(--color-heading)", lineHeight: "1.4" }}>
          {p.name}
        </p>
        <p className="text-sm font-black" style={{ color: GOLD }}>{formatPrice(price)}</p>
        {orig > price && (
          <p className="text-[10px] line-through mt-0.5" style={{ color: "var(--color-muted)" }}>
            {formatPrice(orig)}
          </p>
        )}
      </div>
    </button>
  );
}
