// Public order tracking page
 
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
 Package,
 Search,
 Truck,
 MapPin,
 CheckCircle,
 Clock,
 X,
 Phone,
 Star,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/app/lib/utils";
import { toast } from "react-hot-toast";

export default function TrackPage() {
 const searchParams = useSearchParams();
 const { data: session } = useSession();
 const [input, setInput] = useState(searchParams.get("order") ?? "");
 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 // Auto-load if order in URL
 useEffect(() => {
 const orderId = searchParams.get("order");
 if (orderId) {
 setInput(orderId);
 fetchTracking(orderId);
 }
 }, []);

 const fetchTracking = async (orderId = input) => {
 if (!orderId.trim()) {
 setError("Please enter an order number");
 return;
 }
 if (!session?.user) {
 setError("Please sign in to track your order");
 return;
 }
 setLoading(true);
 setError("");
 const res = await fetch(`/api/orders/${orderId.trim()}/track`);
 const json = await res.json();
 setLoading(false);
 if (!res.ok) {
 setError(json.error ?? "Order not found");
 setData(null);
 } else setData(json);
 };

 const { order, timeline } = data ?? {};

 const STATUS_COLORS: Record<string, string> = {
 PENDING: "text-yellow-700 bg-yellow-100",
 CONFIRMED: "text-blue-700 bg-blue-100",
 PROCESSING: "text-blue-700 bg-blue-100",
 SHIPPED: "text-blue-700 bg-blue-100",
 OUT_FOR_DELIVERY: "text-orange-700 bg-orange-100",
 DELIVERED: "text-green-700 bg-green-100",
 CANCELLED: "text-red-700 bg-red-100",
 RETURN_REQUESTED: "text-amber-700 bg-amber-100",
 RETURNED: "text-gray-600 bg-gray-100",
 REFUNDED: "text-teal-700 bg-teal-100",
 };

 return (
 <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
 {/* Hero */}
 <div className="bg-linear-to-r from-blue-600 to-blue-700 py-14 px-4">
 <div className="max-w-2xl mx-auto text-center">
 <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
 <Package className="w-7 h-7 text-white" />
 </div>
 <h1 className="text-3xl font-black text-white mb-2">
 Track Your Order
 </h1>
 <p className="text-blue-200 mb-8">
 Enter your order number to get real-time delivery updates
 </p>

 {/* Search box */}
 <div className="flex gap-2 max-w-lg mx-auto">
 <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-lg">
 <Search className="w-5 h-5 text-gray-400 shrink-0" />
 <input
 type="text"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && fetchTracking()}
 placeholder="e.g. NX-2025-47832"
 className="flex-1 text-gray-900 font-mono font-semibold outline-none placeholder:text-gray-300 placeholder:font-normal"
 aria-label="Order number"
 />
 {input && (
 <button
 onClick={() => {
 setInput("");
 setData(null);
 setError("");
 }}
 >
 <X className="w-4 h-4 text-gray-400" />
 </button>
 )}
 </div>
 <button
 onClick={() => fetchTracking()}
 disabled={loading}
 className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-colors disabled:opacity-60 flex items-center gap-2"
 >
 {loading ? (
 <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : (
 "Track"
 )}
 </button>
 </div>

 {error && (
 <div className="mt-4 bg-red-100 text-red-700 rounded-xl px-4 py-2.5 text-sm font-semibold max-w-lg mx-auto">
 ⚠️ {error}
 </div>
 )}
 </div>
 </div>

 {/* Result */}
 <div className="max-w-3xl mx-auto px-4 py-8">
 {!data && !loading && (
 <div className="text-center py-12">
 <div className="text-6xl mb-4">📦</div>
 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
 Where is my order?
 </h3>
 <p className="text-gray-400 text-sm">
 Enter your order number above to track your delivery
 </p>
 {!session?.user && (
 <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 max-w-sm mx-auto">
 <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold mb-3">
 Sign in to track orders
 </p>
 <Link
 href="/login?callbackUrl=/track"
 className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors"
 >
 Sign In
 </Link>
 </div>
 )}
 </div>
 )}

 {data && order && (
 <div className="space-y-5 animate-fade-in">
 {/* Order summary card */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
 <div>
 <p className="text-xs text-gray-400">Order Number</p>
 <p className="font-mono font-black text-lg text-blue-600">
 {order.orderNumber}
 </p>
 <p className="text-sm text-gray-400 mt-0.5">
 {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} ·{" "}
 {formatPrice(0)}
 </p>
 </div>
 <span
 className={cn(
 "text-sm font-bold px-3 py-1.5 rounded-full",
 STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600",
 )}
 >
 {order.status.replace("_", " ")}
 </span>
 </div>

 {/* Delivery address */}
 {order.address && (
 <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4">
 <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
 <div className="text-sm">
 <p className="font-semibold text-gray-900 dark:text-white">
 {order.address.fullName}
 </p>
 <p className="text-gray-500">
 {order.address.street}, {order.address.city},{" "}
 {order.address.district}
 </p>
 <a
 href={`tel:${order.address.phone}`}
 className="text-blue-600 font-semibold flex items-center gap-1 mt-0.5 hover:underline"
 >
 <Phone className="w-3 h-3" /> {order.address.phone}
 </a>
 </div>
 </div>
 )}

 {/* Tracking number */}
 {order.trackingNumber && (
 <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
 <Truck className="w-4 h-4 text-blue-600 shrink-0" />
 <div className="flex-1">
 <p className="text-xs text-blue-600 font-semibold">
 Tracking Number
 </p>
 <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
 {order.trackingNumber}
 </p>
 </div>
 <div className="flex gap-1">
 <button
 onClick={() => {
 navigator.clipboard.writeText(order.trackingNumber);
 toast.success("Copied!");
 }}
 className="text-xs text-blue-600 font-semibold hover:underline"
 >
 Copy
 </button>
 {order.trackingUrl && (
 <a
 href={order.trackingUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs text-blue-600 font-semibold hover:underline ml-3"
 >
 Track →
 </a>
 )}
 </div>
 </div>
 )}

 {/* ETA */}
 {order.estimatedDelivery &&
 !["DELIVERED", "CANCELLED"].includes(order.status) && (
 <div className="flex items-center gap-2 mt-3 text-sm">
 <Clock className="w-4 h-4 text-blue-500" />
 <span className="text-gray-500">Expected by:</span>
 <span className="font-bold text-gray-900 dark:text-white">
 {new Date(order.estimatedDelivery).toLocaleDateString(
 "en-NP",
 { weekday: "long", day: "numeric", month: "long" },
 )}
 </span>
 </div>
 )}
 {order.deliveredAt && (
 <div className="flex items-center gap-2 mt-3 text-sm">
 <CheckCircle className="w-4 h-4 text-green-500" />
 <span className="text-gray-500">Delivered on:</span>
 <span className="font-bold text-green-600">
 {new Date(order.deliveredAt).toLocaleDateString("en-NP", {
 weekday: "long",
 day: "numeric",
 month: "long",
 })}
 </span>
 </div>
 )}
 </div>

 {/* Full timeline */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
 <h2 className="font-bold text-gray-900 dark:text-white mb-5">
 Delivery Timeline
 </h2>
 <div className="relative">
 <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />
 <div className="space-y-6">
 {(timeline ?? []).map((step: any, idx: number) => (
 <div key={idx} className="flex items-start gap-4 relative">
 <div
 className={cn(
 "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 text-sm border-2 transition-all",
 step.active
 ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40 scale-110"
 : step.done
 ? "bg-blue-600 border-blue-600 text-white"
 : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300",
 )}
 >
 {step.done ? "✓" : step.icon}
 </div>
 <div className="flex-1 pt-0.5">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <p
 className={cn(
 "font-semibold text-sm",
 step.done
 ? "text-gray-900 dark:text-white"
 : "text-gray-400",
 )}
 >
 {step.label}
 {step.active && (
 <span className="ml-2 text-[10px] text-blue-600 font-black animate-pulse">
 ● NOW
 </span>
 )}
 </p>
 {step.time && (
 <span className="text-xs text-gray-400">
 {timeAgo(step.time)}
 </span>
 )}
 </div>
 <p
 className={cn(
 "text-xs mt-0.5",
 step.done ? "text-gray-500" : "text-gray-300",
 )}
 >
 {step.note ?? step.desc}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-3 flex-wrap">
 <Link
 href={`/account/orders/${order.id}`}
 className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors"
 >
 View Full Details
 </Link>
 <Link
 href="/account/orders"
 className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 >
 All Orders
 </Link>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
