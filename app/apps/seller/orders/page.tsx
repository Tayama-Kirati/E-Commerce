"use client";

import { useState, useEffect } from "react";
import { Package, ChevronDown, ChevronUp, MapPin } from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  currentLocation?: string | null;
  trackingNumber?: string | null;
  total: number;
  createdAt: string;
  items: { product: { name: string }; quantity: number; price: number }[];
  user: { name?: string; email: string };
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:         "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PROCESSING:      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  SHIPPED:         "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  OUT_FOR_DELIVERY:"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  DELIVERED:       "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED:        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_OPTIONS = [
  "PENDING","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED",
];

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: (id: string, updated: Partial<Order>) => void }) {
  const [expanded, setExpanded]       = useState(false);
  const [saving,   setSaving]         = useState(false);
  const [status,   setStatus]         = useState(order.status);
  const [location, setLocation]       = useState(order.currentLocation ?? "");
  const [tracking, setTracking]       = useState(order.trackingNumber ?? "");
  const [saved,    setSaved]          = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        currentLocation: location || null,
        trackingNumber:  tracking || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      onUpdate(order.id, data.order);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
      {/* Header row */}
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="font-bold text-gray-900 dark:text-white">#{order.orderNumber}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {order.user.name ?? order.user.email} · {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
            {order.status.replace(/_/g," ")}
          </span>
          <span className="font-black text-[#C68313]">रू {Number(order.total).toLocaleString()}</span>
          <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 pb-3 space-y-1">
        {order.items.map((item, i) => (
          <p key={i} className="text-sm text-gray-600 dark:text-gray-400">
            {item.product.name} × {item.quantity}
          </p>
        ))}
      </div>

      {/* Expanded update panel */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-3">
          {/* Status */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
              Order Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-[#C68313]"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace(/_/g," ")}</option>
              ))}
            </select>
          </div>

          {/* Current location */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Current location
            </label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Kathmandu depot, Out for delivery in Thamel..."
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-[#C68313] placeholder-gray-300"
            />
          </div>

          {/* Tracking number */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
              Tracking Number
            </label>
            <input
              value={tracking}
              onChange={e => setTracking(e.target.value)}
              placeholder="e.g. NP123456789"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-[#C68313] placeholder-gray-300"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-60"
            style={{ backgroundColor: saved ? "#16a34a" : "#C68313" }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Update Order"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/orders?limit=50")
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleUpdate(id: string, updated: Partial<Order>) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-[#C68313]" />
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Orders</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
