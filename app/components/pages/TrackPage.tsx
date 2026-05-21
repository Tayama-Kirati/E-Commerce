"use client";
import { useState } from "react";
import { MOCK_ORDERS, formatPrice, useUIStore, useAuthStore } from "@/app/lib/store";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const MUTED    = "var(--color-muted)";

const DEFAULT_ORDER = MOCK_ORDERS[0];

const STEPS = [
  { label: "Order placed",    date: "Apr 28", done: true  },
  { label: "In production",   date: "May 09", done: true  },
  { label: "Shipped",         date: "May 19", done: true  },
  { label: "Out for delivery",date: "May 20", done: true, active: true },
  { label: "Delivered",       date: "",       done: false },
];

const EVENTS = [
  { time: "5:18 pm", desc: "Driver Tomas is on the way · pin #4821", active: true  },
  { time: "4:34 pm", desc: "Loaded at Kathmandu depot",              active: false },
  { time: "2:11 pm", desc: "Customs cleared",                        active: false },
  { time: "9:00 am", desc: "Package dispatched from warehouse",       active: false },
];

const ITEMS = [
  { name: "Apple iPhone 16 Pro Max", qty: 1, price: 195000, emoji: "📱" },
  { name: "Sony WH-1000XM6",         qty: 1, price: 38500,  emoji: "🎧" },
];

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
      {/* Avatar */}
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

      {/* Nav links */}
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

