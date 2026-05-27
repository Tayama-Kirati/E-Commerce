"use client";
import { useState, useEffect } from "react";
import { timeAgo, cn, useUIStore, useAuthStore, apiGet } from "@/app/lib/store";

export function NotifPanel() {
 const { notifPanelOpen, toggleNotifPanel } = useUIStore();
 const { user } = useAuthStore();
 const { nav } = useUIStore();
 const [notifs, setNotifs] = useState<any[]>([]);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 if (!notifPanelOpen || !user) return;
 setLoading(true);
 apiGet("/api/user/notifications?limit=10", null)
 .then(d => { setNotifs(d?.notifications ?? []); setLoading(false); })
 .catch(() => setLoading(false));
 }, [notifPanelOpen, user]);

 const ICONS: Record<string, string> = { ORDER:"📦", PAYMENT:"💳", PROMO:"🎁", SYSTEM:"🔔", REVIEW:"⭐" };

 const markAllRead = () => {
  fetch("/api/user/notifications", { method: "PATCH" });
  setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
 };

 if (!notifPanelOpen) return null;

 return (
 <div className="fixed inset-0 z-50" onClick={toggleNotifPanel}>
 <aside className="absolute right-4 top-20 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
 <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
  <div className="flex items-center gap-2"><span>🔔</span><h2 className="font-bold text-sm text-gray-900 dark:text-white">Notifications</h2></div>
  <div className="flex items-center gap-3">
   {notifs.some(n => !n.isRead) && (
    <button onClick={markAllRead} className="text-xs text-violet-600 font-semibold hover:underline">Mark all read</button>
   )}
   <button onClick={toggleNotifPanel} className="text-gray-400 hover:text-gray-600">✕</button>
  </div>
 </div>
 <div className="max-h-80 overflow-y-auto">
 {loading ? (
 <div className="space-y-2 p-3">{[...Array(3)].map((_,i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
 ) : notifs.length === 0 ? (
 <div className="text-center py-10 text-gray-400">
 <div className="text-4xl mb-2">🔔</div>
 <p className="text-sm">{user ? "All caught up!" : "Sign in to see notifications"}</p>
 {!user && <button onClick={() => { toggleNotifPanel(); nav("login"); }} className="mt-3 text-xs text-violet-600 font-semibold hover:underline">Sign In</button>}
 </div>
 ) : (
 notifs.map(n => (
 <div key={n.id} className={cn("flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer", !n.isRead && "bg-violet-50/50 dark:bg-violet-900/10")}>
 <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-lg shrink-0">{ICONS[n.type] ?? "🔔"}</div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>
 <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
 <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
 </div>
 {!n.isRead && <div className="w-2 h-2 bg-violet-600 rounded-full shrink-0 mt-1.5" />}
 </div>
 ))
 )}
 </div>
 </aside>
 </div>
 );
}
