
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingCart, Minus, Plus, Trash2, ArrowRight, Tag } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { cn, formatPrice } from "../../lib/utils";
export function CartSidebar() {
  const { items, summary, isOpen, toggleCart, removeItem, updateQty, itemCount } = useCartStore();

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const subtotal   = summary.subtotal;
  const shipping   = summary.shippingCost;
  const grandTotal = summary.total;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn("fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={toggleCart}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-950 z-50 flex flex-col",
          "shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">My Cart</h2>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{itemCount()}</span>
          </div>
          <button onClick={toggleCart} aria-label="Close cart"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-4xl mb-4">🛒</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-400 mb-6">Discover amazing products and add them to your cart!</p>
              <button onClick={toggleCart}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item: any, idx: any) => (
              <div key={`${item.productId}-${item.variantId ?? ""}`}
                className="flex gap-3 pb-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
                {/* Image */}
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center  shrink-0 overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover" />
                  ) : <span className="text-2xl">🛍️</span>}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-0.5">{item.name}</h4>
                  {item.sku && <p className="text-xs text-gray-400 mb-2">SKU: {item.sku}</p>}
                  <div className="flex items-center justify-between">
                    {/* Qty */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1, item.variantId)}
                        className="w-6 h-6 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 transition-colors"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold text-gray-900 dark:text-white w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1, item.variantId)}
                        className="w-6 h-6 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 transition-colors"
                        aria-label="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-600">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
            {/* Coupon input */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                <Tag className="w-4 h-4 text-gray-400  shrink-0" />
                <input type="text" placeholder="Coupon code"
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400" />
              </div>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Apply
              </button>
            </div>
            {/* Summary */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal ({itemCount()} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className={shipping === 0 ? "text-green-600 font-semibold" : "text-gray-700 dark:text-gray-300"}>
                  {shipping === 0 ? "Free 🎉" : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Add {formatPrice(1000 - subtotal)} more for free shipping</p>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-blue-600">{formatPrice(grandTotal)}</span>
              </div>
            </div>
            {/* Checkout CTA */}
            <Link href="/checkout" onClick={toggleCart}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all active:scale-[0.98]">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/cart" onClick={toggleCart}
              className="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View Full Cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

 