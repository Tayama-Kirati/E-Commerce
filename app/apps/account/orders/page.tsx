"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
 Package,
 Search,
 ChevronRight,
 ChevronLeft,
 RefreshCcw,
 Download,
 RotateCcw,
 Eye,
 Star,
 X,
 Filter,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/app/lib/utils";
import { toast } from "react-hot-toast";

const STATUS_CFG: Record<
 string,
 { color: string; bg: string; label: string; icon: string }
> = {
 PENDING: {
 color: "text-yellow-700",
 bg: "bg-yellow-100 dark:bg-yellow-900/30",
 label: "Pending",
 icon: "⏳",
 },
 CONFIRMED: {
 color: "text-blue-700",
 bg: "bg-blue-100 dark:bg-blue-900/30",
 label: "Confirmed",
 icon: "✅",
 },
 PROCESSING: {
 color: "text-blue-700",
 bg: "bg-blue-100 dark:bg-blue-900/30",
 label: "Processing",
 icon: "📦",
 },
 SHIPPED: {
 color: "text-blue-700",
 bg: "bg-blue-100 dark:bg-blue-900/30",
 label: "Shipped",
 icon: "🚚",
 },
 OUT_FOR_DELIVERY: {
 color: "text-orange-700",
 bg: "bg-orange-100 dark:bg-orange-900/30",
 label: "Out for Delivery",
 icon: "🛵",
 },
 DELIVERED: {
 color: "text-green-700",
 bg: "bg-green-100 dark:bg-green-900/30",
 label: "Delivered",
 icon: "🎉",
 },
 CANCELLED: {
 color: "text-red-700",
 bg: "bg-red-100 dark:bg-red-900/30",
 label: "Cancelled",
 icon: "❌",
 },
 RETURN_REQUESTED: {
 color: "text-amber-700",
 bg: "bg-amber-100 dark:bg-amber-900/30",
 label: "Return Requested",
 icon: "↩️",
 },
 RETURNED: {
 color: "text-gray-600",
 bg: "bg-gray-100 dark:bg-gray-800",
 label: "Returned",
 icon: "📮",
 },
 REFUNDED: {
 color: "text-teal-700",
 bg: "bg-teal-100 dark:bg-teal-900/30",
 label: "Refunded",
 icon: "💰",
 },
};

const STATUS_TABS = [
 { key: "all", label: "All" },
 { key: "PENDING", label: "Pending" },
 { key: "SHIPPED", label: "Shipped" },
 { key: "DELIVERED", label: "Delivered" },
 { key: "CANCELLED", label: "Cancelled" },
 { key: "RETURN_REQUESTED", label: "Return" },
];

