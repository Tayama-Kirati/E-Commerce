"use client";
import { cn, formatPrice, useCartStore, useUIStore, useAuthStore } from "@/app/lib/store";

export function CartPage() {
  const { cartItems, removeItem, updateQty, clearCart, cartTotal, cartShipping, cartGrand } = useCartStore();
  const { nav } = useUIStore();
  const { user } = useAuthStore();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">🛒 Cart ({cartItems.length})</h1>
        {cartItems.length > 0 && <button onClick={clearCart} className="text-sm text-red-500 font-semibold hover:underline">Clear all</button>}
      </div>
      {cartItems.length === 0 ? (
        <div className="text-center py-24"><div className="text-7xl mb-5">🛒</div><h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Your cart is empty</h2><p className="text-gray-400 mb-8">Add some amazing products!</p><button onClick={() => nav("home")} className="px-8 py-3.5 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 transition-colors">Start Shopping</button></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {cartItems.map((item, idx) => (
              <div key={item.id} className={cn("flex gap-4 p-5", idx < cartItems.length-1 && "border-b border-gray-50 dark:border-gray-800")}>
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-4xl shrink-0">{item.emoji ?? "🛍️"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5 line-clamp-2">{item.name}</p>
                  {item.seller?.storeName && <p className="text-xs text-gray-400 mb-3">{item.seller.storeName}</p>}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      <button onClick={() => updateQty(item.id, item.qty-1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-violet-600 font-bold text-lg transition-colors">−</button>
                      <span className="w-8 text-center font-black text-gray-900 dark:text-white">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty+1)} disabled={item.qty>=(item.stock??99)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-violet-600 font-bold text-lg transition-colors disabled:opacity-30">+</button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-violet-600">{formatPrice(Number(item.basePrice??item.price??0) * item.qty)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-sm text-gray-400 hover:text-red-500 transition-colors font-semibold">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-fit sticky top-24">
            <h2 className="font-black text-gray-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold dark:text-white">{formatPrice(cartTotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className={cn("font-semibold", cartShipping===0?"text-green-600":"dark:text-white")}>{cartShipping===0?"Free 🎉":formatPrice(cartShipping)}</span></div>
              {cartShipping>0 && <p className="text-xs text-gray-400">Add {formatPrice(1000-cartTotal)} more for free shipping</p>}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-2.5 flex justify-between font-black text-lg"><span className="dark:text-white">Total</span><span className="text-violet-600">{formatPrice(cartGrand)}</span></div>
            </div>
            {user ? (
              <button onClick={() => nav("checkout")} className="w-full py-4 bg-linear-to-r from-violet-600 to-violet-700 text-white font-black rounded-2xl hover:from-violet-700 hover:to-violet-800 transition-all active:scale-[0.98] mb-3">Proceed to Checkout →</button>
            ) : (
              <button onClick={() => nav("login")} className="w-full py-4 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 transition-colors mb-3">Sign In to Checkout</button>
            )}
            <button onClick={() => nav("home")} className="w-full text-sm text-violet-600 font-semibold hover:underline">Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
}
