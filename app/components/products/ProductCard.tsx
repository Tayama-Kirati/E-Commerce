"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Eye, Zap, Leaf, Star } from "lucide-react";
import { cn, formatPrice, calculateDiscount } from "@/frontend/web/lib/utils";
import { useCartStore } from "@/frontend/web/store/cartStore";
import { useWishlistStore } from "@/frontend/web/store/wishlistStore";
import { toast } from "@/frontend/web/components/ui/Toast";
import type { ProductCardData } from "@/frontend/web/types";

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
  showQuickView?: boolean;
  onQuickView?: (product: ProductCardData) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  showQuickView = true,
  onQuickView,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addItem } = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const discountPct = product.comparePrice
    ? calculateDiscount(Number(product.basePrice), Number(product.comparePrice))
    : null;

  const primaryImage = product.images?.[0];
  const stockPercent = Math.min((product.stock / 50) * 100, 85);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOutOfStock || isAddingToCart) return;

      setIsAddingToCart(true);
      try {
        await addItem(product.id, null, 1);
        toast.success(`${product.name.slice(0, 30)}... added to cart!`);
      } catch {
        toast.error("Failed to add to cart. Please try again.");
      } finally {
        setIsAddingToCart(false);
      }
    },
    [product, isOutOfStock, isAddingToCart, addItem],
  );

  const handleWishlist = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await toggle(product.id);
        toast.success(
          inWishlist ? "Removed from wishlist" : "Added to wishlist! ❤️",
        );
      } catch {
        toast.error("Please sign in to use your wishlist");
      }
    },
    [product.id, inWishlist, toggle],
  );

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group relative flex flex-col bg-white rounded-2xl border border-gray-100",
        "overflow-hidden transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/50",
        "dark:bg-gray-900 dark:border-gray-800",
        className,
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800">
        {primaryImage && !imageError ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🛍️
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

        {discountPct && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPct}%
          </span>
        )}

        {product.isFlashSale && (
          <span className="absolute top-2.5 left-2.5 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Flash
          </span>
        )}

        {product.isEco && (
          <span className="absolute bottom-2 left-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Leaf className="w-3 h-3" />
            Eco
          </span>
        )}

        <button
          onClick={handleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center",
            "border transition-all duration-200 z-10",
            inWishlist
              ? "bg-red-50 border-red-300 text-red-500"
              : "bg-white border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500",
            "dark:bg-gray-800 dark:border-gray-700",
          )}
        >
          <Heart className="w-4 h-4" fill={inWishlist ? "currentColor" : "none"} />
        </button>

        {showQuickView && onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            aria-label="Quick view"
            className={cn(
              "absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center",
              "bg-white border border-gray-200 text-gray-600",
              "opacity-0 group-hover:opacity-100 transition-all duration-200",
              "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600",
              "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
            )}
          >
            <Eye className="w-4 h-4" />
          </button>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center">
            <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-3">
        {product.seller?.storeName && (
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">
            {product.seller.storeName}
          </p>
        )}

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1.5 flex-1">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-3 h-3",
                  star <= Math.round(product.averageRating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-200 fill-gray-200",
                )}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {product.averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">
            ({product.totalReviews.toLocaleString()})
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-base font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(Number(product.basePrice), product.currency)}
          </span>
          {product.comparePrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(Number(product.comparePrice), product.currency)}
            </span>
          )}
          {discountPct && (
            <span className="text-xs text-green-600 font-semibold">
              Save{" "}
              {formatPrice(
                Number(product.comparePrice) - Number(product.basePrice),
                product.currency,
              )}
            </span>
          )}
        </div>

        {!isOutOfStock && product.stock <= 30 && (
          <div className="mb-2">
            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-green-400 to-amber-400 rounded-full transition-all"
                style={{ width: `${stockPercent}%` }}
              />
            </div>
            <p
              className={cn(
                "text-xs mt-0.5",
                isLowStock ? "text-red-500 font-semibold" : "text-gray-400",
              )}
            >
              {isLowStock ? `Only ${product.stock} left!` : `${product.stock} in stock`}
            </p>
          </div>
        )}

        {product.freeShipping && (
          <span className="text-xs text-green-600 font-medium mb-2">
            🚚 Free Delivery
          </span>
        )}
      </div>

      {/* Add to Cart */}
      <div className="px-3 pb-3">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAddingToCart}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl",
            "text-sm font-semibold transition-all duration-200 active:scale-95",
            isOutOfStock
              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800"
              : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
          )}
        >
          {isAddingToCart ? (
            <span className="animate-pulse">Adding...</span>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock ? "Unavailable" : "Add to Cart"}
            </>
          )}
        </button>
      </div>
    </Link>
  );
};

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-100 dark:bg-gray-800" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
    </div>
    <div className="px-3 pb-3">
      <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div>
  </div>
);