export default function OrdersPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [orders, setOrders] = useState<any[]>([]);
 const [total, setTotal] = useState(0);
 const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const activeTab = searchParams.get("status") ?? "all";
 const page = Number(searchParams.get("page")) || 1;
 const LIMIT = 10;

 const load = useCallback(async () => {
 setLoading(true);
 const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
 if (activeTab !== "all") p.set("status", activeTab);
 const res = await fetch(`/api/orders?${p}`);
 const data = await res.json();
 setOrders(data.orders ?? []);
 setTotal(data.total ?? 0);
 setStatusCounts(data.statusCounts ?? {});
 setLoading(false);
 }, [page, activeTab]);

 useEffect(() => {
 load();
 }, [load]);

 const setTab = (tab: string) => {
 const p = new URLSearchParams();
 if (tab !== "all") p.set("status", tab);
 p.set("page", "1");
 router.push(`/account/orders?${p.toString()}`);
 };

 const setPageNum = (n: number) => {
 const p = new URLSearchParams(searchParams.toString());
 p.set("page", String(n));
 router.push(`/account/orders?${p.toString()}`);
 };

 // Filter client-side by search
 const filtered = search.trim()
 ? orders.filter(
 (o) =>
 o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
 o.items.some((i: any) =>
 i.product?.name?.toLowerCase().includes(search.toLowerCase()),
 ),
 )
 : orders;

 return (
 <div className="max-w-4xl mx-auto px-4 py-8">
 <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
 <div>
 <h1 className="text-2xl font-black text-gray-900 dark:text-white">
 My Orders
 </h1>
 <p className="text-sm text-gray-400 mt-0.5">{total} total orders</p>
 </div>
 <button
 onClick={load}
 className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-colors"
 aria-label="Refresh"
 >
 <RefreshCcw className="w-4 h-4" />
 </button>
 </div>

 {/* Status tabs */}
 <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-5 overflow-x-auto">
 {STATUS_TABS.map((tab) => {
 const count =
 tab.key === "all"
 ? Object.values(statusCounts).reduce((s, v) => s + v, 0)
 : (statusCounts[tab.key] ?? 0);
 return (
 <button
 key={tab.key}
 onClick={() => setTab(tab.key)}
 className={cn(
 "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0",
 activeTab === tab.key
 ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
 : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
 )}
 >
 {tab.label}
 {count > 0 && (
 <span
 className={cn(
 "text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-4.5 text-center",
 activeTab === tab.key
 ? "bg-blue-100 text-blue-700"
 : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400",
 )}
 >
 {count}
 </span>
 )}
 </button>
 );
 })}
 </div>

 {/* Search */}
 <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 mb-5">
 <Search className="w-4 h-4 text-gray-400 shrink-0" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by order number or product name..."
 className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
 />
 {search && (
 <button onClick={() => setSearch("")} aria-label="Clear">
 <X className="w-4 h-4 text-gray-400" />
 </button>
 )}
 </div>

 {/* Orders */}
 <div className="space-y-4">
 {loading ? (
 [...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)
 ) : filtered.length === 0 ? (
 <div className="text-center py-20">
 <div className="text-6xl mb-4">📭</div>
 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
 No orders found
 </h3>
 <p className="text-gray-400 text-sm mb-6">
 {search
 ? "Try adjusting your search"
 : "You haven't placed any orders yet"}
 </p>
 <Link
 href="/"
 className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors"
 >
 Start Shopping
 </Link>
 </div>
 ) : (
 filtered.map((order) => (
 <OrderCard key={order.id} order={order} onRefresh={load} />
 ))
 )}
 </div>

 {/* Pagination */}
 {total > LIMIT && (
 <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
 <p className="text-sm text-gray-500">
 {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}{" "}
 orders
 </p>
 <div className="flex gap-1">
 <button
 onClick={() => setPageNum(Math.max(1, page - 1))}
 disabled={page === 1}
 className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-500 transition-colors"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>
 {[...Array(Math.min(Math.ceil(total / LIMIT), 5))].map((_, i) => (
 <button
 key={i}
 onClick={() => setPageNum(i + 1)}
 className={cn(
 "w-9 h-9 rounded-xl text-sm font-semibold transition-colors",
 page === i + 1
 ? "bg-blue-600 text-white"
 : "border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400",
 )}
 >
 {i + 1}
 </button>
 ))}
 <button
 onClick={() =>
 setPageNum(Math.min(Math.ceil(total / LIMIT), page + 1))
 }
 disabled={page >= Math.ceil(total / LIMIT)}
 className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-500 transition-colors"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 );
}

function OrderCard({
 order,
 onRefresh,
}: {
 order: any;
 onRefresh: () => void;
}) {
 const [cancelling, setCancelling] = useState(false);
 const cfg = STATUS_CFG[order.status] ?? {
 color: "text-gray-600",
 bg: "bg-gray-100",
 label: order.status,
 icon: "📦",
 };

 const cancel = async () => {
 if (!confirm("Are you sure you want to cancel this order?")) return;
 setCancelling(true);
 const res = await fetch(`/api/orders/${order.id}/cancel`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ reason: "CHANGED_MIND" }),
 });
 const data = await res.json();
 setCancelling(false);
 if (res.ok) {
 toast.success(data.message);
 onRefresh();
 } else toast.error(data.error ?? "Cancellation failed");
 };

 const reorder = async () => {
 const res = await fetch(`/api/orders/${order.id}/reorder`, {
 method: "POST",
 });
 const data = await res.json();
 if (res.ok) toast.success(data.message);
 else toast.error(data.error ?? "Failed to reorder");
 };

 return (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
 {/* Header */}
 <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
 <div className="flex items-center gap-3 flex-wrap">
 <div>
 <span className="text-xs text-gray-400">Order</span>
 <p className="font-mono font-bold text-sm text-blue-600">
 {order.orderNumber}
 </p>
 </div>
 <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
 <div>
 <span className="text-xs text-gray-400">Placed</span>
 <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
 {timeAgo(order.createdAt)}
 </p>
 </div>
 <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
 <div>
 <span className="text-xs text-gray-400">Deliver to</span>
 <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
 {order.address?.city}, {order.address?.district}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span
 className={cn(
 "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1",
 cfg.bg,
 cfg.color,
 )}
 >
 {cfg.icon} {cfg.label}
 </span>
 </div>
 </div>

 {/* Items */}
 <div className="px-5 py-4">
 <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
 {order.items?.slice(0, 4).map((item: any, idx: number) => (
 <div key={item.id} className="shrink-0">
 <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center text-2xl relative">
 {item.product?.images?.[0] ? (
 <Image
 src={item.product.images[0].url}
 alt={item.product.name}
 width={56}
 height={56}
 className="object-cover"
 />
 ) : (
 "🛍️"
 )}
 {idx === 3 && order.items.length > 4 && (
 <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
 +{order.items.length - 4}
 </div>
 )}
 </div>
 </div>
 ))}
 <div className="flex-1 min-w-0 pl-1">
 <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
 {order.items?.[0]?.product?.name}
 {order.items?.length > 1
 ? ` +${order.items.length - 1} more`
 : ""}
 </p>
 {order.items?.[0]?.variant && (
 <p className="text-xs text-gray-400">
 {order.items[0].variant.name}
 </p>
 )}
 <p className="text-xs text-gray-400 mt-0.5">
 ×{order.items?.[0]?.quantity}
 </p>
 </div>
 </div>

 {/* Tracking bar */}
 {!["CANCELLED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(
 order.status,
 ) && <OrderProgressBar status={order.status} />}

 {/* Tracking number */}
 {order.trackingNumber && (
 <div className="mt-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
 <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <span className="text-xs text-blue-600 font-semibold">
 Tracking:{" "}
 </span>
 <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
 {order.trackingNumber}
 </span>
 </div>
 {order.trackingUrl && (
 <a
 href={order.trackingUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs text-blue-600 font-semibold hover:underline shrink-0"
 >
 Track →
 </a>
 )}
 </div>
 )}

 {/* Return info */}
 {order.returnRequest && (
 <div
 className={cn(
 "mt-3 flex items-center gap-2 rounded-xl px-3 py-2",
 order.returnRequest.status === "REJECTED"
 ? "bg-red-50 dark:bg-red-900/20"
 : "bg-amber-50 dark:bg-amber-900/20",
 )}
 >
 <span className="text-lg">↩️</span>
 <div>
 <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
 Return Request
 </p>
 <p className="text-xs text-amber-600 dark:text-amber-500">
 Status: {order.returnRequest.status}
 </p>
 </div>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="px-5 pb-4 flex items-center justify-between flex-wrap gap-3">
 <div>
 <span className="text-xs text-gray-400">Order Total</span>
 <p className="text-lg font-black text-blue-600">
 {formatPrice(Number(order.total))}
 </p>
 {order.shippingCost === 0 && (
 <span className="text-xs text-green-600 font-semibold">
 Free Delivery
 </span>
 )}
 </div>
 <div className="flex gap-2 flex-wrap">
 <Link
 href={`/account/orders/${order.id}`}
 className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 >
 <Eye className="w-4 h-4" /> View Details
 </Link>
 {order.status === "DELIVERED" && !order.returnRequest && (
 <Link
 href={`/account/orders/${order.id}/return`}
 className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 >
 <RotateCcw className="w-4 h-4" /> Return
 </Link>
 )}
 {order.status === "DELIVERED" && (
 <Link
 href={`/account/orders/${order.id}/review`}
 className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border border-amber-200 dark:border-amber-800"
 >
 <Star className="w-4 h-4" /> Review
 </Link>
 )}
 {["PENDING", "CONFIRMED"].includes(order.status) && (
 <button
 onClick={cancel}
 disabled={cancelling}
 className="flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
 >
 {cancelling ? (
 <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
 ) : (
 <X className="w-4 h-4" />
 )}
 Cancel
 </button>
 )}
 {["CANCELLED", "DELIVERED", "RETURNED"].includes(order.status) && (
 <button
 onClick={reorder}
 className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
 >
 <RefreshCcw className="w-4 h-4" /> Reorder
 </button>
 )}
 <button
 onClick={() =>
 window.open(`/api/orders/${order.id}/invoice`, "_blank")
 }
 className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 aria-label="Download invoice"
 >
 <Download className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 );
}

// ─── Progress bar ─────────────────────────────────────────────────────────

function OrderProgressBar({ status }: { status: string }) {
 const steps = [
 "PENDING",
 "CONFIRMED",
 "SHIPPED",
 "OUT_FOR_DELIVERY",
 "DELIVERED",
 ];
 const idx = steps.indexOf(status);

 return (
 <div className="flex items-center gap-1 mt-2">
 {steps.map((step, i) => {
 const done = idx >= i;
 const active = idx === i;
 return (
 <React.Fragment key={step}>
 <div
 className={cn(
 "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 transition-all",
 done
 ? "bg-blue-600 text-white"
 : "bg-gray-200 dark:bg-gray-700 text-gray-400",
 active &&
 "ring-2 ring-blue-300 dark:ring-blue-700 scale-110",
 )}
 >
 {done ? "✓" : i + 1}
 </div>
 {i < steps.length - 1 && (
 <div
 className={cn(
 "flex-1 h-1 rounded-full transition-colors",
 idx > i ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700",
 )}
 />
 )}
 </React.Fragment>
 );
 })}
 </div>
 );
}

function OrderCardSkeleton() {
 return (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
 <div className="h-12 bg-gray-100 dark:bg-gray-800" />
 <div className="p-5">
 <div className="flex gap-3 mb-4">
 {[...Array(3)].map((_, i) => (
 <div
 key={i}
 className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl"
 />
 ))}
 <div className="flex-1 space-y-2 pt-1">
 <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
 <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
 </div>
 </div>
 <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full" />
 </div>
 <div className="px-5 pb-4 flex justify-between">
 <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
 <div className="flex gap-2">
 <div className="h-9 w-28 bg-gray-100 dark:bg-gray-800 rounded-xl" />
 <div className="h-9 w-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
 </div>
 </div>
 </div>
 );
}
