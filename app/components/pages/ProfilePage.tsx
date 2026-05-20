"use client";
import { useState, useEffect } from "react";
import { cn, formatPrice, MOCK_PRODUCTS, useUIStore, useAuthStore, useWishlistStore, apiGet } from "@/app/lib/store";
import { ProductCard } from "./ProductCard";

export function ProfilePage() {
  const { nav, showToast } = useUIStore();
  const { user, setUser }  = useAuthStore();
  const { ids: wishIds }   = useWishlistStore();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) { nav("login"); return; }
    apiGet("/api/user/profile", null)
      .then(d => setProfile(d?.user ?? { ...user, loyaltyPoints:100, loyaltyTier:"BRONZE", _count:{orders:0,reviews:0,wishlistItems:wishIds.length} }))
      .catch(() => setProfile({ ...user, loyaltyPoints:100, loyaltyTier:"BRONZE", _count:{orders:0,reviews:0,wishlistItems:wishIds.length} }));
  }, [user]);

  if (!user || !profile) return <div className="text-center py-20"><div className="text-5xl mb-3">⏳</div></div>;

  const TIER_COLORS: Record<string, string> = { BRONZE:"from-amber-700 to-amber-500", SILVER:"from-slate-500 to-slate-400", GOLD:"from-amber-500 to-yellow-400", PLATINUM:"from-violet-600 to-violet-400" };
  const TIER_EMOJIS: Record<string, string> = { BRONZE:"🥉", SILVER:"🥈", GOLD:"🥇", PLATINUM:"💎" };
  const tier = profile.loyaltyTier ?? "BRONZE";

  const TABS = [
    {id:"profile",l:"Profile",i:"👤"},{id:"orders",l:"Orders",i:"📦"},
    {id:"wishlist",l:`Wishlist (${wishIds.length})`,i:"❤️"},{id:"rewards",l:"Rewards",i:"🏅"},{id:"security",l:"Security",i:"🔒"},
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className={`h-16 bg-linear-to-r ${TIER_COLORS[tier]}`} />
            <div className="px-5 pb-5 -mt-8">
              <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${TIER_COLORS[tier]} flex items-center justify-center text-white text-2xl font-black border-4 border-white dark:border-gray-900 mb-3 shadow-lg`}>{user.name?.[0]?.toUpperCase()}</div>
              <h2 className="font-black text-gray-900 dark:text-white">{user.name}</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
              <span className="inline-block mt-2 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">{TIER_EMOJIS[tier]} {tier} Member</span>
            </div>
            <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-800 divide-x divide-gray-100 dark:divide-gray-800">
              {[{l:"Orders",v:profile._count?.orders??0},{l:"Points",v:profile.loyaltyPoints??100},{l:"Saved",v:wishIds.length}].map(s => (
                <div key={s.l} className="py-3 text-center"><p className="font-black text-gray-900 dark:text-white">{s.v}</p><p className="text-[10px] text-gray-400 uppercase">{s.l}</p></div>
              ))}
            </div>
          </div>
          <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-3 w-full px-4 py-3 text-sm font-medium border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors", tab===t.id?"bg-violet-50 dark:bg-violet-900/20 text-violet-600":"text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>
                <span>{t.i}</span><span className="flex-1 text-left">{t.l}</span><span className="text-gray-300 text-xs">›</span>
              </button>
            ))}
            <button onClick={() => { setUser(null); nav("home"); showToast("Signed out"); }} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <span>🚪</span><span>Sign Out</span>
            </button>
          </nav>
        </aside>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          {tab === "profile" && (
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-lg mb-5">Personal Information</h2>
              <div className="space-y-1 max-w-md">
                {[{l:"Full Name",v:user.name},{l:"Email",v:user.email},{l:"Phone",v:"Not added"},{l:"Member Since",v:"May 2026"},{l:"Account Status",v:"✅ Active & Verified"}].map(f => (
                  <div key={f.l} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800">
                    <div><p className="text-xs text-gray-400">{f.l}</p><p className="font-semibold text-gray-900 dark:text-white mt-0.5">{f.v}</p></div>
                    <button onClick={() => showToast("Edit form available in full app")} className="text-xs text-violet-600 font-semibold hover:underline">Edit</button>
                  </div>
                ))}
              </div>
              <button onClick={() => showToast("Profile saved!")} className="mt-6 px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Save Changes</button>
            </div>
          )}
          {tab === "orders" && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="font-black text-gray-900 dark:text-white text-xl mb-2">View All Orders</h3>
              <p className="text-gray-400 mb-6">Track your orders, request returns, and download invoices.</p>
              <button onClick={() => nav("orders")} className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Go to Orders →</button>
            </div>
          )}
          {tab === "wishlist" && (
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-lg mb-5">Wishlist ({wishIds.length})</h2>
              {wishIds.length === 0 ? (
                <div className="text-center py-12"><div className="text-5xl mb-3">❤️</div><p className="text-gray-400">Your wishlist is empty</p><button onClick={() => nav("home")} className="mt-4 text-violet-600 font-semibold hover:underline">Browse Products</button></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{MOCK_PRODUCTS.filter(p => wishIds.includes(p.id)).map(p => <ProductCard key={p.id} product={p} />)}</div>
              )}
            </div>
          )}
          {tab === "rewards" && (
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-lg mb-5">Loyalty Rewards</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[{l:"Available Points",v:(profile.loyaltyPoints??100).toLocaleString(),c:"text-violet-600"},{l:"Points Worth",v:formatPrice((profile.loyaltyPoints??100)/10),c:"text-green-600"},{l:"Tier",v:`${TIER_EMOJIS[tier]} ${tier}`,c:"text-amber-700"}].map(s => (
                  <div key={s.l} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center"><p className={cn("text-xl font-black",s.c)}>{s.v}</p><p className="text-xs text-gray-400 mt-1">{s.l}</p></div>
                ))}
              </div>
              <div className="bg-linear-to-r from-violet-600 to-orange-500 rounded-2xl p-5 text-white">
                <h3 className="font-black text-lg mb-2">🎡 Daily Spin Wheel</h3>
                <p className="text-white/80 text-sm mb-4">Spin once per day to win up to 100 bonus points!</p>
                <button onClick={() => showToast("🎉 You won 25 bonus points! Come back tomorrow.")} className="bg-white text-violet-700 font-black px-6 py-2.5 rounded-xl hover:scale-105 transition-transform">Spin Now →</button>
              </div>
            </div>
          )}
          {tab === "security" && (
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-lg mb-5">Security Settings</h2>
              <div className="space-y-4 max-w-md">
                {[{l:"Change Password",s:"Last changed: Never",i:"🔑"},{l:"Two-Factor Auth",s:"Not enabled",i:"📱"},{l:"Active Sessions",s:"1 session active",i:"💻"}].map(s => (
                  <div key={s.l} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <div className="flex items-center gap-3"><span className="text-2xl">{s.i}</span><div><p className="font-semibold text-gray-900 dark:text-white text-sm">{s.l}</p><p className="text-xs text-gray-400">{s.s}</p></div></div>
                    <button onClick={() => showToast("Security settings available in full app")} className="text-xs text-violet-600 font-semibold hover:underline">Manage</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
