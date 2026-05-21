"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Package, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

type Product = {
 id: string;
 name: string;
 slug: string;
 basePrice: number;
 stock: number;
 status: string;
 isActive: boolean;
 images: { url: string }[];
 totalSales: number;
};

export default function SellerProductsPage() {
 const [products, setProducts] = useState<Product[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetch("/api/seller/products?limit=50")
 .then((r) => r.json())
 .then((d) => { setProducts(d.products ?? []); setLoading(false); })
 .catch(() => setLoading(false));
 }, []);

 const toggleActive = async (slug: string, current: boolean) => {
 await fetch(`/api/products/${slug}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ isActive: !current }),
 });
 setProducts((prev) => prev.map((p) => p.slug === slug ? { ...p, isActive: !current } : p));
 toast.success(current ? "Product hidden" : "Product visible");
 };

 return (
 <div className="max-w-5xl mx-auto px-4 py-8">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <Package className="w-6 h-6 text-blue-600" />
 <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Products</h1>
 </div>
 <Link href="/seller/dashboard"
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors">
 <Plus className="w-4 h-4" /> Add Product
 </Link>
 </div>

 {loading ? (
 <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
 ) : products.length === 0 ? (
 <div className="text-center py-24">
 <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-400 mb-4">No products yet.</p>
 <Link href="/seller/dashboard" className="text-blue-600 hover:underline">Add your first product</Link>
 </div>
 ) : (
 <div className="space-y-3">
 {products.map((p) => (
 <div key={p.id} className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
 <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 shrink-0">
 {p.images[0] ? (
 <Image src={p.images[0].url} alt={p.name} width={64} height={64} className="w-full h-full object-cover" />
 ) : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
 <p className="text-sm text-gray-500">रू {Number(p.basePrice).toLocaleString()} · {p.stock} in stock · {p.totalSales} sold</p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.status}</span>
 <button onClick={() => toggleActive(p.slug, p.isActive)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" title={p.isActive ? "Hide" : "Show"}>
 {p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
