"use client";
import { useState } from "react";
import { cn, useUIStore, useAuthStore } from "@/app/lib/store";

export function SellerDashPage() {
  const { nav, showToast } = useUIStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState("overview");
  if (!user) { nav("login"); return null; }
  const TABS = [{id:"overview",l:"Overview",i:"📊"},{id:"products",l:"Products",i:"🛍️"},{id:"orders",l:"Orders",i:"📦"},{id:"analytics",l:"Analytics",i:"📈"},{id:"payouts",l:"Payouts",i:"💰"}];
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">Seller Dashboard</h1><p className="text-sm text-gray-400">Manage your NexMart store</p></div>
        <button onClick={() => nav("home")} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">🌐 View Store</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2 h-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors mb-0.5", tab===t.id?"bg-violet-50 dark:bg-violet-900/20 text-violet-600":"text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>{t.i} {t.l}</button>
          ))}
        </nav>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[{l:"Revenue (30d)",v:"रू 2,40,000",c:"text-violet-600",i:"💰"},{l:"Orders",v:"1,847",c:"text-green-600",i:"📦"},{l:"Products",v:"142",c:"text-blue-600",i:"🛍️"},{l:"Rating",v:"4.9 ★",c:"text-amber-600",i:"⭐"}].map(s => (
                  <div key={s.l} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center"><div className="text-2xl mb-2">{s.i}</div><p className={cn("text-xl font-black",s.c)}>{s.v}</p><p className="text-xs text-gray-400 mt-0.5">{s.l}</p></div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[{l:"Add Product",i:"➕",c:"bg-violet-600 hover:bg-violet-700 text-white"},{l:"View Orders",i:"📦",c:"bg-orange-500 hover:bg-orange-600 text-white"},{l:"Withdraw",i:"💸",c:"bg-green-600 hover:bg-green-700 text-white"},{l:"Analytics",i:"📊",c:"bg-blue-600 hover:bg-blue-700 text-white"}].map(a => (
                  <button key={a.l} onClick={() => showToast(`${a.l} — available in full app`)} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl font-semibold text-sm transition-all hover:scale-105 active:scale-100",a.c)}><span className="text-2xl">{a.i}</span>{a.l}</button>
                ))}
              </div>
            </div>
          )}
          {tab !== "overview" && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="font-black text-gray-900 dark:text-white text-xl mb-2">{TABS.find(t => t.id === tab)?.l}</h3>
              <p className="text-gray-400 mb-6">This section uses the full seller dashboard from <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">nexmart-seller/page-seller-dashboard.tsx</code></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
