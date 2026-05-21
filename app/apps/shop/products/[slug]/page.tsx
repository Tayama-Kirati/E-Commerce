"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, Heart, Star, ChevronLeft } from "lucide-react";
import { useCartStore } from "@/app/store/cartStore";
import { toast } from "react-hot-toast";

type Product = {
 id: string;
 name: string;
 slug: string;
 shortDesc?: string;
 description?: string;
 basePrice: number;
 comparePrice?: number;
 averageRating: number;
 totalReviews: number;
 stock: number;
 images: { url: string; alt?: string; isPrimary?: boolean }[];
 seller?: { storeName: string; isVerified?: boolean };
 category?: { name: string; slug: string };
};

export default function ProductDetailPage() {
 const params = useParams();
 const router = useRouter();
 const slug = params?.slug as string;
 const [product, setProduct] = useState<Product | null>(null);
 const [loading, setLoading] = useState(true);
 const [activeImg, setActiveImg] = useState(0);
 const [qty, setQty] = useState(1);
 const { addItem } = useCartStore();

 useEffect(() => {
 if (!slug) return;
 fetch(`/api/products/${slug}`)
 .then((r) => r.json())
 .then((d) => { setProduct(d.product ?? null); setLoading(false); })
 .catch(() => setLoading(false));
 }, [slug]);

 const handleAddToCart = async () => {
 if (!product) return;
 try {
 for (let i = 0; i < qty; i++) await addItem(product.id);
 toast.success("Added to cart!");
 } catch (e: any) {
 toast.error(e.message ?? "Failed to add");
 }
 };

 if (loading) return (
 <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
 <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
 <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}</div>
 </div>
 );

 if (!product) return (
 <div className="text-center py-24">
 <p className="text-gray-400 text-lg mb-4">Product not found.</p>
 <button onClick={() => router.back()} className="text-blue-600 hover:underline flex items-center gap-1 mx-auto">
 <ChevronLeft className="w-4 h-4" /> Back to shop
 </button>
 </div>
 );

 const price = Number(product.basePrice);
 const compare = product.comparePrice ? Number(product.comparePrice) : null;
 const discount = compare ? Math.round((1 - price / compare) * 100) : null;

 return (
 <div className="max-w-6xl mx-auto px-4 py-8">
 <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors">
 <ChevronLeft className="w-4 h-4" /> Back
 </button>

 <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
 {/* Images */}
 <div className="space-y-3">
 <div className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
 {product.images[activeImg] ? (
 <Image src={product.images[activeImg].url} alt={product.name} width={600} height={600} className="w-full h-full object-cover" />
 ) : <div className="w-full h-full flex items-center justify-center text-6xl">🛍️</div>}
 </div>
 {product.images.length > 1 && (
 <div className="flex gap-2 overflow-x-auto">
 {product.images.map((img, i) => (
 <button key={i} onClick={() => setActiveImg(i)}
 className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${i === activeImg ? "border-blue-500" : "border-transparent"}`}>
 <Image src={img.url} alt={img.alt ?? ""} width={64} height={64} className="w-full h-full object-cover" />
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Info */}
 <div className="space-y-5">
 {product.category && <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{product.category.name}</span>}
 <h1 className="text-2xl font-black text-gray-900 dark:text-white">{product.name}</h1>

 {product.averageRating > 0 && (
 <div className="flex items-center gap-2">
 <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(product.averageRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}</div>
 <span className="text-sm text-gray-500">({product.totalReviews} reviews)</span>
 </div>
 )}

 <div className="flex items-baseline gap-3">
 <span className="text-3xl font-black text-blue-600">रू {price.toLocaleString()}</span>
 {compare && <span className="text-lg text-gray-400 line-through">रू {compare.toLocaleString()}</span>}
 {discount && <span className="text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg">{discount}% off</span>}
 </div>

 {product.shortDesc && <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{product.shortDesc}</p>}

 <div className="flex items-center gap-3">
 <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
 <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">−</button>
 <span className="px-4 py-2 font-semibold text-gray-900 dark:text-white">{qty}</span>
 <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">+</button>
 </div>
 <span className="text-sm text-gray-500">{product.stock} in stock</span>
 </div>

 <div className="flex gap-3">
 <button onClick={handleAddToCart} disabled={product.stock === 0}
 className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
 <ShoppingCart className="w-5 h-5" /> {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
 </button>
 <button className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all">
 <Heart className="w-5 h-5" />
 </button>
 </div>

 {product.seller && (
 <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
 <p className="text-sm text-gray-500">Sold by <span className="font-semibold text-gray-900 dark:text-white">{product.seller.storeName}</span>
 {product.seller.isVerified && <span className="ml-1 text-blue-600">✓</span>}</p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
