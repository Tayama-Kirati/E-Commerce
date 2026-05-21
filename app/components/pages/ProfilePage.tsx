"use client";
import { useState } from "react";
import { formatPrice, MOCK_PRODUCTS, MOCK_ORDERS, useUIStore, useAuthStore, useWishlistStore } from "@/app/lib/store";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const MUTED    = "var(--color-muted)";

// ── Types ─────────────────────────────────────────────────────────────────────
type Address = {
  id: string; label: string; name: string; phone: string;
  line1: string; line2: string; city: string; district: string;
  province: string; postalCode: string; country: string; isDefault: boolean;
};
type PayMethod = { id: string; type: string; last4: string; expires: string; isDefault: boolean; };

const NEPAL_PROVINCES = ["Koshi","Madhesh","Bagmati","Gandaki","Lumbini","Karnali","Sudurpashchim"];
const NEPAL_DISTRICTS: Record<string, string[]> = {
  "Bagmati":      ["Kathmandu","Lalitpur","Bhaktapur","Chitwan","Makwanpur","Sindhuli","Kavrepalanchok","Nuwakot","Rasuwa","Dhading","Sindhupalchok","Ramechhap","Dolakha"],
  "Koshi":        ["Sunsari","Morang","Jhapa","Ilam","Taplejung","Panchthar","Dhankuta","Terhathum","Sankhuwasabha","Bhojpur","Solukhumbu","Okhaldhunga","Khotang","Udayapur"],
  "Madhesh":      ["Sarlahi","Mahottari","Bara","Parsa","Rautahat","Dhanusha","Siraha","Saptari"],
  "Gandaki":      ["Kaski","Syangja","Parbat","Myagdi","Mustang","Manang","Nawalpur","Palpa","Arghakhanchi","Gulmi","Baglung","Tanahun","Lamjung","Gorkha"],
  "Lumbini":      ["Rupandehi","Kapilvastu","Palpa","Nawalparasi","Arghakhanchi","Gulmi","Pyuthan","Rolpa","Eastern Rukum","Dang","Banke","Bardiya"],
  "Karnali":      ["Surkhet","Dailekh","Jajarkot","Western Rukum","Salyan","Dolpa","Jumla","Kalikot","Mugu","Humla"],
  "Sudurpashchim":["Kailali","Kanchanpur","Dadeldhura","Baitadi","Darchula","Doti","Achham","Bajura","Bajhang","Humla"],
};
const EMPTY_ADDR: Omit<Address,"id"> = {
  label:"Home", name:"", phone:"", line1:"", line2:"", city:"",
  district:"", province:"Bagmati", postalCode:"", country:"Nepal", isDefault:false,
};

const INITIAL_ADDRESSES: Address[] = [
  { id:"a1", label:"Home",   name:"User", phone:"+977-9800000000", line1:"Thamel, Ward 29", line2:"Near Kathmandu Guest House", city:"Kathmandu", district:"Kathmandu", province:"Bagmati", postalCode:"44600", country:"Nepal", isDefault:true  },
  { id:"a2", label:"Office", name:"User", phone:"+977-9800000001", line1:"Durbar Marg, Ward 1", line2:"Next to NRB", city:"Kathmandu", district:"Kathmandu", province:"Bagmati", postalCode:"44600", country:"Nepal", isDefault:false },
];

