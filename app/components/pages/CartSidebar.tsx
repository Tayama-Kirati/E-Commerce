"use client";
import { useEffect } from "react";
import { cn, formatPrice, useCartStore, useUIStore } from "@/app/lib/store";

export function CartSidebar() {
  const { cartItems, cartOpen, toggleCart, removeItem, updateQty, clearCart,
          cartCount, cartTotal, cartShipping, cartGrand } = useCartStore();
  const { nav } = useUIStore();

  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen]);

  const pct = Math.min((cartTotal / 1000) * 100, 100);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300",
          cartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-950 z-50 flex flex-col",
          "shadow-2xl transition-transform duration-300 ease-in-out",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">My Cart</h2>
            {cartCount > 0 && (
              <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </div>
          <button
            onClick={toggleCart}
            aria-label="Close cart"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Free shipping progress */}
        {cartTotal > 0 && cartTotal < 1000 && (
          <div className="px-5 py-3 bg-violet-50 dark:bg-violet-900/10 border-b border-violet-100 dark:border-violet-900/20">
            <div className="flex justify-between text-xs font-semibold text-violet-700 dark:text-violet-400 mb-1.5">
              <span>🚚 Free shipping at रू 1,000</span>
              <span>{formatPrice(1000 - cartTotal)} away</span>
            </div>
            <div className="h-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        {cartTotal >= 1000 && (
          <div className="px-5 py-2.5 bg-green-50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/20 text-xs font-semibold text-green-700 dark:text-green-400 text-center">
            🎉 You&apos;ve unlocked free shipping!
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-4xl mb-4">🛒</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-400 mb-6">Discover amazing products and add them to your cart!</p>
              <button
                onClick={() => { toggleCart(); nav("products"); }}
                className="px-6 py-2.5 bg-violet-600 text-white font-semibold text-sm rounded-xl hover:bg-violet-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div
                key={item.id}
                className="flex gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                {/* Emoji thumbnail */}
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-3xl shrink-0">
                  {item.emoji ?? "🛍️"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    {/* Qty controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-6 h-6 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-violet-600 transition-colors text-sm"
                        aria-label="Decrease"
                      >−</button>
                      <span className="text-sm font-bold text-gray-900 dark:text-white w-6 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        disabled={item.qty >= item.stock}
                        className="w-6 h-6 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-violet-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Increase"
                      >+</button>
                    </div>

                    {/* Price + remove */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-violet-600">
                        {formatPrice(Number(item.basePrice) * item.qty)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors text-xs"
                        aria-label="Remove item"
                      >🗑</button>
                    </div>
                  </div>
                  {item.freeShipping && (
                    <p className="text-[10px] text-green-600 font-semibold mt-1">🚚 Free shipping</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            {/* Summary */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Subtotal ({cartCount} items)</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                <span className={cartShipping === 0 ? "text-green-600 font-semibold" : "text-gray-700 dark:text-gray-300"}>
                  {cartShipping === 0 ? "Free 🎉" : formatPrice(cartShipping)}
                </span>
              </div>
              <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-violet-600">{formatPrice(cartGrand)}</span>
              </div>
            </div>

            {/* CTAs */}
            <button
              onClick={() => { toggleCart(); nav("checkout"); }}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98]"
            >
              Proceed to Checkout →
            </button>
            <button
              onClick={() => { toggleCart(); nav("cart"); }}
              className="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
            >
              View Full Cart
            </button>
            <button
              onClick={clearCart}
              className="flex items-center justify-center w-full py-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
