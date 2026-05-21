"use client";
import { useState, useEffect } from "react";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, useUIStore, apiGet } from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const MUTED    = "var(--color-muted)";
const IVORY    = "var(--color-surface-warm)";

export function HomePage() {
  const { nav } = useUIStore();
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [flash, setFlash]       = useState(MOCK_PRODUCTS.filter(p => p.isFlashSale));
  const [slide, setSlide]       = useState(0);
  const [countdown, setCountdown] = useState({ h: 4, m: 23, s: 14 });

  useEffect(() => {
    apiGet("/api/products?limit=12", null).then(d => { if (d?.products?.length) setProducts(d.products); });
    apiGet("/api/products?isFlashSale=true&limit=4", null).then(d => { if (d?.products?.length) setFlash(d.products); });
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

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  const SLIDES = [
    { headline: "Biggest Sale of the Year",    sub: "Up to 70% off on Electronics",  emoji: "⚡", cta: "Shop Electronics" },
    { headline: "New Arrivals — Fashion 2025",  sub: "Styles that define the season", emoji: "✨", cta: "Explore Fashion"   },
    { headline: "Eco-Friendly Living",          sub: "Sustainable picks, happy planet",emoji: "🌿", cta: "Shop Green"       },
  ];
  const sl = SLIDES[slide];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">

      {/* Hero */}
      <div className="rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #1C1A16 0%, #2D2418 60%, #3D2A0E 100%)" }}>
        {/* Gold shimmer line overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, transparent 40%, rgba(198,131,19,0.06) 60%, transparent 80%)" }} />

        <div className="flex items-center justify-between px-8 py-12 md:py-16 relative z-10">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: GOLD, fontFamily: "var(--font-inter,'Inter',sans-serif)" }}>
              PeaNut Exclusive
            </p>
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight text-white"
              style={{ fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
              {sl.headline}
            </h1>
            <p className="text-base md:text-lg mb-8" style={{ color: "#BBA882" }}>{sl.sub}</p>
            <button onClick={() => nav("products")}
              className="font-bold px-8 py-3 rounded-2xl transition-all duration-300 active:scale-95 text-white text-sm"
              style={{ backgroundColor: GOLD }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#9B6210"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(198,131,19,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              {sl.cta} →
            </button>
          </div>
          <div className="text-8xl md:text-9xl hidden sm:block select-none" style={{ filter: "drop-shadow(0 0 32px rgba(198,131,19,0.3))" }}>
            {sl.emoji}
          </div>
        </div>

        {/* Slide dots */}
        <div className="flex justify-center gap-2 pb-5 relative z-10">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: slide === i ? "24px" : "6px", backgroundColor: slide === i ? GOLD : "rgba(255,255,255,0.25)" }} />
          ))}
        </div>
      </div>

      {/* Flash Sale */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
              ⚡ Flash Sale
            </h2>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ backgroundColor: IVORY, border: `1px solid ${BORDER}` }}>
              {[countdown.h, countdown.m, countdown.s].map((v, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-white text-xs font-black px-2 py-0.5 rounded-lg tabular-nums"
                    style={{ backgroundColor: GOLD }}>
                    {String(v).padStart(2, "0")}
                  </span>
                  {i < 2 && <span className="font-black text-xs" style={{ color: GOLD }}>:</span>}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => nav("products")} className="text-sm font-bold hover:underline transition-colors"
            style={{ color: GOLD }}>
            View All →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {flash.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Gold divider */}
      <div className="divider-gold" />

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1" style={{ color: GOLD }}>Curated for You</p>
            <h2 className="text-xl font-black" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
              🔥 Trending Now
            </h2>
          </div>
          <button onClick={() => nav("products")} className="text-sm font-bold hover:underline transition-colors"
            style={{ color: GOLD }}>
            View All →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Gold divider */}
      <div className="divider-gold" />

      {/* Categories */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1" style={{ color: GOLD }}>Browse</p>
          <h2 className="text-xl font-black" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            Shop by Category
          </h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {MOCK_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => nav("products")}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl transition-all duration-300 group"
              style={{ border: `1px solid ${BORDER}` }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = GOLD; el.style.boxShadow = "0 6px 20px rgba(198,131,19,0.12)"; el.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = BORDER; el.style.boxShadow = "none"; el.style.transform = "none"; }}>
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{c.icon}</span>
              <span className="text-xs font-semibold text-center" style={{ color: CHARCOAL }}>{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🛡️", t: "Buyer Protection",  s: "100% safe shopping"     },
          { icon: "🚚", t: "Fast Delivery",      s: "2-3 days nationwide"    },
          { icon: "↩️", t: "Easy Returns",       s: "7-day hassle-free"      },
          { icon: "💳", t: "Secure Payment",     s: "Khalti, eSewa & more"   },
        ].map(item => (
          <div key={item.t} className="flex items-center gap-3 bg-white rounded-2xl p-4"
            style={{ border: `1px solid ${BORDER}` }}>
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{item.t}</p>
              <p className="text-xs" style={{ color: MUTED }}>{item.s}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
