"use client";
import { useState } from "react";
import { useUIStore, useAuthStore, formatPrice } from "@/app/lib/store";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const MUTED    = "var(--color-muted)";

// Status → step index (0-based)
const STATUS_STEPS = [
  { key: "PENDING",          label: "Order placed"     },
  { key: "CONFIRMED",        label: "Confirmed"         },
  { key: "PROCESSING",       label: "Processing"        },
  { key: "SHIPPED",          label: "Shipped"           },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery"  },
  { key: "DELIVERED",        label: "Delivered"         },
];

const CANCELLED_STATUSES = new Set(["CANCELLED", "REFUNDED"]);

type TrackedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  currentLocation?: string | null;
  trackingNumber?: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string | null;
  items: { quantity: number; price: number; product: { name: string; images: { url: string }[] } }[];
  address?: { fullName: string; street: string; city: string; district: string; province: string } | null;
};

// ── Sidebar nav ───────────────────────────────────────────────────────────────
function AccountSidebar({ active, onNav }: { active: string; onNav: (p: string) => void }) {
  const { user } = useAuthStore();
  const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "CB";
  const name     = user?.name ?? "Guest User";

  const links = [
    { id: "profile",  icon: "⊹", label: "Dashboard"   },
    { id: "orders",   icon: "▦",  label: "Orders"      },
    { id: "track",    icon: "🚚", label: "Track order" },
    { id: "wishlist", icon: "♡",  label: "Wishlist"    },
    { id: "address",  icon: "⊙",  label: "Addresses"   },
    { id: "payment",  icon: "☐",  label: "Payment"     },
    { id: "settings", icon: "✎",  label: "Settings"    },
  ];

  return (
    <aside className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-3 pb-5 mb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #D4A63A)` }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black truncate" style={{ color: CHARCOAL }}>{name}</p>
          <p className="text-[11px]" style={{ color: MUTED }}>Joined Jan 2025</p>
        </div>
      </div>

      <nav className="space-y-0.5">
        {links.map(l => (
          <button key={l.id} onClick={() => onNav(l.id)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left"
            style={active === l.id
              ? { backgroundColor: IVORY, color: CHARCOAL, fontWeight: 600 }
              : { color: MUTED }}>
            <span className="text-base w-5 text-center">{l.icon}</span>
            {l.label}
          </button>
        ))}
      </nav>

      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button onClick={() => onNav("home")}
          className="flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ color: "#EF4444" }}>
          <span>→</span> Sign out
        </button>
      </div>
    </aside>
  );
}

// ── Dynamic timeline ──────────────────────────────────────────────────────────
function Timeline({ status }: { status: string }) {
  const isCancelled = CANCELLED_STATUSES.has(status);
  const currentIdx  = STATUS_STEPS.findIndex(s => s.key === status);

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: "#EF4444" }}>
          ✕ Order {status.toLowerCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-start justify-between mt-6 mb-2">
      {/* Grey base line */}
      <div className="absolute top-4 left-[8%] right-[8%] h-px" style={{ backgroundColor: BORDER }} />
      {/* Gold progress line */}
      {currentIdx >= 0 && (
        <div
          className="absolute top-4 h-px transition-all"
          style={{
            left: "8%",
            width: `${(currentIdx / (STATUS_STEPS.length - 1)) * 84}%`,
            backgroundColor: GOLD,
          }}
        />
      )}

      {STATUS_STEPS.map((s, i) => {
        const done   = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.key} className="flex flex-col items-center z-10" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all"
              style={done
                ? { backgroundColor: GOLD, border: `2px solid ${GOLD}` }
                : { backgroundColor: "white", border: `2px solid ${BORDER}` }}>
              {done && !active && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {active && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
            </div>
            <p className="text-[10px] font-bold text-center leading-tight" style={{ color: done ? CHARCOAL : MUTED }}>
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TrackPage() {
  const { nav } = useUIStore();
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [order,   setOrder]   = useState<TrackedOrder | null>(null);
  const [error,   setError]   = useState("");

  async function handleTrack() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);

    const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(input.trim())}`);
    setLoading(false);

    if (!res.ok) {
      setError("Order not found. Check the order number and try again.");
      return;
    }
    const data = await res.json();
    setOrder(data.order);
  }

  return (
    <div style={{ backgroundColor: "#FDFBF7", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-5 pb-2">
        <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
          <button onClick={() => nav("home")} className="hover:underline" style={{ color: GOLD }}>Home</button>
          <span>/</span>
          <button onClick={() => nav("orders")} className="hover:underline">Account</button>
          <span>/</span>
          <span style={{ color: CHARCOAL }}>Tracking</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

          <AccountSidebar active="track" onNav={p => nav(p)} />

          <div className="space-y-5">

            {/* Search bar */}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleTrack()}
                placeholder="Enter your order number e.g. NX-2025-47832"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
              <button
                onClick={handleTrack}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70"
                style={{ backgroundColor: GOLD }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}
              >
                {loading ? "…" : "Track"}
              </button>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium text-red-600 bg-red-50" style={{ border: "1px solid #FCA5A5" }}>
                {error}
              </div>
            )}

            {order && (
              <>
                {/* Order card + timeline */}
                <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: MUTED }}>ORDER</p>
                      <p className="text-2xl font-black" style={{ color: CHARCOAL }}>
                        {order.orderNumber}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-xs mt-1" style={{ color: MUTED }}>
                          Tracking: <span className="font-mono font-bold" style={{ color: CHARCOAL }}>{order.trackingNumber}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black text-white"
                        style={{ backgroundColor: GOLD }}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                        Placed {new Date(order.createdAt).toLocaleDateString("en-NP", { day:"numeric", month:"short", year:"numeric" })}
                      </p>
                    </div>
                  </div>
                  <Timeline status={order.status} />
                </div>

                {/* Location + items */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">

                  {/* Location info */}
                  <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
                    <h2 className="font-black text-base" style={{ color: CHARCOAL }}>Delivery tracking</h2>

                    {/* Status events */}
                    <div className="space-y-3">
                      {/* Current location if set */}
                      {order.currentLocation && (
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0 mt-1">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
                            <div className="w-px mt-1" style={{ height: "20px", backgroundColor: BORDER }} />
                          </div>
                          <div>
                            <p className="text-xs font-black" style={{ color: GOLD }}>
                              {new Date(order.updatedAt).toLocaleTimeString("en-NP", { hour:"2-digit", minute:"2-digit" })}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: CHARCOAL }}>📍 {order.currentLocation}</p>
                          </div>
                        </div>
                      )}

                      {/* Delivered event */}
                      {order.deliveredAt && (
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0 mt-1">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
                            <div className="w-px mt-1" style={{ height: "20px", backgroundColor: BORDER }} />
                          </div>
                          <div>
                            <p className="text-xs font-black" style={{ color: GOLD }}>
                              {new Date(order.deliveredAt).toLocaleString("en-NP", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: CHARCOAL }}>✅ Package delivered</p>
                          </div>
                        </div>
                      )}

                      {/* Status steps as events */}
                      {STATUS_STEPS.slice()
                        .reverse()
                        .filter(s => STATUS_STEPS.findIndex(x => x.key === s.key) <= STATUS_STEPS.findIndex(x => x.key === order.status))
                        .map((s, i) => (
                          <div key={s.key} className="flex items-start gap-3">
                            <div className="flex flex-col items-center shrink-0 mt-1">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 && !order.currentLocation && !order.deliveredAt ? GOLD : BORDER }} />
                              <div className="w-px mt-1" style={{ height: "16px", backgroundColor: BORDER }} />
                            </div>
                            <div>
                              <span className="text-xs" style={{ color: CHARCOAL }}>{s.label}</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>

                    {/* Delivery address */}
                    {order.address && (
                      <div className="pt-4 mt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Delivering to</p>
                        <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{order.address.fullName}</p>
                        <p className="text-xs" style={{ color: MUTED }}>
                          {order.address.street}, {order.address.city}, {order.address.district}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items in this order */}
                  <div className="bg-white rounded-2xl p-5 flex flex-col" style={{ border: `1px solid ${BORDER}` }}>
                    <h2 className="font-black text-base mb-4" style={{ color: CHARCOAL }}>Items in this order</h2>

                    <div className="flex-1 space-y-0">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-3"
                          style={{ borderBottom: i < order.items.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                            style={{ backgroundColor: IVORY }}>
                            {item.product.images[0]
                              ? <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                              : "🛍️"
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: CHARCOAL }}>{item.product.name}</p>
                            <p className="text-[11px]" style={{ color: MUTED }}>Qty {item.quantity}</p>
                          </div>
                          <p className="text-sm font-black shrink-0" style={{ color: CHARCOAL }}>
                            {formatPrice(Number(item.price) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="pt-3 mt-2 flex justify-between items-center" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <span className="text-sm font-bold" style={{ color: MUTED }}>Total</span>
                      <span className="text-base font-black" style={{ color: GOLD }}>{formatPrice(Number(order.total))}</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <button onClick={() => nav("orders")}
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all"
                        style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "white" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL; }}>
                        My Orders
                      </button>
                      <button onClick={() => nav("products")}
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl text-white transition-all"
                        style={{ backgroundColor: GOLD }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
                        Shop more
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!order && !loading && !error && (
              <div className="bg-white rounded-2xl p-12 text-center" style={{ border: `1px solid ${BORDER}` }}>
                <p className="text-4xl mb-3">🚚</p>
                <p className="font-bold text-base mb-1" style={{ color: CHARCOAL }}>Track your order</p>
                <p className="text-sm" style={{ color: MUTED }}>Enter your order number above to see real-time status updates</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
