"use client";
import { useState } from "react";
import { formatPrice, MOCK_CATEGORIES, useUIStore, useAuthStore } from "@/app/lib/store";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const MUTED    = "var(--color-muted)";

type SellerProduct = {
  id: string; name: string; category: string; emoji: string;
  basePrice: number; comparePrice: number; stock: number;
  description: string; freeShipping: boolean; isFlashSale: boolean;
  badge: string; status: "active" | "draft";
};

type SellerOrder = {
  id: string; orderNumber: string; customer: string; product: string;
  qty: number; total: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  date: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100   text-blue-700",
  SHIPPED:    "bg-purple-100 text-purple-700",
  DELIVERED:  "bg-green-100  text-green-700",
  CANCELLED:  "bg-red-100    text-red-700",
};

const INITIAL_PRODUCTS: SellerProduct[] = [
  { id:"sp1", name:"Apple iPhone 16 Pro Max", category:"Electronics", emoji:"📱", basePrice:195000, comparePrice:215000, stock:12, description:"Latest Apple flagship smartphone.", freeShipping:true,  isFlashSale:true,  badge:"New",  status:"active" },
  { id:"sp2", name:"Sony WH-1000XM6",         category:"Electronics", emoji:"🎧", basePrice:38500,  comparePrice:45000,  stock:45, description:"Premium noise-cancelling headphones.", freeShipping:true, isFlashSale:false, badge:"Sale", status:"active" },
  { id:"sp3", name:"MacBook Pro M4 14\"",      category:"Electronics", emoji:"💻", basePrice:285000, comparePrice:0,      stock:8,  description:"Apple Silicon powerhouse laptop.", freeShipping:true,  isFlashSale:false, badge:"",     status:"draft"  },
];

const INITIAL_ORDERS: SellerOrder[] = [
  { id:"o1", orderNumber:"NX-2025-47832", customer:"Arun Sharma",   product:"Apple iPhone 16 Pro Max", qty:1, total:195000, status:"DELIVERED",  date:"2025-05-18" },
  { id:"o2", orderNumber:"NX-2025-47234", customer:"Priya Thapa",   product:"Sony WH-1000XM6",         qty:2, total:77000,  status:"SHIPPED",    date:"2025-05-19" },
  { id:"o3", orderNumber:"NX-2025-48001", customer:"Ram Bahadur",   product:"MacBook Pro M4",           qty:1, total:285000, status:"PROCESSING", date:"2025-05-20" },
  { id:"o4", orderNumber:"NX-2025-48102", customer:"Sita Maharjan", product:"AirPods Pro 4",            qty:1, total:32000,  status:"PENDING",    date:"2025-05-20" },
];

const EMOJIS = ["📱","💻","🎧","⌚","📺","🎮","👟","👗","👖","🏠","🍵","📚","💄","⚽","🧹","📖","🎵","🛍️","💍","🎒"];

