"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Store,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  RefreshCcw,
  Zap,
  Eye,
  Star,
  ArrowUpRight,
  ShoppingCart,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/frontend/web/lib/utils";

// ─── Tiny chart primitives ────────────────────────────────────────────────

function Sparkline({
  data,
  color = "#3B82F6",
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data.length) return null;
  const w = 80;
  const h = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`,
    )
    .join(" ");
  const fill = `${pts} ${w},${h} 0,${h}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient
          id={`sg-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarChart({
  data,
  colors,
}: {
  data: { value: number; label: string }[];
  colors?: string[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const palette = colors ?? [
    "#3B82F6",
    "#8B5CF6",
    "#A78BFA",
    "#C4B5FD",
    "#DDD6FE",
    "#EDE9FE",
    "#F5F3FF",
  ];
  return (
    <div
      className="flex items-end gap-1.5 h-52 pt-2 relative"
      role="img"
      aria-label="Bar chart"
    >
      {/* Y-axis guides */}
      {[0, 25, 50, 75, 100].map((pct) => (
        <div
          key={pct}
          className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400"
          style={{ bottom: `${pct}%` }}
        >
          {pct === 0 ? null : (
            <span className="absolute -left-8 -top-2">{pct}%</span>
          )}
        </div>
      ))}
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1 group relative z-10"
        >
          <div
            className="w-full relative cursor-pointer"
            style={{ height: `${Math.max((d.value / max) * 100, 3)}%` }}
          >
            <div
              className="absolute inset-0 rounded-t-lg transition-opacity group-hover:opacity-80"
              style={{ background: palette[i % palette.length] }}
            />
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-20 pointer-events-none shadow-lg">
              {formatPrice(d.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({
  segments,
}: {
  segments: { value: number; color: string; label: string }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const cx = 70;
  const cy = 70;
  const r = 56;
  const sw = 22;
  let offset = 0;
  const circ = 2 * Math.PI * r;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circ;
    const arc = { ...seg, pct, dash, offset, gap: circ - dash };
    offset += dash;
    return arc;
  });

  return (
    <svg
      viewBox="0 0 140 140"
      className="w-32 h-32"
      role="img"
      aria-label="Donut chart"
    >
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={sw}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-(arc.offset - circ / 4)}
          className="transition-all duration-500"
        />
      ))}
      {/* Center */}
      <circle
        cx={cx}
        cy={cy}
        r={r - sw / 2 - 2}
        fill="var(--bg-surface, white)"
        className="fill-white dark:fill-gray-900"
      />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        className="fill-gray-500 dark:fill-gray-400"
        fontSize="9"
        fontWeight="500"
      >
        Revenue
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        className="fill-gray-900 dark:fill-white"
        fontSize="13"
        fontWeight="700"
      >
        {formatPrice(
          segments.reduce((s, seg) => s + seg.value, 0),
          "NPR",
        ).slice(0, 8)}
      </text>
    </svg>
  );
}

interface KpiProps {
  title: string;
  value: string | number;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  iconBg: string;
  sparkline: number[];
  sparkColor: string;
  href?: string;
}

function KpiCard({
  title,
  value,
  change,
  positive,
  icon,
  iconBg,
  sparkline,
  sparkColor,
  href,
}: KpiProps) {
  const inner = (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all duration-200",
        href &&
          "hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            iconBg,
          )}
        >
          {icon}
        </div>
        <Sparkline data={sparkline} color={sparkColor} />
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white mb-0.5 tabular-nums">
        {value}
      </p>
      <p className="text-sm text-gray-400">{title}</p>
      <div
        className={cn(
          "flex items-center gap-1 text-xs font-semibold mt-2",
          positive ? "text-green-600" : "text-red-500",
        )}
      >
        {positive ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" />
        )}
        {change}
        {href && <ChevronRight className="w-3 h-3 ml-auto text-gray-300" />}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState("7");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await res.json();
      setAnalytics(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [period]);

  // Derived
  const ov = analytics?.overview ?? {};
  const rbd = analytics?.revenueByDay ?? [];
  const revValues = rbd.map((d: any) => d.revenue);
  const days = rbd.map((d: any) =>
    new Date(d.date).toLocaleDateString("en", { weekday: "short" }),
  );

  const donutSegs = (
    analytics?.revenueByCategory ?? [
      { categoryName: "Electronics", revenue: 37000000 },
      { categoryName: "Fashion", revenue: 22000000 },
      { categoryName: "Home", revenue: 15000000 },
      { categoryName: "Beauty", revenue: 10000000 },
    ]
  )
    .slice(0, 4)
    .map((c: any, i: number) => ({
      label: c.categoryName,
      value: c.revenue,
      color: ["#3B82F6", "#F59E0B", "#16A34A", "#D97706"][i] ?? "#94A3B8",
    }));

  const kpis: KpiProps[] = [
    {
      title: "Total Revenue",
      value: formatPrice(ov.totalRevenue ?? 84200000),
      change: `+24.1% vs last period`,
      positive: true,
      icon: <DollarSign className="w-5 h-5" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
      sparkline: revValues.length
        ? revValues.slice(-7)
        : [40, 55, 48, 70, 65, 80, 84],
      sparkColor: "#3B82F6",
      href: "/admin/reports",
    },
    {
      title: "Total Orders",
      value: (ov.totalOrders ?? 14832).toLocaleString(),
      change: `+8.3% vs last period`,
      positive: true,
      icon: <Package className="w-5 h-5" />,
      iconBg: "bg-green-100 dark:bg-green-900/30 text-green-600",
      sparkline: [120, 140, 130, 160, 155, 170, 148],
      sparkColor: "#16A34A",
      href: "/admin/orders",
    },
    {
      title: "Active Users",
      value: (ov.totalUsers ?? 3240000).toLocaleString(),
      change: `+1,240 new today`,
      positive: true,
      icon: <Users className="w-5 h-5" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
      sparkline: [3100, 3150, 3180, 3200, 3220, 3235, 3240],
      sparkColor: "#2563EB",
      href: "/admin/users",
    },
    {
      title: "Active Sellers",
      value: (ov.totalSellers ?? 85492).toLocaleString(),
      change: `${ov.pendingOrders ?? 12} pending approval`,
      positive: false,
      icon: <Store className="w-5 h-5" />,
      iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
      sparkline: [84, 85, 84, 85, 85, 85, 85],
      sparkColor: "#D97706",
      href: "/admin/sellers",
    },
  ];

  const orderByStatus: Record<string, string> = {
    DELIVERED: "text-green-600 bg-green-100",
    SHIPPED: "text-blue-600 bg-blue-100",
    OUT_FOR_DELIVERY: "text-orange-600 bg-orange-100",
    PENDING: "text-yellow-700 bg-yellow-100",
    CANCELLED: "text-red-600 bg-red-100",
    RETURNED: "text-gray-600 bg-gray-100",
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("en-NP", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live badge */}
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
            Live
          </div>
          {/* Period picker */}
          <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {["7", "30", "90"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  period === p
                    ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                )}
              >
                {p}D
              </button>
            ))}
          </div>
          <button
            onClick={() => load(true)}
            aria-label="Refresh"
            className={cn(
              "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors",
              refreshing && "animate-spin",
            )}
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
              />
            ))
          : kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue bar chart */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Revenue Overview
              </h2>
              <p className="text-sm text-gray-400">
                Daily revenue in NPR · {period} day view
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  {formatPrice(ov.totalRevenue ?? 84200000)}
                </p>
                <div className="flex items-center gap-1 text-xs text-green-600 font-semibold justify-end">
                  <TrendingUp className="w-3 h-3" /> +24.1%
                </div>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="h-52 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <>
              <BarChart
                data={(revValues.length
                  ? revValues
                  : [840, 960, 1100, 890, 1350, 1200, 1480]
                ).map((v: number, i: number) => ({
                  value: v,
                  label: days[i] ?? `D${i + 1}`,
                }))}
              />
              {/* X labels */}
              <div className="flex gap-1.5 mt-2 pl-8">
                {(days.length
                  ? days
                  : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                ).map((d: string, i: number) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-xs text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Donut + legend */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            Revenue by Category
          </h2>
          <div className="flex items-center justify-center mb-5">
            <DonutChart segments={donutSegs} />
          </div>
          <div className="space-y-2.5">
            {donutSegs.map((seg: any) => {
              const total =
                donutSegs.reduce((s: number, x: any) => s + x.value, 0) || 1;
              const pct = Math.round((seg.value / total) * 100);
              return (
                <div key={seg.label} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: seg.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                    {seg.label}
                  </span>
                  <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: seg.color }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-8 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Order status breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">
              Orders by Status
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {(
              analytics?.ordersByStatus ?? [
                { status: "DELIVERED", count: 8420 },
                { status: "SHIPPED", count: 2341 },
                { status: "OUT_FOR_DELIVERY", count: 1205 },
                { status: "PENDING", count: 987 },
                { status: "CANCELLED", count: 342 },
                { status: "RETURNED", count: 156 },
              ]
            ).map((item: any) => {
              const total =
                (
                  analytics?.ordersByStatus ?? [{ status: "_", count: 13451 }]
                ).reduce(
                  (s: number, x: any) => s + (x._count?.status ?? x.count),
                  0,
                ) || 13451;
              const count = item._count?.status ?? item.count;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                DELIVERED: "bg-green-500",
                SHIPPED: "bg-blue-500",
                OUT_FOR_DELIVERY: "bg-orange-500",
                PENDING: "bg-yellow-500",
                CONFIRMED: "bg-blue-500",
                CANCELLED: "bg-red-500",
                RETURNED: "bg-gray-400",
              };
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          orderByStatus[item.status] ??
                            "bg-gray-100 text-gray-600",
                        )}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {count?.toLocaleString()}
                      <span className="text-xs text-gray-400 font-normal ml-1">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        colors[item.status] ?? "bg-gray-400",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top sellers */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">
              Top Sellers
            </h2>
            <Link
              href="/admin/sellers"
              className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {(
              analytics?.topSellers ?? [
                {
                  storeName: "TechStore Nepal",
                  totalRevenue: 2400000,
                  totalSales: 1847,
                  averageRating: 4.9,
                  isVerified: true,
                },
                {
                  storeName: "FashionHub KTM",
                  totalRevenue: 1800000,
                  totalSales: 3241,
                  averageRating: 4.7,
                  isVerified: true,
                },
                {
                  storeName: "Organic Grocery",
                  totalRevenue: 1200000,
                  totalSales: 5820,
                  averageRating: 4.8,
                  isVerified: false,
                },
                {
                  storeName: "SportsZone Nepal",
                  totalRevenue: 890000,
                  totalSales: 1203,
                  averageRating: 4.6,
                  isVerified: true,
                },
                {
                  storeName: "BookHouse KTM",
                  totalRevenue: 650000,
                  totalSales: 2891,
                  averageRating: 4.9,
                  isVerified: false,
                },
              ]
            )
              .slice(0, 5)
              .map((s: any, i: number) => (
                <div key={s.storeName} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                      i === 0
                        ? "bg-amber-400 text-white"
                        : i === 1
                          ? "bg-gray-300 text-gray-700"
                          : i === 2
                            ? "bg-amber-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                    {s.storeName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {s.storeName}
                      </p>
                      {s.isVerified && (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {s.totalSales?.toLocaleString()} sales · ⭐{" "}
                      {(s.averageRating ?? 0).toFixed(1)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-blue-600 shrink-0">
                    {formatPrice(Number(s.totalRevenue))}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">
              Top Products
            </h2>
            <Link
              href="/admin/products"
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {(
              analytics?.topProducts ?? [
                {
                  name: "iPhone 16 Pro Max",
                  totalSales: 1847,
                  basePrice: 195000,
                },
                { name: "Sony WH-1000XM6", totalSales: 923, basePrice: 38500 },
                { name: "MacBook Pro M4", totalSales: 641, basePrice: 285000 },
                { name: "PS5 Slim Bundle", totalSales: 512, basePrice: 75000 },
                {
                  name: "Apple Watch Ultra 3",
                  totalSales: 389,
                  basePrice: 125000,
                },
              ]
            )
              .slice(0, 5)
              .map((p: any, i: number) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-lg">
                    {["📱", "🎧", "💻", "🎮", "⌚"][i] ?? "🛍️"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.totalSales?.toLocaleString()} sold
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 shrink-0">
                    {formatPrice(Number(p.basePrice))}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Pending approvals */}
        <PendingApprovalsCard />

        {/* Recent support tickets */}
        <RecentTicketsCard />
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Approve Sellers",
              icon: "✅",
              href: "/admin/sellers?status=PENDING",
              color:
                "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-700",
            },
            {
              label: "Moderate Products",
              icon: "🛍️",
              href: "/admin/products?status=PENDING_REVIEW",
              color:
                "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-700",
            },
            {
              label: "Handle Refunds",
              icon: "↩️",
              href: "/admin/returns",
              color:
                "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 text-orange-700",
            },
            {
              label: "Create Coupon",
              icon: "🏷️",
              href: "/admin/coupons/new",
              color:
                "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-700",
            },
            {
              label: "Add Banner",
              icon: "🖼️",
              href: "/admin/banners/new",
              color:
                "bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 text-pink-700",
            },
            {
              label: "View Reports",
              icon: "📊",
              href: "/admin/reports",
              color:
                "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 text-amber-700",
            },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl font-semibold text-sm transition-colors text-center",
                a.color,
              )}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pending approvals widget ─────────────────────────────────────────────

function PendingApprovalsCard() {
  const [items, setItems] = useState<any[]>([]);
  const [approved, setApproved] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/sellers?status=PENDING&limit=4")
      .then((r) => r.json())
      .then((d) => setItems(d.sellers ?? []));
  }, []);

  const mock = [
    {
      id: "1",
      storeName: "TechWorld Store",
      user: { name: "Ram B." },
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: "2",
      storeName: "FashionHub KTM",
      user: { name: "Sita K." },
      createdAt: new Date(Date.now() - 14400000),
    },
    {
      id: "3",
      storeName: "Organic Grocery",
      user: { name: "Hari P." },
      createdAt: new Date(Date.now() - 21600000),
    },
    {
      id: "4",
      storeName: "BookHouse Nepal",
      user: { name: "Devi T." },
      createdAt: new Date(Date.now() - 28800000),
    },
  ];

  const data = items.length ? items : mock;

  const approve = async (id: string) => {
    await fetch(`/api/admin/sellers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    setApproved((prev) => new Set([...prev, id]));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white">
          Pending Approvals
        </h2>
        <Link
          href="/admin/sellers?status=PENDING"
          className="text-xs text-blue-600 font-semibold hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {data.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
              {s.storeName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {s.storeName}
              </p>
              <p className="text-xs text-gray-400">
                {s.user?.name} · {timeAgo(s.createdAt)}
              </p>
            </div>
            {approved.has(s.id) ? (
              <span className="text-xs text-green-600 font-semibold flex items-center gap-1 shrink-0">
                <CheckCircle className="w-3.5 h-3.5" />
                Done
              </span>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => approve(s.id)}
                  className="px-2.5 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 text-xs font-bold rounded-lg transition-colors"
                >
                  ✓
                </button>
                <button className="px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 text-xs font-bold rounded-lg transition-colors">
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent tickets widget ────────────────────────────────────────────────

function RecentTicketsCard() {
  const tickets = [
    {
      id: "SK-8821",
      subject: "Order not received",
      priority: "HIGH",
      user: "Priya M.",
      time: "2h ago",
    },
    {
      id: "SK-8820",
      subject: "Refund still pending",
      priority: "HIGH",
      user: "Raj K.",
      time: "4h ago",
    },
    {
      id: "SK-8819",
      subject: "Wrong item delivered",
      priority: "MEDIUM",
      user: "Sita T.",
      time: "6h ago",
    },
    {
      id: "SK-8818",
      subject: "Login issues on app",
      priority: "LOW",
      user: "Dev S.",
      time: "1d ago",
    },
  ];
  const pc: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
    LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800",
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white">
          Open Tickets
        </h2>
        <Link
          href="/admin/support"
          className="text-xs text-blue-600 font-semibold hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {tickets.map((t) => (
          <Link
            key={t.id}
            href={`/admin/support/${t.id}`}
            className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1.5 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 text-gray-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                {t.subject}
              </p>
              <p className="text-xs text-gray-400">
                #{t.id} · {t.user} · {t.time}
              </p>
            </div>
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                pc[t.priority],
              )}
            >
              {t.priority}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
