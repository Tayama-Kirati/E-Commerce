"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Product = {
 id: string;
 name: string;
 slug: string;
 basePrice: number;
 comparePrice?: number;
 averageRating: number;
 images: { url: string; alt?: string }[];
};

export default function CategoryPage() {
 const params = useParams();
 const slug = params?.slug as string;
 const [products, setProducts] = useState<Product[]>([]);
 const [loading, setLoading] = useState(true);
 const [categoryName, setCategoryName] = useState("");

 useEffect(() => {
 if (!slug) return;
 fetch(`/api/products?categorySlug=${slug}&limit=24`)
 .then((r) => r.json())
 .then((d) => {
 setProducts(d.products ?? []);
 setCategoryName(d.category?.name ?? slug);
 setLoading(false);
 })
 .catch(() => setLoading(false));
 }, [slug]);

 return (
 <div className="max-w-7xl mx-auto px-4 py-8">
 <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6 capitalize">
 {categoryName || slug}
 </h1>

 {loading ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
 {[...Array(8)].map((_, i) => (
 <div key={i} className="aspect-3/4 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
 ))}
 </div>
 ) : products.length === 0 ? (
 <div className="text-center py-24">
 <p className="text-gray-400 mb-4">No products in this category yet.</p>
 <Link href="/shop" className="text-blue-600 hover:underline">Browse all products</Link>
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
 {products.map((p) => (
 <Link key={p.id} href={`/shop/products/${p.slug}`}
 className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all group">
 <div className="aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden">
 {p.images[0] ? (
 <Image src={p.images[0].url} alt={p.images[0].alt ?? p.name} width={300} height={300}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
 ) : <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>}
 </div>
 <div className="p-3">
 <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">{p.name}</p>
 <div className="flex items-center gap-2">
 <span className="font-black text-blue-600">रू {Number(p.basePrice).toLocaleString()}</span>
 {p.comparePrice && <span className="text-xs text-gray-400 line-through">रू {Number(p.comparePrice).toLocaleString()}</span>}
 </div>
 </div>
 </Link>
 ))}
 </div>
 )}
 </div>
 );
}