// ── Address form modal ────────────────────────────────────────────────────────
function AddressFormModal({ initial, onSave, onClose }: {
  initial: Omit<Address,"id"> & { id?: string };
  onSave: (a: Omit<Address,"id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Address,"id">>({ ...EMPTY_ADDR, ...initial });
  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  const districts = NEPAL_DISTRICTS[form.province] ?? [];

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.line1.trim() || !form.city.trim()) return;
    onSave(form);
  };

  const Field = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: CHARCOAL }}>
        {label}{req && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all";
  const inputStyle = { border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "#FDFAF4" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden my-auto"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)", border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h3 className="font-black text-base" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            {initial.id ? "Edit address" : "Add new address"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100" style={{ color: MUTED }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Label */}
          <Field label="Address label">
            <div className="flex gap-2">
              {["Home","Office","Other"].map(l => (
                <button type="button" key={l}
                  onClick={() => set("label", l)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    border: `1.5px solid ${form.label === l ? GOLD : BORDER}`,
                    backgroundColor: form.label === l ? "rgba(198,131,19,0.08)" : "#FDFAF4",
                    color: form.label === l ? GOLD : MUTED,
                  }}>
                  {l === "Home" ? "🏠" : l === "Office" ? "🏢" : "📍"} {l}
                </button>
              ))}
            </div>
          </Field>

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name" req>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Ramesh Sharma" className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Phone number" req>
              <input value={form.phone} onChange={e => set("phone", e.target.value)}
                type="tel" placeholder="+977-98XXXXXXXX" className={inputCls} style={inputStyle} />
            </Field>
          </div>

          {/* Address Line 1 */}
          <Field label="Street / Building" req>
            <input value={form.line1} onChange={e => set("line1", e.target.value)}
              placeholder="Ward no., Street name, Building name" className={inputCls} style={inputStyle} />
          </Field>

          {/* Address Line 2 */}
          <Field label="Landmark / Area (optional)">
            <input value={form.line2} onChange={e => set("line2", e.target.value)}
              placeholder="e.g. Near Pashupati Temple" className={inputCls} style={inputStyle} />
          </Field>

          {/* Province + District */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Province" req>
              <select value={form.province} onChange={e => { set("province", e.target.value); set("district", ""); }}
                className={inputCls} style={inputStyle}>
                {NEPAL_PROVINCES.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="District" req>
              <select value={form.district} onChange={e => set("district", e.target.value)}
                className={inputCls} style={inputStyle}>
                <option value="">Select district</option>
                {districts.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          {/* City + Postal */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="City / Municipality" req>
              <input value={form.city} onChange={e => set("city", e.target.value)}
                placeholder="Kathmandu" className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Postal code">
              <input value={form.postalCode} onChange={e => set("postalCode", e.target.value)}
                placeholder="44600" className={inputCls} style={inputStyle} />
            </Field>
          </div>

          {/* Country (locked to Nepal for now) */}
          <Field label="Country">
            <input value="Nepal" readOnly className={inputCls}
              style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
          </Field>

          {/* Default checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input type="checkbox" checked={form.isDefault} onChange={e => set("isDefault", e.target.checked)}
              className="w-4 h-4 rounded accent-[#C68313] cursor-pointer" />
            <span className="text-sm font-medium" style={{ color: CHARCOAL }}>Set as default address</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80"
              style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "#FDFAF4" }}>
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: GOLD }}>
              {initial.id ? "Save changes" : "Add address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const INITIAL_PAYMENTS: PayMethod[] = [
  { id:"p1", type:"KHALTI",  last4:"4821", expires:"06/27", isDefault:true  },
  { id:"p2", type:"ESEWA",   last4:"3309", expires:"12/28", isDefault:false },
];

// ── Shared sidebar ────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { id:"dashboard", icon:"⊹", label:"Dashboard"   },
  { id:"orders",    icon:"▦",  label:"Orders"      },
  { id:"track",     icon:"🚚", label:"Track order" },
  { id:"wishlist",  icon:"♡",  label:"Wishlist"    },
  { id:"addresses", icon:"⊙",  label:"Addresses"   },
  { id:"payment",   icon:"☐",  label:"Payment"     },
  { id:"settings",  icon:"✎",  label:"Settings"    },
];

function Sidebar({ active, onTab, onSignOut, user }: { active: string; onTab: (t: string) => void; onSignOut: () => void; user: any }) {
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
          <button key={l.id} onClick={() => onTab(l.id)}
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

// ── Page header (for non-dashboard tabs) ─────────────────────────────────────
function PageHeader({ crumb, nav }: { crumb: string; nav: () => void }) {
  return (
    <div className="text-center py-10 mb-6" style={{ backgroundColor: IVORY, borderRadius: "1rem" }}>
      <h1 className="text-3xl font-black mb-2" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
        My Account
      </h1>
      <div className="flex items-center justify-center gap-2 text-xs" style={{ color: MUTED }}>
        <button onClick={nav} className="hover:underline" style={{ color: GOLD }}>Home</button>
        <span>/</span>
        <span>Account</span>
        <span>/</span>
        <span style={{ color: CHARCOAL }}>{crumb}</span>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ user, onTab, nav }: { user: any; onTab: (t: string) => void; nav: (p: string) => void }) {
  const { ids: wishIds } = useWishlistStore();
  const points = user?.loyaltyPoints ?? 2840;
  const toNext = 4000 - points;
  const pct    = Math.min((points / 4000) * 100, 100);

  const RECENT = MOCK_ORDERS.slice(0, 3);
  const PICKS  = MOCK_PRODUCTS.slice(0, 3);

  const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
    OUT_FOR_DELIVERY: { bg: GOLD,      color: "#fff"     },
    DELIVERED:        { bg: "#F0F0EE", color: MUTED      },
    PROCESSING:       { bg: "#EFF6FF", color: "#3B82F6"  },
    PENDING:          { bg: "#FFFBEB", color: "#D97706"  },
  };

  return (
    <div className="space-y-5">
      {/* Loyalty hero */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1C1A16 0%, #2D2418 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, transparent 40%, rgba(198,131,19,0.06) 70%, transparent 90%)" }} />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>Gold Member</p>
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 ml-auto" style={{ backgroundColor: "rgba(198,131,19,0.2)", color: GOLD }}>🏅</div>
                <p className="text-[10px]" style={{ color: MUTED }}>{toNext.toLocaleString()} pts to Obsidian</p>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            Welcome back, {user?.name?.split(" ")[0]}.
          </h2>
          <p className="text-sm mb-5" style={{ color: "#BBA882" }}>
            You've earned{" "}
            <span className="font-black" style={{ color: GOLD }}>{points.toLocaleString()} points</span>
            {" "}— that's {formatPrice(points / 10)} in store credit, ready when you are.
          </p>
          {/* Progress bar */}
          <div className="flex items-center justify-between text-[10px] mb-1.5" style={{ color: MUTED }}>
            <span>Gold</span><span>Obsidian</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: GOLD }} />
          </div>
        </div>
      </div>

      {/* 3 KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon:"📦", value:"12", label:"ORDERS THIS YEAR", sub:"↑ +3 vs '24"           },
          { icon:"♡",  value:String(wishIds.length).padStart(2,"0"), label:"SAVED ITEMS",  sub:"↑ 2 back in stock"  },
          { icon:"⭐", value:String(points), label:"LOYALTY POINTS",  sub:"↑ redeemable"  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: IVORY }}>
                {s.icon}
              </div>
              <span className="text-[10px] font-bold" style={{ color: GOLD }}>{s.sub}</span>
            </div>
            <p className="text-3xl font-black mb-1" style={{ color: CHARCOAL }}>{s.value}</p>
            <p className="text-[10px] font-bold tracking-wider" style={{ color: MUTED }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bottom two-column */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">
        {/* Recent orders */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-base" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
              Recent orders
            </h3>
            <button onClick={() => onTab("orders")} className="text-xs font-bold underline-offset-2 hover:underline" style={{ color: GOLD }}>
              View all
            </button>
          </div>
          <div className="space-y-0">
            {RECENT.map((o, i) => {
              const st = STATUS_BADGE[o.status] ?? { bg: IVORY, color: MUTED };
              return (
                <div key={o.id} className="flex items-center justify-between py-3"
                  style={{ borderBottom: i < RECENT.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <div>
                    <p className="text-sm font-black" style={{ color: CHARCOAL }}>{o.orderNumber}</p>
                    <p className="text-[11px]" style={{ color: MUTED }}>
                      {new Date(o.createdAt).toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {o.items.length} item{o.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                      {o.status.replace(/_/g, " ")}
                    </span>
                    <p className="text-sm font-black" style={{ color: CHARCOAL }}>{formatPrice(o.total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pick up where you left off */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
          <h3 className="font-black text-base mb-4" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            Pick up where you left off
          </h3>
          <div className="space-y-0">
            {PICKS.map((p, i) => (
              <button key={p.id} onClick={() => nav("product")}
                className="flex items-center gap-3 w-full py-3 text-left transition-colors group"
                style={{ borderBottom: i < PICKS.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: IVORY }}>
                  {(p as any).emoji ?? "🛍️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate group-hover:underline" style={{ color: CHARCOAL }}>{p.name}</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>{formatPrice(p.basePrice)}</p>
                </div>
                <span className="text-sm shrink-0" style={{ color: MUTED }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Addresses ─────────────────────────────────────────────────────────────────
function AddressesTab({ nav }: { nav: () => void }) {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [formTarget, setFormTarget] = useState<(Omit<Address,"id"> & { id?: string }) | null>(null);
  const { showToast } = useUIStore();

  const setDefault = (id: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    showToast("Default address updated");
  };
  const deleteAddr = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    showToast("Address removed");
  };
  const handleSave = (data: Omit<Address,"id">) => {
    if (formTarget?.id) {
      setAddresses(prev => prev.map(a => {
        if (a.id !== formTarget.id) return data.isDefault ? { ...a, isDefault: false } : a;
        return { ...data, id: formTarget.id };
      }));
      showToast("Address updated");
    } else {
      const id = `a${Date.now()}`;
      setAddresses(prev => [
        ...(data.isDefault ? prev.map(a => ({ ...a, isDefault: false })) : prev),
        { ...data, id },
      ]);
      showToast("Address added");
    }
    setFormTarget(null);
  };

  const LABEL_ICON: Record<string, string> = { Home:"🏠", Office:"🏢", Other:"📍" };

  return (
    <div>
      {formTarget && (
        <AddressFormModal
          initial={formTarget}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
        />
      )}
      <PageHeader crumb="Addresses" nav={nav} />
      <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-lg" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            Saved addresses
          </h2>
          <button
            onClick={() => setFormTarget({ ...EMPTY_ADDR })}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-full transition-all"
            style={{ backgroundColor: GOLD }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add new address
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(a => (
            <div key={a.id} className="rounded-2xl p-5 transition-all"
              style={{ border: `1.5px solid ${a.isDefault ? GOLD : BORDER}`, backgroundColor: a.isDefault ? "rgba(198,131,19,0.02)" : "#fff" }}>

              {/* Card header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{LABEL_ICON[a.label] ?? "📍"}</span>
                  <p className="font-black text-sm" style={{ color: CHARCOAL }}>{a.label}</p>
                </div>
                {a.isDefault && (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: GOLD }}>DEFAULT</span>
                )}
              </div>

              {/* Address details */}
              <div className="text-xs space-y-1 mb-4" style={{ color: MUTED }}>
                <p className="font-semibold text-sm" style={{ color: CHARCOAL }}>{a.name}</p>
                <p>{a.line1}</p>
                {a.line2 && <p>{a.line2}</p>}
                <p>{a.city}{a.district ? `, ${a.district}` : ""}{a.province ? ` — ${a.province}` : ""}</p>
                {a.postalCode && <p>PIN: {a.postalCode}, {a.country}</p>}
                <p className="pt-0.5" style={{ color: CHARCOAL }}>📞 {a.phone}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                <button
                  onClick={() => setFormTarget({ ...a })}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full transition-all"
                  style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "white" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL; }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Edit
                </button>
                {!a.isDefault && (
                  <button onClick={() => setDefault(a.id)}
                    className="px-3 py-1.5 text-xs font-bold rounded-full transition-all"
                    style={{ color: MUTED, border: `1.5px solid ${BORDER}` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
                  >
                    Set default
                  </button>
                )}
                {!a.isDefault && (
                  <button onClick={() => deleteAddr(a.id)}
                    className="ml-auto flex items-center gap-1 text-xs font-bold transition-colors px-3 py-1.5 rounded-full"
                    style={{ color: "#EF4444", border: "1.5px solid #FEE2E2" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#FEF2F2"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Empty-state add card */}
          <button
            onClick={() => setFormTarget({ ...EMPTY_ADDR })}
            className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all min-h-40"
            style={{ border: `1.5px dashed ${BORDER}`, color: MUTED }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: IVORY }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            </div>
            <p className="text-xs font-bold">Add new address</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment ───────────────────────────────────────────────────────────────────
function PaymentTab({ nav }: { nav: () => void }) {
  const [methods, setMethods] = useState<PayMethod[]>(INITIAL_PAYMENTS);
  const [adding, setAdding]   = useState(false);
  const { showToast } = useUIStore();

  const setDefault = (id: string) => {
    setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    showToast("Default payment method updated");
  };
  const deleteMethod = (id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
    showToast("Payment method removed");
  };

  const CARD_ICONS: Record<string, { label: string; bg: string }> = {
    KHALTI: { label: "KHALTI", bg: "#5C2D91" },
    ESEWA:  { label: "ESEWA",  bg: "#60BB46" },
    VISA:   { label: "VISA",   bg: CHARCOAL  },
    MASTER: { label: "MAST",   bg: CHARCOAL  },
  };

  return (
    <div>
      <PageHeader crumb="Payment" nav={nav} />
      <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-lg" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            Payment methods
          </h2>
          <button onClick={() => setAdding(!adding)}
            className="px-4 py-2 text-xs font-bold text-white rounded-full transition-all"
            style={{ backgroundColor: GOLD }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
            + Add card
          </button>
        </div>

        {adding && (
          <div className="mb-4 p-4 rounded-2xl space-y-3" style={{ border: `1.5px dashed ${BORDER}` }}>
            <p className="text-xs font-bold" style={{ color: CHARCOAL }}>Add new payment method</p>
            <div className="grid grid-cols-2 gap-2">
              {["KHALTI","ESEWA"].map(type => (
                <button key={type} onClick={() => {
                  setMethods(prev => [...prev, { id:`p${Date.now()}`, type, last4:"0000", expires:"12/29", isDefault:false }]);
                  setAdding(false);
                  showToast(`${type} added!`);
                }}
                  className="py-2.5 text-xs font-black text-white rounded-xl"
                  style={{ backgroundColor: CARD_ICONS[type]?.bg ?? "#1C1A16" }}>
                  + {type}
                </button>
              ))}
            </div>
            <button onClick={() => setAdding(false)} className="text-xs" style={{ color: MUTED }}>Cancel</button>
          </div>
        )}

        <div className="space-y-3">
          {methods.map(m => {
            const card = CARD_ICONS[m.type] ?? { label: m.type, bg: CHARCOAL };
            return (
              <div key={m.id} className="flex items-center gap-4 py-4 px-1"
                style={{ borderBottom: `1px solid ${BORDER}` }}>
                {/* Card icon */}
                <div className="w-14 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                  style={{ backgroundColor: card.bg }}>
                  {card.label}
                </div>
                {/* Details */}
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: CHARCOAL }}>
                    {m.type.charAt(0) + m.type.slice(1).toLowerCase()} •••• {m.last4}
                  </p>
                  <p className="text-[11px]" style={{ color: MUTED }}>Expires {m.expires}</p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {m.isDefault && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: GOLD }}>DEFAULT</span>
                  )}
                  {!m.isDefault && (
                    <button onClick={() => setDefault(m.id)} className="text-xs font-semibold" style={{ color: MUTED }}>Set default</button>
                  )}
                  <button onClick={() => showToast("Edit payment — coming soon")} className="text-xs font-semibold" style={{ color: CHARCOAL }}>Edit</button>
                  <button onClick={() => deleteMethod(m.id)} className="text-sm" style={{ color: "#EF4444" }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Settings / personal info ──────────────────────────────────────────────────
function SettingsTab({ user, nav }: { user: any; nav: () => void }) {
  const { showToast } = useUIStore();
  const [form, setForm] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: "", city: "Kathmandu" });
  const s = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHeader crumb="Settings" nav={nav} />
      <div className="space-y-5">
        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}` }}>
          <h2 className="font-black text-base mb-5" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            Personal Information
          </h2>
          <div className="space-y-4 max-w-lg">
            {[
              { k:"name",  label:"Full Name",  type:"text"  },
              { k:"email", label:"Email",      type:"email" },
              { k:"phone", label:"Phone",      type:"tel"   },
              { k:"city",  label:"City",       type:"text"  },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.k]} onChange={e => s(f.k, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = BORDER} />
              </div>
            ))}
            <button onClick={() => showToast("Profile saved!")}
              className="px-6 py-2.5 text-sm font-bold text-white rounded-xl"
              style={{ backgroundColor: GOLD }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
              Save Changes
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}` }}>
          <h2 className="font-black text-base mb-4" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            Security
          </h2>
          <div className="space-y-3">
            {[
              { label:"Change Password", sub:"Last changed: Never"  },
              { label:"Two-Factor Auth", sub:"Not enabled"          },
              { label:"Active Sessions", sub:"1 session active"     },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{s.label}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{s.sub}</p>
                </div>
                <button onClick={() => showToast("Coming soon")} className="text-xs font-bold" style={{ color: GOLD }}>Manage</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { nav, showToast, pageData } = useUIStore();
  const { user, setUser }            = useAuthStore();
  const [tab, setTab]                = useState(pageData?.tab ?? "dashboard");

  if (!user) { nav("login"); return null; }

  const handleTab = (t: string) => {
    if (t === "orders")   { nav("orders");  return; }
    if (t === "track")    { nav("track");   return; }
    if (t === "wishlist") { nav("wishlist"); return; }
    setTab(t);
  };

  const signOut = () => { setUser(null); nav("home"); showToast("Signed out"); };

  return (
    <div style={{ backgroundColor: "#FDFBF7", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <Sidebar active={tab} onTab={handleTab} onSignOut={signOut} user={user} />
          <div>
            {tab === "dashboard"  && <Dashboard user={user} onTab={handleTab} nav={p => nav(p)} />}
            {tab === "addresses"  && <AddressesTab nav={() => nav("home")} />}
            {tab === "payment"    && <PaymentTab   nav={() => nav("home")} />}
            {tab === "settings"   && <SettingsTab  user={user} nav={() => nav("home")} />}
          </div>
        </div>
      </div>
    </div>
  );
}
