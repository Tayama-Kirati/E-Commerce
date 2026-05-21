"use client";
import { useState, useEffect } from "react";
import { cn, formatPrice, timeAgo, MOCK_ORDERS, useUIStore, apiGet } from "@/app/lib/store";

export function OrderDetailPage() {
 const { pageData, nav } = useUIStore();
 const [data, setData] = useState<any>(null);

 useEffect(() => {
 if (!pageData) return;
 apiGet(`/api/orders/${pageData}`, null)
 .then(d => setData(d))
 .catch(() => setData({ order: MOCK_ORDERS.find(o => o.id === pageData) ?? MOCK_ORDERS[0], cancellable: false }));
 }, [pageData]);

 if (!data) return <div className="max-w-4xl mx-auto px-4 py-16 text-center"><div className="text-5xl mb-3">⏳</div><p className="text-gray-400">Loading order details…</p></div>;

 const { order } = data;
 if (!order) return null;

 const STATUS_STEPS = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED"];
 const currentStep = STATUS_STEPS.indexOf(order.status);

 return (
 <div className="max-w-4xl mx-auto px-4 py-8">
 <div className="flex items-center gap-3 mb-6">
 <button onClick={() => nav("orders")} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors">←</button>
 <div>
 <h1 className="text-xl font-black text-gray-900 dark:text-white">Order {order.orderNumber}</h1>
 <p className="text-sm text-gray-400">{timeAgo(order.createdAt)}</p>
 </div>
 </div>
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-5">
 <h2 className="font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">📦 Order Timeline</h2>
 {order.trackingNumber && (
 <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-xl px-4 py-3 mb-5">
 <span>🚚</span>
 <div className="flex-1">
 <p className="text-xs text-violet-600 font-semibold">Tracking Number</p>
 <p className="font-mono font-bold text-sm text-gray-900 dark:text-white">{order.trackingNumber}</p>
 </div>
 </div>
 )}
 <div className="relative">
 <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />
 {STATUS_STEPS.map((step, i) => {
 const done = !["CANCELLED","RETURN_REQUESTED"].includes(order.status) && currentStep >= i;
 const active = order.status === step;
 const LABELS: Record<string, string> = { PENDING:"Order Placed",CONFIRMED:"Confirmed",PROCESSING:"Packing",SHIPPED:"Shipped",OUT_FOR_DELIVERY:"Out for Delivery",DELIVERED:"Delivered" };
 const ICONS: Record<string, string> = { PENDING:"📋",CONFIRMED:"✅",PROCESSING:"📦",SHIPPED:"🚚",OUT_FOR_DELIVERY:"🛵",DELIVERED:"🎉" };
 return (
 <div key={step} className="flex items-start gap-4 mb-5 relative">
 <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 text-sm border-2 transition-all", active?"bg-violet-600 border-violet-600 text-white ring-4 ring-violet-100 dark:ring-violet-900/40 scale-110":done?"bg-violet-600 border-violet-600 text-white":"bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300")}>
 {ICONS[step]}
 </div>
 <div className="flex-1 pt-0.5">
 <p className={cn("font-semibold text-sm", done?"text-gray-900 dark:text-white":"text-gray-400")}>{LABELS[step]}{active && <span className="ml-2 text-[10px] text-violet-600 font-black animate-pulse">● NOW</span>}</p>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-5">
 <h2 className="font-black text-gray-900 dark:text-white mb-4">Order Items</h2>
 {order.items?.map((item: any, i: number) => (
 <div key={i} className="flex gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
 <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-3xl shrink-0">{item.emoji ?? "🛍️"}</div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.product?.name ?? item.name}</p>
 <p className="text-xs text-gray-400">×{item.quantity ?? item.qty}</p>
 </div>
 <p className="font-black text-violet-600">{formatPrice(Number(item.total ?? item.price ?? 0))}</p>
 </div>
 ))}
 <div className="pt-3 space-y-1.5 text-sm">
 <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold dark:text-white">{formatPrice(Number(order.subtotal??order.total??0))}</span></div>
 <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={cn("font-semibold", Number(order.shippingCost??0)===0?"text-green-600":"dark:text-white")}>{Number(order.shippingCost??0)===0?"Free 🎉":formatPrice(Number(order.shippingCost??0))}</span></div>
 <div className="flex justify-between font-black text-base border-t border-gray-100 dark:border-gray-800 pt-2"><span className="dark:text-white">Total</span><span className="text-violet-600">{formatPrice(Number(order.total??0))}</span></div>
 </div>
 </div>
 <div className="flex gap-3">
 <button onClick={() => nav("track")} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-semibold text-sm rounded-xl hover:bg-violet-700 transition-colors">📍 Track Order</button>
 <button onClick={() => nav("orders")} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">← All Orders</button>
 </div>
 </div>
 );
}
