"use client";
import Image from "next/image";
import { formatPrice, useCartStore, useUIStore, useWishlistStore } from "@/app/lib/store";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const MUTED    = "var(--color-muted)";
const IVORY    = "var(--color-surface-warm)";

// ── SVG icons ─────────────────────────────────────────────────────────────────
function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : "currentColor"} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
    </svg>
  );
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  );
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
    </svg>
  );
}

export function ProductCard({ product: p }: { product: any }) {
  const { addItem }   = useCartStore();
  const { nav }       = useUIStore();
  const { toggle: toggleWish, isIn: inWish } = useWishlistStore();
  const { cartItems } = useCartStore();
  const inCart = cartItems.some(i => i.id === p.id);
  const price  = Number(p.basePrice ?? p.price ?? 0);
  const orig   = Number(p.comparePrice ?? p.originalPrice ?? 0);
  const disc   = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
  const fav    = inWish(p.id);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden group transition-all duration-300"
      style={{ border: `1px solid ${BORDER}` }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = GOLD;
        el.style.boxShadow   = "0 8px 28px rgba(198,131,19,0.12)";
        el.style.transform   = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = BORDER;
        el.style.boxShadow   = "none";
        el.style.transform   = "none";
      }}
    >
      {/* ── Image area ───────────────────────────────── */}
      <div className="relative w-full aspect-square bg-white overflow-hidden cursor-pointer"
        onClick={() => nav("product", p.slug)}>

        {/* Product image */}
        {p.images?.[0]?.url ? (
          <Image
            src={p.images[0].url}
            alt={p.images[0].alt ?? p.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl transition-transform duration-500 group-hover:scale-105">
            🛍️
          </div>
        )}

        {/* Discount badge — top left */}
        {disc > 0 && (
          <span className="absolute top-3 left-3 text-[11px] font-black px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: "#1C1A16" }}>
            {disc}% off
          </span>
        )}

        {/* Out of stock overlay */}
        {p.stock === 0 && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-sm px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* ── Hover: right-side icon column ── */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2
          opacity-0 group-hover:opacity-100 transition-all duration-300
          translate-x-2 group-hover:translate-x-0">

          {/* Wishlist */}
          <button
            onClick={e => { e.stopPropagation(); toggleWish(p.id); }}
            title="Save to Wishlist"
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90"
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
            }}>
            <IconHeart filled={fav} />
          </button>

          {/* Quick view */}
          <button
            onClick={e => { e.stopPropagation(); nav("product", p.slug); }}
            title="Quick View"
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90"
            style={{ backgroundColor: "rgba(255,255,255,0.95)", border: `1px solid ${BORDER}`, color: CHARCOAL }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = IVORY; e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.95)"; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL; }}>
            <IconEye />
          </button>

          {/* Add to cart */}
          {p.stock > 0 && (
            <button
              onClick={e => { e.stopPropagation(); addItem(p); }}
              title="Add to Cart"
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90"
              style={{ backgroundColor: inCart ? "rgba(198,131,19,0.12)" : "rgba(255,255,255,0.95)", border: `1px solid ${inCart ? GOLD : BORDER}`, color: inCart ? GOLD : CHARCOAL }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = inCart ? "rgba(198,131,19,0.12)" : "rgba(255,255,255,0.95)";
                e.currentTarget.style.borderColor = inCart ? GOLD : BORDER;
                e.currentTarget.style.color = inCart ? GOLD : CHARCOAL;
              }}>
              <IconCart />
            </button>
          )}
        </div>

        {/* ── Hover: Quick add bar at bottom ── */}
        {p.stock > 0 && (
          <div
            onClick={e => { e.stopPropagation(); addItem(p); }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-3 text-xs font-black text-white cursor-pointer
              translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            style={{ backgroundColor: inCart ? "#9B6210" : "#1C1A16" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = GOLD; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = inCart ? "#9B6210" : "#1C1A16"; }}>
            {inCart ? "✓ Added to cart" : `Quick add — ${formatPrice(price)}`}
          </div>
        )}
      </div>

      {/* ── Info ─────────────────────────────────────── */}
      <div className="p-3" style={{ borderTop: `1px solid ${IVORY}` }}>
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[10px]" style={{ color: MUTED }}>{p.category?.name ?? p.seller?.storeName}</p>
          <div className="flex items-center gap-0.5">
            <span className="text-[10px]" style={{ color: GOLD }}>★</span>
            <span className="text-[10px] font-semibold" style={{ color: MUTED }}>{(p.rating ?? p.averageRating ?? 0).toFixed(1)}</span>
          </div>
        </div>

        <button onClick={() => nav("product", p.slug)}
          className="block text-xs font-semibold text-left line-clamp-2 mb-2 w-full transition-colors duration-200"
          style={{ color: CHARCOAL }}
          onMouseEnter={e => e.currentTarget.style.color = GOLD}
          onMouseLeave={e => e.currentTarget.style.color = CHARCOAL}>
          {p.name}
        </button>

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-black text-sm" style={{ color: GOLD }}>{formatPrice(price)}</span>
          {orig > price && <span className="text-[10px] line-through" style={{ color: MUTED }}>{formatPrice(orig)}</span>}
        </div>

        {p.freeShipping && (
          <p className="text-[10px] font-semibold mt-1" style={{ color: "#16A34A" }}>🚚 Free shipping</p>
        )}
      </div>
    </div>
  );
}
