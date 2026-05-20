"use client";
import { MOCK_PRODUCTS, useUIStore, useWishlistStore } from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

export function WishlistPage() {
  const { nav } = useUIStore();
  const { ids: wishIds } = useWishlistStore();
  const items = MOCK_PRODUCTS.filter(p => wishIds.includes(p.id));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">❤️ My Wishlist ({items.length})</h1>
      {items.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-7xl mb-4">💝</div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Wishlist is empty</h3>
          <p className="text-gray-400 mb-6">Save products you love for later!</p>
          <button onClick={() => nav("home")} className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Explore Products</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
