"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { cn, formatPrice, useUIStore, useAuthStore } from "@/app/lib/store";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const MUTED    = "var(--color-muted)";

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminUser    = { id:string; name:string; email:string; role:string; orders:number; joined:string; status:"active"|"banned"; };
type AdminSeller  = { id:string; storeName:string; owner:string; email:string; products:number; revenue:string; status:"pending"|"approved"|"suspended"; joined:string; };
type AdminOrder   = { id:string; orderNumber:string; customer:string; seller:string; total:number; status:string; date:string; items:number; payment:string; };
type AdminProduct = { id:string; name:string; emoji:string; category:string; seller:string; price:number; stock:number; status:"active"|"suspended"; };
type Coupon       = { id:string; code:string; discount:number; type:"percent"|"fixed"; minOrder:number; uses:number; maxUses:number; status:"active"|"expired"; expires:string; };

// ── Mock data ─────────────────────────────────────────────────────────────────
const USERS: AdminUser[] = [
  { id:"u1", name:"Arun Sharma",   email:"arun@email.com",   role:"CUSTOMER", orders:12, joined:"Jan 2025", status:"active" },
  { id:"u2", name:"Priya Thapa",   email:"priya@email.com",  role:"CUSTOMER", orders:5,  joined:"Feb 2025", status:"active" },
  { id:"u3", name:"Ram Bahadur",   email:"ram@email.com",    role:"SELLER",   orders:0,  joined:"Mar 2025", status:"active" },
  { id:"u4", name:"Sita Maharjan", email:"sita@email.com",   role:"SELLER",   orders:0,  joined:"Apr 2025", status:"banned" },
  { id:"u5", name:"Bikash Paudel", email:"bikash@email.com", role:"CUSTOMER", orders:31, joined:"Dec 2024", status:"active" },
  { id:"u6", name:"Maya Tamang",   email:"maya@email.com",   role:"CUSTOMER", orders:8,  joined:"Mar 2025", status:"active" },
];

const SELLERS: AdminSeller[] = [
  { id:"s1", storeName:"TechStore Nepal", owner:"Ram Bahadur",  email:"ram@email.com",   products:48, revenue:"रू 8,40,000", status:"approved",  joined:"Jan 2025" },
  { id:"s2", storeName:"FashionHub",      owner:"Sita Maharjan",email:"sita@email.com",  products:12, revenue:"रू 1,20,000", status:"pending",   joined:"May 2025" },
  { id:"s3", storeName:"HomeAppliances",  owner:"Bikash Paudel",email:"bikash@email.com",products:35, revenue:"रू 4,50,000", status:"approved",  joined:"Feb 2025" },
  { id:"s4", storeName:"SportZone",       owner:"Maya Tamang",  email:"maya@email.com",  products:0,  revenue:"रू 0",        status:"pending",   joined:"May 2025" },
  { id:"s5", storeName:"BookWorld",       owner:"Dev Karki",    email:"dev@email.com",   products:22, revenue:"रू 2,80,000", status:"suspended", joined:"Mar 2025" },
];

const ORDERS: AdminOrder[] = [
  { id:"o1", orderNumber:"NX-2025-47832", customer:"Arun Sharma",   seller:"TechStore Nepal", total:195000, status:"DELIVERED",  date:"2025-05-18", items:1, payment:"COD"    },
  { id:"o2", orderNumber:"NX-2025-47234", customer:"Priya Thapa",   seller:"TechStore Nepal", total:77000,  status:"SHIPPED",    date:"2025-05-19", items:2, payment:"Visa"   },
  { id:"o3", orderNumber:"NX-2025-48001", customer:"Bikash Paudel", seller:"HomeAppliances",  total:285000, status:"PROCESSING", date:"2025-05-20", items:1, payment:"COD"    },
  { id:"o4", orderNumber:"NX-2025-48102", customer:"Maya Tamang",   seller:"TechStore Nepal", total:32000,  status:"PENDING",    date:"2025-05-20", items:1, payment:"COD"    },
  { id:"o5", orderNumber:"NX-2025-48200", customer:"Arun Sharma",   seller:"FashionHub",      total:18500,  status:"CANCELLED",  date:"2025-05-17", items:1, payment:"Visa"   },
];

const COUPONS: Coupon[] = [
  { id:"c1", code:"PEANUT20",  discount:20,  type:"percent", minOrder:2000,  uses:1240, maxUses:5000, status:"active",  expires:"2025-06-30" },
  { id:"c2", code:"FIRSTBUY", discount:500, type:"fixed",   minOrder:1000,  uses:320,  maxUses:1000, status:"active",  expires:"2025-12-31" },
  { id:"c3", code:"FLASH50",  discount:50,  type:"percent", minOrder:5000,  uses:890,  maxUses:2000, status:"expired", expires:"2025-05-01" },
  { id:"c4", code:"FREESHIP", discount:150, type:"fixed",   minOrder:500,   uses:4200, maxUses:9999, status:"active",  expires:"2025-07-31" },
];

