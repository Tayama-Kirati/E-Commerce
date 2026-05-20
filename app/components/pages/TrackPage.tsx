"use client";
import { useState } from "react";
import { MOCK_ORDERS, useUIStore, apiGet } from "@/app/lib/store";

export function TrackPage() {
  const { nav } = useUIStore();
  const [input, setInput]   = useState("");
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const d = await apiGet(`/api/orders/${input.trim()}/track`, null);
    setLoading(false);
    setData(d ?? { order: { ...MOCK_ORDERS[0], orderNumber: input }, timeline: [] });
  };

  return (
    <div className="min-h-[60vh] bg-linear-to-br from-violet-50 to-orange-50 dark:from-violet-900/10 dark:to-orange-900/10">
      <div className="bg-linear-to-r from-violet-600 to-violet-700 py-12 px-4 text-center">
        <h1 className="text-3xl font-black text-white mb-2">📦 Track Your Order</h1>
        <p className="text-violet-200 mb-7">Enter your order number to get live delivery updates</p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && fetch_()} placeholder="e.g. NX-2025-47832" className="flex-1 px-4 py-3 rounded-2xl bg-white text-gray-900 font-mono font-semibold text-sm outline-none placeholder:text-gray-300 placeholder:font-normal" />
          <button onClick={fetch_} disabled={loading} className="px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors disabled:opacity-60">{loading ? "…" : "Track"}</button>
        </div>
      </div>
      {data?.order && (
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-mono font-black text-violet-600 text-lg">{data.order.orderNumber}</p>
                <p className="text-sm text-gray-400">Payment: {data.order.paymentMethod?.replace("_"," ")}</p>
              </div>
              <span className="text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 px-2.5 py-1 rounded-full">{data.order.status?.replace("_"," ")}</span>
            </div>
            {data.order.trackingNumber && <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl px-3 py-2.5"><span>🚚</span><p className="font-mono text-sm font-bold text-gray-900 dark:text-white">{data.order.trackingNumber}</p></div>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => nav("orders")} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">All Orders</button>
            <button onClick={() => nav("order", data.order.id)} className="flex-1 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors">View Details</button>
          </div>
        </div>
      )}
    </div>
  );
}
