
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { ProductCardData } from "../types";

interface UseProductsOptions {
  initialPage?: number;
  limit?:       number;
  autoFetch?:   boolean;
}

interface ProductsResult {
  products:    ProductCardData[];
  total:       number;
  page:        number;
  totalPages:  number;
  hasMore:     boolean;
  isLoading:   boolean;
  isFetching:  boolean;
  error:       string | null;
  fetchMore:   () => void;
  refresh:     () => void;
  setPage:     (page: number) => void;
}

export function useProducts(options: UseProductsOptions = {}): ProductsResult {
  const { initialPage = 1, limit = 20, autoFetch = true } = options;
  const searchParams = useSearchParams();
  const [products, setProducts]   = useState<ProductCardData[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page",  String(p));
    params.set("limit", String(limit));
    return `/api/products?${params.toString()}`;
  }, [searchParams, limit]);

  const fetchProducts = useCallback(async (p: number, append = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!append) setIsLoading(true);
    else         setIsFetching(true);
    setError(null);

    try {
      const res  = await fetch(buildUrl(p), { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();

      setProducts((prev) => append ? [...prev, ...data.products] : data.products);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Failed to load products. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    if (autoFetch) { setPage(1); fetchProducts(1, false); }
  }, [searchParams.toString(), autoFetch]);

  const fetchMore = useCallback(() => {
    if (isFetching || page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    fetchProducts(next, true);
  }, [isFetching, page, totalPages, fetchProducts]);

  const refresh = useCallback(() => fetchProducts(1, false), [fetchProducts]);

  return {
    products, total, page, totalPages,
    hasMore: page < totalPages,
    isLoading, isFetching, error,
    fetchMore, refresh, setPage: (p) => { setPage(p); fetchProducts(p, false); },
  };
}
