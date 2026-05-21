"use client";
import { useState, useEffect } from "react";
import { formatPrice, MOCK_PRODUCTS, cn, useCartStore, useUIStore, useWishlistStore, apiGet } from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

const GOLD = "#C68313";

const RATING_BARS = [
 { stars: 5, pct: 78 },
 { stars: 4, pct: 12 },
 { stars: 3, pct: 5 },
 { stars: 2, pct: 3 },
 { stars: 1, pct: 2 },
];

const MOCK_REVIEWS = [
 { name: "Kristin Watson", verified: true, date: "1 month ago", rating: 5, text: "Amazing product! Exactly as described and delivery was fast." },
 { name: "Cameron Williamson", verified: true, date: "2 months ago", rating: 4, text: "Great quality. Will definitely buy again." },
 { name: "Brooklyn Simmons", verified: false, date: "3 months ago", rating: 5, text: "Very satisfied with this purchase." },
 { name: "Jacob Jones", verified: true, date: "3 months ago", rating: 4, text: "Good product, packaging was nice." },
];

type Tab = "description" | "additional" | "review";

export function ProductDetailPage() {
 const { pageData, nav } = useUIStore();
 const { addItem } = useCartStore();
 const { toggle: toggleWish, isIn } = useWishlistStore();
 const [product, setProduct] = useState<any>(
 MOCK_PRODUCTS.find((p) => p.slug === pageData) ?? MOCK_PRODUCTS[0],
 );
 const [qty, setQty] = useState(1);
 const [tab, setTab] = useState<Tab>("description");
 const [activeThumb, setActiveThumb] = useState(0);
 const inWish = isIn(product?.id);

 useEffect(() => {
 if (!pageData) return;
 apiGet(`/api/products/${pageData}`, null)
 .then((d) => { if (d?.product) setProduct(d.product); })
 .catch(() => {});
 }, [pageData]);

 if (!product) return null;
 const price = Number(product.basePrice ?? product.price ?? 0);
 const orig = Number(product.comparePrice ?? product.originalPrice ?? 0);
 const rating = Number(product.rating ?? product.averageRating ?? 4.8).toFixed(1);
 const reviews = product.reviews ?? product.totalReviews ?? 245;
 const related = MOCK_PRODUCTS.filter(
 (p) => p.category?.name === product.category?.name && p.id !== product.id,
 ).slice(0, 4);

 return (
 <div>
 {/* Shop banner */}
 <div className="bg-gray-100 dark:bg-gray-900 py-10 text-center">
 <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Shop</h1>
 <nav className="flex items-center justify-center gap-2 text-sm text-gray-400">
 <button onClick={() => nav("home")} className="hover:text-[#C68313] transition-colors">Home</button>
 <span>/</span>
 <button onClick={() => nav("products")} className="hover:text-[#C68313] transition-colors">Shop</button>
 <span>/</span>
 <span className="text-gray-600 dark:text-gray-300">Product Details</span>
 </nav>
 </div>

 <div className="max-w-7xl mx-auto px-4 py-10 pb-12">
 {/* Product section */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
 {/* Image column */}
 <div>
 <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-[#C68313]/20 overflow-hidden aspect-square flex items-center justify-center text-9xl mb-3 select-none">
 <span>{product.emoji ?? "🛍️"}</span>
 <button className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 font-bold text-lg hover:border-[#C68313] transition-colors shadow-sm">
 ‹
 </button>
 <button className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#2D3748] dark:bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-lg hover:opacity-80 transition-opacity shadow-sm">
 ›
 </button>
 </div>
 <div className="grid grid-cols-4 gap-2">
 {[0, 1, 2, 3].map((i) => (
 <button
 key={i}
 onClick={() => setActiveThumb(i)}
 className={cn(
 "aspect-square rounded-xl border-2 flex items-center justify-center text-3xl bg-white dark:bg-gray-900 transition-all",
 activeThumb === i
 ? "border-[#C68313]"
 : "border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100",
 )}
 >
 {product.emoji ?? "🛍️"}
 </button>
 ))}
 </div>
 </div>

 {/* Info column */}
 <div className="space-y-4">
 <p className="text-sm text-gray-400">{product.category?.name ?? "General"}</p>

 <div className="flex items-center gap-3 flex-wrap">
 <h1 className="text-2xl font-black text-gray-900 dark:text-white">{product.name}</h1>
 <span className={cn(
 "text-xs font-semibold px-3 py-1 rounded-full border",
 (product.stock ?? 1) > 0
 ? "border-[#C68313]/50 text-[#C68313] bg-amber-50 dark:bg-amber-900/20"
 : "border-red-400/50 text-red-500 bg-red-50 dark:bg-red-900/20",
 )}>
 {(product.stock ?? 1) > 0 ? "In Stock" : "Out of Stock"}
 </span>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-amber-400">{"★".repeat(Math.round(Number(rating)))}</span>
 <span className="text-sm font-bold text-gray-900 dark:text-white">{rating}</span>
 <span className="text-sm text-gray-400">({Number(reviews).toLocaleString()} Review)</span>
 </div>

 <div className="flex items-baseline gap-3">
 <span className="text-2xl font-black" style={{ color: GOLD }}>{formatPrice(price)}</span>
 {orig > price && <span className="text-gray-400 line-through">{formatPrice(orig)}</span>}
 </div>

 <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
 {product.description ?? "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore."}
 </p>


 {/* Qty + actions */}
 {(product.stock ?? 1) > 0 && (
 <div className="flex items-center gap-3 flex-wrap">
 <div className="flex items-center gap-3 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2">
 <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-gray-600 dark:text-gray-300 hover:text-[#C68313] font-black text-lg transition-colors">−</button>
 <span className="w-6 text-center font-black text-gray-900 dark:text-white">{qty}</span>
 <button onClick={() => setQty(Math.min(product.stock ?? 99, qty + 1))} className="text-gray-600 dark:text-gray-300 hover:text-[#C68313] font-black text-lg transition-colors">+</button>
 </div>
 <button
 onClick={() => addItem(product, qty)}
 className="flex-1 py-3 font-bold rounded-full text-white bg-[#2D3748] dark:bg-gray-700 hover:opacity-90 transition-opacity"
 >
 Add To Cart
 </button>
 <button
 onClick={() => { addItem(product, qty); nav("checkout"); }}
 className="flex-1 py-3 font-bold rounded-full text-white transition-opacity hover:opacity-90"
 style={{ backgroundColor: GOLD }}
 >
 Buy Now
 </button>
 <button
 onClick={() => toggleWish(product.id)}
 className={cn(
 "p-3 rounded-full border-2 transition-all",
 inWish
 ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500"
 : "border-gray-300 dark:border-gray-600 text-gray-400 hover:border-red-300 hover:text-red-400",
 )}
 >
 ♥
 </button>
 </div>
 )}

 {/* SKU / Tags / Share */}
 <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
 <p><span className="font-semibold text-gray-700 dark:text-gray-300">SKU :</span> {product.sku ?? "GRF R85648HGJ"}</p>
 <p><span className="font-semibold text-gray-700 dark:text-gray-300">Tags :</span> {product.category?.name ?? "General"}, {product.name}</p>
 <div className="flex items-center gap-2 pt-1">
 <span className="font-semibold text-gray-700 dark:text-gray-300">Share :</span>
 {["f", "𝕏", "p", "in"].map((icon) => (
 <button key={icon} className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-[#C68313] hover:text-white transition-colors">
 {icon}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="mb-10">
 <div className="flex items-center gap-8 border-b border-gray-200 dark:border-gray-700 mb-8">
 {(["description", "additional", "review"] as Tab[]).map((t) => (
 <button
 key={t}
 onClick={() => setTab(t)}
 className={cn(
 "pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px",
 tab === t
 ? "border-[#C68313] text-[#C68313]"
 : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
 )}
 >
 {t === "additional" ? "Additional Information" : t.charAt(0).toUpperCase() + t.slice(1)}
 </button>
 ))}
 </div>

 {tab === "description" && (
 <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-3 max-w-3xl">
 <p>{product.description ?? "This premium product is crafted with the finest materials, ensuring exceptional quality and performance. Perfect for everyday use, it combines functionality with style."}</p>
 <p>Our products are tested for quality and durability. We ensure every item meets the highest standards before reaching our customers.</p>
 </div>
 )}

 {tab === "additional" && (
 <div className="max-w-md space-y-0 text-sm">
 {[
 { label: "SKU", value: product.sku ?? "GRF R85648HGJ" },
 { label: "Category", value: product.category?.name ?? "General" },
 { label: "Stock", value: String(product.stock ?? "In Stock") },
 { label: "Weight", value: "0.5 kg" },
 ].map(({ label, value }) => (
 <div key={label} className="flex gap-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
 <span className="w-24 font-semibold text-gray-700 dark:text-gray-300">{label}</span>
 <span className="text-gray-500 dark:text-gray-400">{value}</span>
 </div>
 ))}
 </div>
 )}

 {tab === "review" && (
 <div>
 <div className="flex flex-col md:flex-row gap-10 mb-10">
 <div className="text-center shrink-0">
 <p className="text-6xl font-black text-gray-900 dark:text-white">{rating}</p>
 <p className="text-xs text-gray-400 mt-1">out of 5</p>
 <p className="text-amber-400 text-xl mt-1">{"★".repeat(Math.round(Number(rating)))}</p>
 <p className="text-xs text-gray-400 mt-1">({Number(reviews).toLocaleString()} Review)</p>
 </div>
 <div className="flex-1 space-y-2.5">
 {RATING_BARS.map(({ stars, pct }) => (
 <div key={stars} className="flex items-center gap-3">
 <span className="text-xs text-gray-500 w-10 shrink-0">{stars} Star</span>
 <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
 <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GOLD }} />
 </div>
 </div>
 ))}
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-5">
 <div>
 <h3 className="font-bold text-gray-900 dark:text-white">Review List</h3>
 <p className="text-xs text-gray-400 mt-0.5">Showing 1-4 of {Number(reviews).toLocaleString()} results</p>
 </div>
 <div className="flex items-center gap-2 text-sm text-gray-500">
 <span>Sort by :</span>
 <select className="bg-transparent font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
 <option>Newest</option>
 <option>Oldest</option>
 <option>Top Rated</option>
 </select>
 </div>
 </div>
 <div className="space-y-6">
 {MOCK_REVIEWS.map((r) => (
 <div key={r.name} className="flex gap-3 border-b border-gray-100 dark:border-gray-800 pb-5">
 <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
 {r.name[0]}
 </div>
 <div className="flex-1">
 <div className="flex items-start justify-between">
 <div>
 <p className="text-sm font-bold text-gray-900 dark:text-white">{r.name}</p>
 {r.verified && <p className="text-[10px] text-gray-400">(Verified)</p>}
 </div>
 <span className="text-xs text-gray-400">{r.date}</span>
 </div>
 <p className="text-amber-400 text-sm mt-1">{"★".repeat(r.rating)}</p>
 <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.text}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Related Products */}
 {related.length > 0 && (
 <section>
 <h2 className="text-xl font-black text-gray-900 dark:text-white mb-5">Related Products</h2>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {related.map((p) => <ProductCard key={p.id} product={p} />)}
 </div>
 </section>
 )}
 </div>
 </div>
 );
}
