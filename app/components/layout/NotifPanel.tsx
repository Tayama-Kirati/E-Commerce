"use client";

import React, { useEffect, useState } from "react";
import { X, Bell, CheckCheck } from "lucide-react";
import { useUIStore } from "@/frontend/web/store/uiStore";
import { cn, timeAgo } from "@/frontend/web/lib/utils";

const NOTIF_ICONS: Record<string, string> = {
  ORDER_PLACED: "📦",
  ORDER_SHIPPED: "🚚",
  ORDER_DELIVERED: "✅",
  ORDER_CANCELLED: "❌",
  PAYMENT_SUCCESS: "💳",
  FLASH_SALE: "⚡",
  PROMO_ALERT: "🎁",
  SYSTEM: "🔔",
  REVIEW_RECEIVED: "⭐",
};

export function NotifPanel() {
  const { notifPanelOpen, toggleNotifPanel } = useUIStore();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!notifPanelOpen) return;
    setLoading(true);
    fetch("/api/user/notifications?limit=15")
      .then((r) => r.json())
      .then((d) => {
        setNotifs(d.notifications ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [notifPanelOpen]);

  const markAllRead = async () => {
    await fetch("/api/user/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [] }),
    });
    setNotifs((n) => n.map((item) => ({ ...item, isRead: true })));
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/20",
          notifPanelOpen ? "" : "hidden",
        )}
        onClick={toggleNotifPanel}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-950 z-50 flex flex-col shadow-2xl transition-transform duration-300",
          notifPanelOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">
              Notifications
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllRead}
              aria-label="Mark all read"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={toggleNotifPanel}
              aria-label="Close"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
              <div className="text-5xl mb-3">🔔</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                All caught up!
              </h3>
              <p className="text-sm text-gray-400">No new notifications</p>
            </div>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer",
                  !n.isRead && "bg-blue-50/50 dark:bg-blue-900/10",
                )}
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-lg  shrink-0">
                  {NOTIF_ICONS[n.type] ?? "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full  shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
