"use client";
import { cn, formatPrice, useCartStore, useUIStore, useWishlistStore } from "@/app/lib/store";

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
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden group hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-md transition-all">
      <div onClick={() => nav("product", p.slug)} className="block w-full aspect-square bg-gray-50 dark:bg-gray-800 relative overflow-hidden cursor-pointer">
        <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">{p.emoji ?? "🛍️"}</div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {p.badge && <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full text-white", p.badge==="New"?"bg-blue-500":p.badge==="Sale"?"bg-red-500":p.badge==="Hot"?"bg-orange-500":p.badge==="Trending"?"bg-purple-500":"bg-violet-600")}>{p.badge}</span>}
          {disc > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-500 text-white">-{disc}%</span>}
          {p.isEco && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">🌿 Eco</span>}
          {p.isFlashSale && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">⚡ Flash</span>}
        </div>
        <button onClick={e => { e.stopPropagation(); toggleWish(p.id); }}
          className={cn("absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all", fav ? "bg-red-100 dark:bg-red-900/30 opacity-100" : "bg-white/80 dark:bg-gray-800/80 opacity-0 group-hover:opacity-100")}>
          <span className={cn("text-sm", fav ? "text-red-500" : "text-gray-400")}>♥</span>
        </button>
        {p.stock === 0 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white font-black text-sm bg-black/60 px-3 py-1 rounded-xl">Out of Stock</span></div>}
        {p.stock > 0 && p.stock <= 5 && <div className="absolute bottom-2 left-2 text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">Only {p.stock} left!</div>}
      </div>
      <div className="p-3">
        <p className="text-[10px] text-gray-400 mb-0.5">{p.seller?.storeName}</p>
        <button onClick={() => nav("product", p.slug)} className="block font-semibold text-xs text-gray-900 dark:text-white hover:text-violet-600 text-left line-clamp-2 mb-1.5 w-full transition-colors">{p.name}</button>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-amber-400 text-[10px]">{"★".repeat(Math.round(p.rating ?? p.averageRating ?? 0))}</span>
          <span className="text-[10px] text-gray-400">({(p.reviews ?? p.totalReviews ?? 0).toLocaleString()})</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2.5">
          <span className="font-black text-sm text-violet-600">{formatPrice(price)}</span>
          {orig > price && <span className="text-[10px] text-gray-400 line-through">{formatPrice(orig)}</span>}
        </div>
        {p.stock > 0 ? (
          <button onClick={() => addItem(p)} className={cn("w-full py-2 text-xs font-bold rounded-xl transition-all active:scale-95", inCart ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" : "bg-violet-600 text-white hover:bg-violet-700")}>
            {inCart ? "✓ Added" : "Add to Cart"}
          </button>
        ) : (
          <button disabled className="w-full py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed">Out of Stock</button>
        )}
        {p.freeShipping && <p className="text-[10px] text-green-600 font-semibold text-center mt-1.5">🚚 Free shipping</p>}
      </div>
    </div>
  );
}
