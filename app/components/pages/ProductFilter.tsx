"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Slider } from "@/app/components/ui/Slider";
import { Checkbox } from "@/app/components/ui/Checkbox";

interface FilterState {
 minPrice: number;
 maxPrice: number;
 brands: string[];
 ratings: number[];
 colors: string[];
 sizes: string[];
 delivery: string[];
 inStock: boolean;
 isEco: boolean;
 freeShipping: boolean;
}

interface ProductFiltersProps {
 maxPriceLimit?: number;
 brands?: { name: string; count: number }[];
 colors?: { name: string; hex: string }[];
 sizes?: string[];
 className?: string;
 onClose?: () => void;
}

const COLOR_PRESETS = [
 { name: "Black", hex: "#000000" },
 { name: "White", hex: "#FFFFFF" },
 { name: "Red", hex: "#DC2626" },
 { name: "Blue", hex: "#2563EB" },
 { name: "Green", hex: "#16A34A" },
 { name: "Yellow", hex: "#D97706" },
 { name: "Purple", hex: "#7C3AED" },
 { name: "Pink", hex: "#EC4899" },
 { name: "Gray", hex: "#6B7280" },
 { name: "Brown", hex: "#92400E" },
];

export const ProductFilters: React.FC<ProductFiltersProps> = ({
 maxPriceLimit = 500000,
 brands = [],
 colors = COLOR_PRESETS,
 sizes = [],
 className,
 onClose,
}) => {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();

 const [filters, setFilters] = React.useState<FilterState>({
 minPrice: Number(searchParams.get("minPrice")) || 0,
 maxPrice: Number(searchParams.get("maxPrice")) || maxPriceLimit,
 brands: searchParams.get("brand")?.split(",") || [],
 ratings: searchParams.get("rating")?.split(",").map(Number) || [],
 colors: searchParams.get("color")?.split(",") || [],
 sizes: searchParams.get("size")?.split(",") || [],
 delivery: searchParams.get("delivery")?.split(",") || [],
 inStock: searchParams.get("inStock") === "true",
 isEco: searchParams.get("isEco") === "true",
 freeShipping:searchParams.get("freeShipping") === "true",
 });

 const applyFilters = () => {
 const params = new URLSearchParams(searchParams.toString());
 const set = (key: string, val: string | null) =>
 val ? params.set(key, val) : params.delete(key);

 set("minPrice", filters.minPrice > 0 ? String(filters.minPrice) : null);
 set("maxPrice", filters.maxPrice < maxPriceLimit ? String(filters.maxPrice) : null);
 set("brand", filters.brands.length ? filters.brands.join(",") : null);
 set("color", filters.colors.length ? filters.colors.join(",") : null);
 set("size", filters.sizes.length ? filters.sizes.join(",") : null);
 set("delivery", filters.delivery.length ? filters.delivery.join(",") : null);
 set("inStock", filters.inStock ? "true" : null);
 set("isEco", filters.isEco ? "true" : null);
 set("freeShipping", filters.freeShipping ? "true" : null);
 params.set("page", "1");

 router.push(`${pathname}?${params.toString()}`);
 onClose?.();
 };

 const clearFilters = () => {
 setFilters({
 minPrice: 0, maxPrice: maxPriceLimit, brands: [], ratings: [],
 colors: [], sizes: [], delivery: [], inStock: false, isEco: false, freeShipping: false,
 });
 router.push(pathname);
 onClose?.();
 };

 const toggleArray = <T,>(arr: T[], val: T): T[] =>
 arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

 const activeCount = [
 filters.brands.length > 0,
 filters.colors.length > 0,
 filters.sizes.length > 0,
 filters.delivery.length > 0,
 filters.minPrice > 0 || filters.maxPrice < maxPriceLimit,
 filters.inStock,
 filters.isEco,
 filters.freeShipping,
 ].filter(Boolean).length;

 return (
 <aside className={cn("flex flex-col gap-0", className)}>
 <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
 <h2 className="font-bold text-gray-900 dark:text-white">
 Filters
 {activeCount > 0 && (
 <span className="ml-2 text-xs bg-amber-100 text-[#C68313] px-2 py-0.5 rounded-full font-semibold">
 {activeCount}
 </span>
 )}
 </h2>
 {activeCount > 0 && (
 <button
 onClick={clearFilters}
 className="text-xs text-[#C68313] hover:text-violet-700 font-semibold"
 >
 Clear all
 </button>
 )}
 </div>

 <FilterSection title="Price Range">
 <Slider
 min={0}
 max={maxPriceLimit}
 value={[filters.minPrice, filters.maxPrice]}
 onChange={([min, max]) =>
 setFilters((f) => ({ ...f, minPrice: min, maxPrice: max }))
 }
 />
 <div className="flex items-center gap-2 mt-3">
 <input
 type="number"
 value={filters.minPrice}
 onChange={(e) =>
 setFilters((f) => ({ ...f, minPrice: Number(e.target.value) }))
 }
 className="w-24 px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:bg-gray-800 dark:text-white"
 placeholder="Min"
 />
 <span className="text-gray-400 text-xs">—</span>
 <input
 type="number"
 value={filters.maxPrice}
 onChange={(e) =>
 setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))
 }
 className="w-24 px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:bg-gray-800 dark:text-white"
 placeholder="Max"
 />
 </div>
 </FilterSection>

 {brands.length > 0 && (
 <FilterSection title="Brand">
 <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
 {brands.map((brand) => (
 <Checkbox
 key={brand.name}
 label={brand.name}
 count={brand.count}
 checked={filters.brands.includes(brand.name)}
 onChange={() =>
 setFilters((f) => ({
 ...f,
 brands: toggleArray(f.brands, brand.name),
 }))
 }
 />
 ))}
 </div>
 </FilterSection>
 )}

 <FilterSection title="Rating">
 {[5, 4, 3].map((r) => (
 <button
 key={r}
 onClick={() =>
 setFilters((f) => ({ ...f, ratings: toggleArray(f.ratings, r) }))
 }
 className={cn(
 "flex items-center gap-2 w-full py-1.5 px-2 rounded-lg text-sm transition-colors",
 filters.ratings.includes(r)
 ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30"
 : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
 )}
 >
 <div className="flex items-center gap-0.5">
 {[1, 2, 3, 4, 5].map((s) => (
 <Star
 key={s}
 className={cn(
 "w-3 h-3",
 s <= r ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200",
 )}
 />
 ))}
 </div>
 <span className="text-xs">{r === 5 ? "5 stars only" : `${r}+ stars`}</span>
 </button>
 ))}
 </FilterSection>

 <FilterSection title="Color">
 <div className="flex flex-wrap gap-2">
 {colors.map((c) => (
 <button
 key={c.name}
 onClick={() =>
 setFilters((f) => ({
 ...f,
 colors: toggleArray(f.colors, c.name),
 }))
 }
 title={c.name}
 aria-label={c.name}
 className={cn(
 "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
 filters.colors.includes(c.name)
 ? "border-blue-500 scale-110 shadow-sm"
 : "border-transparent",
 )}
 style={{
 background: c.hex,
 borderColor: c.hex === "#FFFFFF" ? "#E5E7EB" : undefined,
 }}
 />
 ))}
 </div>
 </FilterSection>

 {sizes.length > 0 && (
 <FilterSection title="Size">
 <div className="flex flex-wrap gap-2">
 {sizes.map((s) => (
 <button
 key={s}
 onClick={() =>
 setFilters((f) => ({ ...f, sizes: toggleArray(f.sizes, s) }))
 }
 className={cn(
 "px-3 py-1 text-xs rounded-lg border transition-colors",
 filters.sizes.includes(s)
 ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30"
 : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300",
 )}
 >
 {s}
 </button>
 ))}
 </div>
 </FilterSection>
 )}

 <FilterSection title="Delivery Time">
 {[
 { val: "same_day", label: "Same day" },
 { val: "next_day", label: "Next day" },
 { val: "2_3_days", label: "2–3 days" },
 { val: "standard", label: "Standard (5–7 days)" },
 ].map((d) => (
 <Checkbox
 key={d.val}
 label={d.label}
 checked={filters.delivery.includes(d.val)}
 onChange={() =>
 setFilters((f) => ({
 ...f,
 delivery: toggleArray(f.delivery, d.val),
 }))
 }
 />
 ))}
 </FilterSection>

 <FilterSection title="Options">
 <Checkbox
 label="In Stock Only"
 checked={filters.inStock}
 onChange={() => setFilters((f) => ({ ...f, inStock: !f.inStock }))}
 />
 <Checkbox
 label="🌿 Eco-Friendly"
 checked={filters.isEco}
 onChange={() => setFilters((f) => ({ ...f, isEco: !f.isEco }))}
 />
 <Checkbox
 label="🚚 Free Shipping"
 checked={filters.freeShipping}
 onChange={() => setFilters((f) => ({ ...f, freeShipping: !f.freeShipping }))}
 />
 </FilterSection>

 <button
 onClick={applyFilters}
 className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
 >
 Apply Filters
 </button>
 </aside>
 );
};

interface FilterSectionProps {
 title: string;
 children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, children }) => {
 const [open, setOpen] = React.useState(true);

 return (
 <div className="py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
 <button
 onClick={() => setOpen((v) => !v)}
 className="flex items-center justify-between w-full mb-3 text-left"
 >
 <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
 <svg
 className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")}
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M19 9l-7 7-7-7"
 />
 </svg>
 </button>
 {open && <div className="space-y-1.5">{children}</div>}
 </div>
 );
};
