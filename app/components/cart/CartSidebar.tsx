"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  Truck,
  Tag,
  Gift,
  ShoppingBag,
  RefreshCcw,
  Heart,
  AlertTriangle,
  RotateCcw,
  Zap,
  Leaf,
} from "lucide-react";
import { useCartStore } from "@/frontend/web/store/cartStore";
import { useWishlistStore } from "@/frontend/web/store/wishlistStore";
import { useSession } from "next-auth/react";
import { cn, formatPrice } from "@/frontend/web/lib/utils";
import { toast } from "react-hot-toast";

export function CartSidebar() {
  const { data: session } = useSession();
  const { toggle: wishToggle } = useWishlistStore();
  const {
    items,
    savedItems,
    summary,
    isOpen,
    isSyncing,
    closeCart,
    removeItem,
    updateQty,
    saveForLater,
    moveToCart,
    syncFromServer,
  } = useCartStore();

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Focus trap + scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      drawerRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Sync on open
  useEffect(() => {
    if (isOpen && session?.user) syncFromServer();
  }, [isOpen]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    const res = await fetch("/api/orders/validate-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: coupon.toUpperCase(),
        orderAmount: summary.subtotal,
      }),
    });
    const data = await res.json();
    setCouponLoading(false);
    if (data.valid) {
      setCouponApplied(true);
      setCouponDiscount(data.discount);
      toast.success(data.message);
    } else toast.error(data.error ?? "Invalid coupon");
  };

  const finalTotal = summary.subtotal + summary.shippingCost - couponDiscount;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-100 bg-white dark:bg-gray-950",
          "border-l border-gray-100 dark:border-gray-800",
          "flex flex-col shadow-2xl z-50",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800  shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              {summary.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {summary.totalItems > 99 ? "99+" : summary.totalItems}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-black text-gray-900 dark:text-white">Cart</h2>
              <p className="text-xs text-gray-400">
                {summary.totalItems > 0
                  ? `${summary.totalItems} item${summary.totalItems !== 1 ? "s" : ""}`
                  : "Empty"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={syncFromServer}
                disabled={isSyncing}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                aria-label="Refresh"
              >
                <RefreshCcw
                  className={cn("w-4 h-4", isSyncing && "animate-spin")}
                />
              </button>
            )}
            <button
              onClick={closeCart}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free shipping bar */}
        {items.length > 0 && (
          <div className="px-5 py-2.5 border-b border-gray-50 dark:border-gray-800  shrink-0">
            {summary.freeShipping ? (
              <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
                <Truck className="w-3.5 h-3.5" /> 🎉 Free delivery unlocked!
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <div className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Add{" "}
                    {formatPrice(summary.threshold)} for free shipping
                  </div>
                  <span className="text-blue-600 font-semibold">
                    {Math.round((summary.subtotal / 1000) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((summary.subtotal / 1000) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            /* Empty */
            <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-4xl mb-5">
                🛒
              </div>
              <h3 className="font-black text-gray-900 dark:text-white text-lg mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Add products to start your order
              </p>
              <button
                onClick={closeCart}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Browse Products
              </button>
            </div>
          ) : (
            <div>
              {/* Cart items */}
              {items.map((item: any, idx: any) => (
                <SidebarCartItem
                  key={`${item.productId}-${item.variantId ?? ""}`}
                  item={item}
                  isLast={idx === items.length - 1 && savedItems.length === 0}
                  onRemove={() => removeItem(item.productId, item.variantId)}
                  onInc={() =>
                    updateQty(item.productId, item.quantity + 1, item.variantId)
                  }
                  onDec={() =>
                    updateQty(item.productId, item.quantity - 1, item.variantId)
                  }
                  onSave={() => saveForLater(item.productId, item.variantId)}
                  onWishlist={() => {
                    wishToggle(item.productId);
                    toast.success("Added to wishlist ❤️");
                  }}
                  onClose={closeCart}
                />
              ))}

              {/* Saved for later */}
              {savedItems.length > 0 && (
                <div>
                  <p className="px-5 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
                    Saved for Later ({savedItems.length})
                  </p>
                  {savedItems.map((item: any) => (
                    <div
                      key={`saved-${item.productId}`}
                      className="flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800"
                    >
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden  shrink-0 flex items-center justify-center text-xl">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          "🛍️"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          moveToCart(item.productId, item.variantId);
                          toast.success("Moved to cart");
                        }}
                        className=" shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors self-center whitespace-nowrap"
                      >
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupon input (compact) */}
              <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800">
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-green-600" />
                      <div>
                        <p className="text-xs font-bold text-green-700 dark:text-green-400">
                          {coupon} applied!
                        </p>
                        <p className="text-xs text-green-600">
                          −{formatPrice(couponDiscount)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCouponApplied(false);
                        setCoupon("");
                        setCouponDiscount(0);
                      }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                      <Tag className="w-3.5 h-3.5 text-gray-400  shrink-0" />
                      <input
                        value={coupon}
                        onChange={(e) =>
                          setCoupon(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        placeholder="Coupon code"
                        className="flex-1 bg-transparent text-xs font-mono outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 uppercase"
                      />
                    </div>
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !coupon.trim()}
                      className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {couponLoading ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800  shrink-0 p-4 space-y-3">
            {/* Summary */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(summary.subtotal)}
                </span>
              </div>
              {summary.savings > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Savings</span>
                  <span>−{formatPrice(summary.savings)}</span>
                </div>
              )}
              {couponApplied && couponDiscount > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Coupon</span>
                  <span>−{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span
                  className={cn(
                    "font-semibold text-sm",
                    summary.freeShipping
                      ? "text-green-600"
                      : "text-gray-900 dark:text-white",
                  )}
                >
                  {summary.freeShipping
                    ? "Free 🎉"
                    : formatPrice(summary.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between font-black text-base border-t border-gray-100 dark:border-gray-800 pt-2">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-blue-600">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {session?.user ? (
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-linear-to-r from-blue-600 to-blue-700 text-white font-black text-sm rounded-2xl hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all"
              >
                Checkout · {formatPrice(finalTotal)}{" "}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login?callbackUrl=/checkout"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl hover:bg-blue-700 transition-colors"
                >
                  Sign in to Checkout
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex items-center justify-center w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Continue as Guest
                </Link>
              </div>
            )}

            <Link
              href="/cart"
              onClick={closeCart}
              className="flex items-center justify-center w-full text-xs text-blue-600 font-semibold hover:underline"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

function SidebarCartItem({
  item,
  isLast,
  onRemove,
  onInc,
  onDec,
  onSave,
  onWishlist,
  onClose,
}: {
  item: any;
  isLast: boolean;
  onRemove: () => void;
  onInc: () => void;
  onDec: () => void;
  onSave: () => void;
  onWishlist: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4",
        !isLast && "border-b border-gray-50 dark:border-gray-800",
        !item.available && "opacity-60 bg-red-50/30 dark:bg-red-900/5",
      )}
    >
      {/* Image */}
      <Link
        href={`/products/${item.slug}`}
        onClick={onClose}
        className="shrink-0 relative"
      >
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center text-2xl">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              width={64}
              height={64}
              className="object-cover"
            />
          ) : (
            "🛍️"
          )}
        </div>
        {item.discountPercent > 0 && (
          <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full">
            −{item.discountPercent}%
          </span>
        )}
        {item.isEco && (
          <span className="absolute -bottom-1 left-0 bg-green-100 text-green-700 text-[8px] font-bold px-1 py-0.5 rounded-full flex items-center gap-0.5">
            <Leaf className="w-2 h-2" />
            Eco
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.slug}`}
          onClick={onClose}
          className="block text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-2 leading-snug"
        >
          {item.name}
        </Link>
        {item.variantName && (
          <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>
        )}

        {!item.available && (
          <p className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-0.5">
            <AlertTriangle className="w-3 h-3" /> Unavailable
          </p>
        )}
        {item.stockWarning && item.available && (
          <p className="text-xs text-amber-600 font-semibold mt-0.5">
            {item.stockWarning}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          {/* Qty */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-0.5 py-0.5">
            <button
              onClick={onDec}
              disabled={item.quantity <= 1}
              aria-label="Decrease"
              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 disabled:opacity-30 transition-all"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center text-sm font-black text-gray-900 dark:text-white">
              {item.quantity}
            </span>
            <button
              onClick={onInc}
              disabled={item.quantity >= item.maxQty}
              aria-label="Increase"
              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 disabled:opacity-30 transition-all"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm font-black text-blue-600">
              {formatPrice(item.price * item.quantity)}
            </p>
            {item.originalPrice && item.originalPrice > item.price && (
              <p className="text-[10px] text-gray-400 line-through">
                {formatPrice(item.originalPrice * item.quantity)}
              </p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={onSave}
            className="text-[10px] text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-0.5"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Save
          </button>
          <span className="text-gray-200 dark:text-gray-700">·</span>
          <button
            onClick={onWishlist}
            className="text-[10px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
          >
            <Heart className="w-2.5 h-2.5" />
            Wishlist
          </button>
          <span className="text-gray-200 dark:text-gray-700">·</span>
          <button
            onClick={onRemove}
            className="text-[10px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5 ml-auto"
          >
            <Trash2 className="w-2.5 h-2.5" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
