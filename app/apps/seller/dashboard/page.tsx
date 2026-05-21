// Complete Seller Dashboard
"use client";

import React, {
 useState,
 useEffect,
 useCallback,
 useRef,
 useMemo,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
 BarChart2,
 Package,
 ShoppingBag,
 Star,
 TrendingUp,
 Plus,
 Pencil,
 Trash2,
 Eye,
 AlertTriangle,
 CheckCircle,
 Truck,
 X,
 Upload,
 Tag,
 DollarSign,
 Settings,
 Store,
 FileText,
 RotateCcw,
 ChevronDown,
 ChevronRight,
 Camera,
 Save,
 Search,
 Filter,
 Download,
 RefreshCcw,
 CheckSquare,
 Square,
 Zap,
 MoreHorizontal,
 ArrowUpRight,
 Inbox,
 Clock,
 CreditCard,
 ShieldCheck,
 TrendingDown,
 Globe,
 Bell,
 ChevronLeft,
 Info,
 Star as StarIcon,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn, formatPrice, timeAgo } from "@/app/lib/utils";
import { toast } from "react-hot-toast";
import { useDebounce } from "@/app/hooks/useDebounce";

// ─── Types ────────────────────────────────────────────────────────────────

type SellerTab =
 | "overview"
 | "products"
 | "orders"
 | "reviews"
 | "analytics"
 | "payouts"
 | "settings";

const STATUS_COLORS: Record<string, string> = {
 ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30",
 DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800",
 PENDING_REVIEW: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30",
 INACTIVE: "bg-red-100 text-red-700 dark:bg-red-900/30",
 OUT_OF_STOCK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
 REJECTED: "bg-red-200 text-red-800 dark:bg-red-900/30",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
 PENDING: "bg-yellow-100 text-yellow-700",
 CONFIRMED: "bg-blue-100 text-blue-700",
 PROCESSING: "bg-blue-100 text-blue-700",
 SHIPPED: "bg-blue-100 text-blue-700",
 OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
 DELIVERED: "bg-green-100 text-green-700",
 CANCELLED: "bg-red-100 text-red-700",
 RETURNED: "bg-gray-100 text-gray-600",
};

// ─── Sidebar ──────────────────────────────────────────────────────────────

const SELLER_NAV: {
 id: SellerTab;
 label: string;
 icon: React.ReactNode;
 badge?: number;
}[] = [
 {
 id: "overview",
 label: "Overview",
 icon: <BarChart2 className="w-4 h-4" />,
 },
 {
 id: "products",
 label: "Products",
 icon: <ShoppingBag className="w-4 h-4" />,
 },
 {
 id: "orders",
 label: "Orders",
 icon: <Package className="w-4 h-4" />,
 badge: 4,
 },
 { id: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> },
 {
 id: "analytics",
 label: "Analytics",
 icon: <TrendingUp className="w-4 h-4" />,
 },
 { id: "payouts", label: "Payouts", icon: <DollarSign className="w-4 h-4" /> },
 {
 id: "settings",
 label: "Store Settings",
 icon: <Settings className="w-4 h-4" />,
 },
];

// ─── Root Component ───────────────────────────────────────────────────────