function Input({ label, note, ...props }: any) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>
        {label}{note && <span className="font-normal ml-1" style={{ color: MUTED }}>{note}</span>}
      </label>
      <input {...props}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, ...(props.style ?? {}) }}
        onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(198,131,19,0.1)`; }}
        onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }} />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none" onClick={onChange}>
      <div className="w-10 h-5 rounded-full relative transition-colors" style={{ backgroundColor: value ? GOLD : "#D1D5DB" }}>
        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all" style={{ left: value ? "22px" : "2px" }} />
      </div>
      <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>{label}</span>
    </label>
  );
}

function ProductModal({ product, onSave, onClose }: {
  product: Partial<SellerProduct> | null;
  onSave: (p: SellerProduct) => void;
  onClose: () => void;
}) {
  const EMPTY: Partial<SellerProduct> = {
    name:"", category:"Electronics", emoji:"🛍️", basePrice:0, comparePrice:0,
    stock:0, description:"", freeShipping:false, isFlashSale:false, badge:"", status:"active",
  };
  const [form, setForm] = useState<Partial<SellerProduct>>(product ? { ...product } : EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const disc = (form.comparePrice ?? 0) > (form.basePrice ?? 0)
    ? Math.round((((form.comparePrice ?? 0) - (form.basePrice ?? 0)) / (form.comparePrice ?? 1)) * 100)
    : 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Product name is required";
    if (!form.basePrice || form.basePrice <= 0) e.basePrice = "Enter a valid price";
    if (!form.stock || form.stock < 0) e.stock = "Enter valid stock quantity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id:           form.id ?? `p${Date.now()}`,
      name:         form.name!,
      category:     form.category ?? "Electronics",
      emoji:        form.emoji ?? "🛍️",
      basePrice:    form.basePrice!,
      comparePrice: form.comparePrice ?? 0,
      stock:        form.stock ?? 0,
      description:  form.description ?? "",
      freeShipping: form.freeShipping ?? false,
      isFlashSale:  form.isFlashSale ?? false,
      badge:        form.badge ?? "",
      status:       form.status ?? "active",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" style={{ border: `1px solid ${BORDER}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white rounded-t-3xl z-10" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="text-base font-black" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            {product?.id ? "Edit Product" : "Add New Product"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors hover:bg-gray-100" style={{ color: MUTED }}>✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: CHARCOAL }}>Product Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => set("emoji", e)}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                  style={{ backgroundColor: form.emoji === e ? IVORY : "#F9F9F9", border: `2px solid ${form.emoji === e ? GOLD : BORDER}` }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <Input label="Product Name *" value={form.name ?? ""} onChange={(e: any) => set("name", e.target.value)} placeholder="e.g. Apple iPhone 16 Pro Max 256GB" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Category + Badge */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>Category *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "white" }}>
                {MOCK_CATEGORIES.map(c => <option key={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>Badge <span style={{ color: MUTED }}>(optional)</span></label>
              <select value={form.badge ?? ""} onChange={e => set("badge", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "white" }}>
                <option value="">No Badge</option>
                {["New","Sale","Hot","Trending","Limited"].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Prices */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input label="Selling Price (रू) *" type="number" value={form.basePrice || ""} onChange={(e: any) => set("basePrice", Number(e.target.value))} placeholder="0" />
                {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice}</p>}
              </div>
              <div>
                <Input label="Original / MRP (रू)" note="— for discount strike-through" type="number" value={form.comparePrice || ""} onChange={(e: any) => set("comparePrice", Number(e.target.value))} placeholder="0 = no discount" />
              </div>
            </div>
            {disc > 0 && (
              <div className="mt-2 px-4 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: IVORY, color: GOLD }}>
                ✓ {disc}% discount applied — customers will see रू {(form.comparePrice ?? 0).toLocaleString()} crossed out
              </div>
            )}
          </div>

          {/* Stock */}
          <div>
            <Input label="Stock Quantity *" type="number" value={form.stock || ""} onChange={(e: any) => set("stock", Number(e.target.value))} placeholder="0" />
            {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>Product Description</label>
            <textarea value={form.description ?? ""} onChange={e => set("description", e.target.value)}
              placeholder="Describe your product — features, specifications, what's in the box..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
              style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(198,131,19,0.1)`; }}
              onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }} />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <Toggle label="🚚 Free Shipping" value={form.freeShipping ?? false} onChange={() => set("freeShipping", !form.freeShipping)} />
            <Toggle label="⚡ Flash Sale"    value={form.isFlashSale ?? false}  onChange={() => set("isFlashSale",  !form.isFlashSale)}  />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: CHARCOAL }}>Listing Status</label>
            <div className="flex gap-2">
              {([["active","✓ Active — visible to shoppers"],["draft","◷ Draft — hidden from shoppers"]] as const).map(([s, label]) => (
                <button key={s} onClick={() => set("status", s)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={form.status === s
                    ? { backgroundColor: GOLD, color: "#fff" }
                    : { backgroundColor: IVORY, color: MUTED, border: `1px solid ${BORDER}` }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 sticky bottom-0 bg-white rounded-b-3xl" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: IVORY, color: MUTED, border: `1px solid ${BORDER}` }}>
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ backgroundColor: GOLD }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
            {product?.id ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StoreSettings({ user, showToast }: { user: any; showToast: any }) {
  const [store, setStore] = useState({
    name: user.name + "'s Store", description: "Quality products at great prices",
    phone: "+977-98XXXXXXXX", email: user.email,
    returnPolicy: "7-day hassle-free returns", processingTime: "1-2 business days",
    bankName: "Nepal Investment Bank", accountNo: "",
  });
  const s = (k: string, v: string) => setStore(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5">
      <h2 className="font-black text-base" style={{ color: CHARCOAL }}>Store Settings</h2>
      <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="font-bold text-sm" style={{ color: CHARCOAL }}>Store Information</h3>
        <Input label="Store Name" value={store.name} onChange={(e: any) => s("name", e.target.value)} placeholder="Your store name" />
        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>Store Description</label>
          <textarea value={store.description} onChange={e => s("description", e.target.value)} rows={2}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Contact Phone" value={store.phone} onChange={(e: any) => s("phone", e.target.value)} />
          <Input label="Contact Email" type="email" value={store.email} onChange={(e: any) => s("email", e.target.value)} />
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="font-bold text-sm" style={{ color: CHARCOAL }}>Store Policies</h3>
        <Input label="Return Policy" value={store.returnPolicy} onChange={(e: any) => s("returnPolicy", e.target.value)} placeholder="e.g. 7-day hassle-free returns" />
        <Input label="Processing Time" value={store.processingTime} onChange={(e: any) => s("processingTime", e.target.value)} placeholder="e.g. 1-2 business days" />
      </div>
      <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="font-bold text-sm" style={{ color: CHARCOAL }}>Payout Bank Details</h3>
        <Input label="Bank Name" value={store.bankName} onChange={(e: any) => s("bankName", e.target.value)} placeholder="Your bank name" />
        <Input label="Account Number" value={store.accountNo} onChange={(e: any) => s("accountNo", e.target.value)} placeholder="Your bank account number" />
      </div>
      <button onClick={() => showToast("Store settings saved!")}
        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
        style={{ backgroundColor: GOLD }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
        Save All Settings
      </button>
    </div>
  );
}

export function SellerDashPage() {
  const { nav, showToast } = useUIStore();
  const { user } = useAuthStore();
  const [tab, setTab]           = useState("overview");
  const [products, setProducts] = useState<SellerProduct[]>(INITIAL_PRODUCTS);
  const [orders, setOrders]     = useState<SellerOrder[]>(INITIAL_ORDERS);
  const [modal, setModal]       = useState<{ open: boolean; product: Partial<SellerProduct> | null }>({ open: false, product: null });
  const [orderFilter, setOrderFilter]   = useState("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch]     = useState("");

  if (!user) { nav("login"); return null; }

  const filteredOrders = orders.filter(o =>
    (orderFilter === "ALL" || o.status === orderFilter) &&
    (!search || o.orderNumber.includes(search) || o.customer.toLowerCase().includes(search.toLowerCase()))
  );

  const saveProduct = (p: SellerProduct) => {
    const exists = products.find(x => x.id === p.id);
    setProducts(prev => exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
    showToast(exists ? "Product updated!" : "Product added to your store!");
    setModal({ open: false, product: null });
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast("Product removed from your store");
    setDeleteConfirm(null);
  };

  const updateOrderStatus = (id: string, status: SellerOrder["status"]) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    showToast("Order status updated");
  };

  const TABS = [
    { id:"overview",  label:"Overview",       icon:"📊" },
    { id:"products",  label:"My Products",    icon:"🛍️" },
    { id:"orders",    label:"Orders",         icon:"📦" },
    { id:"analytics", label:"Analytics",      icon:"📈" },
    { id:"payouts",   label:"Payouts",        icon:"💰" },
    { id:"settings",  label:"Store Settings", icon:"⚙️" },
  ];

  return (
    <div style={{ backgroundColor: "#FDFBF7", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
              Seller Hub
            </h1>
            <p className="text-xs" style={{ color: MUTED }}>{user.name}'s Store · PeaNut Marketplace</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => nav("home")}
              className="px-3 py-2 text-xs font-bold rounded-xl transition-all hidden sm:block"
              style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
              🌐 View Store
            </button>
            <button onClick={() => setModal({ open: true, product: null })}
              className="px-4 py-2 text-xs font-bold text-white rounded-xl transition-all"
              style={{ backgroundColor: GOLD }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
              + Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">

          {/* Sidebar */}
          <aside>
            <div className="bg-white rounded-2xl p-2 sticky top-20" style={{ border: `1px solid ${BORDER}` }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-semibold transition-all mb-0.5 text-left"
                  style={tab === t.id ? { backgroundColor: IVORY, color: GOLD } : { color: MUTED }}>
                  <span className="text-base">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div>

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div className="space-y-5">
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon:"💰", label:"Revenue (30d)",    value:"रू 2,40,000", sub:"+12%",     color: GOLD        },
                    { icon:"📦", label:"Total Orders",     value:String(orders.length), sub:"this month", color:"#22C55E"  },
                    { icon:"🛍️", label:"Active Products",  value:String(products.filter(p=>p.status==="active").length), sub:"listed", color:"#3B82F6" },
                    { icon:"⭐", label:"Store Rating",     value:"4.9 ★",        sub:"245 reviews", color: GOLD      },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4" style={{ border: `1px solid ${BORDER}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{s.icon}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: IVORY, color: MUTED }}>{s.sub}</span>
                      </div>
                      <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <h3 className="font-black text-sm" style={{ color: CHARCOAL }}>Recent Orders</h3>
                    <button onClick={() => setTab("orders")} className="text-xs font-bold" style={{ color: GOLD }}>View all →</button>
                  </div>
                  {orders.slice(0,4).map((o, i) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: i < 3 ? `1px solid ${BORDER}` : "none" }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: CHARCOAL }}>{o.orderNumber}</p>
                        <p className="text-[11px]" style={{ color: MUTED }}>{o.customer} · {o.product.slice(0,28)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black" style={{ color: GOLD }}>{formatPrice(o.total)}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { l:"Add Product",    i:"➕", fn: () => setModal({ open: true, product: null }) },
                    { l:"View Orders",    i:"📦", fn: () => setTab("orders")   },
                    { l:"Analytics",      i:"📊", fn: () => setTab("analytics") },
                    { l:"Store Settings", i:"⚙️", fn: () => setTab("settings") },
                  ].map(a => (
                    <button key={a.l} onClick={a.fn}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl text-xs font-bold transition-all"
                      style={{ border: `1px solid ${BORDER}`, color: CHARCOAL }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL; e.currentTarget.style.transform = "none"; }}>
                      <span className="text-2xl">{a.i}</span>{a.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRODUCTS ── */}
            {tab === "products" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-base" style={{ color: CHARCOAL }}>
                    My Products <span className="text-sm font-normal" style={{ color: MUTED }}>({products.length})</span>
                  </h2>
                  <button onClick={() => setModal({ open: true, product: null })}
                    className="px-4 py-2 text-xs font-bold text-white rounded-xl transition-all"
                    style={{ backgroundColor: GOLD }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
                    + Add New Product
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center" style={{ border: `1px solid ${BORDER}` }}>
                    <div className="text-6xl mb-4">🛍️</div>
                    <h3 className="font-black text-lg mb-2" style={{ color: CHARCOAL }}>No products yet</h3>
                    <p className="text-sm mb-5" style={{ color: MUTED }}>Add your first product to start selling on PeaNut</p>
                    <button onClick={() => setModal({ open: true, product: null })}
                      className="px-6 py-2.5 text-sm font-bold text-white rounded-xl"
                      style={{ backgroundColor: GOLD }}>
                      + Add First Product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ border: `1px solid ${BORDER}` }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: IVORY }}>
                          {p.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-sm font-bold truncate" style={{ color: CHARCOAL }}>{p.name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {p.status}
                            </span>
                            {p.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: GOLD }}>
                                {p.badge}
                              </span>
                            )}
                            {p.isFlashSale && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0 bg-orange-500">⚡ Flash</span>}
                          </div>
                          <p className="text-[11px]" style={{ color: MUTED }}>
                            {p.category} · Stock: {p.stock}
                            {p.freeShipping && " · 🚚 Free shipping"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black" style={{ color: GOLD }}>{formatPrice(p.basePrice)}</p>
                          {p.comparePrice > p.basePrice && (
                            <p className="text-[11px] line-through" style={{ color: MUTED }}>{formatPrice(p.comparePrice)}</p>
                          )}
                          {p.comparePrice > p.basePrice && (
                            <p className="text-[10px] font-bold" style={{ color: "#22C55E" }}>
                              {Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100)}% off
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setModal({ open: true, product: p })}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                            style={{ backgroundColor: IVORY, color: GOLD, border: `1px solid ${BORDER}` }}>
                            Edit
                          </button>
                          {deleteConfirm === p.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => deleteProduct(p.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500 text-white">Yes, delete</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1.5 text-xs rounded-lg" style={{ backgroundColor: IVORY, color: MUTED }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(p.id)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                              style={{ backgroundColor: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="font-black text-base" style={{ color: CHARCOAL }}>
                    Orders <span className="text-sm font-normal" style={{ color: MUTED }}>({filteredOrders.length})</span>
                  </h2>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search order # or customer..."
                    className="px-4 py-2 rounded-xl text-xs outline-none"
                    style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, width: "220px" }}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                {/* Status filters */}
                <div className="flex gap-2 flex-wrap">
                  {["ALL","PENDING","PROCESSING","SHIPPED","DELIVERED","CANCELLED"].map(s => (
                    <button key={s} onClick={() => setOrderFilter(s)}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-full transition-all"
                      style={orderFilter === s
                        ? { backgroundColor: GOLD, color: "#fff" }
                        : { backgroundColor: IVORY, color: MUTED, border: `1px solid ${BORDER}` }}>
                      {s}
                    </button>
                  ))}
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center" style={{ border: `1px solid ${BORDER}` }}>
                    <div className="text-5xl mb-3">📦</div>
                    <p className="font-bold" style={{ color: CHARCOAL }}>No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map(o => (
                      <div key={o.id} className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-black" style={{ color: CHARCOAL }}>{o.orderNumber}</p>
                            <p className="text-xs" style={{ color: MUTED }}>{o.customer} · {o.date}</p>
                          </div>
                          <p className="text-sm font-black" style={{ color: GOLD }}>{formatPrice(o.total)}</p>
                        </div>
                        <p className="text-xs mb-3 font-medium" style={{ color: CHARCOAL }}>
                          {o.product} × {o.qty}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                          {o.status !== "DELIVERED" && o.status !== "CANCELLED" && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: MUTED }}>Update status:</span>
                              <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as SellerOrder["status"])}
                                className="text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                                style={{ border: `1px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "white" }}>
                                <option value="PENDING">PENDING</option>
                                <option value="PROCESSING">PROCESSING</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {tab === "analytics" && (
              <div className="space-y-5">
                <h2 className="font-black text-base" style={{ color: CHARCOAL }}>Analytics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { l:"Total Revenue",   v:"रू 8,40,000", sub:"All time"       },
                    { l:"This Month",      v:"रू 2,40,000", sub:"+12% vs last"   },
                    { l:"Avg Order Value", v:"रू 52,000",   sub:"Per order"      },
                    { l:"Conversion",      v:"3.8%",         sub:"Views → orders" },
                  ].map(s => (
                    <div key={s.l} className="bg-white rounded-2xl p-4 text-center" style={{ border: `1px solid ${BORDER}` }}>
                      <p className="text-lg font-black mb-1" style={{ color: GOLD }}>{s.v}</p>
                      <p className="text-xs font-semibold" style={{ color: CHARCOAL }}>{s.l}</p>
                      <p className="text-[11px]" style={{ color: MUTED }}>{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue bar chart */}
                <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
                  <h3 className="font-black text-sm mb-5" style={{ color: CHARCOAL }}>Monthly Revenue — 2025</h3>
                  <div className="flex items-end gap-1.5 h-36">
                    {[
                      { m:"Jan",v:180000 },{ m:"Feb",v:220000 },{ m:"Mar",v:195000 },
                      { m:"Apr",v:310000 },{ m:"May",v:240000 },{ m:"Jun",v:0 },
                      { m:"Jul",v:0 },    { m:"Aug",v:0 },    { m:"Sep",v:0 },
                      { m:"Oct",v:0 },    { m:"Nov",v:0 },    { m:"Dec",v:0 },
                    ].map(({ m, v }) => (
                      <div key={m} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-lg transition-all"
                          style={{ height: v ? `${(v / 310000) * 120}px` : "4px", backgroundColor: v ? GOLD : "#F0EBE0", minHeight: "4px" }} />
                        <span className="text-[9px]" style={{ color: MUTED }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top products */}
                <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
                  <h3 className="font-black text-sm mb-4" style={{ color: CHARCOAL }}>Top Selling Products</h3>
                  <div className="space-y-4">
                    {products.slice(0,3).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 text-[11px] font-black flex items-center justify-center rounded-full text-white shrink-0"
                          style={{ backgroundColor: [GOLD,"#9B6210","#D4A63A"][i] }}>
                          {i + 1}
                        </span>
                        <span className="text-xl">{p.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate mb-1" style={{ color: CHARCOAL }}>{p.name}</p>
                          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: IVORY }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${[100, 70, 45][i]}%`, backgroundColor: GOLD }} />
                          </div>
                        </div>
                        <p className="text-xs font-black shrink-0" style={{ color: GOLD }}>{formatPrice(p.basePrice)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PAYOUTS ── */}
            {tab === "payouts" && (
              <div className="space-y-5">
                <h2 className="font-black text-base" style={{ color: CHARCOAL }}>Payouts</h2>

                {/* Balance card */}
                <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #1C1A16 0%, #2D2418 100%)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#BBA882" }}>Available Balance</p>
                  <p className="text-4xl font-black text-white mb-1">रू 1,84,500</p>
                  <p className="text-xs mb-6" style={{ color: "#BBA882" }}>Next payout: 25 May 2025</p>
                  <button onClick={() => showToast("Withdrawal request submitted! Funds arrive within 2 business days.")}
                    className="px-8 py-2.5 rounded-full text-sm font-black text-white transition-all"
                    style={{ backgroundColor: GOLD }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
                    Withdraw Funds
                  </button>
                </div>

                {/* Transaction history */}
                <div className="bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <h3 className="font-black text-sm" style={{ color: CHARCOAL }}>Transaction History</h3>
                  </div>
                  {[
                    { date:"15 May 2025", amount:120000, type:"Payout",    status:"Completed" },
                    { date:"01 May 2025", amount:85000,  type:"Payout",    status:"Completed" },
                    { date:"28 Apr 2025", amount:15000,  type:"Refund",    status:"Processed" },
                    { date:"15 Apr 2025", amount:210000, type:"Payout",    status:"Completed" },
                    { date:"01 Apr 2025", amount:95000,  type:"Payout",    status:"Completed" },
                  ].map((t, i, arr) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: CHARCOAL }}>{t.type}</p>
                        <p className="text-[11px]" style={{ color: MUTED }}>{t.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black" style={{ color: t.type === "Refund" ? "#EF4444" : GOLD }}>
                          {t.type === "Refund" ? "−" : "+"}{formatPrice(t.amount)}
                        </p>
                        <span className="text-[10px] font-bold" style={{ color: "#22C55E" }}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === "settings" && <StoreSettings user={user} showToast={showToast} />}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <ProductModal product={modal.product} onSave={saveProduct} onClose={() => setModal({ open: false, product: null })} />
      )}
    </div>
  );
}