// ── Progress timeline ─────────────────────────────────────────────────────────
function Timeline() {
  return (
    <div className="relative flex items-start justify-between mt-6 mb-2">
      {/* Connecting line */}
      <div className="absolute top-4 left-[10%] right-[10%] h-px" style={{ backgroundColor: BORDER }} />
      {/* Gold progress line (4/5 done) */}
      <div className="absolute top-4 left-[10%] h-px transition-all" style={{ width: "70%", backgroundColor: GOLD }} />

      {STEPS.map((s, i) => (
        <div key={i} className="flex flex-col items-center z-10" style={{ width: "20%" }}>
          {/* Circle */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all"
            style={s.done
              ? { backgroundColor: GOLD, border: `2px solid ${GOLD}` }
              : { backgroundColor: "white", border: `2px solid ${BORDER}` }}>
            {s.done && !s.active && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {s.active && (
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            )}
          </div>
          {/* Label */}
          <p className="text-[10px] font-bold text-center leading-tight" style={{ color: s.done ? CHARCOAL : MUTED }}>
            {s.label}
          </p>
          {s.date && (
            <p className="text-[10px] mt-0.5 text-center" style={{ color: MUTED }}>{s.date}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Mock map ──────────────────────────────────────────────────────────────────
function MockMap() {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: "#EDE8DC", height: "220px" }}>
      {/* Road grid */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 220" preserveAspectRatio="none">
        {/* Roads */}
        <rect x="60"  y="0"   width="20" height="220" fill="#D6D0C4" rx="2"/>
        <rect x="180" y="0"   width="20" height="220" fill="#D6D0C4" rx="2"/>
        <rect x="300" y="0"   width="20" height="220" fill="#D6D0C4" rx="2"/>
        <rect x="0"   y="60"  width="400" height="18" fill="#D6D0C4" rx="2"/>
        <rect x="0"   y="140" width="400" height="18" fill="#D6D0C4" rx="2"/>
        {/* Buildings */}
        <rect x="20"  y="20"  width="30" height="30" fill="#C8C2B5" rx="3"/>
        <rect x="90"  y="20"  width="70" height="30" fill="#C8C2B5" rx="3"/>
        <rect x="210" y="20"  width="70" height="30" fill="#C8C2B5" rx="3"/>
        <rect x="20"  y="90"  width="30" height="40" fill="#C8C2B5" rx="3"/>
        <rect x="90"  y="90"  width="70" height="40" fill="#C8C2B5" rx="3"/>
        <rect x="210" y="90"  width="70" height="40" fill="#C8C2B5" rx="3"/>
        <rect x="330" y="20"  width="50" height="30" fill="#C8C2B5" rx="3"/>
        <rect x="330" y="90"  width="50" height="40" fill="#C8C2B5" rx="3"/>
        <rect x="20"  y="168" width="30" height="40" fill="#C8C2B5" rx="3"/>
        <rect x="90"  y="168" width="70" height="40" fill="#C8C2B5" rx="3"/>
        <rect x="210" y="168" width="70" height="40" fill="#C8C2B5" rx="3"/>
        <rect x="330" y="168" width="50" height="40" fill="#C8C2B5" rx="3"/>
        {/* Dotted delivery path */}
        <path d="M 170 160 Q 200 140 220 110 Q 240 80 290 70 Q 320 62 340 55"
          fill="none" stroke={GOLD} strokeWidth="2.5" strokeDasharray="5,4" strokeLinecap="round"/>
        {/* Delivery dot (current location) */}
        <circle cx="220" cy="110" r="7" fill={GOLD} />
        <circle cx="220" cy="110" r="12" fill={GOLD} fillOpacity="0.2" />
        {/* Destination star */}
        <text x="332" y="58" fontSize="16" textAnchor="middle">★</text>
      </svg>

      {/* ETA pill */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white shadow-md"
        style={{ color: CHARCOAL }}>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: GOLD }} />
        <span style={{ color: GOLD }}>2.4 km away</span>
        <span style={{ color: MUTED }}>· ETA 5:42 pm</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TrackPage() {
  const { nav } = useUIStore();
  const [order] = useState(DEFAULT_ORDER);
  const [input, setInput]     = useState(order.orderNumber);
  const [searched, setSearched] = useState(true);

  const statusLabel = order.status.replace(/_/g, " ");

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

          {/* Sidebar */}
          <AccountSidebar active="track" onNav={p => nav(p)} />

          {/* Main */}
          <div className="space-y-5">

            {/* Search bar */}
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setSearched(true)}
                placeholder="Enter order number e.g. NX-2025-47832"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = BORDER} />
              <button onClick={() => setSearched(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ backgroundColor: GOLD }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
                Track
              </button>
            </div>

            {searched && (
              <>
                {/* Order card + timeline */}
                <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: MUTED }}>ORDER</p>
                      <p className="text-2xl font-black" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
                        {order.orderNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black text-white"
                        style={{ backgroundColor: GOLD }}>
                        {statusLabel}
                      </span>
                      <p className="text-xs mt-1.5" style={{ color: MUTED }}>Arriving today by 6 pm</p>
                    </div>
                  </div>
                  <Timeline />
                </div>

                {/* Bottom row: map + items */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">

                  {/* Live tracking */}
                  <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
                    <h2 className="font-black text-base mb-4" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
                      Live tracking
                    </h2>
                    <MockMap />

                    {/* Event log */}
                    <div className="mt-4 space-y-3">
                      {EVENTS.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0 mt-1">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ev.active ? GOLD : BORDER }} />
                            {i < EVENTS.length - 1 && (
                              <div className="w-px flex-1 mt-1" style={{ height: "16px", backgroundColor: BORDER }} />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-black mr-2" style={{ color: ev.active ? GOLD : MUTED }}>{ev.time}</span>
                            <span className="text-xs" style={{ color: CHARCOAL }}>{ev.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items in this order */}
                  <div className="bg-white rounded-2xl p-5 flex flex-col" style={{ border: `1px solid ${BORDER}` }}>
                    <h2 className="font-black text-base mb-4" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
                      Items in this order
                    </h2>

                    <div className="flex-1 space-y-0">
                      {[...ITEMS, ...order.items.slice(0,1).map((it: any) => ({
                        name: it.product?.name ?? "Product",
                        qty: it.quantity ?? 1,
                        price: it.price ?? 0,
                        emoji: it.emoji ?? "🛍️",
                      }))].slice(0,3).map((item, i, arr) => (
                        <div key={i} className="flex items-center gap-3 py-3"
                          style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                            style={{ backgroundColor: IVORY }}>
                            {item.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: CHARCOAL }}>{item.name}</p>
                            <p className="text-[11px]" style={{ color: MUTED }}>Qty {item.qty}</p>
                          </div>
                          <p className="text-sm font-black shrink-0" style={{ color: CHARCOAL }}>
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <button onClick={() => nav("orders")}
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all"
                        style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "white" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL; }}>
                        Contact support
                      </button>
                      <button onClick={() => nav("products")}
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl text-white transition-all"
                        style={{ backgroundColor: GOLD }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
