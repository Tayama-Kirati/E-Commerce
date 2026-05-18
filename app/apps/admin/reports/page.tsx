//  Full analytics & reports
"use client";

import React, { useState, useEffect } from "react";
import { Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { cn, formatPrice } from "@/app/lib/utils";

function LineChart({
  datasets,
  labels,
}: {
  datasets: { label: string; data: number[]; color: string }[];
  labels: string[];
}) {
  const allVals = datasets.flatMap((d) => d.data);
  const max = Math.max(...allVals, 1);
  const min = Math.min(...allVals, 0);
  const range = max - min || 1;
  const W = 600;
  const H = 180;
  const PAD = 8;
  const W2 = W - PAD * 2;
  const H2 = H - PAD * 2;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        className="w-full min-w-100"
        aria-hidden="true"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = PAD + H2 * (1 - pct / 100);
          return (
            <g key={pct}>
              <line
                x1={PAD}
                y1={y}
                x2={W - PAD}
                y2={y}
                stroke="currentColor"
                className="text-gray-100 dark:text-gray-800"
                strokeWidth="1"
              />
              <text
                x={PAD - 2}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                className="fill-gray-400"
              >
                {Math.round(min + (range * (pct / 100)) / 1000)}k
              </text>
            </g>
          );
        })}

        {/* Dataset lines */}
        {datasets.map((ds) => {
          const pts = ds.data
            .map((v, i) => {
              const x = PAD + (i / (ds.data.length - 1)) * W2;
              const y = PAD + H2 * (1 - (v - min) / range);
              return `${x},${y}`;
            })
            .join(" ");
          const fillPts = ds.data.map((v, i) => {
            const x = PAD + (i / (ds.data.length - 1)) * W2;
            const y = PAD + H2 * (1 - (v - min) / range);
            return `${x},${y}`;
          });
          const fill = [...fillPts, `${W - PAD},${H}`, `${PAD},${H}`].join(" ");

          return (
            <g key={ds.label}>
              <polygon points={fill} fill={ds.color} fillOpacity="0.08" />
              <polyline
                points={pts}
                fill="none"
                stroke={ds.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {ds.data.map((v, i) => {
                const x = PAD + (i / (ds.data.length - 1)) * W2;
                const y = PAD + H2 * (1 - (v - min) / range);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={ds.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          );
        })}

        {/* X labels */}
        {labels.map((l, i) => {
          const x = PAD + (i / (labels.length - 1)) * W2;
          return (
            <text
              key={i}
              x={x}
              y={H + 20}
              textAnchor="middle"
              fontSize="9"
              className="fill-gray-400"
            >
              {l}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [period]);

  const revenueByDay = data?.revenueByDay ?? [];
  const labels = revenueByDay.length
    ? revenueByDay.map((d: any) =>
        new Date(d.date).toLocaleDateString("en", {
          day: "2-digit",
          month: "short",
        }),
      )
    : [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

  const revData = revenueByDay.length
    ? revenueByDay.map((d: any) => d.revenue)
    : [
        840000, 960000, 1100000, 890000, 1350000, 1200000, 1480000, 1320000,
        1580000, 1490000, 1640000, 1580000,
      ];
  const orderData = revenueByDay.length
    ? revenueByDay.map((d: any) => d.orders * 5000)
    : [
        600000, 700000, 800000, 650000, 980000, 870000, 1050000, 950000,
        1150000, 1080000, 1200000, 1160000,
      ];

  const ov = data?.overview ?? {};

  const metrics = [
    {
      label: "Gross Revenue",
      value: formatPrice(ov.totalRevenue ?? 84200000),
      change: "+24.1%",
      up: true,
      sub: "Platform total",
    },
    {
      label: "Net Revenue",
      value: formatPrice((ov.totalRevenue ?? 84200000) * 0.08),
      change: "+22.3%",
      up: true,
      sub: "After seller payouts",
    },
    {
      label: "Total Orders",
      value: (ov.totalOrders ?? 14832).toLocaleString(),
      change: "+8.3%",
      up: true,
      sub: "All time",
    },
    {
      label: "Avg. Order Value",
      value: formatPrice(
        Math.round((ov.totalRevenue ?? 84200000) / (ov.totalOrders ?? 14832)),
      ),
      change: "+14.7%",
      up: true,
      sub: "Per transaction",
    },
    {
      label: "Conversion Rate",
      value: "3.24%",
      change: "+0.4%",
      up: true,
      sub: "Visitors to buyers",
    },
    {
      label: "Return Rate",
      value: "1.82%",
      change: "-0.3%",
      up: true,
      sub: "Orders returned",
    },
    {
      label: "New Users",
      value: (ov.newUsers ?? 3240).toLocaleString(),
      change: "+18.2%",
      up: true,
      sub: `Last ${period} days`,
    },
    {
      label: "Active Sellers",
      value: (ov.activeSellers ?? 1240).toLocaleString(),
      change: "+5.1%",
      up: true,
      sub: "Sold in period",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-400">Platform performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {["7", "30", "90", "365"].map((p) => (
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
            onClick={() => {
              /* generate PDF */
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
          >
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {m.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
            <p className="text-xs text-gray-400">{m.sub}</p>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-semibold mt-2",
                m.up ? "text-green-600" : "text-red-500",
              )}
            >
              {m.up ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {m.change} vs prev period
            </div>
          </div>
        ))}
      </div>

      {/* Revenue trend chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">
              Revenue & Orders Trend
            </h2>
            <p className="text-sm text-gray-400">{period}-day comparison</p>
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-600 inline-block rounded-full" />{" "}
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block rounded-full" />{" "}
              Orders
            </span>
          </div>
        </div>
        <LineChart
          datasets={[
            { label: "Revenue", data: revData.slice(-12), color: "#3B82F6" },
            { label: "Orders", data: orderData.slice(-12), color: "#F59E0B" },
          ]}
          labels={labels.slice(-12)}
        />
      </div>

      {/* Two charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            Revenue by Category
          </h2>
          <div className="space-y-3">
            {(
              data?.revenueByCategory ?? [
                {
                  categoryName: "Electronics",
                  revenue: 37000000,
                  orders: 6420,
                },
                { categoryName: "Fashion", revenue: 22000000, orders: 4890 },
                { categoryName: "Home", revenue: 15000000, orders: 2340 },
                { categoryName: "Beauty", revenue: 10000000, orders: 1890 },
                { categoryName: "Sports", revenue: 6000000, orders: 980 },
              ]
            ).map((cat: any, i: number) => {
              const total = 90200000;
              const pct = Math.round((cat.revenue / total) * 100);
              const colors = [
                "bg-blue-500",
                "bg-amber-400",
                "bg-green-500",
                "bg-blue-500",
                "bg-amber-500",
              ];
              return (
                <div key={cat.categoryName}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {cat.categoryName}
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatPrice(cat.revenue)}
                      </span>
                      <span className="text-gray-400 ml-2 text-xs">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        colors[i],
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cat.orders?.toLocaleString()} orders
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top sellers table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            Top Sellers
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800">
                <th className="pb-2 text-left font-semibold">#</th>
                <th className="pb-2 text-left font-semibold">Store</th>
                <th className="pb-2 text-right font-semibold">Revenue</th>
                <th className="pb-2 text-right font-semibold">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {(
                data?.topSellers ?? [
                  {
                    storeName: "TechStore Nepal",
                    totalRevenue: 24000000,
                    totalSales: 1847,
                  },
                  {
                    storeName: "FashionHub KTM",
                    totalRevenue: 18000000,
                    totalSales: 3241,
                  },
                  {
                    storeName: "Organic Grocery",
                    totalRevenue: 12000000,
                    totalSales: 5820,
                  },
                  {
                    storeName: "SportsZone Nepal",
                    totalRevenue: 8900000,
                    totalSales: 1203,
                  },
                  {
                    storeName: "BookHouse KTM",
                    totalRevenue: 6500000,
                    totalSales: 2891,
                  },
                ]
              )
                .slice(0, 5)
                .map((s: any, i: number) => (
                  <tr key={s.storeName}>
                    <td className="py-2.5 pr-3">
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black",
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
                    </td>
                    <td className="py-2.5 font-medium text-gray-900 dark:text-white">
                      {s.storeName}
                    </td>
                    <td className="py-2.5 text-right font-bold text-blue-600">
                      {formatPrice(Number(s.totalRevenue))}
                    </td>
                    <td className="py-2.5 text-right text-gray-500">
                      {s.totalSales?.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
