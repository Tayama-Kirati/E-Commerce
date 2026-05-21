"use client";
import { MOCK_PRODUCTS, formatPrice, useUIStore, useAuthStore, useWishlistStore } from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

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

export function WishlistPage() {
  const { nav, showToast } = useUIStore();
  const { user, setUser }  = useAuthStore();
  const { ids: wishIds, toggle } = useWishlistStore();
  const items = MOCK_PRODUCTS.filter(p => wishIds.includes(p.id));

  if (!user) { nav("login"); return null; }

  const handleNav = (t: string) => {
    if (t === "wishlist")  return;
    if (t === "orders")    { nav("orders"); return; }
    if (t === "track")     { nav("track");  return; }
    nav("profile", { tab: t });
  };

  const signOut = () => { setUser(null); nav("home"); showToast("Signed out"); };

  return (
    <div style={{ backgroundColor: "#FDFBF7", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <Sidebar active="wishlist" onNav={handleNav} onSignOut={signOut} user={user} />

          <div>
            {/* Header */}
            <div className="rounded-2xl px-7 py-8 mb-6" style={{ backgroundColor: IVORY }}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: GOLD }}>My Account</p>
                  <h1 className="text-3xl font-black" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
                    Wishlist
                  </h1>
                  <div className="flex items-center gap-2 text-xs mt-1" style={{ color: MUTED }}>
                    <button onClick={() => nav("home")} className="hover:underline" style={{ color: GOLD }}>Home</button>
                    <span>/</span><span>Account</span><span>/</span>
                    <span style={{ color: CHARCOAL }}>Wishlist</span>
                  </div>
                </div>
                <span className="text-sm font-bold px-4 py-2 rounded-full" style={{ backgroundColor: "rgba(198,131,19,0.12)", color: GOLD }}>
                  {items.length} {items.length === 1 ? "item" : "items"} saved
                </span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-24" style={{ border: `1px solid ${BORDER}` }}>
                <div className="text-7xl mb-5">♡</div>
                <h3 className="text-xl font-black mb-2" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
                  Your wishlist is empty
                </h3>
                <p className="text-sm mb-6" style={{ color: MUTED }}>Save items you love and come back to them anytime.</p>
                <button onClick={() => nav("home")}
                  className="px-7 py-3 text-sm font-bold text-white rounded-xl"
                  style={{ backgroundColor: GOLD }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
                  Explore Products
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                <div className="flex items-center justify-between py-3 px-1">
                  <button onClick={() => { wishIds.forEach(id => toggle(id)); showToast("Wishlist cleared"); }}
                    className="text-sm font-semibold" style={{ color: MUTED }}
                    onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                    onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                    Clear wishlist
                  </button>
                  <button onClick={() => nav("home")}
                    className="text-sm font-bold" style={{ color: GOLD }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                    Continue shopping →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