const MONTHLY_REVENUE = [
  { month:"Dec", val:4200000 }, { month:"Jan", val:5800000 }, { month:"Feb", val:5200000 },
  { month:"Mar", val:6800000 }, { month:"Apr", val:7400000 }, { month:"May", val:8400000 },
];

const STATUS_COLORS: Record<string,string> = {
  PENDING:"bg-yellow-100 text-yellow-700", PROCESSING:"bg-blue-100 text-blue-700",
  SHIPPED:"bg-purple-100 text-purple-700", DELIVERED:"bg-green-100 text-green-700",
  CANCELLED:"bg-red-100 text-red-700",
};
const ROLE_COLORS: Record<string,string> = {
  CUSTOMER:"bg-blue-100 text-blue-700", SELLER:"bg-amber-100 text-amber-700",
  ADMIN:"bg-purple-100 text-purple-700", SUPER_ADMIN:"bg-red-100 text-red-700",
};

// ── Shared components ─────────────────────────────────────────────────────────
function Pill({ label, color }: { label:string; color:string }) {
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}
function StatCard({ icon, label, value, sub, color = GOLD }: any) {
  return (
    <div className="bg-white dark:bg-[#1A1814] rounded-2xl p-5" style={{ border:`1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor:IVORY, color:MUTED }}>{sub}</span>}
      </div>
      <p className="text-2xl font-black mb-0.5" style={{ color }}>{value}</p>
      <p className="text-xs" style={{ color:MUTED }}>{label}</p>
    </div>
  );
}
function SectionHeader({ title, count }: { title:string; count?:number }) {
  return (
    <h2 className="font-black text-base" style={{ color:CHARCOAL }}>
      {title}{count !== undefined && <span className="text-sm font-normal ml-2" style={{ color:MUTED }}>({count})</span>}
    </h2>
  );
}

// ── Product Modal (Add / Edit) ────────────────────────────────────────────────
type ProductForm = { name:string; emoji:string; category:string; seller:string; price:string; stock:string; };
function ProductModal({ initial, onSave, onClose }: {
  initial?: AdminProduct;
  onSave: (p: AdminProduct) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductForm>({
    name:     initial?.name     ?? "",
    emoji:    initial?.emoji    ?? "🛍️",
    category: initial?.category ?? "",
    seller:   initial?.seller   ?? "",
    price:    initial ? String(initial.price) : "",
    stock:    initial ? String(initial.stock) : "",
  });
  const set = (k: keyof ProductForm, v: string) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.name.trim() && form.price && form.stock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor:"rgba(0,0,0,0.55)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#1A1814] rounded-3xl w-full max-w-md shadow-2xl" style={{ border:`1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:`1px solid ${BORDER}` }}>
          <h3 className="font-black text-sm" style={{ color:CHARCOAL }}>{initial ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-sm" style={{ color:MUTED }}>✕</button>
        </div>
        <div className="p-6 space-y-4">
          {([
            { k:"name",     label:"Product Name",     type:"text",   ph:"e.g. iPhone 16 Pro Max" },
            { k:"emoji",    label:"Icon (emoji)",      type:"text",   ph:"🛍️"                     },
            { k:"category", label:"Category",          type:"text",   ph:"Electronics"             },
            { k:"seller",   label:"Seller / Brand",    type:"text",   ph:"TechStore Nepal"         },
            { k:"price",    label:"Price (रू)",         type:"number", ph:"0"                       },
            { k:"stock",    label:"Stock Qty",          type:"number", ph:"0"                       },
          ] as const).map(f => (
            <div key={f.k}>
              <label className="block text-xs font-bold mb-1" style={{ color:CHARCOAL }}>{f.label}</label>
              <input type={f.type} value={form[f.k]} placeholder={f.ph}
                onChange={e => set(f.k, e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border:`1.5px solid ${BORDER}`, color:CHARCOAL, backgroundColor:"var(--color-bg)" }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop:`1px solid ${BORDER}` }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold"
            style={{ backgroundColor:IVORY, color:MUTED, border:`1px solid ${BORDER}` }}>Cancel</button>
          <button disabled={!valid}
            onClick={() => onSave({
              id:      initial?.id ?? `p${Date.now()}`,
              name:    form.name.trim(),
              emoji:   form.emoji || "🛍️",
              category:form.category,
              seller:  form.seller,
              price:   Number(form.price),
              stock:   Number(form.stock),
              status:  initial?.status ?? "active",
            })}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40"
            style={{ backgroundColor:GOLD }}>
            {initial ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Coupon Modal ──────────────────────────────────────────────────────────────
function CouponModal({ onSave, onClose }: { onSave:(c:Coupon) => void; onClose:() => void }) {
  const [form, setForm] = useState<Partial<Coupon>>({ code:"", discount:10, type:"percent", minOrder:0, maxUses:100, expires:"", status:"active" });
  const set = (k:string, v:any) => setForm(p => ({ ...p, [k]:v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor:"rgba(0,0,0,0.55)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#1A1814] rounded-3xl w-full max-w-md shadow-2xl" style={{ border:`1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:`1px solid ${BORDER}` }}>
          <h3 className="font-black text-sm" style={{ color:CHARCOAL }}>Create Coupon</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-sm" style={{ color:MUTED }}>✕</button>
        </div>
        <div className="p-6 space-y-4">
          {([
            { k:"code",     label:"Coupon Code",        type:"text",   ph:"e.g. PEANUT20" },
            { k:"discount", label:"Discount Value",      type:"number", ph:"10" },
            { k:"minOrder", label:"Minimum Order (रू)", type:"number", ph:"0" },
            { k:"maxUses",  label:"Max Uses",            type:"number", ph:"1000" },
            { k:"expires",  label:"Expires On",          type:"date",   ph:"" },
          ] as const).map(f => (
            <div key={f.k}>
              <label className="block text-xs font-bold mb-1" style={{ color:CHARCOAL }}>{f.label}</label>
              <input type={f.type} value={(form as any)[f.k] ?? ""} placeholder={f.ph}
                onChange={e => set(f.k, f.type === "number" ? Number(e.target.value) : e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border:`1.5px solid ${BORDER}`, color:CHARCOAL, backgroundColor:"var(--color-bg)" }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color:CHARCOAL }}>Discount Type</label>
            <div className="flex gap-2">
              {(["percent","fixed"] as const).map(t => (
                <button key={t} onClick={() => set("type",t)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold capitalize"
                  style={form.type === t ? { backgroundColor:GOLD, color:"#fff" } : { backgroundColor:IVORY, color:MUTED, border:`1px solid ${BORDER}` }}>
                  {t === "percent" ? "% Percentage" : "रू Fixed"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop:`1px solid ${BORDER}` }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold"
            style={{ backgroundColor:IVORY, color:MUTED, border:`1px solid ${BORDER}` }}>Cancel</button>
          <button onClick={() => { if (!form.code?.trim() || !form.discount) return; onSave({ ...form, id:`c${Date.now()}`, code:form.code!.toUpperCase(), uses:0 } as Coupon); }}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor:GOLD }}>
            Create Coupon
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function AdminPage() {
  const { nav, showToast } = useUIStore();
  const { user } = useAuthStore();
  const [tab, setTab]       = useState("dashboard");
  const [users, setUsers]   = useState<AdminUser[]>(USERS);
  const [sellers, setSellers] = useState<AdminSeller[]>(SELLERS);
  const [orders]            = useState<AdminOrder[]>(ORDERS);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Array<{id:string;name:string;slug:string;icon?:string}>>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [coupons, setCoupons]     = useState<Coupon[]>(COUPONS);
  const [couponModal, setCouponModal] = useState(false);
  const [productModal, setProductModal] = useState<{ mode:"add"|"edit"; product?: AdminProduct } | null>(null);
  const [userSearch, setUserSearch]   = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [prodSearch, setProdSearch]   = useState("");

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => { if (d?.categories) setCategories(d.categories); });
    fetch("/api/products?sort=sales_desc&limit=5").then(r => r.json()).then(d => { if (d?.products) setTopProducts(d.products); });
    fetch("/api/products?limit=50").then(r => r.json()).then(d => {
      if (d?.products) setProducts(d.products.map((p: any) => ({
        id: p.id, name: p.name, emoji: "🛍️",
        category: p.category?.name ?? "General",
        seller: p.seller?.storeName ?? "Unknown",
        price: Number(p.basePrice), stock: p.stock,
        status: p.isActive ? "active" as const : "suspended" as const,
      })));
    });
  }, []);

  if (!user || !["ADMIN","SUPER_ADMIN"].includes(user.role)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-5">🔒</div>
        <h2 className="text-2xl font-black mb-2" style={{ color:CHARCOAL }}>Admin Access Required</h2>
        <p className="text-sm mb-6" style={{ color:MUTED }}>You need admin privileges to access this panel.</p>
        <button onClick={() => nav("home")} className="px-6 py-3 text-sm font-bold text-white rounded-xl" style={{ backgroundColor:GOLD }}>Go Home</button>
      </div>
    );
  }

  const TABS = [
    { id:"dashboard",  label:"Dashboard",  icon:"📊" },
    { id:"analytics",  label:"Analytics",  icon:"📈" },
    { id:"users",      label:"Users",      icon:"👥" },
    { id:"sellers",    label:"Sellers",    icon:"🏪" },
    { id:"products",   label:"Products",   icon:"🛍️" },
    { id:"orders",     label:"Orders",     icon:"📦" },
    { id:"inventory",  label:"Inventory",  icon:"🗃️" },
    { id:"coupons",    label:"Coupons",    icon:"🎟️" },
    { id:"categories", label:"Categories", icon:"📁" },
    { id:"reports",    label:"Reports",    icon:"📋" },
    { id:"settings",   label:"Settings",   icon:"⚙️" },
  ];

  const filteredUsers   = users.filter(u => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.includes(userSearch));
  const filteredOrders  = orders.filter(o => (orderFilter === "ALL" || o.status === orderFilter) && (!orderSearch || o.orderNumber.includes(orderSearch) || o.customer.toLowerCase().includes(orderSearch.toLowerCase())));
  const filteredProducts = products.filter(p => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.seller.toLowerCase().includes(prodSearch.toLowerCase()));

  const banUser          = (id:string)                          => { setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u)); showToast("User status updated"); };
  const changeRole       = (id:string, role:string)            => { setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u)); showToast("User role updated"); };
  const approveSeller    = (id:string, status:AdminSeller["status"]) => { setSellers(prev => prev.map(s => s.id === id ? { ...s, status } : s)); showToast(status === "approved" ? "Seller approved!" : "Status updated"); };
  const toggleProduct    = (id:string)                          => { setProducts(prev => prev.map(p => p.id === id ? { ...p, status: p.status === "active" ? "suspended" : "active" } : p)); showToast("Product status updated"); };
  const deleteProduct    = (id:string)                          => { setProducts(prev => prev.filter(p => p.id !== id)); showToast("Product deleted"); };
  const deleteCoupon     = (id:string)                          => { setCoupons(prev => prev.filter(c => c.id !== id)); showToast("Coupon deleted"); };
  const saveProduct      = (p: AdminProduct)                    => {
    setProducts(prev => prev.some(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
    setProductModal(null); showToast(productModal?.mode === "edit" ? "Product updated!" : "Product added!");
  };

  const maxRevenue = Math.max(...MONTHLY_REVENUE.map(m => m.val));

  return (
    <div style={{ backgroundColor:"#FDFBF7", minHeight:"100vh" }}>
      {/* Top bar */}
      <div className="bg-white" style={{ borderBottom:`1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black" style={{ color:CHARCOAL }}>Admin Panel</h1>
            <p className="text-xs" style={{ color:MUTED }}>PeaNut Marketplace · {user.name}</p>
          </div>
          <button onClick={() => nav("home")} className="px-3 py-2 text-xs font-bold rounded-xl"
            style={{ border:`1px solid ${BORDER}`, color:MUTED }}>🌐 View Site</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">

          {/* Sidebar */}
          <aside>
            <div className="bg-white rounded-2xl p-2 sticky top-20" style={{ border:`1px solid ${BORDER}` }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-semibold transition-all mb-0.5 text-left"
                  style={tab === t.id ? { backgroundColor:IVORY, color:GOLD } : { color:MUTED }}>
                  <span className="text-base">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div>

            {/* ── DASHBOARD ── */}
            {tab === "dashboard" && (
              <div className="space-y-5">
                <SectionHeader title="Dashboard Overview" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon="💰" label="Total Revenue"  value="रू 8.4Cr"   sub="+18% MoM"         color={GOLD}      />
                  <StatCard icon="👥" label="Total Users"    value="32,400"      sub="+1.2k this month" color="#3B82F6"   />
                  <StatCard icon="📦" label="Total Orders"   value="1,48,000"    sub="+5.4k this week"  color="#22C55E"   />
                  <StatCard icon="🏪" label="Active Sellers" value="85,492"      sub="+342 this month"  color={GOLD}      />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon="🛍️" label="Products Listed" value="4,82,000"  color="#8B5CF6" />
                  <StatCard icon="⭐" label="Avg Rating"       value="4.7 ★"     color={GOLD}   />
                  <StatCard icon="🔄" label="Return Rate"      value="2.3%"      color="#EF4444"/>
                  <StatCard icon="💳" label="Digital Payments" value="78%"       color="#22C55E"/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl" style={{ border:`1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:`1px solid ${BORDER}` }}>
                      <h3 className="font-black text-sm" style={{ color:CHARCOAL }}>Pending Seller Approvals</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{sellers.filter(s=>s.status==="pending").length} pending</span>
                    </div>
                    {sellers.filter(s=>s.status==="pending").map((s,i,arr) => (
                      <div key={s.id} className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none" }}>
                        <div>
                          <p className="text-xs font-bold" style={{ color:CHARCOAL }}>{s.storeName}</p>
                          <p className="text-[11px]" style={{ color:MUTED }}>{s.owner} · {s.joined}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => approveSeller(s.id,"approved")} className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-green-100 text-green-700 hover:bg-green-200">Approve</button>
                          <button onClick={() => approveSeller(s.id,"suspended")} className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Reject</button>
                        </div>
                      </div>
                    ))}
                    {sellers.filter(s=>s.status==="pending").length === 0 && (
                      <p className="px-5 py-4 text-xs" style={{ color:MUTED }}>No pending approvals</p>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl" style={{ border:`1px solid ${BORDER}` }}>
                    <div className="px-5 py-4" style={{ borderBottom:`1px solid ${BORDER}` }}>
                      <h3 className="font-black text-sm" style={{ color:CHARCOAL }}>Recent Orders</h3>
                    </div>
                    {orders.slice(0,4).map((o,i,arr) => (
                      <div key={o.id} className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none" }}>
                        <div>
                          <p className="text-xs font-bold" style={{ color:CHARCOAL }}>{o.orderNumber}</p>
                          <p className="text-[11px]" style={{ color:MUTED }}>{o.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black" style={{ color:GOLD }}>{formatPrice(o.total)}</p>
                          <Pill label={o.status} color={STATUS_COLORS[o.status]??""} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {TABS.filter(t=>t.id!=="dashboard").slice(0,6).map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl text-xs font-bold transition-all"
                      style={{ border:`1px solid ${BORDER}`, color:CHARCOAL }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=GOLD; e.currentTarget.style.color=GOLD; e.currentTarget.style.transform="translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=CHARCOAL; e.currentTarget.style.transform="none"; }}>
                      <span className="text-2xl">{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {tab === "analytics" && (
              <div className="space-y-5">
                <SectionHeader title="Sales Analytics" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon="💰" label="This Month Revenue" value="रू 84L"    color={GOLD}     />
                  <StatCard icon="📦" label="Orders This Month"  value="12,480"    color="#22C55E"  />
                  <StatCard icon="👥" label="New Customers"      value="1,240"     color="#3B82F6"  />
                  <StatCard icon="🔄" label="Conversion Rate"    value="3.8%"      color="#8B5CF6"  />
                </div>

                {/* Revenue chart */}
                <div className="bg-white rounded-2xl p-6" style={{ border:`1px solid ${BORDER}` }}>
                  <h3 className="font-black text-sm mb-6" style={{ color:CHARCOAL }}>Monthly Revenue (रू)</h3>
                  <div className="flex items-end gap-3 h-40">
                    {MONTHLY_REVENUE.map(m => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <p className="text-[10px] font-bold" style={{ color:GOLD }}>{(m.val/100000).toFixed(1)}L</p>
                        <div className="w-full rounded-t-lg transition-all" style={{ height:`${(m.val/maxRevenue)*120}px`, backgroundColor:GOLD, opacity:0.85 }} />
                        <p className="text-[10px]" style={{ color:MUTED }}>{m.month}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top categories + top products */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl p-5" style={{ border:`1px solid ${BORDER}` }}>
                    <h3 className="font-black text-sm mb-4" style={{ color:CHARCOAL }}>Sales by Category</h3>
                    {[
                      { name:"Electronics", pct:48, val:"रू 40L" },
                      { name:"Fashion",     pct:22, val:"रू 18L" },
                      { name:"Home",        pct:16, val:"रू 13L" },
                      { name:"Beauty",      pct:9,  val:"रू 7L"  },
                      { name:"Sports",      pct:5,  val:"रू 4L"  },
                    ].map(c => (
                      <div key={c.name} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color:CHARCOAL }}>{c.name}</span>
                          <span className="font-bold" style={{ color:GOLD }}>{c.val} ({c.pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor:BORDER }}>
                          <div className="h-full rounded-full" style={{ width:`${c.pct}%`, backgroundColor:GOLD }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl p-5" style={{ border:`1px solid ${BORDER}` }}>
                    <h3 className="font-black text-sm mb-4" style={{ color:CHARCOAL }}>Top Selling Products</h3>
                    {topProducts.map((p: any, i: number) => (
                      <div key={p.id} className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-black w-4" style={{ color:MUTED }}>#{i+1}</span>
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ backgroundColor:IVORY }}>
                          {p.images?.[0]?.url
                            ? <Image src={p.images[0].url} alt={p.name} width={32} height={32} className="object-cover w-full h-full" />
                            : <span className="text-base">🛍️</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color:CHARCOAL }}>{p.name}</p>
                          <p className="text-[10px]" style={{ color:MUTED }}>{p.totalSales ?? 0} sold</p>
                        </div>
                        <p className="text-xs font-black" style={{ color:GOLD }}>{formatPrice(Number(p.basePrice))}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === "users" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader title="Users" count={filteredUsers.length} />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search name or email..."
                    className="px-4 py-2 rounded-xl text-xs outline-none" style={{ border:`1.5px solid ${BORDER}`, color:CHARCOAL, width:"220px" }}
                    onFocus={e => e.target.style.borderColor=GOLD} onBlur={e => e.target.style.borderColor=BORDER} />
                </div>
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border:`1px solid ${BORDER}` }}>
                  <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor:IVORY, color:MUTED }}>
                    <span>User</span><span>Email</span><span>Role</span><span>Orders</span><span>Status</span><span>Actions</span>
                  </div>
                  {filteredUsers.map((u,i) => (
                    <div key={u.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3"
                      style={{ borderTop:i>0?`1px solid ${BORDER}`:"none" }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color:CHARCOAL }}>{u.name}</p>
                        <p className="text-[10px]" style={{ color:MUTED }}>{u.joined}</p>
                      </div>
                      <p className="text-xs truncate" style={{ color:MUTED }}>{u.email}</p>
                      <select value={u.role} onChange={e => changeRole(u.id,e.target.value)}
                        className={cn("text-[10px] font-bold px-2 py-1 rounded-full outline-none cursor-pointer", ROLE_COLORS[u.role]??"bg-gray-100 text-gray-600")}
                        style={{ border:"none" }}>
                        {["CUSTOMER","SELLER","ADMIN"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <p className="text-xs font-bold" style={{ color:CHARCOAL }}>{u.orders}</p>
                      <Pill label={u.status} color={u.status==="active"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"} />
                      <button onClick={() => banUser(u.id)} className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                        style={u.status==="banned"?{backgroundColor:"#DCFCE7",color:"#16A34A"}:{backgroundColor:"#FEF2F2",color:"#EF4444"}}>
                        {u.status==="banned"?"Unban":"Ban"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SELLERS ── */}
            {tab === "sellers" && (
              <div className="space-y-4">
                <SectionHeader title="Sellers" count={sellers.length} />
                <div className="space-y-3">
                  {sellers.map(s => (
                    <div key={s.id} className="bg-white rounded-2xl p-5" style={{ border:`1px solid ${BORDER}` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor:IVORY }}>🏪</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black" style={{ color:CHARCOAL }}>{s.storeName}</p>
                              <Pill label={s.status} color={s.status==="approved"?"bg-green-100 text-green-700":s.status==="pending"?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700"} />
                            </div>
                            <p className="text-xs" style={{ color:MUTED }}>{s.owner} · {s.email} · Joined {s.joined}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-black" style={{ color:GOLD }}>{s.revenue}</p>
                          <p className="text-[11px]" style={{ color:MUTED }}>{s.products} products</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop:`1px solid ${BORDER}` }}>
                        {s.status==="pending" && <button onClick={() => approveSeller(s.id,"approved")} className="px-4 py-1.5 text-xs font-bold rounded-xl bg-green-100 text-green-700 hover:bg-green-200">✓ Approve</button>}
                        {s.status==="suspended"
                          ? <button onClick={() => approveSeller(s.id,"approved")} className="px-4 py-1.5 text-xs font-bold rounded-xl" style={{ backgroundColor:"#DCFCE7",color:"#16A34A" }}>↺ Restore</button>
                          : <button onClick={() => approveSeller(s.id,"suspended")} className="px-4 py-1.5 text-xs font-bold rounded-xl" style={{ backgroundColor:"#FEF2F2",color:"#EF4444" }}>⊘ Suspend</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRODUCTS ── */}
            {tab === "products" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <SectionHeader title="All Products" count={filteredProducts.length} />
                  <div className="flex gap-2">
                    <input value={prodSearch} onChange={e => setProdSearch(e.target.value)} placeholder="Search products..."
                      className="px-4 py-2 rounded-xl text-xs outline-none" style={{ border:`1.5px solid ${BORDER}`, color:CHARCOAL, width:"200px" }}
                      onFocus={e => e.target.style.borderColor=GOLD} onBlur={e => e.target.style.borderColor=BORDER} />
                    <button onClick={() => setProductModal({ mode:"add" })}
                      className="px-4 py-2 text-xs font-bold text-white rounded-xl whitespace-nowrap"
                      style={{ backgroundColor:GOLD }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor="#9B6210"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor=GOLD}>
                      + Add Product
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ border:`1px solid ${BORDER}` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor:IVORY }}>{p.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold truncate" style={{ color:CHARCOAL }}>{p.name}</p>
                          <Pill label={p.status} color={p.status==="active"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"} />
                        </div>
                        <p className="text-[11px]" style={{ color:MUTED }}>{p.category} · {p.seller} · Stock: {p.stock}</p>
                      </div>
                      <p className="text-sm font-black shrink-0" style={{ color:GOLD }}>{formatPrice(p.price)}</p>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setProductModal({ mode:"edit", product:p })}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor:IVORY, color:CHARCOAL, border:`1px solid ${BORDER}` }}>Edit</button>
                        <button onClick={() => toggleProduct(p.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg"
                          style={p.status==="active"?{backgroundColor:"#FEF9C3",color:"#B45309"}:{backgroundColor:"#DCFCE7",color:"#16A34A"}}>
                          {p.status==="active"?"Suspend":"Restore"}
                        </button>
                        <button onClick={() => deleteProduct(p.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor:"#FEF2F2", color:"#EF4444", border:"1px solid #FECACA" }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <SectionHeader title="All Orders" count={filteredOrders.length} />
                  <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search order # or customer..."
                    className="px-4 py-2 rounded-xl text-xs outline-none" style={{ border:`1.5px solid ${BORDER}`, color:CHARCOAL, width:"220px" }}
                    onFocus={e => e.target.style.borderColor=GOLD} onBlur={e => e.target.style.borderColor=BORDER} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["ALL","PENDING","PROCESSING","SHIPPED","DELIVERED","CANCELLED"].map(s => (
                    <button key={s} onClick={() => setOrderFilter(s)}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-full"
                      style={orderFilter===s?{backgroundColor:GOLD,color:"#fff"}:{backgroundColor:IVORY,color:MUTED,border:`1px solid ${BORDER}`}}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border:`1px solid ${BORDER}` }}>
                  <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr] gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor:IVORY,color:MUTED }}>
                    <span>Order</span><span>Customer</span><span>Seller</span><span>Total</span><span>Status</span><span>Payment</span>
                  </div>
                  {filteredOrders.map((o,i) => (
                    <div key={o.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr] gap-3 items-center px-5 py-3"
                      style={{ borderTop:i>0?`1px solid ${BORDER}`:"none" }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color:CHARCOAL }}>{o.orderNumber}</p>
                        <p className="text-[10px]" style={{ color:MUTED }}>{o.date} · {o.items} item{o.items>1?"s":""}</p>
                      </div>
                      <p className="text-xs" style={{ color:CHARCOAL }}>{o.customer}</p>
                      <p className="text-xs" style={{ color:MUTED }}>{o.seller}</p>
                      <p className="text-xs font-black" style={{ color:GOLD }}>{formatPrice(o.total)}</p>
                      <Pill label={o.status} color={STATUS_COLORS[o.status]??""} />
                      <p className="text-xs font-semibold" style={{ color:MUTED }}>{o.payment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── INVENTORY ── */}
            {tab === "inventory" && (
              <div className="space-y-4">
                <SectionHeader title="Inventory Management" count={products.length} />
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <StatCard icon="📦" label="Total SKUs"       value={products.length}                         color={GOLD}     />
                  <StatCard icon="⚠️" label="Low Stock (≤10)"  value={products.filter(p=>p.stock<=10).length}  color="#EF4444"  />
                  <StatCard icon="🚫" label="Out of Stock"     value={products.filter(p=>p.stock===0).length}  color="#9CA3AF"  />
                </div>
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border:`1px solid ${BORDER}` }}>
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor:IVORY,color:MUTED }}>
                    <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Status</span>
                  </div>
                  {products.map((p,i) => {
                    const stockColor = p.stock === 0 ? "#EF4444" : p.stock <= 10 ? "#F97316" : "#16A34A";
                    return (
                      <div key={p.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3"
                        style={{ borderTop:i>0?`1px solid ${BORDER}`:"none" }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{p.emoji}</span>
                          <p className="text-xs font-bold truncate" style={{ color:CHARCOAL }}>{p.name}</p>
                        </div>
                        <p className="text-xs" style={{ color:MUTED }}>{p.category}</p>
                        <p className="text-xs font-bold" style={{ color:GOLD }}>{formatPrice(p.price)}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setProducts(prev => prev.map(x => x.id===p.id ? {...x, stock:Math.max(0,x.stock-1)} : x))}
                            className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center" style={{ backgroundColor:IVORY,color:MUTED,border:`1px solid ${BORDER}` }}>−</button>
                          <span className="text-xs font-black w-8 text-center" style={{ color:stockColor }}>{p.stock}</span>
                          <button onClick={() => setProducts(prev => prev.map(x => x.id===p.id ? {...x, stock:x.stock+1} : x))}
                            className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center" style={{ backgroundColor:IVORY,color:MUTED,border:`1px solid ${BORDER}` }}>+</button>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor:p.stock===0?"#FEF2F2":p.stock<=10?"#FFF7ED":"#F0FDF4", color:stockColor }}>
                          {p.stock===0?"Out of Stock":p.stock<=10?"Low Stock":"In Stock"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── COUPONS ── */}
            {tab === "coupons" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader title="Coupons & Discounts" count={coupons.length} />
                  <button onClick={() => setCouponModal(true)}
                    className="px-4 py-2 text-xs font-bold text-white rounded-xl"
                    style={{ backgroundColor:GOLD }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor="#9B6210"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor=GOLD}>
                    + Create Coupon
                  </button>
                </div>
                <div className="space-y-3">
                  {coupons.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl p-5" style={{ border:`1px solid ${BORDER}` }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black font-mono" style={{ color:GOLD }}>{c.code}</p>
                            <Pill label={c.status} color={c.status==="active"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"} />
                          </div>
                          <p className="text-xs" style={{ color:CHARCOAL }}>
                            {c.type==="percent"?`${c.discount}% off`:`रू ${c.discount} off`}
                            {c.minOrder>0&&` · min order रू ${c.minOrder.toLocaleString()}`}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color:MUTED }}>{c.uses}/{c.maxUses} uses · Expires {c.expires}</p>
                          <div className="w-48 h-1.5 rounded-full mt-2" style={{ backgroundColor:IVORY }}>
                            <div className="h-full rounded-full" style={{ width:`${Math.min((c.uses/c.maxUses)*100,100)}%`, backgroundColor:GOLD }} />
                          </div>
                        </div>
                        <button onClick={() => deleteCoupon(c.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor:"#FEF2F2",color:"#EF4444",border:"1px solid #FECACA" }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CATEGORIES ── */}
            {tab === "categories" && (
              <div className="space-y-4">
                <SectionHeader title="Categories" count={categories.length} />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl p-5 flex items-center justify-between" style={{ border:`1px solid ${BORDER}` }}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{c.icon}</span>
                        <div>
                          <p className="text-sm font-bold" style={{ color:CHARCOAL }}>{c.name}</p>
                          <p className="text-[11px]" style={{ color:MUTED }}>/{c.slug}</p>
                        </div>
                      </div>
                      <button onClick={() => showToast(`Editing: ${c.name}`)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor:IVORY,color:GOLD,border:`1px solid ${BORDER}` }}>Edit</button>
                    </div>
                  ))}
                  <button onClick={() => showToast("Add new category")}
                    className="rounded-2xl p-5 flex items-center justify-center gap-2 text-xs font-bold border-2 border-dashed transition-all"
                    style={{ borderColor:BORDER,color:MUTED }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=GOLD; e.currentTarget.style.color=GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=MUTED; }}>
                    + Add Category
                  </button>
                </div>
              </div>
            )}

            {/* ── REPORTS ── */}
            {tab === "reports" && (
              <div className="space-y-5">
                <SectionHeader title="Reports" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon:"💰", title:"Revenue Report",     desc:"Monthly/yearly revenue breakdown, GMV, net revenue after commissions.", period:"May 2026" },
                    { icon:"📦", title:"Orders Report",      desc:"Order volume, fulfillment rates, cancellation & return rates.",         period:"May 2026" },
                    { icon:"👥", title:"Customer Report",    desc:"New vs returning customers, retention rate, LTV analysis.",            period:"May 2026" },
                    { icon:"🏪", title:"Seller Report",      desc:"Seller performance, top earners, payout summary.",                     period:"May 2026" },
                    { icon:"🛍️", title:"Product Report",    desc:"Best & worst sellers, views, conversion per product.",                 period:"May 2026" },
                    { icon:"🎟️", title:"Coupon Usage Report",desc:"Coupon redemption rates, discount cost, affected revenue.",           period:"May 2026" },
                  ].map(r => (
                    <div key={r.title} className="bg-white rounded-2xl p-5" style={{ border:`1px solid ${BORDER}` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{r.icon}</span>
                          <div>
                            <p className="text-sm font-bold" style={{ color:CHARCOAL }}>{r.title}</p>
                            <p className="text-[11px]" style={{ color:MUTED }}>{r.period}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs mt-3 leading-relaxed" style={{ color:MUTED }}>{r.desc}</p>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => showToast(`Generating ${r.title}…`)}
                          className="px-4 py-1.5 text-xs font-bold rounded-xl text-white"
                          style={{ backgroundColor:GOLD }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor="#9B6210"}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor=GOLD}>
                          Generate
                        </button>
                        <button onClick={() => showToast(`Downloading ${r.title}…`)}
                          className="px-4 py-1.5 text-xs font-bold rounded-xl"
                          style={{ backgroundColor:IVORY,color:MUTED,border:`1px solid ${BORDER}` }}>
                          Download CSV
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === "settings" && (
              <div className="space-y-5">
                <SectionHeader title="Platform Settings" />
                {[
                  { title:"General", fields:[
                    { label:"Platform Name",          value:"PeaNut Marketplace" },
                    { label:"Support Email",           value:"support@peanut.com" },
                    { label:"Commission Rate (%)",     value:"10"                 },
                    { label:"Min Payout Amount (रू)", value:"500"                },
                  ]},
                  { title:"Payments", fields:[
                    { label:"COD Enabled",  value:"Yes"          },
                    { label:"Visa Gateway", value:"stripe_xxxx"  },
                  ]},
                ].map(section => (
                  <div key={section.title} className="bg-white rounded-2xl p-6 space-y-4" style={{ border:`1px solid ${BORDER}` }}>
                    <h3 className="font-black text-sm" style={{ color:CHARCOAL }}>{section.title}</h3>
                    {section.fields.map(f => (
                      <div key={f.label}>
                        <label className="block text-xs font-bold mb-1" style={{ color:CHARCOAL }}>{f.label}</label>
                        <input defaultValue={f.value} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                          style={{ border:`1.5px solid ${BORDER}`,color:CHARCOAL }}
                          onFocus={e => e.target.style.borderColor=GOLD}
                          onBlur={e => e.target.style.borderColor=BORDER} />
                      </div>
                    ))}
                  </div>
                ))}
                <button onClick={() => showToast("Settings saved!")}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor:GOLD }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor="#9B6210"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor=GOLD}>
                  Save Settings
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {couponModal && (
        <CouponModal
          onSave={c => { setCoupons(prev=>[...prev,c]); setCouponModal(false); showToast("Coupon created!"); }}
          onClose={() => setCouponModal(false)} />
      )}
      {productModal && (
        <ProductModal
          initial={productModal.product}
          onSave={saveProduct}
          onClose={() => setProductModal(null)} />
      )}
    </div>
  );
}
