"use client";
import { cn, useUIStore, useAuthStore } from "@/app/lib/store";

export function AdminPage() {
  const { nav, showToast } = useUIStore();
  const { user } = useAuthStore();

  if (!user || !["ADMIN","SUPER_ADMIN"].includes(user.role)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Admin Access Required</h2>
        <p className="text-gray-400 mb-6">You need admin privileges to access this panel.</p>
        <button onClick={() => nav("home")} className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Go Home</button>
      </div>
    );
  }

  const QUICK = [{l:"Users",i:"👥"},{l:"Sellers",i:"🏪"},{l:"Products",i:"🛍️"},{l:"Orders",i:"📦"},{l:"Support",i:"💬"},{l:"Reports",i:"📊"}];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin Dashboard</h1><p className="text-sm text-gray-400">NexMart Admin Panel</p></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {[{l:"Total Revenue",v:"रू 8.4Cr",c:"text-violet-600"},{l:"Active Users",v:"32.4L",c:"text-blue-600"},{l:"Total Orders",v:"1.48L",c:"text-green-600"},{l:"Active Sellers",v:"85,492",c:"text-amber-600"}].map(s => (
          <div key={s.l} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 text-center"><p className={cn("text-2xl font-black",s.c)}>{s.v}</p><p className="text-sm text-gray-400 mt-1">{s.l}</p></div>
        ))}
      </div>
      <h2 className="font-black text-gray-900 dark:text-white mb-4">Quick Navigation</h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {QUICK.map(q => (
          <button key={q.l} onClick={() => showToast(`${q.l} page — from nexmart-admin/03-05`)} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all group">
            <span className="text-3xl group-hover:scale-110 transition-transform">{q.i}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{q.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
