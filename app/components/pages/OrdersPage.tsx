"use client";
import { useState, useEffect } from "react";
import { formatPrice, timeAgo, MOCK_ORDERS, useUIStore, useAuthStore, apiGet } from "@/app/lib/store";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const MUTED    = "var(--color-muted)";

const NAV_LINKS = [
  { id:"dashboard", icon:"⊹", label:"Dashboard"   },
  { id:"orders",    icon:"▦",  label:"Orders"      },
  { id:"track",     icon:"🚚", label:"Track order" },
  { id:"wishlist",  icon:"♡",  label:"Wishlist"    },
  { id:"addresses", icon:"⊙",  label:"Addresses"   },
  { id:"payment",   icon:"☐",  label:"Payment"     },
  { id:"settings",  icon:"✎",  label:"Settings"    },
];

function Sidebar({ active, onNav, onSignOut, user }: { active: string; onNav: (t: string) => void; onSignOut: () => void; user: any }) {
  const initials = user?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "U";
  return (
    <aside className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-3 pb-5 mb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #D4A63A)` }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black truncate" style={{ color: CHARCOAL }}>{user?.name}</p>
          <p className="text-[11px]" style={{ color: MUTED }}>Joined Jan 2025</p>
        </div>
      </div>
      <nav className="space-y-0.5">
        {NAV_LINKS.map(l => (
          <button key={l.id} onClick={() => onNav(l.id)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left"
            style={active === l.id ? { backgroundColor: IVORY, color: CHARCOAL, fontWeight: 600 } : { color: MUTED }}>
            <span className="text-base w-5 text-center">{l.icon}</span>{l.label}
          </button>
        ))}
      </nav>
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button onClick={onSignOut} className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#EF4444" }}>
          <span>→</span> Sign out
        </button>
      </div>
    </aside>
  );
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  PENDING:           { label:"Pending",          bg:"#FFFBEB", color:"#D97706", icon:"⏳" },
  CONFIRMED:         { label:"Confirmed",        bg:"#EFF6FF", color:"#3B82F6", icon:"✅" },
  PROCESSING:        { label:"Processing",       bg:"#EFF6FF", color:"#3B82F6", icon:"🔄" },
  SHIPPED:           { label:"Shipped",          bg:"rgba(198,131,19,0.08)", color:GOLD, icon:"🚚" },
  OUT_FOR_DELIVERY:  { label:"Out for delivery", bg:"rgba(198,131,19,0.15)", color:"#9B6210", icon:"🛵" },
  DELIVERED:         { label:"Delivered",        bg:"#F0FDF4", color:"#16A34A", icon:"🎉" },
  CANCELLED:         { label:"Cancelled",        bg:"#FEF2F2", color:"#EF4444", icon:"✕"  },
  RETURN_REQUESTED:  { label:"Return requested", bg:"#FFFBEB", color:"#D97706", icon:"↩"  },
};

const TABS = [
  { id:"all",       label:"All"        },
  { id:"PENDING",   label:"Pending"    },
  { id:"SHIPPED",   label:"Shipped"    },
  { id:"DELIVERED", label:"Delivered"  },
  { id:"CANCELLED", label:"Cancelled"  },
];

export function OrdersPage() {
  const { nav, showToast } = useUIStore();
  const { user, setUser }  = useAuthStore();
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) { nav("login"); return; }
    setLoading(true);
    const p = new URLSearchParams({ limit: "20" });
    if (activeTab !== "all") p.set("status", activeTab);
    apiGet(`/api/orders?${p}`, null)
      .then(d => { setOrders(d?.orders ?? MOCK_ORDERS); setLoading(false); })
      .catch(() => { setOrders(MOCK_ORDERS); setLoading(false); });
  }, [user, activeTab]);

  if (!user) return null;

  const handleNav = (t: string) => {
    if (t === "orders")   return;
    if (t === "track")    { nav("track");    return; }
    if (t === "wishlist") { nav("wishlist"); return; }
    nav("profile", { tab: t });
  };

  const signOut = () => { setUser(null); nav("home"); showToast("Signed out"); };

  const filtered = activeTab === "all" ? orders : orders.filter(o => o.status === activeTab);

  return (
    <div style={{ backgroundColor: "#FDFBF7", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <Sidebar active="orders" onNav={handleNav} onSignOut={signOut} user={user} />

          <div>
            {/* Header */}
            <div className="rounded-2xl px-7 py-8 mb-6" style={{ backgroundColor: IVORY }}>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: GOLD }}>My Account</p>
              <h1 className="text-3xl font-black mb-1" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
                My Orders
              </h1>
              <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                <button onClick={() => nav("home")} className="hover:underline" style={{ color: GOLD }}>Home</button>
                <span>/</span><span>Account</span><span>/</span>
                <span style={{ color: CHARCOAL }}>Orders</span>
              </div>
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                  style={activeTab === t.id
                    ? { backgroundColor: GOLD, color: "#fff" }
                    : { backgroundColor: "#fff", color: MUTED, border: `1px solid ${BORDER}` }}>
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ backgroundColor: "#EDE8DC" }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-24" style={{ border: `1px solid ${BORDER}` }}>
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-black mb-2" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
                  No orders found
                </h3>
                <p className="text-sm mb-6" style={{ color: MUTED }}>
                  {activeTab === "all" ? "You haven't placed any orders yet." : `No ${activeTab.toLowerCase()} orders.`}
                </p>
                <button onClick={() => nav("home")}
                  className="px-7 py-3 text-sm font-bold text-white rounded-xl"
                  style={{ backgroundColor: GOLD }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(order => {
                  const cfg = STATUS_CFG[order.status] ?? { label: order.status, bg: IVORY, color: MUTED, icon: "📦" };
                  const firstItem = order.items?.[0];
                  return (
                    <div key={order.id} className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
                      style={{ border: `1px solid ${BORDER}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = GOLD}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = BORDER}>

                      {/* Order header row */}
                      <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-2"
                        style={{ backgroundColor: IVORY, borderBottom: `1px solid ${BORDER}` }}>
                        <div className="flex items-center gap-4">
                          <p className="font-mono font-black text-xs" style={{ color: CHARCOAL }}>{order.orderNumber}</p>
                          <p className="text-xs" style={{ color: MUTED }}>{timeAgo(order.createdAt)}</p>
                        </div>
                        <span className="text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      {/* Order body */}
                      <div className="px-5 py-4">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                            style={{ backgroundColor: IVORY }}>
                            {firstItem?.emoji ?? "🛍️"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm line-clamp-1" style={{ color: CHARCOAL }}>
                              {firstItem?.product?.name ?? firstItem?.name ?? "Order items"}
                            </p>
                            {order.items?.length > 1 && (
                              <p className="text-xs mt-0.5" style={{ color: MUTED }}>+{order.items.length - 1} more items</p>
                            )}
                          </div>
                          <p className="font-black text-base shrink-0" style={{ color: GOLD }}>
                            {formatPrice(Number(order.total))}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => nav("order", order.id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all"
                            style={{ border: `1px solid ${BORDER}`, color: CHARCOAL }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL; }}>
                            👁 View details
                          </button>
                          {order.trackingNumber && (
                            <button onClick={() => nav("track")}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all"
                              style={{ backgroundColor: "rgba(198,131,19,0.08)", border: `1px solid ${BORDER}`, color: GOLD }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.color = "#fff"; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(198,131,19,0.08)"; e.currentTarget.style.color = GOLD; }}>
                              🚚 Track
                            </button>
                          )}
                          {order.status === "DELIVERED" && (
                            <button onClick={() => showToast("Review feature coming soon!")}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl"
                              style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
                              ★ Review
                            </button>
                          )}
                          {["PENDING", "CONFIRMED"].includes(order.status) && (
                            <button onClick={() => showToast("Order cancelled")}
                              className="px-4 py-2 text-xs font-semibold rounded-xl transition-all"
                              style={{ border: `1px solid #FECACA`, color: "#EF4444" }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#FEF2F2"; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = ""; }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