export default function SellerDashboardPage() {
 const [tab, setTab] = useState<SellerTab>("overview");
 const [seller, setSeller] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetch("/api/seller/profile")
 .then((r) => r.json())
 .then((d) => {
 setSeller(d.seller);
 setLoading(false);
 })
 .catch(() => setLoading(false));
 }, []);

 return (
 <div className="max-w-7xl mx-auto px-4 py-8">
 {/* Store Banner */}
 {!loading && seller && (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
 <div className="h-32 bg-linear-to-r from-blue-600 via-indigo-500 to-blue-400 relative">
 {seller.storeBanner && (
 <Image
 src={seller.storeBanner}
 alt="Banner"
 fill
 className="object-cover"
 />
 )}
 <button className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors backdrop-blur-sm">
 <Camera className="w-3.5 h-3.5" /> Change Banner
 </button>
 </div>
 <div className="px-6 pb-5 flex flex-col sm:flex-row gap-4 sm:items-end -mt-12 relative z-10">
 <div className="relative w-20 h-20 shrink-0">
 <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl border-4 border-white dark:border-gray-800 flex items-center justify-center text-3xl font-black text-blue-600 shadow-lg overflow-hidden">
 {seller.storeLogo ? (
 <Image
 src={seller.storeLogo}
 alt="Logo"
 fill
 className="object-cover"
 />
 ) : (
 seller.storeName?.[0]
 )}
 </div>
 <button
 className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
 aria-label="Change logo"
 >
 <Camera className="w-3.5 h-3.5" />
 </button>
 </div>
 <div className="flex-1 pt-1">
 <div className="flex items-center gap-2 flex-wrap mb-1">
 <h1 className="text-xl font-bold text-gray-900 dark:text-white">
 {seller.storeName}
 </h1>
 {seller.isVerified && (
 <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
 <ShieldCheck className="w-3 h-3" />
 Verified
 </span>
 )}
 {seller.isTopRated && (
 <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
 ⭐ Top Rated
 </span>
 )}
 {seller.isFastShipper && (
 <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
 ⚡ Fast Shipper
 </span>
 )}
 </div>
 <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
 <span>
 ⭐ {(seller.averageRating ?? 0).toFixed(1)} (
 {(seller.totalReviews ?? 0).toLocaleString()} reviews)
 </span>
 <span>
 📦 {(seller.totalSales ?? 0).toLocaleString()} sales
 </span>
 <span>💬 {seller.responseRate ?? 100}% response</span>
 <span>
 📍 {seller.city}, {seller.district}
 </span>
 </div>
 </div>
 <div className="flex gap-2 mt-2 sm:mt-0">
 <Link
 href={`/sellers/${seller.storeSlug}`}
 target="_blank"
 className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 >
 <Globe className="w-4 h-4" /> View Store
 </Link>
 <button
 onClick={() => setTab("settings")}
 className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
 >
 <Settings className="w-4 h-4" /> Settings
 </button>
 </div>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
 {/* Sidebar */}
 <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2 h-fit lg:sticky lg:top-24">
 {SELLER_NAV.map((item) => (
 <button
 key={item.id}
 onClick={() => setTab(item.id)}
 className={cn(
 "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left",
 tab === item.id
 ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
 : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
 )}
 >
 {item.icon}
 <span className="flex-1">{item.label}</span>
 {item.badge && (
 <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
 {item.badge}
 </span>
 )}
 </button>
 ))}
 </nav>

 {/* Content panels */}
 <div>
 {tab === "overview" && (
 <OverviewTab seller={seller} setTab={setTab} />
 )}
 {tab === "products" && <ProductsTab />}
 {tab === "orders" && <OrdersTab />}
 {tab === "reviews" && <ReviewsTab />}
 {tab === "analytics" && <AnalyticsTab />}
 {tab === "payouts" && <PayoutsTab seller={seller} />}
 {tab === "settings" && (
 <SettingsTab seller={seller} onUpdate={setSeller} />
 )}
 </div>
 </div>
 </div>
 );
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════

function OverviewTab({
 seller,
 setTab,
}: {
 seller: any;
 setTab: (t: SellerTab) => void;
}) {
 const [stats, setStats] = useState<any>(null);

 useEffect(() => {
 Promise.all([
 fetch("/api/seller/analytics?period=30").then((r) => r.json()),
 fetch("/api/seller/orders?limit=5").then((r) => r.json()),
 ]).then(([analytics, orders]) => setStats({ analytics, orders }));
 }, []);

 const kpis = [
 {
 label: "Revenue (30d)",
 value: formatPrice(stats?.orders?.stats?.totalEarnings ?? 240000),
 change: "+18.4%",
 up: true,
 icon: <DollarSign className="w-5 h-5" />,
 color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
 },
 {
 label: "Total Orders",
 value: (stats?.orders?.stats?.totalOrders ?? 1847).toLocaleString(),
 change: "+12%",
 up: true,
 icon: <Package className="w-5 h-5" />,
 color: "bg-green-100 dark:bg-green-900/30 text-green-600",
 },
 {
 label: "Pending Orders",
 value: stats?.orders?.stats?.pendingOrders ?? 4,
 change: "Action needed",
 up: false,
 icon: <Clock className="w-5 h-5" />,
 color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
 },
 {
 label: "Store Rating",
 value: `${(seller?.averageRating ?? 4.9).toFixed(1)} ★`,
 change: "Top 5% sellers",
 up: true,
 icon: <Star className="w-5 h-5" />,
 color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
 },
 ];

 return (
 <div className="space-y-6">
 {/* KPI row */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {kpis.map((k) => (
 <div
 key={k.label}
 className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-sm transition-shadow"
 >
 <div
 className={cn(
 "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
 k.color,
 )}
 >
 {k.icon}
 </div>
 <p className="text-2xl font-black text-gray-900 dark:text-white">
 {k.value}
 </p>
 <p className="text-sm text-gray-400 mt-0.5">{k.label}</p>
 <div
 className={cn(
 "flex items-center gap-1 text-xs font-semibold mt-2",
 k.up ? "text-green-600" : "text-amber-500",
 )}
 >
 {k.up ? (
 <TrendingUp className="w-3.5 h-3.5" />
 ) : (
 <AlertTriangle className="w-3.5 h-3.5" />
 )}
 {k.change}
 </div>
 </div>
 ))}
 </div>

 {/* Quick actions */}
 <div>
 <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
 Quick Actions
 </h2>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 {
 label: "Add Product",
 icon: "➕",
 color: "bg-blue-600 hover:bg-blue-700 text-white",
 onClick: () => setTab("products"),
 },
 {
 label: "View Orders",
 icon: "📦",
 color: "bg-blue-600 hover:bg-blue-700 text-white",
 onClick: () => setTab("orders"),
 },
 {
 label: "Withdraw",
 icon: "💸",
 color: "bg-green-600 hover:bg-green-700 text-white",
 onClick: () => setTab("payouts"),
 },
 {
 label: "See Reviews",
 icon: "⭐",
 color: "bg-amber-500 hover:bg-amber-600 text-white",
 onClick: () => setTab("reviews"),
 },
 ].map((a) => (
 <button
 key={a.label}
 onClick={a.onClick}
 className={cn(
 "flex flex-col items-center gap-2 p-4 rounded-2xl font-semibold text-sm transition-all hover:scale-105 active:scale-100",
 a.color,
 )}
 >
 <span className="text-2xl">{a.icon}</span>
 {a.label}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {/* Recent Orders */}
 <DashCard
 title="Recent Orders"
 action={{ label: "View All", onClick: () => setTab("orders") }}
 >
 <MiniOrderList orders={stats?.orders?.orders?.slice(0, 5) ?? []} />
 </DashCard>
 {/* Low Stock */}
 <DashCard
 title="Low Stock Alerts"
 badge={
 <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
 Needs attention
 </span>
 }
 >
 <LowStockWidget />
 </DashCard>
 </div>

 {/* Revenue mini chart */}
 <DashCard title="Revenue This Month">
 <MiniBarChart
 data={
 stats?.analytics?.revenueByDay?.map((d: any) => d.revenue) ?? []
 }
 />
 </DashCard>
 </div>
 );
}

// PRODUCTS TAB — full CRUD with variant editor, bulk actions, image upload
const ProductSchema = z.object({
 name: z.string().min(3, "Min 3 characters").max(300),
 categoryId: z.string().min(1, "Select a category"),
 basePrice: z.coerce.number().positive("Must be positive"),
 comparePrice: z.coerce.number().positive().optional().or(z.literal("")),
 costPrice: z.coerce.number().positive().optional().or(z.literal("")),
 stock: z.coerce.number().int().min(0),
 lowStockAlert: z.coerce.number().int().min(0).default(5),
 sku: z.string().optional(),
 shortDesc: z.string().max(300).optional(),
 description: z.string().min(10, "At least 10 characters"),
 weight: z.coerce.number().positive().optional().or(z.literal("")),
 isEco: z.boolean().default(false),
 isFlashSale: z.boolean().default(false),
 freeShipping: z.boolean().default(false),
 isSubscription: z.boolean().default(false),
 tags: z.string().optional(),
 metaTitle: z.string().max(70).optional(),
 metaDescription: z.string().max(160).optional(),
 variants: z
 .array(
 z.object({
 name: z.string().min(1),
 sku: z.string().min(1),
 price: z.coerce.number().positive(),
 comparePrice: z.coerce.number().optional().or(z.literal("")),
 stock: z.coerce.number().int().min(0),
 color: z.string().optional(),
 size: z.string().optional(),
 }),
 )
 .default([]),
});
type ProductFormData = z.infer<typeof ProductSchema>;

function ProductsTab() {
 const [products, setProducts] = useState<any[]>([]);
 const [total, setTotal] = useState(0);
 const [stats, setStats] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [editSlug, setEditSlug] = useState<string | null>(null);
 const [search, setSearch] = useState("");
 const [statusFilt, setStatusFilt] = useState("all");
 const [sortBy, setSortBy] = useState("newest");
 const [page, setPage] = useState(1);
 const [selected, setSelected] = useState<Set<string>>(new Set());
 const [bulkAction, setBulkAction] = useState("");
 const [categories, setCategories] = useState<any[]>([]);
 const dSearch = useDebounce(search, 400);

 const {
 register,
 handleSubmit,
 reset,
 control,
 watch,
 setValue,
 formState: { errors, isSubmitting },
 } = useForm<ProductFormData>({ resolver: zodResolver(ProductSchema) as any });
 const {
 fields: variantFields,
 append: addVariant,
 remove: removeVariant,
 } = useFieldArray({ control, name: "variants" });

 const watchVariants = watch("variants");
 const watchBasePrice = watch("basePrice");

 const load = useCallback(async () => {
 setLoading(true);
 const p = new URLSearchParams({
 page: String(page),
 limit: "15",
 sort: sortBy,
 });
 if (dSearch) p.set("search", dSearch);
 if (statusFilt && statusFilt !== "all") p.set("status", statusFilt);
 const [pRes, cRes] = await Promise.all([
 fetch(`/api/seller/products?${p}`).then((r) => r.json()),
 fetch("/api/categories").then((r) => r.json()),
 ]);
 setProducts(pRes.products ?? []);
 setTotal(pRes.total ?? 0);
 setStats(pRes.stats);
 setCategories(cRes ?? []);
 setLoading(false);
 }, [page, dSearch, statusFilt, sortBy]);

 useEffect(() => {
 load();
 }, [load]);

 const openCreate = () => {
 reset({
 variants: [],
 isEco: false,
 isFlashSale: false,
 freeShipping: false,
 isSubscription: false,
 });
 setEditSlug(null);
 setShowModal(true);
 };
 const openEdit = (p: any) => {
 reset({
 name: p.name,
 categoryId: p.categoryId,
 basePrice: Number(p.basePrice),
 comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
 stock: p.stock,
 description: p.description,
 shortDesc: p.shortDesc,
 isEco: p.isEco,
 isFlashSale: p.isFlashSale,
 freeShipping: p.freeShipping,
 sku: p.sku,
 tags: p.tags?.join(", "),
 variants:
 p.variants?.map((v: any) => ({
 name: v.name,
 sku: v.sku,
 price: Number(v.price),
 stock: v.stock,
 color: v.attributes?.color,
 size: v.attributes?.size,
 })) ?? [],
 });
 setEditSlug(p.slug);
 setShowModal(true);
 };

 const onSubmit = async (data: ProductFormData) => {
 const tags =
 data.tags
 ?.split(",")
 .map((t) => t.trim())
 .filter(Boolean) ?? [];
 const variants = (data.variants ?? []).map((v) => ({
 name: v.name,
 sku: v.sku,
 price: v.price,
 stock: v.stock,
 attributes: {
 ...(v.color ? { color: v.color } : {}),
 ...(v.size ? { size: v.size } : {}),
 },
 }));
 const payload = {
 ...data,
 tags,
 variants,
 comparePrice: data.comparePrice || undefined,
 costPrice: data.costPrice || undefined,
 };

 const url = editSlug ? `/api/products/${editSlug}` : "/api/products";
 const method = editSlug ? "PUT" : "POST";
 const res = await fetch(url, {
 method,
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });
 const json = await res.json();
 if (res.ok) {
 toast.success(editSlug ? "Product updated!" : "Product published!");
 setShowModal(false);
 load();
 } else {
 toast.error(json.error ?? "Failed to save");
 }
 };

 const deleteProduct = async (slug: string, name: string) => {
 if (!confirm(`Remove "${name}"? It will be deactivated.`)) return;
 await fetch(`/api/products/${slug}`, { method: "DELETE" });
 toast.success("Product removed.");
 load();
 };

 const toggleSelect = (id: string) =>
 setSelected((prev) => {
 const n = new Set(prev);
 n.has(id) ? n.delete(id) : n.add(id);
 return n;
 });
 const selectAll = () =>
 setSelected(
 selected.size === products.length
 ? new Set()
 : new Set(products.map((p) => p.id)),
 );

 const executeBulk = async () => {
 if (!bulkAction || selected.size === 0) {
 toast.error("Select products and action");
 return;
 }
 const res = await fetch("/api/seller/bulk", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ids: Array.from(selected), action: bulkAction }),
 });
 const data = await res.json();
 if (res.ok) {
 toast.success(`${bulkAction} applied to ${data.affected} product(s)`);
 setSelected(new Set());
 setBulkAction("");
 load();
 } else toast.error(data.error ?? "Bulk action failed");
 };

 const LIMIT = 15;

 return (
 <div className="space-y-5">
 {/* Stats row */}
 {stats && (
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
 {[
 { label: "Total", value: stats.total },
 { label: "Total Stock", value: stats.totalStock },
 { label: "Total Sales", value: stats.totalSales },
 {
 label: "Low Stock",
 value: stats.lowStock,
 warn: stats.lowStock > 0,
 },
 {
 label: "Out of Stock",
 value: stats.outOfStock,
 warn: stats.outOfStock > 0,
 },
 ].map((s) => (
 <div
 key={s.label}
 className={cn(
 "bg-white dark:bg-gray-900 rounded-xl border p-3 text-center",
 s.warn
 ? "border-red-200 dark:border-red-800"
 : "border-gray-100 dark:border-gray-800",
 )}
 >
 <p
 className={cn(
 "text-xl font-black",
 s.warn ? "text-red-600" : "text-gray-900 dark:text-white",
 )}
 >
 {s.value?.toLocaleString()}
 </p>
 <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
 </div>
 ))}
 </div>
 )}

 {/* Toolbar */}
 <div className="flex gap-2 flex-wrap items-center">
 <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex-1 min-w-45 max-w-xs">
 <Search className="w-4 h-4 text-gray-400 shrink-0" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search name, SKU..."
 className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
 />
 {search && (
 <button onClick={() => setSearch("")} aria-label="Clear">
 <X className="w-3.5 h-3.5 text-gray-400" />
 </button>
 )}
 </div>
 <select
 value={statusFilt}
 onChange={(e) => {
 setStatusFilt(e.target.value);
 setPage(1);
 }}
 className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none"
 >
 <option value="all">All Status</option>
 <option value="ACTIVE">Active</option>
 <option value="DRAFT">Draft</option>
 <option value="PENDING_REVIEW">Pending</option>
 <option value="LOW_STOCK">Low Stock</option>
 <option value="OUT_OF_STOCK">Out of Stock</option>
 <option value="INACTIVE">Inactive</option>
 </select>
 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value)}
 className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none"
 >
 <option value="newest">Newest First</option>
 <option value="price_asc">Price ↑</option>
 <option value="price_desc">Price ↓</option>
 <option value="sales_desc">Most Sold</option>
 <option value="stock_asc">Low Stock First</option>
 </select>
 <button
 onClick={openCreate}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors ml-auto"
 >
 <Plus className="w-4 h-4" /> Add Product
 </button>
 </div>

 {/* Bulk actions */}
 {selected.size > 0 && (
 <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
 <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
 {selected.size} selected
 </span>
 <select
 value={bulkAction}
 onChange={(e) => setBulkAction(e.target.value)}
 className="px-3 py-1.5 border border-blue-300 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 outline-none"
 >
 <option value="">Choose action</option>
 <option value="activate">Activate</option>
 <option value="deactivate">Deactivate</option>
 <option value="delete">Remove (soft)</option>
 </select>
 <button
 onClick={executeBulk}
 className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
 >
 Apply
 </button>
 <button
 onClick={() => setSelected(new Set())}
 className="ml-auto text-gray-400 hover:text-gray-600"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 )}

 {/* Products table */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm min-w-[700px]">
 <thead>
 <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
 <th className="px-4 py-3 text-left w-10">
 <button onClick={selectAll} aria-label="Select all">
 {selected.size === products.length &&
 products.length > 0 ? (
 <CheckSquare className="w-4 h-4 text-blue-600" />
 ) : (
 <Square className="w-4 h-4 text-gray-400" />
 )}
 </button>
 </th>
 {[
 "Product",
 "Price",
 "Stock",
 "Sales",
 "Views",
 "Status",
 "Actions",
 ].map((h) => (
 <th
 key={h}
 className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
 >
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
 {loading ? (
 [...Array(5)].map((_, i) => (
 <tr key={i}>
 <td colSpan={8} className="px-4 py-3">
 <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
 </td>
 </tr>
 ))
 ) : products.length === 0 ? (
 <tr>
 <td colSpan={8}>
 <EmptyState
 icon="📦"
 title="No products yet"
 desc="Add your first product to start selling."
 action={{ label: "Add Product", onClick: openCreate }}
 />
 </td>
 </tr>
 ) : (
 products.map((p) => {
 const isLowStock =
 p.stock > 0 && p.stock <= (p.lowStockAlert ?? 5);
 const isOOS = p.stock === 0;
 return (
 <tr
 key={p.id}
 className={cn(
 "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
 selected.has(p.id) &&
 "bg-blue-50/50 dark:bg-blue-900/10",
 )}
 >
 <td className="px-4 py-3">
 <button
 onClick={() => toggleSelect(p.id)}
 aria-label="Select"
 >
 {selected.has(p.id) ? (
 <CheckSquare className="w-4 h-4 text-blue-600" />
 ) : (
 <Square className="w-4 h-4 text-gray-300" />
 )}
 </button>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
 {p.images?.[0] ? (
 <Image
 src={p.images[0].url}
 alt={p.name}
 width={48}
 height={48}
 className="object-cover"
 />
 ) : (
 <span className="text-2xl">🛍️</span>
 )}
 </div>
 <div className="min-w-0">
 <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
 {p.name}
 </p>
 <p className="text-xs text-gray-400">
 {p.category?.name}
 </p>
 {p.sku && (
 <p className="text-xs text-gray-300 font-mono">
 #{p.sku}
 </p>
 )}
 </div>
 </div>
 </td>
 <td className="px-4 py-3">
 <p className="font-bold text-blue-600">
 {formatPrice(Number(p.basePrice))}
 </p>
 {p.comparePrice && (
 <p className="text-xs text-gray-400 line-through">
 {formatPrice(Number(p.comparePrice))}
 </p>
 )}
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-1.5">
 <span
 className={cn(
 "font-bold",
 isOOS
 ? "text-red-500"
 : isLowStock
 ? "text-amber-500"
 : "text-green-600",
 )}
 >
 {p.stock}
 </span>
 {isLowStock && !isOOS && (
 <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
 )}
 {isOOS && (
 <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
 )}
 </div>
 {p.hasVariants && (
 <p className="text-xs text-gray-400">
 {p.variants?.length} variants
 </p>
 )}
 </td>
 <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
 {(p.totalSales ?? 0).toLocaleString()}
 </td>
 <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
 {(p.totalViews ?? 0).toLocaleString()}
 </td>
 <td className="px-4 py-3">
 <span
 className={cn(
 "text-xs font-bold px-2 py-0.5 rounded-full",
 STATUS_COLORS[p.status] ??
 "bg-gray-100 text-gray-600",
 )}
 >
 {(p.status ?? "").replace("_", " ")}
 </span>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-1">
 <Link
 href={`/products/${p.slug}`}
 target="_blank"
 className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
 aria-label="Preview"
 >
 <Eye className="w-4 h-4" />
 </Link>
 <button
 onClick={() => openEdit(p)}
 className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
 aria-label="Edit"
 >
 <Pencil className="w-4 h-4" />
 </button>
 <button
 onClick={() => deleteProduct(p.slug, p.name)}
 className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
 aria-label="Remove"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {total > LIMIT && (
 <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
 <p className="text-sm text-gray-500">
 {total} products · page {page} of {Math.ceil(total / LIMIT)}
 </p>
 <div className="flex gap-1">
 <button
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={page === 1}
 className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-500 transition-colors"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>
 {[...Array(Math.min(Math.ceil(total / LIMIT), 5))].map((_, i) => (
 <button
 key={i}
 onClick={() => setPage(i + 1)}
 className={cn(
 "w-9 h-9 rounded-lg text-sm font-semibold transition-colors",
 page === i + 1
 ? "bg-blue-600 text-white"
 : "border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400",
 )}
 >
 {i + 1}
 </button>
 ))}
 <button
 onClick={() =>
 setPage((p) => Math.min(Math.ceil(total / LIMIT), p + 1))
 }
 disabled={page >= Math.ceil(total / LIMIT)}
 className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-500 transition-colors"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Product Modal */}
 {showModal && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 py-8 overflow-y-auto">
 <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl shadow-2xl">
 <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
 <div>
 <h2 className="font-bold text-gray-900 dark:text-white text-lg">
 {editSlug ? "Edit Product" : "Add New Product"}
 </h2>
 <p className="text-sm text-gray-400 mt-0.5">
 {editSlug
 ? "Update product details"
 : "Fill in the details to list a new product"}
 </p>
 </div>
 <button
 onClick={() => setShowModal(false)}
 aria-label="Close"
 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
 {/* Basic Info */}
 <Section title="Basic Information">
 <ModalField label="Product Name *" error={errors.name?.message}>
 <input
 {...register("name")}
 className={mfld(!!errors.name)}
 placeholder="Apple iPhone 16 Pro Max 256GB"
 />
 </ModalField>
 <div className="grid grid-cols-2 gap-4">
 <ModalField
 label="Category *"
 error={errors.categoryId?.message}
 >
 <select
 {...register("categoryId")}
 className={mfld(!!errors.categoryId)}
 >
 <option value="">Choose category</option>
 {categories.map((c: any) => (
 <optgroup key={c.id} label={c.name}>
 {c.children?.length ? (
 c.children.map((sub: any) => (
 <option key={sub.id} value={sub.id}>
 {sub.name}
 </option>
 ))
 ) : (
 <option value={c.id}>{c.name}</option>
 )}
 </optgroup>
 ))}
 </select>
 </ModalField>
 <ModalField label="SKU / Product Code">
 <input
 {...register("sku")}
 className={mfld(false)}
 placeholder="IPH16PM-BLK-256"
 />
 </ModalField>
 </div>
 <ModalField label="Short Description">
 <input
 {...register("shortDesc")}
 className={mfld(false)}
 placeholder="One-line product summary for search"
 />
 </ModalField>
 <ModalField
 label="Full Description *"
 error={errors.description?.message}
 >
 <textarea
 {...register("description")}
 rows={4}
 className={mfld(!!errors.description) + " resize-none"}
 placeholder="Detailed description, features, specifications..."
 />
 </ModalField>
 </Section>

 {/* Pricing */}
 <Section title="Pricing & Inventory">
 <div className="grid grid-cols-3 gap-3">
 <ModalField
 label="Selling Price (NPR) *"
 error={errors.basePrice?.message}
 >
 <input
 type="number"
 step="0.01"
 {...register("basePrice")}
 className={mfld(!!errors.basePrice)}
 placeholder="195000"
 />
 </ModalField>
 <ModalField label="Compare / MRP">
 <input
 type="number"
 step="0.01"
 {...register("comparePrice")}
 className={mfld(false)}
 placeholder="220000"
 />
 </ModalField>
 <ModalField label="Cost Price">
 <input
 type="number"
 step="0.01"
 {...register("costPrice")}
 className={mfld(false)}
 placeholder="Your cost"
 />
 </ModalField>
 </div>
 <div className="grid grid-cols-3 gap-3">
 <ModalField label="Stock *" error={errors.stock?.message}>
 <input
 type="number"
 {...register("stock")}
 className={mfld(!!errors.stock)}
 placeholder="25"
 />
 </ModalField>
 <ModalField label="Low Stock Alert">
 <input
 type="number"
 {...register("lowStockAlert")}
 className={mfld(false)}
 placeholder="5"
 />
 </ModalField>
 <ModalField label="Weight (kg)">
 <input
 type="number"
 step="0.01"
 {...register("weight")}
 className={mfld(false)}
 placeholder="0.19"
 />
 </ModalField>
 </div>
 </Section>

 {/* Variants */}
 <Section title={`Variants (${variantFields.length})`} collapsible>
 <p className="text-xs text-gray-400 mb-3">
 Add variants for different colors, sizes, storage, etc. Leave
 empty if your product has no variants.
 </p>
 {variantFields.map((field, i) => (
 <div
 key={field.id}
 className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-3 relative"
 >
 <button
 type="button"
 onClick={() => removeVariant(i)}
 aria-label="Remove variant"
 className="absolute top-3 right-3 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 <p className="text-xs font-bold text-gray-500 uppercase mb-3">
 Variant {i + 1}
 </p>
 <div className="grid grid-cols-2 gap-3 mb-3">
 <ModalField label="Variant Name *">
 <input
 {...register(`variants.${i}.name`)}
 className={mfld(false)}
 placeholder="256GB / Black"
 />
 </ModalField>
 <ModalField label="SKU *">
 <input
 {...register(`variants.${i}.sku`)}
 className={mfld(false)}
 placeholder="IPH16-256-BLK"
 />
 </ModalField>
 </div>
 <div className="grid grid-cols-4 gap-3">
 <ModalField label="Price *">
 <input
 type="number"
 step="0.01"
 {...register(`variants.${i}.price`)}
 defaultValue={watchBasePrice}
 className={mfld(false)}
 />
 </ModalField>
 <ModalField label="Stock *">
 <input
 type="number"
 {...register(`variants.${i}.stock`)}
 className={mfld(false)}
 placeholder="0"
 />
 </ModalField>
 <ModalField label="Color">
 <input
 {...register(`variants.${i}.color`)}
 className={mfld(false)}
 placeholder="Black"
 />
 </ModalField>
 <ModalField label="Size">
 <input
 {...register(`variants.${i}.size`)}
 className={mfld(false)}
 placeholder="XL"
 />
 </ModalField>
 </div>
 </div>
 ))}
 <button
 type="button"
 onClick={() =>
 addVariant({
 name: "",
 sku: "",
 price: watchBasePrice ?? 0,
 stock: 0,
 })
 }
 className="flex items-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
 >
 <Plus className="w-4 h-4" /> Add Variant
 </button>
 </Section>

 {/* Images */}
 <Section title="Product Images">
 <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
 <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
 <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
 Drag & drop or click to upload
 </p>
 <p className="text-xs text-gray-400 mt-1">
 PNG, JPG, WEBP · Max 10MB · Up to 8 images
 </p>
 <p className="text-xs text-gray-400">
 First image = primary / thumbnail
 </p>
 <label className="inline-block mt-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-semibold rounded-xl hover:bg-blue-100 cursor-pointer transition-colors">
 <input
 type="file"
 multiple
 accept="image/*"
 className="hidden"
 onChange={async (e) => {
 const files = Array.from(e.target.files ?? []);
 if (!files.length) return;
 const toasts = toast.loading("Uploading images...");
 const base64s = await Promise.all(
 files.map(
 (f) =>
 new Promise<string>((res) => {
 const reader = new FileReader();
 reader.onload = (ev) =>
 res(ev.target?.result as string);
 reader.readAsDataURL(f);
 }),
 ),
 );
 const resp = await fetch("/api/seller/upload", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ images: base64s }),
 });
 toast.dismiss(toasts);
 if (resp.ok) toast.success("Images uploaded!");
 else toast.error("Upload failed");
 }}
 />
 Choose Files
 </label>
 </div>
 </Section>

 {/* Flags */}
 <Section title="Product Flags">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 {
 name: "isEco",
 label: "🌿 Eco-Friendly",
 desc: "Sustainable product",
 },
 {
 name: "isFlashSale",
 label: "⚡ Flash Sale",
 desc: "Limited time deal",
 },
 {
 name: "freeShipping",
 label: "🚚 Free Shipping",
 desc: "No delivery charge",
 },
 {
 name: "isSubscription",
 label: "🔁 Subscription",
 desc: "Recurring purchase",
 },
 ].map((f) => (
 <label
 key={f.name}
 className="flex items-start gap-2.5 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-all"
 >
 <input
 type="checkbox"
 {...register(f.name as keyof ProductFormData)}
 className="accent-blue-600 w-4 h-4 mt-0.5 shrink-0"
 />
 <div>
 <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
 {f.label}
 </p>
 <p className="text-xs text-gray-400">{f.desc}</p>
 </div>
 </label>
 ))}
 </div>
 </Section>

 {/* SEO */}
 <Section title="SEO / Meta (optional)" collapsible>
 <ModalField label="Meta Title (max 70 chars)">
 <input
 {...register("metaTitle")}
 className={mfld(false)}
 placeholder="iPhone 16 Pro Max — Best Price in Nepal | PeaNut"
 maxLength={70}
 />
 </ModalField>
 <ModalField label="Meta Description (max 160 chars)">
 <textarea
 {...register("metaDescription")}
 rows={2}
 className={mfld(false) + " resize-none"}
 placeholder="Buy genuine Apple iPhone 16 Pro Max..."
 maxLength={160}
 />
 </ModalField>
 <ModalField label="Tags (comma separated)">
 <input
 {...register("tags")}
 className={mfld(false)}
 placeholder="apple, iphone, smartphone, 5g, nepal"
 />
 </ModalField>
 </Section>

 <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
 <button
 type="button"
 onClick={() => setShowModal(false)}
 className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 name="status"
 value="DRAFT"
 formNoValidate
 className="px-5 py-3 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
 >
 Save Draft
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98] transition-all"
 >
 {isSubmitting ? (
 <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : (
 <Save className="w-4 h-4" />
 )}
 {editSlug ? "Update Product" : "Publish Product"}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}

// ═══════════════════════════════════════════════════════════════════════════
// ORDERS TAB
// ═══════════════════════════════════════════════════════════════════════════

function OrdersTab() {
 const [orders, setOrders] = useState<any[]>([]);
 const [stats, setStats] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [statusFilt, setStatus] = useState("all");
 const [search, setSearch] = useState("");
 const [shipModal, setShipModal] = useState<any>(null);
 const dSearch = useDebounce(search, 400);

 const load = useCallback(async () => {
 setLoading(true);
 const p = new URLSearchParams({ limit: "20" });
 if (statusFilt !== "all") p.set("status", statusFilt);
 if (dSearch) p.set("search", dSearch);
 const res = await fetch(`/api/seller/orders?${p}`);
 const data = await res.json();
 setOrders(data.orders ?? []);
 setStats(data.stats);
 setLoading(false);
 }, [statusFilt, dSearch]);

 useEffect(() => {
 load();
 }, [load]);

 const handleShip = async (data: any) => {
 const res = await fetch(`/api/seller/orders/${shipModal.orderId}/ship`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(data),
 });
 if (res.ok) {
 toast.success("Order marked as shipped!");
 setShipModal(null);
 load();
 } else toast.error("Failed to update.");
 };

 return (
 <div className="space-y-5">
 {/* Stats */}
 {stats && (
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 {
 label: "Total Earnings",
 value: formatPrice(stats.totalEarnings ?? 0),
 color: "text-blue-600",
 },
 {
 label: "Total Orders",
 value: (stats.totalOrders ?? 0).toLocaleString(),
 color: "text-gray-900 dark:text-white",
 },
 {
 label: "Pending",
 value: (stats.pendingOrders ?? 0).toLocaleString(),
 color: "text-amber-600",
 },
 {
 label: "Platform Fee",
 value: formatPrice((stats.totalRevenue ?? 0) * 0.08),
 color: "text-gray-500",
 },
 ].map((s) => (
 <div
 key={s.label}
 className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center"
 >
 <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
 <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
 </div>
 ))}
 </div>
 )}

 {/* Filters */}
 <div className="flex gap-2 flex-wrap items-center">
 <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-xs">
 <Search className="w-4 h-4 text-gray-400 shrink-0" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Order ID, customer..."
 className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
 />
 </div>
 <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
 {[
 "all",
 "PENDING",
 "CONFIRMED",
 "SHIPPED",
 "DELIVERED",
 "CANCELLED",
 ].map((s) => (
 <button
 key={s}
 onClick={() => setStatus(s)}
 className={cn(
 "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
 statusFilt === s
 ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
 : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
 )}
 >
 {s === "all" ? "All" : s.replace("_", " ")}
 </button>
 ))}
 </div>
 </div>

 {/* Orders table */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm min-w-150]">
 <thead>
 <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
 {[
 "Order",
 "Customer",
 "Product",
 "Amount",
 "Date",
 "Status",
 "Action",
 ].map((h) => (
 <th
 key={h}
 className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
 >
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
 {loading ? (
 [...Array(5)].map((_, i) => (
 <tr key={i}>
 <td colSpan={7} className="px-4 py-3">
 <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
 </td>
 </tr>
 ))
 ) : orders.length === 0 ? (
 <tr>
 <td colSpan={7}>
 <EmptyState
 icon="📭"
 title="No orders"
 desc="Orders from customers will appear here."
 />
 </td>
 </tr>
 ) : (
 orders.map((item) => (
 <tr
 key={item.id}
 className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
 >
 <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
 {item.order?.orderNumber}
 </td>
 <td className="px-4 py-3">
 <p className="font-medium text-gray-900 dark:text-white text-sm">
 {item.order?.user?.name}
 </p>
 <p className="text-xs text-gray-400">
 {item.order?.address?.city}
 </p>
 </td>
 <td className="px-4 py-3">
 <p className="font-medium text-sm text-gray-800 dark:text-gray-200 max-w-40 truncate">
 {item.product?.name}
 </p>
 {item.variant && (
 <p className="text-xs text-gray-400">
 {item.variant.name}
 </p>
 )}
 <p className="text-xs text-gray-400">×{item.quantity}</p>
 </td>
 <td className="px-4 py-3 font-bold text-blue-600">
 {formatPrice(Number(item.total))}
 </td>
 <td className="px-4 py-3 text-xs text-gray-400">
 {timeAgo(item.order?.createdAt)}
 </td>
 <td className="px-4 py-3">
 <span
 className={cn(
 "text-xs font-bold px-2 py-0.5 rounded-full",
 ORDER_STATUS_COLORS[item.order?.status] ??
 "bg-gray-100 text-gray-600",
 )}
 >
 {(item.order?.status ?? "").replace("_", " ")}
 </span>
 </td>
 <td className="px-4 py-3">
 {["CONFIRMED", "PROCESSING"].includes(
 item.order?.status,
 ) && (
 <button
 onClick={() =>
 setShipModal({
 orderId: item.order.id,
 orderNumber: item.order.orderNumber,
 })
 }
 className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
 >
 <Truck className="w-3.5 h-3.5" /> Ship
 </button>
 )}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Ship modal */}
 {shipModal && (
 <ShipOrderModal
 orderNumber={shipModal.orderNumber}
 onSubmit={handleShip}
 onClose={() => setShipModal(null)}
 />
 )}
 </div>
 );
}

function ShipOrderModal({
 orderNumber,
 onSubmit,
 onClose,
}: {
 orderNumber: string;
 onSubmit: (d: any) => void;
 onClose: () => void;
}) {
 const {
 register,
 handleSubmit,
 formState: { isSubmitting },
 } = useForm({
 defaultValues: {
 trackingNumber: "",
 trackingUrl: "",
 courier: "NexExpress",
 note: "",
 },
 });
 return (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md shadow-2xl">
 <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
 <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
 <Truck className="w-5 h-5 text-blue-600" /> Ship Order{" "}
 {orderNumber}
 </h2>
 <button onClick={onClose} aria-label="Close">
 <X className="w-5 h-5 text-gray-400" />
 </button>
 </div>
 <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
 {[
 {
 label: "Courier Service",
 name: "courier",
 placeholder: "NexExpress, FedEx, DHL...",
 },
 {
 label: "Tracking Number *",
 name: "trackingNumber",
 placeholder: "NEX8829341",
 },
 {
 label: "Tracking URL",
 name: "trackingUrl",
 placeholder: "https://track....",
 },
 {
 label: "Note to customer",
 name: "note",
 placeholder: "Optional message",
 },
 ].map((f) => (
 <ModalField key={f.name} label={f.label}>
 <input
 {...register(f.name as any)}
 className={mfld(false)}
 placeholder={f.placeholder}
 />
 </ModalField>
 ))}
 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={onClose}
 className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
 >
 {isSubmitting ? (
 <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : (
 <Truck className="w-4 h-4" />
 )}
 Mark as Shipped
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}

// ═══════════════════════════════════════════════════════════════════════════
// REVIEWS TAB
// ═══════════════════════════════════════════════════════════════════════════

function ReviewsTab() {
 const [reviews, setReviews] = useState<any[]>([]);
 const [filter, setFilter] = useState("all");
 const [reply, setReply] = useState<Record<string, string>>({});

 useEffect(() => {
 fetch("/api/seller/reviews")
 .then((r) => r.json())
 .then((d) => setReviews(d.reviews ?? []));
 }, []);

 const mockReviews = [
 {
 id: "1",
 user: "Arun K.",
 rating: 5,
 product: "iPhone 16 Pro",
 body: "Excellent product, genuine and fast delivery!",
 time: new Date(Date.now() - 3600000),
 verified: true,
 },
 {
 id: "2",
 user: "Sita T.",
 rating: 4,
 product: "Sony XM6",
 body: "Good quality, packaging was a bit loose but product is fine.",
 time: new Date(Date.now() - 86400000),
 verified: true,
 },
 {
 id: "3",
 user: "Ram B.",
 rating: 5,
 product: "MacBook Pro M4",
 body: "100% genuine, sealed box. Seller very responsive!",
 time: new Date(Date.now() - 172800000),
 verified: false,
 },
 {
 id: "4",
 user: "Devi P.",
 rating: 3,
 product: "Smart Watch",
 body: "Product ok but delivery took 5 days.",
 time: new Date(Date.now() - 259200000),
 verified: true,
 },
 {
 id: "5",
 user: "Bikash G.",
 rating: 5,
 product: "Headphones",
 body: "Perfect! Will order again from this store.",
 time: new Date(Date.now() - 345600000),
 verified: true,
 },
 ];

 const items = (reviews.length > 0 ? reviews : mockReviews).filter((r) => {
 if (filter === "all") return true;
 if (filter === "5") return r.rating === 5;
 if (filter === "low") return r.rating <= 3;
 return true;
 });

 const submitReply = async (id: string) => {
 if (!reply[id]?.trim()) return;
 const res = await fetch(`/api/seller/reviews/${id}/reply`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ reply: reply[id] }),
 });
 if (res.ok) {
 toast.success("Reply posted!");
 setReply((r) => ({ ...r, [id]: "" }));
 } else toast.error("Failed to post reply.");
 };

 return (
 <div className="space-y-4">
 <div className="flex gap-2 flex-wrap items-center">
 <h2 className="font-bold text-gray-900 dark:text-white">
 Customer Reviews
 </h2>
 <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 ml-auto">
 {[
 { v: "all", l: "All" },
 { v: "5", l: "5★" },
 { v: "low", l: "≤3★" },
 ].map(({ v, l }) => (
 <button
 key={v}
 onClick={() => setFilter(v)}
 className={cn(
 "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
 filter === v
 ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
 : "text-gray-500 hover:text-gray-700",
 )}
 >
 {l}
 </button>
 ))}
 </div>
 </div>

 {items.map((r) => (
 <div
 key={r.id}
 className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
 >
 <div className="flex items-start gap-3 mb-3">
 <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
 {r.user[0]}
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <p className="font-semibold text-sm text-gray-900 dark:text-white">
 {r.user}
 </p>
 {r.verified && (
 <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
 ✓ Verified Purchase
 </span>
 )}
 <span className="text-xs text-gray-400 ml-auto">
 {timeAgo(r.time)}
 </span>
 </div>
 <p className="text-xs text-gray-400 mt-0.5">{r.product}</p>
 <div className="flex gap-0.5 mt-1">
 {[1, 2, 3, 4, 5].map((s) => (
 <span
 key={s}
 className={cn(
 "text-sm",
 s <= r.rating ? "text-amber-400" : "text-gray-200",
 )}
 >
 ★
 </span>
 ))}
 </div>
 </div>
 </div>
 <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
 {r.body}
 </p>
 {r.sellerReply ? (
 <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
 <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
 Your reply:
 </p>
 <p className="text-sm text-gray-700 dark:text-gray-300">
 {r.sellerReply}
 </p>
 </div>
 ) : (
 <div className="flex gap-2">
 <input
 type="text"
 placeholder="Write a reply..."
 value={reply[r.id] ?? ""}
 onChange={(e) =>
 setReply((prev) => ({ ...prev, [r.id]: e.target.value }))
 }
 className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-400"
 />
 <button
 onClick={() => submitReply(r.id)}
 className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
 >
 Reply
 </button>
 </div>
 )}
 </div>
 ))}
 </div>
 );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ═══════════════════════════════════════════════════════════════════════════

function AnalyticsTab() {
 const [data, setData] = useState<any>(null);
 const [period, setPeriod] = useState("30");

 useEffect(() => {
 fetch(`/api/seller/analytics?period=${period}`)
 .then((r) => r.json())
 .then(setData);
 }, [period]);

 const revData = data?.revenueByDay?.map((d: any) => d.revenue) ?? [
 280, 320, 410, 290, 480, 395, 520, 450, 580, 510, 640, 590,
 ];
 const maxRev = Math.max(...revData, 1);

 return (
 <div className="space-y-5">
 <div className="flex items-center justify-between">
 <h2 className="font-bold text-gray-900 dark:text-white text-lg">
 Analytics
 </h2>
 <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
 {["7", "30", "90"].map((p) => (
 <button
 key={p}
 onClick={() => setPeriod(p)}
 className={cn(
 "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
 period === p
 ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
 : "text-gray-500 hover:text-gray-700",
 )}
 >
 {p}D
 </button>
 ))}
 </div>
 </div>

 {/* Revenue chart */}
 <DashCard title="Revenue Trend">
 <div className="flex items-end gap-1 h-48 mb-2">
 {revData.map((v: number, i: number) => (
 <div
 key={i}
 className="flex-1 bg-linear-to-t from-blue-600 to-blue-400 rounded-t-md hover:opacity-80 transition-opacity cursor-pointer relative group"
 style={{ height: `${Math.max((v / maxRev) * 100, 3)}%` }}
 >
 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-10 pointer-events-none">
 {formatPrice(v)}
 </div>
 </div>
 ))}
 </div>
 </DashCard>

 {/* Metric grid */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 {[
 {
 label: "Conversion Rate",
 value: `${data?.conversionRate ?? "3.2"}%`,
 sub: "Views → orders",
 },
 {
 label: "Avg Order Value",
 value: formatPrice(data?.avgOrderValue ?? 18450),
 sub: "Per transaction",
 },
 {
 label: "Total Views",
 value: (data?.totalViews ?? 48392).toLocaleString(),
 sub: "Product pages",
 },
 {
 label: "Avg. Rating",
 value: `${(data?.reviewStats?.averageRating ?? 4.9).toFixed(1)} ★`,
 sub: `${data?.reviewStats?.totalReviews ?? 234} reviews`,
 },
 ].map((s) => (
 <div
 key={s.label}
 className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center"
 >
 <p className="text-2xl font-black text-gray-900 dark:text-white">
 {s.value}
 </p>
 <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-0.5">
 {s.label}
 </p>
 <p className="text-xs text-gray-400">{s.sub}</p>
 </div>
 ))}
 </div>

 {/* Top products */}
 <DashCard title="Top Products by Sales">
 <div className="space-y-3">
 {(data?.topProducts ?? []).slice(0, 5).map((p: any, i: number) => {
 const maxSales = Math.max(
 ...(data?.topProducts?.map((x: any) => x.totalSales) ?? [1]),
 );
 return (
 <div key={p.id} className="flex items-center gap-3">
 <span
 className={cn(
 "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0",
 i === 0
 ? "bg-amber-400 text-white"
 : i === 1
 ? "bg-gray-300 text-gray-700"
 : i === 2
 ? "bg-amber-700 text-white"
 : "bg-gray-100 dark:bg-gray-800 text-gray-500",
 )}
 >
 {i + 1}
 </span>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between text-sm mb-0.5">
 <span className="font-medium text-gray-900 dark:text-white truncate">
 {p.name}
 </span>
 <span className="text-gray-400 ml-2 shrink-0">
 {p.totalSales?.toLocaleString()} sold
 </span>
 </div>
 <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
 <div
 className="h-full bg-blue-500 rounded-full"
 style={{ width: `${(p.totalSales / maxSales) * 100}%` }}
 />
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </DashCard>
 </div>
 );
}

function PayoutsTab({ seller }: { seller: any }) {
 const [payouts, setPayouts] = useState<any>(null);
 const [amount, setAmount] = useState("");
 const [requesting, setReq] = useState(false);

 useEffect(() => {
 fetch("/api/seller/payouts")
 .then((r) => r.json())
 .then(setPayouts);
 }, []);

 const requestWithdrawal = async () => {
 const amt = parseFloat(amount);
 if (isNaN(amt) || amt < 500) {
 toast.error("Minimum withdrawal is रू 500");
 return;
 }
 if (amt > (payouts?.available ?? 0)) {
 toast.error("Insufficient available balance");
 return;
 }
 setReq(true);
 const res = await fetch("/api/seller/payouts", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ amount: amt, bankAccount: seller?.bankAccount }),
 });
 const data = await res.json();
 setReq(false);
 if (res.ok) {
 toast.success(data.message);
 setAmount("");
 fetch("/api/seller/payouts")
 .then((r) => r.json())
 .then(setPayouts);
 } else toast.error(data.error ?? "Request failed");
 };

 return (
 <div className="space-y-5">
 {/* Balance cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {[
 {
 label: "Available Balance",
 value: formatPrice(payouts?.available ?? 48320),
 color: "text-green-600",
 bg: "bg-green-50 dark:bg-green-900/20",
 icon: "💰",
 },
 {
 label: "Pending Clearance",
 value: formatPrice(payouts?.pending ?? 12800),
 color: "text-amber-600",
 bg: "bg-amber-50 dark:bg-amber-900/20",
 icon: "⏳",
 },
 {
 label: "Total Earned",
 value: formatPrice(payouts?.totalEarnings ?? 240000),
 color: "text-blue-600",
 bg: "bg-blue-50 dark:bg-blue-900/20",
 icon: "📈",
 },
 ].map((s) => (
 <div
 key={s.label}
 className={cn(
 "rounded-2xl p-5 border text-center",
 s.bg,
 "border-transparent",
 )}
 >
 <div className="text-3xl mb-2">{s.icon}</div>
 <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
 <p className="text-sm text-gray-500 mt-1">{s.label}</p>
 </div>
 ))}
 </div>

 {/* Withdraw */}
 <DashCard title="Request Withdrawal">
 <div className="max-w-sm space-y-4">
 <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3">
 <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
 <div>
 <p className="text-sm font-semibold text-gray-900 dark:text-white">
 {payouts?.bankDetails?.name ??
 seller?.bankName ??
 "NIC Asia Bank"}
 </p>
 <p className="text-xs text-gray-400">
 Account: ****
 {(
 payouts?.bankDetails?.account ??
 seller?.bankAccount ??
 ""
 )?.slice(-4)}
 </p>
 </div>
 <button
 className="ml-auto text-xs text-blue-600 font-semibold hover:underline"
 onClick={() => toast("Go to Settings to update bank details")}
 >
 Change
 </button>
 </div>
 <ModalField label="Amount (NPR)">
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
 रू
 </span>
 <input
 type="number"
 value={amount}
 onChange={(e) => setAmount(e.target.value)}
 min="500"
 className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500"
 placeholder="Enter amount"
 />
 </div>
 <p className="text-xs text-gray-400 mt-1">
 Min: रू 500 · Available:{" "}
 {formatPrice(payouts?.available ?? 48320)}
 </p>
 </ModalField>
 <button
 onClick={requestWithdrawal}
 disabled={requesting}
 className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors"
 >
 {requesting ? (
 <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : (
 "💸"
 )}
 {requesting ? "Processing..." : "Withdraw to Bank Account"}
 </button>
 <p className="text-xs text-gray-400 text-center">
 Transfers arrive within 2–3 business days
 </p>
 </div>
 </DashCard>

 {/* History */}
 <DashCard title="Payout History">
 <div className="space-y-3">
 {(payouts?.payoutHistory ?? []).map((p: any) => (
 <div
 key={p.id}
 className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0"
 >
 <div>
 <p className="text-sm font-semibold text-gray-900 dark:text-white">
 {formatPrice(p.amount)}
 </p>
 <p className="text-xs text-gray-400">
 {p.bank} · {new Date(p.date).toLocaleDateString()}
 </p>
 <p className="text-xs text-gray-400 font-mono">Ref: {p.id}</p>
 </div>
 <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
 <CheckCircle className="w-3.5 h-3.5" /> {p.status}
 </span>
 </div>
 ))}
 </div>
 </DashCard>
 </div>
 );
}

function SettingsTab({
 seller,
 onUpdate,
}: {
 seller: any;
 onUpdate: (s: any) => void;
}) {
 const {
 register,
 handleSubmit,
 formState: { isDirty, isSubmitting },
 } = useForm({
 defaultValues: {
 storeName: seller?.storeName ?? "",
 storeDescription: seller?.storeDescription ?? "",
 businessName: seller?.businessName ?? "",
 businessRegNo: seller?.businessRegNo ?? "",
 panNumber: seller?.panNumber ?? "",
 bankName: seller?.bankName ?? "",
 bankAccount: seller?.bankAccount ?? "",
 bankBranch: seller?.bankBranch ?? "",
 city: seller?.city ?? "",
 district: seller?.district ?? "",
 province: seller?.province ?? "",
 },
 });

 const onSubmit = async (data: any) => {
 const res = await fetch("/api/seller/profile", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(data),
 });
 const json = await res.json();
 if (res.ok) {
 toast.success("Settings saved!");
 onUpdate((prev: any) => ({ ...prev, ...json.seller }));
 } else toast.error(json.error ?? "Save failed");
 };

 return (
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
 <DashCard title="Store Information">
 <div className="space-y-4 max-w-lg">
 <ModalField label="Store Name">
 <input {...register("storeName")} className={mfld(false)} />
 </ModalField>
 <ModalField label="Store Description">
 <textarea
 {...register("storeDescription")}
 rows={4}
 className={mfld(false) + " resize-none"}
 />
 </ModalField>
 </div>
 </DashCard>
 <DashCard title="Business Details">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
 <ModalField label="Business Name">
 <input {...register("businessName")} className={mfld(false)} />
 </ModalField>
 <ModalField label="Business Reg. No.">
 <input {...register("businessRegNo")} className={mfld(false)} />
 </ModalField>
 <ModalField label="PAN / VAT Number">
 <input {...register("panNumber")} className={mfld(false)} />
 </ModalField>
 </div>
 </DashCard>
 <DashCard title="Bank Account">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
 <ModalField label="Bank Name">
 <input {...register("bankName")} className={mfld(false)} />
 </ModalField>
 <ModalField label="Account Number">
 <input {...register("bankAccount")} className={mfld(false)} />
 </ModalField>
 <ModalField label="Branch">
 <input {...register("bankBranch")} className={mfld(false)} />
 </ModalField>
 </div>
 </DashCard>
 <DashCard title="Location">
 <div className="grid grid-cols-3 gap-4 max-w-lg">
 <ModalField label="City">
 <input {...register("city")} className={mfld(false)} />
 </ModalField>
 <ModalField label="District">
 <input {...register("district")} className={mfld(false)} />
 </ModalField>
 <ModalField label="Province">
 <input {...register("province")} className={mfld(false)} />
 </ModalField>
 </div>
 </DashCard>
 <button
 type="submit"
 disabled={!isDirty || isSubmitting}
 className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 {isSubmitting ? (
 <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : (
 <Save className="w-4 h-4" />
 )}
 Save Settings
 </button>
 </form>
 );
}

function MiniOrderList({ orders }: { orders: any[] }) {
 if (!orders.length)
 return (
 <p className="text-sm text-gray-400 py-4 text-center">No recent orders</p>
 );
 return (
 <div className="space-y-2">
 {orders.map((item: any) => (
 <div
 key={item.id}
 className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
 >
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
 {item.order?.orderNumber}
 </p>
 <p className="text-xs text-gray-400">
 {item.product?.name} · {timeAgo(item.order?.createdAt)}
 </p>
 </div>
 <div className="text-right shrink-0">
 <p className="text-sm font-bold text-blue-600">
 {formatPrice(Number(item.total))}
 </p>
 <span
 className={cn(
 "text-xs font-bold px-1.5 py-0.5 rounded-full",
 ORDER_STATUS_COLORS[item.order?.status] ??
 "bg-gray-100 text-gray-600",
 )}
 >
 {(item.order?.status ?? "").replace("_", " ")}
 </span>
 </div>
 </div>
 ))}
 </div>
 );
}

function LowStockWidget() {
 const items = [
 { name: "PS5 Slim Bundle", stock: 5, sku: "PS5-SLIM-BDL" },
 { name: "MacBook Pro M4", stock: 4, sku: "MBP-M4-14" },
 { name: "Ergonomic Chair", stock: 3, sku: "CHAIR-ERG-01" },
 { name: "AirPods Pro 4", stock: 2, sku: "APP-4-WHT" },
 { name: "iPhone 16 Pro 1TB", stock: 1, sku: "IPH16P-1TB" },
 ];
 return (
 <div className="space-y-2">
 {items.map((item) => (
 <div key={item.sku} className="flex items-center gap-3">
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
 {item.name}
 </p>
 <div className="flex items-center gap-2 mt-0.5">
 <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
 <div
 className={cn(
 "h-full rounded-full",
 item.stock <= 2 ? "bg-red-500" : "bg-amber-500",
 )}
 style={{ width: `${item.stock * 10}%` }}
 />
 </div>
 <span
 className={cn(
 "text-xs font-bold shrink-0",
 item.stock <= 2 ? "text-red-500" : "text-amber-500",
 )}
 >
 {item.stock} left
 </span>
 </div>
 </div>
 <button
 className="text-xs text-blue-600 font-semibold hover:underline shrink-0"
 onClick={() => toast("Restock form would open here")}
 >
 Restock
 </button>
 </div>
 ))}
 </div>
 );
}

function MiniBarChart({ data }: { data: number[] }) {
 const d = data.length
 ? data
 : [28, 32, 41, 29, 48, 39, 52, 45, 58, 51, 64, 59];
 const max = Math.max(...d, 1);
 return (
 <div className="flex items-end gap-1 h-32">
 {d.map((v, i) => (
 <div
 key={i}
 className="flex-1 bg-linear-to-t from-blue-600 to-blue-400 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer relative group"
 style={{ height: `${Math.max((v / max) * 100, 3)}%` }}
 >
 <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-10 pointer-events-none">
 {formatPrice(v)}
 </div>
 </div>
 ))}
 </div>
 );
}

function EmptyState({
 icon,
 title,
 desc,
 action,
}: {
 icon: string;
 title: string;
 desc: string;
 action?: { label: string; onClick: () => void };
}) {
 return (
 <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
 <span className="text-5xl mb-4 block">{icon}</span>
 <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
 {title}
 </h3>
 <p className="text-gray-400 text-sm max-w-xs mb-5">{desc}</p>
 {action && (
 <button
 onClick={action.onClick}
 className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors"
 >
 {action.label}
 </button>
 )}
 </div>
 );
}

function DashCard({
 title,
 badge,
 action,
 children,
}: {
 title: string;
 badge?: React.ReactNode;
 action?: { label: string; onClick: () => void };
 children: React.ReactNode;
}) {
 return (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-gray-900 dark:text-white text-sm">
 {title}
 </h3>
 {badge}
 </div>
 {action && (
 <button
 onClick={action.onClick}
 className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
 >
 {action.label}
 <ChevronRight className="w-3 h-3" />
 </button>
 )}
 </div>
 {children}
 </div>
 );
}

function Section({
 title,
 children,
 collapsible = false,
}: {
 title: string;
 children: React.ReactNode;
 collapsible?: boolean;
}) {
 const [open, setOpen] = useState(true);
 return (
 <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
 <button
 type="button"
 onClick={() => collapsible && setOpen((v) => !v)}
 className={cn(
 "flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left",
 collapsible && "cursor-pointer",
 )}
 >
 <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
 {title}
 </span>
 {collapsible && (
 <ChevronDown
 className={cn(
 "w-4 h-4 text-gray-400 transition-transform",
 !open && "-rotate-90",
 )}
 />
 )}
 </button>
 {open && <div className="p-4 space-y-4">{children}</div>}
 </div>
 );
}

function ModalField({
 label,
 error,
 children,
}: {
 label: string;
 error?: string;
 children: React.ReactNode;
}) {
 return (
 <div>
 <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
 {label}
 </label>
 {children}
 {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
 </div>
 );
}

const mfld = (hasError: boolean) =>
 cn(
 "w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all",
 "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
 hasError
 ? "border-red-400 focus:border-red-500"
 : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30",
 );
