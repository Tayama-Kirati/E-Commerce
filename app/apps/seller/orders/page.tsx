"use client";

import { useState, useEffect } from "react";
import { Package } from "lucide-react";

type Order = {
 id: string;
 orderNumber: string;
 status: string;
 total: number;
 createdAt: string;
 items: { product: { name: string }; quantity: number; price: number }[];
 user: { name?: string; email: string };
};

const STATUS_COLORS: Record<string, string> = {
 PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
 CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
 SHIPPED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
 DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
 CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function SellerOrdersPage() {
 const [orders, setOrders] = useState<Order[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetch("/api/seller/orders?limit=50")
 .then((r) => r.json())
 .then((d) => { setOrders(d.orders ?? []); setLoading(false); })
 .catch(() => setLoading(false));
 }, []);

 return (
 <div className="max-w-5xl mx-auto px-4 py-8">
 <div className="flex items-center gap-3 mb-6">
 <Package className="w-6 h-6 text-blue-600" />
 <h1 className="text-2xl font-black text-gray-900 dark:text-white">Orders</h1>
 </div>

 {loading ? (
 <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
 ) : orders.length === 0 ? (
 <div className="text-center py-24">
 <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-400">No orders yet.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {orders.map((order) => (
 <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <div className="flex items-center justify-between mb-3">
 <div>
 <p className="font-bold text-gray-900 dark:text-white">#{order.orderNumber}</p>
 <p className="text-xs text-gray-400">{order.user.name ?? order.user.email} · {new Date(order.createdAt).toLocaleDateString()}</p>
 </div>
 <div className="flex items-center gap-3">
 <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>{order.status}</span>
 <span className="font-black text-blue-600">रू {Number(order.total).toLocaleString()}</span>
 </div>
 </div>
 <div className="space-y-1">
 {order.items.map((item, i) => (
 <p key={i} className="text-sm text-gray-600 dark:text-gray-400">
 {item.product.name} × {item.quantity}
 </p>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
