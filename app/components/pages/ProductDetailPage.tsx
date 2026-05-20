"use client";
import { useState, useEffect } from "react";
import {
  formatPrice,
  MOCK_PRODUCTS,
  cn,
  useCartStore,
  useUIStore,
  useWishlistStore,
  apiGet,
} from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

export function ProductDetailPage() {
  const { pageData, nav } = useUIStore();
  const { addItem } = useCartStore();
  const { toggle: toggleWish, isIn } = useWishlistStore();
  const [product, setProduct] = useState<any>(
    MOCK_PRODUCTS.find((p) => p.slug === pageData) ?? MOCK_PRODUCTS[0],
  );
  const [qty, setQty] = useState(1);
  const inWish = isIn(product?.id);

  useEffect(() => {
    if (!pageData) return;
    apiGet(`/api/products/${pageData}`, null)
      .then((d) => {
        if (d?.product) setProduct(d.product);
      })
      .catch(() => {});
  }, [pageData]);

  if (!product) return null;
  const price = Number(product.basePrice ?? product.price ?? 0);
  const orig = Number(product.comparePrice ?? product.originalPrice ?? 0);
  const disc = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
  const related = MOCK_PRODUCTS.filter(
    (p) => p.category?.name === product.category?.name && p.id !== product.id,
  ).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <button
          onClick={() => nav("home")}
          className="hover:text-violet-600 transition-colors"
        >
          Home
        </button>
        <span>/</span>
        <button
          onClick={() => nav("products")}
          className="hover:text-violet-600 transition-colors"
        >
          {product.category?.name}
        </button>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300 font-medium line-clamp-1">
          {product.name}
        </span>
      </nav>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 flex items-center justify-center aspect-square text-9xl">
          {product.emoji ?? "🛍️"}
        </div>
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {disc > 0 && (
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-green-500 text-white">
                  {disc}% OFF
                </span>
              )}
              {product.isEco && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  🌿 Eco-Friendly
                </span>
              )}
              {product.freeShipping && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  🚚 Free Shipping
                </span>
              )}
              {product.isFlashSale && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                  ⚡ Flash Sale
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
              {product.name}
            </h1>
            <p className="text-sm text-gray-400">
              by{" "}
              <span className="text-violet-600 font-semibold">
                {product.seller?.storeName}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">
              {"★".repeat(
                Math.round(product.rating ?? product.averageRating ?? 0),
              )}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {product.rating ?? product.averageRating ?? 0}
            </span>
            <span className="text-sm text-gray-400">
              ({(product.reviews ?? product.totalReviews ?? 0).toLocaleString()}{" "}
              reviews)
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-violet-600">
              {formatPrice(price)}
            </span>
            {orig > price && (
              <div>
                <span className="text-gray-400 line-through text-lg">
                  {formatPrice(orig)}
                </span>
                <span className="ml-2 text-green-600 font-bold text-sm">
                  Save {formatPrice(orig - price)}
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "text-sm font-semibold",
              (product.stock ?? 0) === 0
                ? "text-red-500"
                : (product.stock ?? 99) <= 5
                  ? "text-amber-500"
                  : "text-green-600",
            )}
          >
            {(product.stock ?? 0) === 0
              ? "❌ Out of Stock"
              : (product.stock ?? 99) <= 5
                ? `⚠️ Only ${product.stock} left!`
                : `✅ In Stock (${product.stock ?? "many"} units)`}
          </div>
          {(product.stock ?? 1) > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-2 py-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-violet-600 font-black text-lg transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-black text-gray-900 dark:text-white">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(Math.min(product.stock ?? 99, qty + 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-violet-600 font-black text-lg transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => addItem(product, qty)}
                className="flex-1 py-3.5 font-black rounded-2xl transition-all active:scale-95 bg-violet-600 text-white hover:bg-violet-700"
              >
                Add to Cart
              </button>
              <button
                onClick={() => toggleWish(product.id)}
                className={cn(
                  "p-3.5 rounded-2xl border-2 transition-all",
                  inWish
                    ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500"
                    : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-red-300 hover:text-red-500",
                )}
              >
                ♥
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              "100% Genuine Product",
              "7-Day Easy Returns",
              "Secure Payment",
              "Buyer Protection",
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="text-green-500">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-5">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
