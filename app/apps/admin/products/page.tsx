"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCcw,
  X,
  Star,
  ShoppingBag,
  TrendingUp,
  Zap,
  Leaf,
  MoreHorizontal,
  Flag,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/app/lib/utils";
import { useDebounce } from "@/app/hooks/useDebounce";
import { toast } from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30",
  DRAFT: "bg-gray-100 text-gray-500 dark:bg-gray-800",
  PENDING_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
  INACTIVE: "bg-red-100 text-red-600 dark:bg-red-900/30",
  REJECTED: "bg-red-200 text-red-800 dark:bg-red-900/50",
  OUT_OF_STOCK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState("");
  const dSearch = useDebounce(search, 400);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
      sort,
    });
    if (dSearch) p.set("search", dSearch);
    if (status !== "all") p.set("status", status);
    if (category) p.set("category", category);
    const res = await fetch(`/api/admin/products?${p}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setStats(data.stats);
    setLoading(false);
  }, [page, dSearch, status, category, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (
    id: string,
    action: "approve" | "reject",
    note?: string,
  ) => {
    const newStatus = action === "approve" ? "ACTIVE" : "REJECTED";
    const res = await fetch(`/api/admin/products/${id}/moderate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, note }),
    });
    if (res.ok) {
      toast.success(
        action === "approve" ? "Product approved!" : "Product rejected",
      );
      setRejectModal(null);
      setRejectNote("");
      load();
    } else {
      toast.error("Action failed");
    }
  };

  const toggleFlashSale = async (id: string, current: boolean) => {
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFlashSale: !current }),
    });
    toast.success(!current ? "Added to flash sale" : "Removed from flash sale");
    load();
  };

  const deleteProduct = async (slug: string) => {
    if (!confirm("Permanently deactivate this product?")) return;
    await fetch(`/api/products/${slug}`, { method: "DELETE" });
    toast.success("Product removed");
    load();
  };

  // Mock data for when API is empty
  const mockProducts = [
    {
      id: "1",
      name: "Apple iPhone 16 Pro Max",
      slug: "iphone-16-pro",
      status: "PENDING_REVIEW",
      basePrice: 195000,
      stock: 23,
      totalSales: 0,
      totalViews: 0,
      averageRating: 0,
      totalReviews: 0,
      isFlashSale: false,
      isEco: false,
      category: { name: "Electronics" },
      seller: { storeName: "TechStore Nepal" },
      images: [],
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      name: "Sony WH-1000XM6",
      slug: "sony-xm6",
      status: "ACTIVE",
      basePrice: 38500,
      stock: 67,
      totalSales: 923,
      totalViews: 8420,
      averageRating: 4.8,
      totalReviews: 892,
      isFlashSale: true,
      isEco: true,
      category: { name: "Electronics" },
      seller: { storeName: "SonyNepal" },
      images: [],
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: "3",
      name: "Nike Air Max 2025",
      slug: "nike-air-max",
      status: "ACTIVE",
      basePrice: 18500,
      stock: 12,
      totalSales: 341,
      totalViews: 4130,
      averageRating: 4.7,
      totalReviews: 234,
      isFlashSale: false,
      isEco: false,
      category: { name: "Fashion" },
      seller: { storeName: "SportZone" },
      images: [],
      createdAt: new Date(Date.now() - 172800000),
    },
    {
      id: "4",
      name: "Suspicious Watch XYZ",
      slug: "watch-xyz",
      status: "PENDING_REVIEW",
      basePrice: 5000,
      stock: 500,
      totalSales: 0,
      totalViews: 0,
      averageRating: 0,
      totalReviews: 0,
      isFlashSale: false,
      isEco: false,
      category: { name: "Accessories" },
      seller: { storeName: "UnknownStore" },
      images: [],
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: "5",
      name: 'MacBook Pro M4 14"',
      slug: "macbook-m4",
      status: "ACTIVE",
      basePrice: 285000,
      stock: 8,
      totalSales: 641,
      totalViews: 9230,
      averageRating: 4.9,
      totalReviews: 412,
      isFlashSale: false,
      isEco: true,
      category: { name: "Electronics" },
      seller: { storeName: "TechStore Nepal" },
      images: [],
      createdAt: new Date(Date.now() - 259200000),
    },
  ];

  const items = products.length ? products : mockProducts;
  const filteredItems =
    status === "all" ? items : items.filter((p) => p.status === status);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-sm text-gray-400">
            {total || filteredItems.length} products
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.success("Exporting...")}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => load()}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Products",
              value: stats.total,
              color: "text-gray-900 dark:text-white",
            },
            {
              label: "Pending Review",
              value: stats.pendingReview,
              color: "text-amber-600",
              warn: stats.pendingReview > 0,
            },
            { label: "Active", value: stats.active, color: "text-green-600" },
            {
              label: "Out of Stock",
              value: stats.outOfStock,
              color: "text-red-600",
              warn: stats.outOfStock > 0,
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                "bg-white dark:bg-gray-900 rounded-xl border p-4",
                s.warn
                  ? "border-amber-200 dark:border-amber-800"
                  : "border-gray-100 dark:border-gray-800",
              )}
            >
              <p className={cn("text-2xl font-black", s.color)}>
                {s.value?.toLocaleString() ?? "—"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 flex-1 min-w-50 max-w-xs">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, SKU, seller..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 min-w-0"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none"
        >
          <option value="all">All Status</option>
          <option value="PENDING_REVIEW">⏳ Pending Review</option>
          <option value="ACTIVE">✅ Active</option>
          <option value="DRAFT">📝 Draft</option>
          <option value="INACTIVE">🚫 Inactive</option>
          <option value="REJECTED">❌ Rejected</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="price_desc">Price: High</option>
          <option value="price_asc">Price: Low</option>
          <option value="sales_desc">Best Selling</option>
          <option value="rating_desc">Top Rated</option>
        </select>
      </div>

      {/* Status quick-filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { v: "all", l: "All", count: filteredItems.length },
          {
            v: "PENDING_REVIEW",
            l: "⏳ Pending",
            count: filteredItems.filter((p) => p.status === "PENDING_REVIEW")
              .length,
          },
          {
            v: "ACTIVE",
            l: "✅ Active",
            count: filteredItems.filter((p) => p.status === "ACTIVE").length,
          },
          {
            v: "INACTIVE",
            l: "🚫 Inactive",
            count: filteredItems.filter((p) => p.status === "INACTIVE").length,
          },
        ].map((tab) => (
          <button
            key={tab.v}
            onClick={() => {
              setStatus(tab.v);
              setPage(1);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors",
              status === tab.v
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600",
            )}
          >
            {tab.l}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                status === tab.v
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500",
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Products table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-225">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {[
                  "Product",
                  "Seller",
                  "Price",
                  "Stock",
                  "Sales",
                  "Rating",
                  "Flags",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="px-4 py-3">
                        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                : filteredItems.map((p) => (
                    <tr
                      key={p.id}
                      className={cn(
                        "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                        p.status === "PENDING_REVIEW" &&
                          "bg-amber-50/40 dark:bg-amber-900/5",
                      )}
                    >
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                            {p.images?.[0] ? (
                              <Image
                                src={p.images[0].url}
                                alt={p.name}
                                width={44}
                                height={44}
                                className="object-cover"
                              />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-45">
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
                      {/* Seller */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {p.seller?.storeName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {timeAgo(p.createdAt)}
                        </p>
                      </td>
                      {/* Price */}
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
                      {/* Stock */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "font-bold",
                            p.stock === 0
                              ? "text-red-500"
                              : p.stock <= 5
                                ? "text-amber-500"
                                : "text-green-600",
                          )}
                        >
                          {p.stock}
                        </span>
                      </td>
                      {/* Sales */}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {(p.totalSales ?? 0).toLocaleString()}
                        <p className="text-xs text-gray-400">
                          {(p.totalViews ?? 0).toLocaleString()} views
                        </p>
                      </td>
                      {/* Rating */}
                      <td className="px-4 py-3">
                        {p.totalReviews > 0 ? (
                          <div>
                            <span className="text-amber-500 font-bold">
                              ⭐ {(p.averageRating ?? 0).toFixed(1)}
                            </span>
                            <p className="text-xs text-gray-400">
                              ({p.totalReviews})
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">
                            No reviews
                          </span>
                        )}
                      </td>
                      {/* Flags */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {p.isFlashSale && (
                            <span
                              title="Flash Sale"
                              className="text-amber-500"
                            >
                              ⚡
                            </span>
                          )}
                          {p.isEco && (
                            <span
                              title="Eco-Friendly"
                              className="text-green-500"
                            >
                              🌿
                            </span>
                          )}
                          {p.isFeatured && (
                            <span title="Featured" className="text-blue-500">
                              ⭐
                            </span>
                          )}
                          {p.freeShipping && (
                            <span
                              title="Free Shipping"
                              className="text-blue-500"
                            >
                              🚚
                            </span>
                          )}
                          {!p.isFlashSale &&
                            !p.isEco &&
                            !p.isFeatured &&
                            !p.freeShipping && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                            STATUS_COLORS[p.status] ??
                              "bg-gray-100 text-gray-600",
                          )}
                        >
                          {p.status?.replace("_", " ")}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreview(p)}
                            aria-label="View"
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {p.status === "PENDING_REVIEW" && (
                            <>
                              <button
                                onClick={() => moderate(p.id, "approve")}
                                className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRejectModal(p)}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {p.status === "ACTIVE" && (
                            <button
                              onClick={() =>
                                toggleFlashSale(p.id, p.isFlashSale)
                              }
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                p.isFlashSale
                                  ? "text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                  : "text-gray-400 hover:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30",
                              )}
                              title={
                                p.isFlashSale
                                  ? "Remove from Flash Sale"
                                  : "Add to Flash Sale"
                              }
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteProduct(p.slug)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex-wrap gap-2">
            <p className="text-sm text-gray-500">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of{" "}
              {total.toLocaleString()}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((v) => Math.max(1, v - 1))}
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
                  setPage((v) => Math.min(Math.ceil(total / LIMIT), v + 1))
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

      {/* Product preview panel */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                Product Preview
              </h2>
              <button onClick={() => setPreview(null)} aria-label="Close">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-16 h-16 text-gray-300" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-lg">
                  {preview.name}
                </p>
                <p className="text-sm text-gray-400">
                  {preview.category?.name} · {preview.seller?.storeName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Price",
                    value: formatPrice(Number(preview.basePrice)),
                  },
                  { label: "Stock", value: preview.stock },
                  {
                    label: "Sales",
                    value: (preview.totalSales ?? 0).toLocaleString(),
                  },
                  {
                    label: "Views",
                    value: (preview.totalViews ?? 0).toLocaleString(),
                  },
                  {
                    label: "Rating",
                    value: `${(preview.averageRating ?? 0).toFixed(1)} ⭐`,
                  },
                  {
                    label: "Reviews",
                    value: (preview.totalReviews ?? 0).toLocaleString(),
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3"
                  >
                    <p className="text-xs text-gray-400">{r.label}</p>
                    <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                      {r.value}
                    </p>
                  </div>
                ))}
              </div>
              <span
                className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full",
                  STATUS_COLORS[preview.status],
                )}
              >
                {preview.status?.replace("_", " ")}
              </span>
              {preview.status === "PENDING_REVIEW" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      moderate(preview.id, "approve");
                      setPreview(null);
                    }}
                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejectModal(preview);
                      setPreview(null);
                    }}
                    className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
              <Link
                href={`/products/${preview.slug}`}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Eye className="w-4 h-4" /> View Live Product
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md p-6 shadow-2xl">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
              Reject Product
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting <strong>&quot;{rejectModal.name}&quot;</strong>. The
              seller will be notified.
            </p>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="e.g. Counterfeit product, misleading description, prohibited category..."
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-red-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectNote("");
                }}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => moderate(rejectModal.id, "reject", rejectNote)}
                disabled={!rejectNote.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const setSortBy = (_: string) => {};

export function AdminInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 400);

  const mockInventory = [
    {
      id: "1",
      name: "iPhone 16 Pro Max 256GB",
      sku: "IPH16PM-256",
      seller: "TechStore Nepal",
      stock: 5,
      lowAlert: 5,
      price: 195000,
      category: "Electronics",
    },
    {
      id: "2",
      name: "Sony WH-1000XM6",
      sku: "SNY-XM6",
      seller: "SonyNepal",
      stock: 0,
      lowAlert: 5,
      price: 38500,
      category: "Electronics",
    },
    {
      id: "3",
      name: "Nike Air Max 2025",
      sku: "NK-AM25-42",
      seller: "SportZone",
      stock: 12,
      lowAlert: 10,
      price: 18500,
      category: "Fashion",
    },
    {
      id: "4",
      name: "MacBook Pro M4",
      sku: "MBP-M4-14",
      seller: "TechStore Nepal",
      stock: 3,
      lowAlert: 5,
      price: 285000,
      category: "Electronics",
    },
    {
      id: "5",
      name: "PS5 Slim Bundle",
      sku: "PS5-SLIM",
      seller: "GamingHub",
      stock: 5,
      lowAlert: 5,
      price: 75000,
      category: "Gaming",
    },
    {
      id: "6",
      name: "Apple Watch Ultra 3",
      sku: "AW-U3-49",
      seller: "TechStore Nepal",
      stock: 45,
      lowAlert: 5,
      price: 125000,
      category: "Wearables",
    },
    {
      id: "7",
      name: "Ergonomic Office Chair",
      sku: "CHAIR-ERG",
      seller: "FurnishNepal",
      stock: 0,
      lowAlert: 3,
      price: 28000,
      category: "Furniture",
    },
    {
      id: "8",
      name: "AirPods Pro 4",
      sku: "APP4-WHT",
      seller: "TechStore Nepal",
      stock: 2,
      lowAlert: 5,
      price: 32000,
      category: "Electronics",
    },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setItems(mockInventory);
      setLoading(false);
    }, 400);
  }, []);

  const filtered = items.filter((i) => {
    const matchSearch =
      !dSearch ||
      i.name.toLowerCase().includes(dSearch.toLowerCase()) ||
      i.sku.toLowerCase().includes(dSearch.toLowerCase());
    const matchFilter =
      filter === "all"
        ? true
        : filter === "out"
          ? i.stock === 0
          : filter === "low"
            ? i.stock > 0 && i.stock <= i.lowAlert
            : filter === "healthy"
              ? i.stock > i.lowAlert
              : true;
    return matchSearch && matchFilter;
  });

  const outOfStock = items.filter((i) => i.stock === 0).length;
  const lowStock = items.filter(
    (i) => i.stock > 0 && i.stock <= i.lowAlert,
  ).length;
  const healthy = items.filter((i) => i.stock > i.lowAlert).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">
          Inventory
        </h1>
        <p className="text-sm text-gray-400">Platform-wide stock overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Out of Stock",
            value: outOfStock,
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/20",
            border: "border-red-200 dark:border-red-800",
            icon: "🚫",
          },
          {
            label: "Low Stock",
            value: lowStock,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-200 dark:border-amber-800",
            icon: "⚠️",
          },
          {
            label: "Healthy",
            value: healthy,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
            border: "border-green-200 dark:border-green-800",
            icon: "✅",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn("rounded-2xl border p-5 text-center", s.bg, s.border)}
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <p className={cn("text-3xl font-black", s.color)}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex-1 min-w-50max-w-xs">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {[
            { v: "all", l: "All", count: items.length },
            { v: "out", l: "Out of Stock", count: outOfStock },
            { v: "low", l: "Low Stock", count: lowStock },
            { v: "healthy", l: "Healthy", count: healthy },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setFilter(t.v)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                filter === t.v
                  ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
              )}
            >
              {t.l}
              {t.count > 0 && (
                <span className="ml-1 opacity-60">({t.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-175">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {[
                  "Product",
                  "SKU",
                  "Seller",
                  "Category",
                  "Price",
                  "Stock Status",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                : filtered.map((item) => {
                    const isOut = item.stock === 0;
                    const isLow = item.stock > 0 && item.stock <= item.lowAlert;
                    const pct = Math.min(
                      (item.stock / (item.lowAlert * 4)) * 100,
                      100,
                    );
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                          isOut && "bg-red-50/30 dark:bg-red-900/5",
                        )}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white max-w-50 truncate">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                          {item.sku}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {item.seller}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {item.category}
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-600">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  isOut
                                    ? "w-0"
                                    : isLow
                                      ? "bg-amber-500"
                                      : "bg-green-500",
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-sm font-bold",
                                isOut
                                  ? "text-red-500"
                                  : isLow
                                    ? "text-amber-500"
                                    : "text-green-600",
                              )}
                            >
                              {item.stock}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-semibold px-2 py-0.5 rounded-full",
                                isOut
                                  ? "bg-red-100 text-red-700"
                                  : isLow
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700",
                              )}
                            >
                              {isOut ? "Out of Stock" : isLow ? "Low" : "OK"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              toast.success(
                                `Notification sent to ${item.seller}`,
                              )
                            }
                            className="text-xs text-blue-600 font-semibold hover:underline whitespace-nowrap"
                          >
                            Notify Seller
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("REQUESTED");
  const [active, setActive] = useState<any>(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const mockReturns = [
    {
      id: "RR-001",
      orderId: "NX-2025-47821",
      orderNumber: "NX-2025-47821",
      user: { name: "Priya M.", email: "priya@gmail.com" },
      product: "iPhone 16 Pro Max",
      reason: "WRONG_ITEM",
      description: "Received wrong color (White instead of Black)",
      status: "REQUESTED",
      refundAmount: 195000,
      images: [],
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: "RR-002",
      orderId: "NX-2025-47345",
      orderNumber: "NX-2025-47345",
      user: { name: "Raj K.", email: "raj@email.com" },
      product: "Sony Headphones",
      reason: "DAMAGED",
      description: "Product arrived with cracked earcup",
      status: "APPROVED",
      refundAmount: 38500,
      images: [],
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: "RR-003",
      orderId: "NX-2025-46891",
      orderNumber: "NX-2025-46891",
      user: { name: "Sita T.", email: "sita@mail.com" },
      product: "Nike Air Max",
      reason: "NOT_AS_DESCRIBED",
      description: "Size runs small, doesn't match the description",
      status: "REQUESTED",
      refundAmount: 18500,
      images: [],
      createdAt: new Date(Date.now() - 172800000),
    },
    {
      id: "RR-004",
      orderId: "NX-2025-46102",
      orderNumber: "NX-2025-46102",
      user: { name: "Dev S.", email: "dev@email.com" },
      product: "Apple Watch Ultra",
      reason: "QUALITY_ISSUE",
      description: "Screen has dead pixels after 2 days of use",
      status: "COMPLETED",
      refundAmount: 125000,
      images: [],
      createdAt: new Date(Date.now() - 259200000),
    },
    {
      id: "RR-005",
      orderId: "NX-2025-45780",
      orderNumber: "NX-2025-45780",
      user: { name: "Mina P.", email: "mina@mail.com" },
      product: "MacBook Pro M4",
      reason: "CHANGED_MIND",
      description: "Bought a different model elsewhere",
      status: "REJECTED",
      refundAmount: 285000,
      images: [],
      createdAt: new Date(Date.now() - 345600000),
    },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setReturns(mockReturns);
      setLoading(false);
    }, 400);
  }, []);

  const STATUS_CFG: Record<string, { color: string; label: string }> = {
    REQUESTED: {
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30",
      label: "Requested",
    },
    APPROVED: {
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
      label: "Approved",
    },
    REJECTED: {
      color: "bg-red-100 text-red-700 dark:bg-red-900/30",
      label: "Rejected",
    },
    PICKED_UP: {
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
      label: "Picked Up",
    },
    COMPLETED: {
      color: "bg-green-100 text-green-700 dark:bg-green-900/30",
      label: "Completed",
    },
    REFUNDED: {
      color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30",
      label: "Refunded",
    },
  };

  const processReturn = async (
    id: string,
    action: "approve" | "reject" | "complete",
  ) => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 600));
    const statusMap = {
      approve: "APPROVED",
      reject: "REJECTED",
      complete: "REFUNDED",
    };
    setReturns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: statusMap[action] } : r)),
    );
    toast.success(`Return ${action}d successfully!`);
    setActive(null);
    setNote("");
    setProcessing(false);
  };

  const filteredReturns = returns.filter(
    (r) => filter === "ALL" || r.status === filter,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">
          Returns & Refunds
        </h1>
        <p className="text-sm text-gray-400">
          {returns.length} total return requests
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          {
            label: "Requested",
            count: returns.filter((r) => r.status === "REQUESTED").length,
            color: "text-amber-600",
          },
          {
            label: "Approved",
            count: returns.filter((r) => r.status === "APPROVED").length,
            color: "text-blue-600",
          },
          {
            label: "Completed",
            count: returns.filter((r) => r.status === "COMPLETED").length,
            color: "text-green-600",
          },
          {
            label: "Rejected",
            count: returns.filter((r) => r.status === "REJECTED").length,
            color: "text-red-600",
          },
          {
            label: "Refunded",
            count: returns.filter((r) => r.status === "REFUNDED").length,
            color: "text-teal-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center"
          >
            <p className={cn("text-2xl font-black", s.color)}>{s.count}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
        {[
          { v: "REQUESTED", l: "Requested" },
          { v: "APPROVED", l: "Approved" },
          { v: "REJECTED", l: "Rejected" },
          { v: "COMPLETED", l: "Completed" },
          { v: "ALL", l: "All" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setFilter(t.v)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
              filter === t.v
                ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Returns list */}
      <div className="space-y-3">
        {loading
          ? [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse"
              />
            ))
          : filteredReturns.map((ret) => {
              const cfg = STATUS_CFG[ret.status];
              return (
                <div
                  key={ret.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
                >
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-50">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {ret.product}
                        </p>
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full",
                            cfg?.color,
                          )}
                        >
                          {cfg?.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Order #{ret.orderNumber} · {ret.user?.name} ·{" "}
                        {timeAgo(ret.createdAt)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        <strong>Reason:</strong> {ret.reason?.replace("_", " ")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">
                        &quot;{ret.description}&quot;
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-blue-600">
                        {formatPrice(ret.refundAmount)}
                      </p>
                      <p className="text-xs text-gray-400">Refund amount</p>
                    </div>
                  </div>

                  {ret.status === "REQUESTED" && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                      <button
                        onClick={() => setActive(ret)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Review & Approve
                      </button>
                      <button
                        onClick={() => processReturn(ret.id, "reject")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                  {ret.status === "APPROVED" && (
                    <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                      <button
                        onClick={() => processReturn(ret.id, "complete")}
                        disabled={processing}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
                      >
                        {processing ? (
                          <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                        ) : null}
                        💸 Process Refund
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
      </div>

      {/* Approve modal */}
      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md p-6 shadow-2xl">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
              Approve Return
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Approve return for <strong>{active.product}</strong> and process
              refund of <strong>{formatPrice(active.refundAmount)}</strong>?
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4 text-sm text-gray-600 dark:text-gray-300">
              <p>
                <strong>Reason:</strong> {active.reason?.replace("_", " ")}
              </p>
              <p className="mt-1 italic">&quot;{active.description}&quot;</p>
            </div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Admin Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 resize-none mb-4"
              placeholder="Internal note about this decision..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActive(null);
                  setNote("");
                }}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => processReturn(active.id, "approve")}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : null}
                Approve & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
