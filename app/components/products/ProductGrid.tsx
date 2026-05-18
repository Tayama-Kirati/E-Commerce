"use client";

import React from "react";
import { cn } from "@/frontend/web/lib/utils";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import type { ProductCardData } from "@/frontend/web/types";

interface ProductGridProps {
  products: ProductCardData[];
  isLoading?: boolean;
  skeletonCount?: number;
  onQuickView?: (product: ProductCardData) => void;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  skeletonCount = 8,
  onQuickView,
  className,
}) => {
  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-4">🔍</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No products found
        </h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Try adjusting your filters or search terms to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        : products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onQuickView}
            />
          ))}
    </div>
  );
};
