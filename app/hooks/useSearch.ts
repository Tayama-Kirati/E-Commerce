
import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";

interface SearchResult {
  products:   any[];
  categories: any[];
  sellers:    any[];
}

export function useSearch() {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [trending, setTrending]     = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  // Fetch trending searches on mount
  useEffect(() => {
    fetch("/api/search/trending")
      .then((r) => r.json())
      .then((d) => setTrending(d.trending ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => { setResults(data); setIsSearching(false); })
      .catch((err) => { if (err.name !== "AbortError") setIsSearching(false); });

    return () => controller.abort();
  }, [debouncedQuery]);

  const clear = useCallback(() => { setQuery(""); setResults(null); }, []);

  return { query, setQuery, results, isSearching, trending, clear };
}
