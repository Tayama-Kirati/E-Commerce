"use client";
import { useState, useEffect } from "react";
import {
  cn,
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  useUIStore,
  apiGet,
} from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

export function HomePage() {
  const { nav } = useUIStore();
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [flash, setFlash] = useState(
    MOCK_PRODUCTS.filter((p) => p.isFlashSale),
  );
  const [slide, setSlide] = useState(0);
  const [countdown, setCountdown] = useState({ h: 4, m: 23, s: 14 });

  useEffect(() => {
    apiGet("/api/products?limit=12", null).then((d) => {
      if (d?.products?.length) setProducts(d.products);
    });
    apiGet("/api/products?isFlashSale=true&limit=4", null).then((d) => {
      if (d?.products?.length) setFlash(d.products);
    });
  }, []);

  useEffect(() => {
    const t = setInterval(
      () =>
        setCountdown((p) => {
          let { h, m, s } = p;
          s--;
          if (s < 0) {
            s = 59;
            m--;
          }
          if (m < 0) {
            m = 59;
            h--;
          }
          if (h < 0) {
            h = 4;
            m = 59;
            s = 59;
          }
          return { h, m, s };
        }),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  const SLIDES = [
    {
      headline: "Biggest Sale of the Year",
      sub: "Up to 70% off on Electronics",
      bg: "from-violet-600 to-violet-800",
      emoji: "⚡",
      cta: "Shop Electronics",
    },
    {
      headline: "New Arrivals — Fashion 2025",
      sub: "Styles that define the season",
      bg: "from-rose-500 to-orange-600",
      emoji: "✨",
      cta: "Explore Fashion",
    },
    {
      headline: "Eco-Friendly Living",
      sub: "Sustainable picks, happy planet",
      bg: "from-emerald-600 to-teal-700",
      emoji: "🌿",
      cta: "Shop Green",
    },
  ];
  const sl = SLIDES[slide];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      {/* Hero */}
      <div className={`bg-linear-to-r ${sl.bg} rounded-3xl overflow-hidden`}>
        <div className="flex items-center justify-between px-8 py-10 md:py-14">
          <div className="text-white max-w-lg">
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-2">
              NexMart Exclusive
            </p>
            <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
              {sl.headline}
            </h1>
            <p className="text-white/80 text-lg mb-6">{sl.sub}</p>
            <button
              onClick={() => nav("products")}
              className="bg-white text-violet-700 font-black px-7 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all"
            >
              {sl.cta} →
            </button>
          </div>
          <div className="text-8xl md:text-9xl hidden sm:block select-none">
            {sl.emoji}
          </div>
        </div>
        <div className="flex justify-center gap-2 pb-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                slide === i ? "bg-white w-6" : "bg-white/40 w-1.5",
              )}
            />
          ))}
        </div>
      </div>

      {/* Flash Sale */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              ⚡ Flash Sale
            </h2>
            <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-xl">
              {[countdown.h, countdown.m, countdown.s].map((v, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="bg-orange-600 text-white text-xs font-black px-1.5 py-0.5 rounded-lg tabular-nums">
                    {String(v).padStart(2, "0")}
                  </span>
                  {i < 2 && (
                    <span className="text-orange-600 font-black">:</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => nav("products")}
            className="text-sm text-violet-600 font-bold hover:underline"
          >
            View All →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {flash.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-5">
          Shop by Category
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {MOCK_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => nav("products")}
              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {c.icon}
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            🔥 Trending Now
          </h2>
          <button
            onClick={() => nav("products")}
            className="text-sm text-violet-600 font-bold hover:underline"
          >
            View All →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🛡️", t: "Buyer Protection", s: "100% safe shopping" },
          { icon: "🚚", t: "Fast Delivery", s: "2-3 days nationwide" },
          { icon: "↩️", t: "Easy Returns", s: "7-day hassle-free" },
          { icon: "💳", t: "Secure Payment", s: "Khalti, eSewa & more" },
        ].map((item) => (
          <div
            key={item.t}
            className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800"
          >
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {item.t}
              </p>
              <p className="text-xs text-gray-400">{item.s}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
