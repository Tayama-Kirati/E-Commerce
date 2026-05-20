"use client";
import { useState, useEffect } from "react";
import { cn, formatPrice, timeAgo, MOCK_ORDERS, useUIStore, useAuthStore, apiGet } from "@/app/lib/store";

export function OrdersPage() {
  const { user } = useAuthStore();
  const { nav } = useUIStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) { nav("login"); return; }
    setLoading(true);
    const p = new URLSearchParams({ limit: "10" });
    if (activeTab !== "all") p.set("status", activeTab);
    apiGet(`/api/orders?${p}`, null)
      .then(d => { setOrders(d?.orders ?? MOCK_ORDERS); setLoading(false); })
      .catch(() => { setOrders(MOCK_ORDERS); setLoading(false); });
  }, [user, activeTab]);

  const STATUS_CFG: Record<string, {bg: string; icon: string}> = {
    PENDING:{bg:"bg-yellow-100 text-yellow-700",icon:"⏳"}, CONFIRMED:{bg:"bg-blue-100 text-blue-700",icon:"✅"},
    SHIPPED:{bg:"bg-violet-100 text-violet-700",icon:"🚚"}, OUT_FOR_DELIVERY:{bg:"bg-orange-100 text-orange-700",icon:"🛵"},
    DELIVERED:{bg:"bg-green-100 text-green-700",icon:"🎉"}, CANCELLED:{bg:"bg-red-100 text-red-700",icon:"❌"},
    RETURN_REQUESTED:{bg:"bg-amber-100 text-amber-700",icon:"↩️"},
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">📦 My Orders</h1>
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-5 overflow-x-auto">
        {["all","PENDING","SHIPPED","DELIVERED","CANCELLED"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap", activeTab===t?"bg-white dark:bg-gray-700 text-violet-600 shadow-sm":"text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}>
            {t==="all"?"All Orders":t.replace("_"," ")}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-36 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20"><div className="text-6xl mb-4">📭</div><h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No orders found</h3><button onClick={() => nav("home")} className="mt-4 px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Start Shopping</button></div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = STATUS_CFG[order.status] ?? {bg:"bg-gray-100 text-gray-600",icon:"📦"};
            const firstItem = order.items?.[0];
            return (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-bold text-sm text-violet-600">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
                  </div>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1", cfg.bg)}>{cfg.icon} {order.status.replace("_"," ")}</span>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-3xl shrink-0">{firstItem?.emoji ?? "🛍️"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{firstItem?.product?.name ?? firstItem?.name}</p>
                      {order.items?.length > 1 && <p className="text-xs text-gray-400">+{order.items.length-1} more items</p>}
                    </div>
                    <p className="font-black text-violet-600">{formatPrice(Number(order.total))}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => nav("order", order.id)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">👁 View Details</button>
                    {order.trackingNumber && <button onClick={() => nav("track")} className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-xs font-semibold text-violet-700 dark:text-violet-400 rounded-xl hover:bg-violet-100 transition-colors border border-violet-200 dark:border-violet-800">📍 Track</button>}
                    {["DELIVERED"].includes(order.status) && <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-xs font-semibold text-amber-700 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 dark:border-amber-800">⭐ Review</button>}
                    {["PENDING","CONFIRMED"].includes(order.status) && <button className="px-4 py-2 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Cancel</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
