"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
 ShoppingCart,
 Trash2,
 Minus,
 Plus,
 Tag,
 Gift,
 ArrowRight,
 RefreshCcw,
 ShoppingBag,
 Heart,
 ChevronRight,
 Truck,
 Shield,
 Leaf,
 Zap,
 X,
 ChevronDown,
 Info,
 AlertTriangle,
 RotateCcw,
} from "lucide-react";
import { useCartStore, CartItem } from "@/app/store/cartStore";
import { useWishlistStore } from "@/app/store/wishlistStore";
import { cn, formatPrice } from "@/app/lib/utils";
import { toast } from "react-hot-toast";

export default function CartPage() {
 const router = useRouter();
 const { data: session } = useSession();
 const {
 items,
 savedItems,
 summary,
 isSyncing,
 removeItem,
 updateQty,
 saveForLater,
 moveToCart,
 clearCart,
 syncFromServer,
 } = useCartStore();
 const { toggle: wishlistToggle } = useWishlistStore();

 const [coupon, setCoupon] = useState("");
 const [couponApplied, setCouponApplied] = useState(false);
 const [couponDiscount, setCouponDiscount] = useState(0);
 const [couponLoading, setCouponLoading] = useState(false);
 const [promoExpanded, setPromoExpanded] = useState(false);

 // Sync on mount if logged in
 useEffect(() => {
 if (session?.user) syncFromServer();
 }, [session?.user]);

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
 } else {
 toast.error(data.error ?? "Invalid coupon");
 }
 };

 const removeCoupon = () => {
 setCouponApplied(false);
 setCouponCode("");
 setCouponDiscount(0);
 };
 const setCouponCode = (v: string) => setCoupon(v);

 const finalTotal = summary.total - couponDiscount;
 const isEmptyCart = items.length === 0;

 return (
 <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
 <div className="max-w-6xl mx-auto px-4 py-8">
 {/* Header */}
 <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
 <div className="flex items-center gap-3">
 <ShoppingCart className="w-7 h-7 text-blue-600" />
 <div>
 <h1 className="text-2xl font-black text-gray-900 dark:text-white">
 My Cart
 </h1>
 <p className="text-sm text-gray-400">
 {summary.totalItems} item{summary.totalItems !== 1 ? "s" : ""}
 {summary.savings > 0 &&
 ` · You're saving ${formatPrice(summary.savings)}!`}
 </p>
 </div>
 </div>
 {!isEmptyCart && (
 <div className="flex gap-2">
 <button
 onClick={syncFromServer}
 disabled={isSyncing}
 className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors disabled:opacity-40"
 aria-label="Refresh cart"
 >
 <RefreshCcw
 className={cn("w-4 h-4", isSyncing && "animate-spin")}
 />
 </button>
 <button
 onClick={() => {
 if (confirm("Clear your cart?")) clearCart();
 }}
 className="flex items-center gap-1.5 px-3 py-2 border border-red-200 dark:border-red-800 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
 >
 <Trash2 className="w-4 h-4" /> Clear
 </button>
 </div>
 )}
 </div>

 {isEmptyCart ? (
 /* Empty state */
 <div className="flex flex-col items-center justify-center py-24 text-center">
 <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 text-5xl">
 🛒
 </div>
 <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
 Your cart is empty
 </h2>
 <p className="text-gray-400 mb-8 max-w-sm">
 Looks like you haven't added anything yet. Browse our collection
 and find something you love!
 </p>
 <Link
 href="/"
 className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-bold text-base rounded-2xl hover:bg-blue-700 active:scale-95 transition-all"
 >
 <ShoppingBag className="w-5 h-5" /> Start Shopping
 </Link>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
 {/* Left: items */}
 <div className="space-y-4">
 {/* Unavailable warning */}
 {summary.hasUnavailable && (
 <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
 <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0mt-0.5" />
 <div>
 <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
 Some items are unavailable
 </p>
 <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
 Please remove unavailable items before checking out.
 </p>
 </div>
 </div>
 )}

 {/* Free shipping progress */}
 {!summary.freeShipping && summary.threshold > 0 && (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-4">
 <div className="flex items-center gap-2 mb-2">
 <Truck className="w-4 h-4 text-blue-600" />
 <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
 Add{" "}
 <span className="text-blue-600 font-black">
 {formatPrice(summary.threshold)}
 </span>{" "}
 more for free delivery!
 </p>
 </div>
 <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
 <div
 className="h-full bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
 style={{
 width: `${Math.min((summary.subtotal / 1000) * 100, 100)}%`,
 }}
 />
 </div>
 <p className="text-xs text-gray-400 mt-1">
 {formatPrice(summary.subtotal)} / {formatPrice(1000)} ·
 <span className="text-green-600 font-semibold ml-1">
 Free shipping above रू 1,000
 </span>
 </p>
 </div>
 )}

 {summary.freeShipping && (
 <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-3">
 <Truck className="w-4 h-4 text-green-600" />
 <p className="text-sm font-semibold text-green-700 dark:text-green-400">
 🎉 You qualify for free delivery!
 </p>
 </div>
 )}

 {/* Cart items */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
 {items.map((item, idx) => (
 <CartItemRow
 key={`${item.productId}-${item.variantId}`}
 item={item}
 isLast={idx === items.length - 1}
 onRemove={() => removeItem(item.productId, item.variantId)}
 onQtyChange={(q) =>
 updateQty(item.productId, q, item.variantId)
 }
 onSaveForLater={() =>
 saveForLater(item.productId, item.variantId)
 }
 onWishlist={() => wishlistToggle(item.productId)}
 />
 ))}
 </div>

 {/* Saved for later */}
 {savedItems.length > 0 && (
 <div>
 <h2 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider mb-3 px-1">
 Saved for Later ({savedItems.length})
 </h2>
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
 {savedItems.map((item, idx) => (
 <SavedItemRow
 key={`saved-${item.productId}-${item.variantId}`}
 item={item}
 isLast={idx === savedItems.length - 1}
 onMoveToCart={() =>
 moveToCart(item.productId, item.variantId)
 }
 onRemove={() =>
 removeItem(item.productId, item.variantId)
 }
 />
 ))}
 </div>
 </div>
 )}

 {/* Continue shopping */}
 <Link
 href="/"
 className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 px-1 transition-colors"
 >
 <ChevronRight className="w-4 h-4 rotate-180" /> Continue
 Shopping
 </Link>
 </div>

 {/* Right: summary */}
 <div className="space-y-4">
 {/* Coupon */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
 <button
 onClick={() => setPromoExpanded((v) => !v)}
 className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 >
 <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
 <Tag className="w-4 h-4 text-blue-600" />
 {couponApplied
 ? `Coupon "${coupon}" applied `
 : "Have a coupon or promo code?"}
 </div>
 <ChevronDown
 className={cn(
 "w-4 h-4 text-gray-400 transition-transform",
 promoExpanded && "rotate-180",
 )}
 />
 </button>
 {promoExpanded && (
 <div className="px-5 pb-4 border-t border-gray-50 dark:border-gray-800">
 {couponApplied ? (
 <div className="flex items-center justify-between mt-3">
 <div>
 <p className="text-sm font-bold text-green-600">
 −{formatPrice(couponDiscount)} saved!
 </p>
 <p className="text-xs text-gray-400">
 Code: <code className="font-mono">{coupon}</code>
 </p>
 </div>
 <button
 onClick={removeCoupon}
 className="text-xs text-red-500 font-semibold hover:underline flex items-center gap-1"
 >
 <X className="w-3.5 h-3.5" /> Remove
 </button>
 </div>
 ) : (
 <div className="flex gap-2 mt-3">
 <input
 type="text"
 value={coupon}
 onChange={(e) =>
 setCouponCode(e.target.value.toUpperCase())
 }
 onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
 placeholder="Enter coupon code"
 className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 uppercase"
 maxLength={20}
 />
 <button
 onClick={applyCoupon}
 disabled={couponLoading || !coupon.trim()}
 className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
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
 )}
 </div>

 {/* Order summary card */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <h2 className="font-bold text-gray-900 dark:text-white text-base mb-4">
 Order Summary
 </h2>
 <div className="space-y-2.5 text-sm">
 <div className="flex justify-between">
 <span className="text-gray-500">
 Subtotal ({summary.totalItems} items)
 </span>
 <span className="font-semibold text-gray-900 dark:text-white">
 {formatPrice(summary.subtotal)}
 </span>
 </div>
 {summary.savings > 0 && (
 <div className="flex justify-between text-green-600">
 <span>Item Discount</span>
 <span className="font-semibold">
 −{formatPrice(summary.savings)}
 </span>
 </div>
 )}
 <div className="flex justify-between">
 <span className="text-gray-500">Delivery</span>
 <span
 className={cn(
 "font-semibold",
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
 {couponApplied && couponDiscount > 0 && (
 <div className="flex justify-between text-green-600">
 <span>Coupon ({coupon})</span>
 <span className="font-semibold">
 −{formatPrice(couponDiscount)}
 </span>
 </div>
 )}
 <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between text-base font-black">
 <span className="text-gray-900 dark:text-white">Total</span>
 <span className="text-blue-600">
 {formatPrice(finalTotal)}
 </span>
 </div>
 {summary.savings + couponDiscount > 0 && (
 <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2 flex items-center gap-2">
 <Gift className="w-4 h-4 text-green-600 shrink-0" />
 <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
 You're saving{" "}
 {formatPrice(summary.savings + couponDiscount)} on this
 order!
 </p>
 </div>
 )}
 </div>

 {/* CTA */}
 {session?.user ? (
 <Link
 href="/checkout"
 className="flex items-center justify-center gap-2 w-full mt-5 py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white font-black text-base rounded-2xl hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all"
 >
 Proceed to Checkout <ArrowRight className="w-5 h-5" />
 </Link>
 ) : (
 <div className="mt-5 space-y-3">
 <Link
 href="/login?callbackUrl=/checkout"
 className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors"
 >
 Sign in to Checkout
 </Link>
 <Link
 href="/checkout"
 className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 >
 Guest Checkout
 </Link>
 </div>
 )}

 {/* Trust badges */}
 <div className="flex items-center justify-center gap-5 mt-4 flex-wrap">
 {[
 {
 icon: <Shield className="w-3.5 h-3.5" />,
 label: "Buyer Protection",
 },
 {
 icon: <Truck className="w-3.5 h-3.5" />,
 label: "Fast Delivery",
 },
 {
 icon: <RotateCcw className="w-3.5 h-3.5" />,
 label: "7-Day Returns",
 },
 ].map((t) => (
 <div
 key={t.label}
 className="flex items-center gap-1 text-xs text-gray-400"
 >
 <span className="text-blue-400">{t.icon}</span>
 {t.label}
 </div>
 ))}
 </div>

 {/* Payment methods */}
 <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
 <p className="text-xs text-gray-400 text-center mb-2">
 Accepted payments
 </p>
 <div className="flex gap-2 justify-center flex-wrap">
 {["eSewa", "Khalti", "Visa", "Mastercard", "COD"].map(
 (m) => (
 <span
 key={m}
 className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold px-2.5 py-1 rounded-lg"
 >
 {m}
 </span>
 ),
 )}
 </div>
 </div>
 </div>

 {/* Recommended */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
 <Zap className="w-4 h-4 text-amber-500" /> You might also
 like
 </h3>
 <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
 {[
 { name: "AirPods Pro 4", price: 32000, emoji: "🎧" },
 { name: "iPad Air M2", price: 89000, emoji: "📱" },
 { name: "Apple Watch", price: 45000, emoji: "⌚" },
 ].map((p) => (
 <Link
 key={p.name}
 href="/products"
 className="shrink-0w-28 group"
 >
 <div className="w-28 h-28 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-3xl mb-2 group-hover:scale-105 transition-transform">
 {p.emoji}
 </div>
 <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
 {p.name}
 </p>
 <p className="text-xs font-bold text-blue-600 mt-0.5">
 {formatPrice(p.price)}
 </p>
 </Link>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}

// ─── Cart Item Row 
function CartItemRow({
 item,
 isLast,
 onRemove,
 onQtyChange,
 onSaveForLater,
 onWishlist,
}: {
 item: CartItem;
 isLast: boolean;
 onRemove: () => void;
 onQtyChange: (q: number) => void;
 onSaveForLater: () => void;
 onWishlist: () => void;
}) {
 const [removing, setRemoving] = useState(false);

 return (
 <div
 className={cn(
 "flex gap-4 p-4 sm:p-5 transition-colors",
 !isLast && "border-b border-gray-50 dark:border-gray-800",
 !item.available && "opacity-60 bg-gray-50/50 dark:bg-gray-800/30",
 )}
 >
 {/* Image */}
 <Link href={`/products/${item.slug}`} className="shrink-0relative">
 <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center text-3xl hover:opacity-80 transition-opacity">
 {item.image ? (
 <Image
 src={item.image}
 alt={item.name}
 width={80}
 height={80}
 className="object-cover"
 />
 ) : (
 "🛍️"
 )}
 </div>
 {item.discountPercent && item.discountPercent > 0 ? (
 <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
 -{item.discountPercent}%
 </span>
 ) : null}
 {item.isEco && (
 <span className="absolute -bottom-1 -left-1 bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
 <Leaf className="w-2.5 h-2.5" />
 Eco
 </span>
 )}
 </Link>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <Link
 href={`/products/${item.slug}`}
 className="block font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors text-sm line-clamp-2 mb-0.5"
 >
 {item.name}
 </Link>
 {item.variantName && (
 <p className="text-xs text-gray-400 mb-1">{item.variantName}</p>
 )}
 {item.sellerName && (
 <p className="text-xs text-gray-400 mb-1">by {item.sellerName}</p>
 )}

 {/* Unavailable / stock warning */}
 {!item.available && (
 <div className="flex items-center gap-1 text-xs text-red-500 font-semibold mb-1">
 <AlertTriangle className="w-3.5 h-3.5" /> Unavailable — remove to
 continue
 </div>
 )}
 {item.stockWarning && item.available && (
 <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mb-1">
 <Info className="w-3.5 h-3.5" /> {item.stockWarning}
 </div>
 )}

 {/* Qty + price row */}
 <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
 {/* Qty controls */}
 <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl px-1 py-1">
 <button
 onClick={() => onQtyChange(item.quantity - 1)}
 className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 transition-all disabled:opacity-40"
 disabled={item.quantity <= 1}
 aria-label="Decrease"
 >
 <Minus className="w-3.5 h-3.5" />
 </button>
 <span className="w-8 text-center text-sm font-black text-gray-900 dark:text-white">
 {item.quantity}
 </span>
 <button
 onClick={() => onQtyChange(item.quantity + 1)}
 className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 transition-all disabled:opacity-40"
 disabled={item.quantity >= item.maxQty}
 aria-label="Increase"
 >
 <Plus className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Price */}
 <div className="text-right">
 <p className="font-black text-blue-600">
 {formatPrice(item.price * item.quantity)}
 </p>
 {item.originalPrice && item.originalPrice > item.price && (
 <p className="text-xs text-gray-400 line-through">
 {formatPrice(item.originalPrice * item.quantity)}
 </p>
 )}
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-3 mt-2">
 <button
 onClick={onSaveForLater}
 className="text-xs text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1"
 >
 <RotateCcw className="w-3 h-3" /> Save for later
 </button>
 <span className="text-gray-200 dark:text-gray-700">|</span>
 <button
 onClick={onWishlist}
 className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
 >
 <Heart className="w-3 h-3" /> Wishlist
 </button>
 <span className="text-gray-200 dark:text-gray-700">|</span>
 <button
 onClick={() => {
 setRemoving(true);
 setTimeout(() => {
 onRemove();
 setRemoving(false);
 }, 200);
 }}
 disabled={removing}
 className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 ml-auto"
 >
 <Trash2 className="w-3 h-3" /> Remove
 </button>
 </div>
 </div>
 </div>
 );
}

// ─── Saved item row 
function SavedItemRow({
 item,
 isLast,
 onMoveToCart,
 onRemove,
}: {
 item: CartItem;
 isLast: boolean;
 onMoveToCart: () => void;
 onRemove: () => void;
}) {
 return (
 <div
 className={cn(
 "flex gap-3 p-4 transition-colors",
 !isLast && "border-b border-gray-50 dark:border-gray-800",
 )}
 >
 <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl">
 {item.image ? (
 <Image
 src={item.image}
 alt={item.name}
 width={56}
 height={56}
 className="object-cover"
 />
 ) : (
 "🛍️"
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
 {item.name}
 </p>
 <p className="text-sm font-bold text-blue-600">
 {formatPrice(item.price)}
 </p>
 </div>
 <div className="flex flex-col gap-1.5 shrink-0">
 <button
 onClick={onMoveToCart}
 className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 transition-colors"
 >
 Move to Cart
 </button>
 <button
 onClick={onRemove}
 className="text-xs text-gray-400 hover:text-red-500 transition-colors text-center"
 >
 Remove
 </button>
 </div>
 </div>
 );
}
