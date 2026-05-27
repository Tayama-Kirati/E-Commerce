"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { formatPrice, cn, useCartStore, useUIStore, useWishlistStore, apiGet } from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

const GOLD = "#C68313";

const FALLBACK_REVIEWS = [
 { id: "r1", user: { name: "Kristin Watson" }, verified: true, createdAt: "1 month ago", rating: 5, body: "Amazing product! Exactly as described and delivery was fast." },
 { id: "r2", user: { name: "Cameron Williamson" }, verified: true, createdAt: "2 months ago", rating: 4, body: "Great quality. Will definitely buy again." },
 { id: "r3", user: { name: "Brooklyn Simmons" }, verified: false, createdAt: "3 months ago", rating: 5, body: "Very satisfied with this purchase." },
 { id: "r4", user: { name: "Jacob Jones" }, verified: true, createdAt: "3 months ago", rating: 4, body: "Good product, packaging was nice." },
];

type Tab = "description" | "additional" | "review";

function Skeleton() {
 return (
  <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse">
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
    <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-2xl" />
    <div className="space-y-4">
     <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
     <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
     <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
     <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
     <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
    </div>
   </div>
  </div>
 );
}

export function ProductDetailPage() {
 const { pageData, nav } = useUIStore();
 const { addItem } = useCartStore();
 const { toggle: toggleWish, isIn } = useWishlistStore();

 const [product, setProduct] = useState<any>(null);
 const [related, setRelated] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [qty, setQty] = useState(1);
 const [tab, setTab] = useState<Tab>("description");
 const [activeThumb, setActiveThumb] = useState(0);
 const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

 useEffect(() => {
  if (!pageData) return;
  setLoading(true);
  setActiveThumb(0);
  apiGet(`/api/products/${pageData}`, null)
   .then((d) => {
    if (d?.product) {
     setProduct(d.product);
     setRelated(d.related ?? []);
    }
   })
   .finally(() => setLoading(false));
 }, [pageData]);

 if (loading) return <Skeleton />;
 if (!product) return (
  <div className="max-w-7xl mx-auto px-4 py-24 text-center">
   <p className="text-5xl mb-4">😕</p>
   <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Product not found</h2>
   <button onClick={() => nav("products")} className="mt-4 px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: GOLD }}>
    Back to Shop
   </button>
  </div>
 );

 const images: { url: string; alt?: string }[] = product.images ?? [];
 const mainImage = images[activeThumb] ?? images[0];
 const price = Number(product.basePrice ?? 0);
 const orig = Number(product.comparePrice ?? 0);
 const rating = Number(product.averageRating ?? product.rating ?? 4.8).toFixed(1);
 const reviewCount = Number(product.totalReviews ?? product.reviews?.length ?? 0);
 const inWish = isIn(product.id);

 // Rating distribution — prefer real data, fall back to illustrative defaults
 const ratingDist: { rating: number; count: number }[] = product.ratingDistribution?.some((r: any) => r.count > 0)
  ? product.ratingDistribution
  : [5, 4, 3, 2, 1].map((r, i) => ({ rating: r, count: [78, 12, 5, 3, 2][i] }));
 const distTotal = ratingDist.reduce((s: number, r: any) => s + r.count, 0) || 1;

 // Reviews — prefer real ones, fall back to illustrative samples
 const reviews: any[] = product.reviews?.length ? product.reviews : FALLBACK_REVIEWS;

 return (
  <div>
   {/* Shop banner */}
   <div className="bg-gray-100 dark:bg-gray-900 py-10 text-center">
    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Shop</h1>
    <nav className="flex items-center justify-center gap-2 text-sm text-gray-400">
     <button onClick={() => nav("home")} className="hover:text-[#C68313] transition-colors">Home</button>
     <span>/</span>
     <button onClick={() => nav("products")} className="hover:text-[#C68313] transition-colors">Shop</button>
     <span>/</span>
     <span className="text-gray-600 dark:text-gray-300 truncate max-w-xs">{product.name}</span>
    </nav>
   </div>

   <div className="max-w-7xl mx-auto px-4 py-10 pb-12">
    {/* Product section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

     {/* Image column */}
     <div>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-[#C68313]/20 overflow-hidden aspect-square flex items-center justify-center mb-3 select-none">
       {mainImage?.url ? (
        <Image
         src={mainImage.url}
         alt={mainImage.alt ?? product.name}
         fill
         sizes="(max-width: 1024px) 100vw, 50vw"
         className="object-contain"
        />
       ) : (
        <span className="text-9xl">{product.emoji ?? "🛍️"}</span>
       )}
       {images.length > 1 && (
        <>
         <button
          onClick={() => setActiveThumb(i => Math.max(0, i - 1))}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 font-bold text-lg hover:border-[#C68313] transition-colors shadow-sm"
         >
          ‹
         </button>
         <button
          onClick={() => setActiveThumb(i => Math.min(images.length - 1, i + 1))}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#2D3748] dark:bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-lg hover:opacity-80 transition-opacity shadow-sm"
         >
          ›
         </button>
        </>
       )}
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
       {(images.length > 0 ? images : [null]).slice(0, 4).map((img: any, i: number) => (
        <button
         key={i}
         onClick={() => setActiveThumb(i)}
         className={cn(
          "aspect-square rounded-xl border-2 overflow-hidden flex items-center justify-center bg-white dark:bg-gray-900 transition-all",
          activeThumb === i
           ? "border-[#C68313]"
           : "border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100",
         )}
        >
         {img?.url ? (
          <div className="relative w-full h-full">
           <Image src={img.url} alt={img.alt ?? ""} fill sizes="80px" className="object-cover" />
          </div>
         ) : (
          <span className="text-3xl">{product.emoji ?? "🛍️"}</span>
         )}
        </button>
       ))}
      </div>
     </div>

     {/* Info column */}
     <div className="space-y-4">
      <p className="text-sm text-gray-400">{product.category?.name ?? "General"}</p>

      <div className="flex items-center gap-3 flex-wrap">
       <h1 className="text-2xl font-black text-gray-900 dark:text-white">{product.name}</h1>
       <span className={cn(
        "text-xs font-semibold px-3 py-1 rounded-full border",
        (product.stock ?? 1) > 0
         ? "border-[#C68313]/50 text-[#C68313] bg-amber-50 dark:bg-amber-900/20"
         : "border-red-400/50 text-red-500 bg-red-50 dark:bg-red-900/20",
       )}>
        {(product.stock ?? 1) > 0 ? "In Stock" : "Out of Stock"}
       </span>
      </div>

      <div className="flex items-center gap-2">
       <span className="text-amber-400">{"★".repeat(Math.min(5, Math.round(Number(rating))))}</span>
       <span className="text-sm font-bold text-gray-900 dark:text-white">{rating}</span>
       <span className="text-sm text-gray-400">({reviewCount.toLocaleString()} Review)</span>
      </div>

      <div className="flex items-baseline gap-3">
       <span className="text-2xl font-black" style={{ color: GOLD }}>{formatPrice(price)}</span>
       {orig > price && <span className="text-gray-400 line-through">{formatPrice(orig)}</span>}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
       {product.description ?? product.shortDesc ?? ""}
      </p>

      {/* Variant selection */}
      {(() => {
       const variants: any[] = product.variants ?? [];
       if (!variants.length) return null;

       // Collect all attribute keys + unique values
       const attrMap: Record<string, string[]> = {};
       for (const v of variants) {
        const attrs = v.attributes ?? {};
        for (const [k, val] of Object.entries(attrs)) {
         if (!attrMap[k]) attrMap[k] = [];
         if (!attrMap[k].includes(String(val))) attrMap[k].push(String(val));
        }
       }

       // Find the variant that matches all selected attrs
       const activeVariant = variants.find(v => {
        const attrs = v.attributes ?? {};
        return Object.entries(selectedAttrs).every(([k, val]) => String(attrs[k]) === val);
       }) ?? null;

       // Derive effective price / stock from active variant
       const effectivePrice = activeVariant ? Number(activeVariant.price) : price;
       const effectiveOrig  = activeVariant?.comparePrice ? Number(activeVariant.comparePrice) : orig;
       const effectiveStock = activeVariant ? activeVariant.stock : (product.stock ?? 1);

       // Expose to parent scope via a ref-like trick: override display
       const COLOR_HEX: Record<string, string> = {
        black:"#1C1C1C", white:"#F5F5F5", red:"#EF4444", blue:"#3B82F6",
        green:"#22C55E", gold:"#C68313", silver:"#A8A9AD", purple:"#8B5CF6",
        orange:"#F97316", grey:"#9CA3AF", pink:"#EC4899", brown:"#92400E",
       };

       return (
        <div className="space-y-3">
         {Object.entries(attrMap).map(([key, vals]) => (
          <div key={key}>
           <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            {key}: <span className="font-black text-gray-900 dark:text-white normal-case tracking-normal">{selectedAttrs[key] ?? "—"}</span>
           </p>
           <div className="flex flex-wrap gap-2">
            {vals.map(val => {
             const lv = val.toLowerCase();
             const isColor = !!COLOR_HEX[lv];
             const selected = selectedAttrs[key] === val;
             if (isColor) return (
              <button
               key={val}
               title={val}
               onClick={() => setSelectedAttrs(prev => ({ ...prev, [key]: val }))}
               className="w-7 h-7 rounded-full transition-transform"
               style={{
                backgroundColor: COLOR_HEX[lv],
                border: selected ? `2.5px solid ${GOLD}` : "2px solid #D1D5DB",
                boxShadow: selected ? `0 0 0 1.5px ${GOLD}` : "none",
                transform: selected ? "scale(1.15)" : "scale(1)",
               }}
              />
             );
             return (
              <button
               key={val}
               onClick={() => setSelectedAttrs(prev => ({ ...prev, [key]: val }))}
               className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
               style={{
                border: `1.5px solid ${selected ? GOLD : "#D1D5DB"}`,
                backgroundColor: selected ? "#FFF8F0" : "transparent",
                color: selected ? GOLD : "var(--color-heading)",
               }}
              >
               {val}
              </button>
             );
            })}
           </div>
          </div>
         ))}

         {/* Updated price + stock from active variant */}
         {activeVariant && (
          <div className="flex items-baseline gap-3 pt-1">
           <span className="text-2xl font-black" style={{ color: GOLD }}>{`रू ${effectivePrice.toLocaleString()}`}</span>
           {effectiveOrig > effectivePrice && <span className="text-gray-400 line-through">{`रू ${effectiveOrig.toLocaleString()}`}</span>}
           <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full border",
            effectiveStock > 0
             ? "border-[#C68313]/50 text-[#C68313] bg-amber-50 dark:bg-amber-900/20"
             : "border-red-400/50 text-red-500 bg-red-50 dark:bg-red-900/20",
           )}>
            {effectiveStock > 0 ? `${effectiveStock} left` : "Out of Stock"}
           </span>
          </div>
         )}

         {/* Qty + actions using active variant data */}
         {effectiveStock > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
           <div className="flex items-center gap-3 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-gray-600 dark:text-gray-300 hover:text-[#C68313] font-black text-lg transition-colors">−</button>
            <span className="w-6 text-center font-black text-gray-900 dark:text-white">{qty}</span>
            <button onClick={() => setQty(Math.min(effectiveStock, qty + 1))} className="text-gray-600 dark:text-gray-300 hover:text-[#C68313] font-black text-lg transition-colors">+</button>
           </div>
           <button
            onClick={() => addItem({ ...product, basePrice: effectivePrice, stock: effectiveStock, variantId: activeVariant?.id }, qty)}
            className="flex-1 py-3 font-bold rounded-full text-white bg-[#2D3748] dark:bg-gray-700 hover:opacity-90 transition-opacity"
           >
            Add To Cart
           </button>
           <button
            onClick={() => { addItem({ ...product, basePrice: effectivePrice, stock: effectiveStock, variantId: activeVariant?.id }, qty); nav("checkout"); }}
            className="flex-1 py-3 font-bold rounded-full text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: GOLD }}
           >
            Buy Now
           </button>
           <button
            onClick={() => toggleWish(product.id)}
            className={cn(
             "p-3 rounded-full border-2 transition-all",
             inWish
              ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500"
              : "border-gray-300 dark:border-gray-600 text-gray-400 hover:border-red-300 hover:text-red-400",
            )}
           >
            ♥
           </button>
          </div>
         )}
        </div>
       );
      })()}

      {/* Qty + actions (no-variant fallback) */}
      {!(product.variants?.length) && (product.stock ?? 1) > 0 && (
       <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2">
         <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-gray-600 dark:text-gray-300 hover:text-[#C68313] font-black text-lg transition-colors">−</button>
         <span className="w-6 text-center font-black text-gray-900 dark:text-white">{qty}</span>
         <button onClick={() => setQty(Math.min(product.stock ?? 99, qty + 1))} className="text-gray-600 dark:text-gray-300 hover:text-[#C68313] font-black text-lg transition-colors">+</button>
        </div>
        <button
         onClick={() => addItem(product, qty)}
         className="flex-1 py-3 font-bold rounded-full text-white bg-[#2D3748] dark:bg-gray-700 hover:opacity-90 transition-opacity"
        >
         Add To Cart
        </button>
        <button
         onClick={() => { addItem(product, qty); nav("checkout"); }}
         className="flex-1 py-3 font-bold rounded-full text-white transition-opacity hover:opacity-90"
         style={{ backgroundColor: GOLD }}
        >
         Buy Now
        </button>
        <button
         onClick={() => toggleWish(product.id)}
         className={cn(
          "p-3 rounded-full border-2 transition-all",
          inWish
           ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500"
           : "border-gray-300 dark:border-gray-600 text-gray-400 hover:border-red-300 hover:text-red-400",
         )}
        >
         ♥
        </button>
       </div>
      )}

      {/* Seller card */}
      {product.seller && (
       <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3 min-w-0">
         <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg shrink-0">🏪</div>
         <div className="min-w-0">
          <p className="text-xs text-gray-400">Sold by</p>
          <p className="text-sm font-black text-gray-900 dark:text-white truncate">{product.seller.storeName}</p>
          {product.seller.isVerified && <p className="text-[10px] text-blue-500 font-semibold">✓ Verified Seller</p>}
         </div>
        </div>
        <button
         onClick={() => nav("store", product.seller.storeSlug)}
         className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#C68313] text-[#C68313] hover:bg-[#C68313] hover:text-white transition-colors"
        >
         View Store →
        </button>
       </div>
      )}

      {/* SKU / Tags / Share */}
      <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
       <p><span className="font-semibold text-gray-700 dark:text-gray-300">SKU :</span> {product.sku ?? "—"}</p>
       {product.tags?.length > 0 && (
        <p><span className="font-semibold text-gray-700 dark:text-gray-300">Tags :</span> {product.tags.join(", ")}</p>
       )}
       <div className="flex items-center gap-2 pt-1">
        <span className="font-semibold text-gray-700 dark:text-gray-300">Share :</span>
        {["f", "𝕏", "p", "in"].map((icon) => (
         <button key={icon} className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-[#C68313] hover:text-white transition-colors">
          {icon}
         </button>
        ))}
       </div>
      </div>
     </div>
    </div>

    {/* Tabs */}
    <div className="mb-10">
     <div className="flex items-center gap-8 border-b border-gray-200 dark:border-gray-700 mb-8">
      {(["description", "additional", "review"] as Tab[]).map((t) => (
       <button
        key={t}
        onClick={() => setTab(t)}
        className={cn(
         "pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px",
         tab === t
          ? "border-[#C68313] text-[#C68313]"
          : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
        )}
       >
        {t === "additional" ? "Additional Information" : t.charAt(0).toUpperCase() + t.slice(1)}
       </button>
      ))}
     </div>

     {tab === "description" && (
      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-3 max-w-3xl">
       <p>{product.description ?? product.shortDesc ?? "No description available."}</p>
      </div>
     )}

     {tab === "additional" && (
      <div className="max-w-md space-y-0 text-sm">
       {[
        { label: "SKU", value: product.sku ?? "—" },
        { label: "Category", value: product.category?.name ?? "—" },
        { label: "Stock", value: String(product.stock ?? "—") },
        { label: "Seller", value: product.seller?.storeName ?? "—" },
       ].map(({ label, value }) => (
        <div key={label} className="flex gap-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
         <span className="w-24 font-semibold text-gray-700 dark:text-gray-300">{label}</span>
         <span className="text-gray-500 dark:text-gray-400">{value}</span>
        </div>
       ))}
      </div>
     )}

     {tab === "review" && (
      <div>
       <div className="flex flex-col md:flex-row gap-10 mb-10">
        <div className="text-center shrink-0">
         <p className="text-6xl font-black text-gray-900 dark:text-white">{rating}</p>
         <p className="text-xs text-gray-400 mt-1">out of 5</p>
         <p className="text-amber-400 text-xl mt-1">{"★".repeat(Math.min(5, Math.round(Number(rating))))}</p>
         <p className="text-xs text-gray-400 mt-1">({reviewCount.toLocaleString()} Review)</p>
        </div>
        <div className="flex-1 space-y-2.5">
         {ratingDist.map(({ rating: r, count }: any) => (
          <div key={r} className="flex items-center gap-3">
           <span className="text-xs text-gray-500 w-10 shrink-0">{r} Star</span>
           <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
             className="h-full rounded-full"
             style={{ width: `${Math.round((count / distTotal) * 100)}%`, backgroundColor: GOLD }}
            />
           </div>
          </div>
         ))}
        </div>
       </div>

       <div>
        <div className="flex items-center justify-between mb-5">
         <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Review List</h3>
          <p className="text-xs text-gray-400 mt-0.5">Showing {reviews.length} of {reviewCount.toLocaleString()} results</p>
         </div>
         <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Sort by :</span>
          <select className="bg-transparent font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
           <option>Newest</option>
           <option>Oldest</option>
           <option>Top Rated</option>
          </select>
         </div>
        </div>
        <div className="space-y-6">
         {reviews.map((r: any) => {
          const name = r.user?.name ?? r.name ?? "User";
          const dateStr = r.createdAt
           ? typeof r.createdAt === "string" && !r.createdAt.includes("T")
            ? r.createdAt
            : new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
           : "";
          return (
           <div key={r.id} className="flex gap-3 border-b border-gray-100 dark:border-gray-800 pb-5">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
             {r.user?.avatar
              ? <Image src={r.user.avatar} alt={name} width={40} height={40} className="rounded-full object-cover" />
              : name[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
             <div className="flex items-start justify-between">
              <div>
               <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
               {(r.verified ?? false) && <p className="text-[10px] text-gray-400">(Verified)</p>}
              </div>
              <span className="text-xs text-gray-400">{dateStr}</span>
             </div>
             <p className="text-amber-400 text-sm mt-1">{"★".repeat(r.rating)}</p>
             {r.title && <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{r.title}</p>}
             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.body ?? r.text}</p>
            </div>
           </div>
          );
         })}
        </div>
       </div>
      </div>
     )}
    </div>

    {/* Related Products */}
    {related.length > 0 && (
     <section>
      <h2 className="text-xl font-black text-gray-900 dark:text-white mb-5">Related Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
       {related.map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
     </section>
    )}
   </div>
  </div>
 );
}
