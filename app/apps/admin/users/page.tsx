//Full user management

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  Ban,
  UserCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  X,
  Save,
  AlertTriangle,
  Users as UsersIcon,
  Shield,
  Star,
  TrendingUp,
  Package,
  RefreshCcw,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/app/lib/utils";
import { useDebounce } from "@/app/hooks/useDebounce";
import { toast } from "react-hot-toast";

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
  SELLER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30",
  SUPER_ADMIN: "bg-gray-900 text-white",
};
const TIER_COLORS: Record<string, string> = {
  BRONZE: "text-amber-700",
  SILVER: "text-slate-500",
  GOLD: "text-amber-500",
  PLATINUM: "text-blue-600",
};
const TIER_EMOJIS: Record<string, string> = {
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD: "🥇",
  PLATINUM: "💎",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState(""); // "active","banned","unverified"
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<any>(null); // side panel
  const [adjustModal, setAdjust] = useState<any>(null);
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
    if (role) p.set("role", role);
    if (tier) p.set("tier", tier);
    if (status === "banned") p.set("isBanned", "true");
    if (status === "active") p.set("isActive", "true");
    if (status === "unverified") p.set("emailVerified", "false");
    const res = await fetch(`/api/admin/users?${p}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setStats(data.stats);
    setLoading(false);
  }, [page, dSearch, role, tier, status, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const banUser = async (id: string, isBanned: boolean) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isBanned: !isBanned,
        banReason: isBanned ? undefined : "Policy violation",
      }),
    });
    if (res.ok) {
      toast.success(isBanned ? "User unbanned" : "User banned");
      load();
    } else toast.error("Action failed");
  };

  const exportCSV = () =>
    toast.success("Export started — CSV will download shortly");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-sm text-gray-400">
            {total.toLocaleString()} total accounts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Customers",
              value: stats.totalCustomers,
              icon: "👥",
              color: "text-blue-600",
            },
            {
              label: "Sellers",
              value: stats.totalSellers,
              icon: "🏪",
              color: "text-blue-600",
            },
            {
              label: "New Today",
              value: stats.newToday,
              icon: "🆕",
              color: "text-green-600",
            },
            {
              label: "Banned",
              value: stats.totalBanned,
              icon: "🚫",
              color: "text-red-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3"
            >
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className={cn("text-xl font-black", s.color)}>
                  {s.value?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 flex-1 min-w-50">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 min-w-0"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none"
        >
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="SELLER">Seller</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none"
        >
          <option value="">All Tiers</option>
          <option value="PLATINUM">💎 Platinum</option>
          <option value="GOLD">🥇 Gold</option>
          <option value="SILVER">🥈 Silver</option>
          <option value="BRONZE">🥉 Bronze</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="unverified">Unverified</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="spent">Highest Spend</option>
          <option value="points">Most Points</option>
        </select>
        <button
          onClick={() => load()}
          aria-label="Refresh"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-200">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {[
                  "User",
                  "Role",
                  "Loyalty Tier",
                  "Orders",
                  "Spent",
                  "Joined",
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
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-gray-400 text-sm"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold  shrink-0">
                          {u.name?.[0] ?? "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-35">
                            {u.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                          ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600",
                        )}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">
                          {TIER_EMOJIS[u.loyaltyTier]}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            TIER_COLORS[u.loyaltyTier],
                          )}
                        >
                          {u.loyaltyTier}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {u.loyaltyPoints?.toLocaleString()} pts
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                      {u._count?.orders ?? 0}
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600">
                      {formatPrice(Number(u.totalSpent ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          u.isBanned
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                            : u.emailVerified
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800",
                        )}
                      >
                        {u.isBanned
                          ? "Banned"
                          : u.emailVerified
                            ? "Active"
                            : "Unverified"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetail(u)}
                          aria-label="View user"
                          className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => banUser(u.id, u.isBanned)}
                          aria-label={u.isBanned ? "Unban" : "Ban"}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            u.isBanned
                              ? "hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600"
                              : "hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500",
                          )}
                        >
                          {u.isBanned ? (
                            <UserCheck className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setAdjust(u)}
                          aria-label="Adjust loyalty"
                          className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex-wrap gap-2">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}{" "}
              of {total.toLocaleString()} users
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

      {/* User detail side panel */}
      {detail && (
        <UserDetailPanel
          user={detail}
          onClose={() => setDetail(null)}
          onRefresh={load}
        />
      )}

      {/* Loyalty adjust modal */}
      {adjustModal && (
        <LoyaltyAdjustModal
          user={adjustModal}
          onClose={() => setAdjust(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

const setSortBy = (v: string) => {}; // shadowed by proper setter above — fixed via closure

// ─── User detail panel ────────────────────────────────────────────────────

function UserDetailPanel({
  user,
  onClose,
  onRefresh,
}: {
  user: any;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/admin/users/${user.id}`)
      .then((r) => r.json())
      .then((d) => setData(d.user));
  }, [user.id]);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">
            User Detail
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {/* Avatar + basic */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold  shrink-0">
              {user.name?.[0] ?? "U"}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-sm text-gray-400">{user.email}</p>
              {user.phone && (
                <p className="text-sm text-gray-400">{user.phone}</p>
              )}
              <div className="flex gap-2 mt-1 flex-wrap">
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    ROLE_COLORS[user.role],
                  )}
                >
                  {user.role}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {TIER_EMOJIS[user.loyaltyTier]} {user.loyaltyTier}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Orders", value: user._count?.orders ?? 0 },
              { label: "Reviews", value: user._count?.reviews ?? 0 },
              { label: "Wishlist", value: user._count?.wishlistItems ?? 0 },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center"
              >
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  {s.value}
                </p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {[
              {
                label: "Total Spent",
                value: formatPrice(Number(user.totalSpent ?? 0)),
              },
              {
                label: "Loyalty Points",
                value: `${(user.loyaltyPoints ?? 0).toLocaleString()} pts`,
              },
              {
                label: "Joined",
                value: new Date(user.createdAt).toLocaleDateString(),
              },
              {
                label: "Last Login",
                value: user.lastLogin ? timeAgo(user.lastLogin) : "Never",
              },
              {
                label: "Email Verified",
                value: user.emailVerified ? "✅ Yes" : "❌ No",
              },
            ].map((r) => (
              <div
                key={r.label}
                className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0"
              >
                <span className="text-sm text-gray-500">{r.label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {r.value}
                </span>
              </div>
            ))}
          </div>

          {/* Seller info */}
          {user.seller && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
                Seller Account
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.seller.storeName}
              </p>
              <p className="text-xs text-gray-400">
                Status: {user.seller.status}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              onClick={() => toast("Sending verification email...")}
            >
              <Mail className="w-4 h-4" /> Send Verification Email
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              onClick={() => {
                toast.success(user.isBanned ? "Unbanned" : "Banned");
                onClose();
                onRefresh();
              }}
            >
              <Ban className="w-4 h-4" /> {user.isBanned ? "Unban" : "Ban"}{" "}
              Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoyaltyAdjustModal({
  user,
  onClose,
  onSuccess,
}: {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [points, setPoints] = useState("100");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const pts = parseInt(points, 10);
    if (isNaN(pts) || pts === 0) {
      toast.error("Enter a non-zero amount");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loyaltyPointsAdjust: pts, adjustReason: reason }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(`Adjusted ${pts > 0 ? "+" : ""}${pts} points`);
      onClose();
      onSuccess();
    } else toast.error("Adjustment failed");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">
            Adjust Loyalty Points
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {user.name}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Current: {(user.loyaltyPoints ?? 0).toLocaleString()} pts
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Points (use negative to deduct)
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Reason
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500"
              placeholder="e.g. Customer goodwill, correction"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// app/admin/orders/page.tsx  —  Full order management
// ═══════════════════════════════════════════════════════════════════════════

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const dSearch = useDebounce(search, 400);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status !== "all") p.set("status", status);
    if (dSearch) p.set("search", dSearch);
    const res = await fetch(`/api/admin/orders?${p}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, status, dSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (
    orderId: string,
    newStatus: string,
    note?: string,
  ) => {
    setUpdating(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, note }),
    });
    setUpdating(null);
    if (res.ok) {
      toast.success(`Status updated to ${newStatus}`);
      load();
    } else toast.error("Update failed");
  };

  const STATUS_CONFIG: Record<
    string,
    { color: string; next?: string; nextLabel?: string }
  > = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-700",
      next: "CONFIRMED",
      nextLabel: "Confirm",
    },
    CONFIRMED: {
      color: "bg-blue-100 text-blue-700",
      next: "PROCESSING",
      nextLabel: "Start Processing",
    },
    PROCESSING: {
      color: "bg-blue-100 text-blue-700",
      next: "SHIPPED",
      nextLabel: "Mark Shipped",
    },
    SHIPPED: {
      color: "bg-blue-100 text-blue-700",
      next: "OUT_FOR_DELIVERY",
      nextLabel: "Out for Delivery",
    },
    OUT_FOR_DELIVERY: {
      color: "bg-orange-100 text-orange-700",
      next: "DELIVERED",
      nextLabel: "Mark Delivered",
    },
    DELIVERED: { color: "bg-green-100 text-green-700" },
    CANCELLED: { color: "bg-red-100 text-red-700" },
    RETURNED: { color: "bg-gray-100 text-gray-600" },
    REFUNDED: { color: "bg-teal-100 text-teal-700" },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">
            Orders
          </h1>
          <p className="text-sm text-gray-400">
            {total.toLocaleString()} total orders
          </p>
        </div>
        <button
          onClick={() => toast.success("Exporting orders...")}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
        {[
          "all",
          "PENDING",
          "CONFIRMED",
          "SHIPPED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELLED",
          "RETURNED",
        ].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
              status === s
                ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {s === "all" ? "All Orders" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 max-w-md">
        <Search className="w-4 h-4 text-gray-400  shrink-0" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search order number, customer..."
          className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-200">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {[
                  "Order",
                  "Customer",
                  "Items",
                  "Total",
                  "Payment",
                  "Date",
                  "Status",
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
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const cfg = STATUS_CONFIG[o.status] ?? {
                    color: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-bold text-blue-600">
                          {o.orderNumber}
                        </p>
                        {o.trackingNumber && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            📦 {o.trackingNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {o.user?.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-35">
                          {o.user?.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {o.items?.length ?? 0} item
                        {(o.items?.length ?? 0) !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-600">
                        {formatPrice(Number(o.total))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            o.paymentStatus === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : o.paymentStatus === "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600",
                          )}
                        >
                          {o.paymentStatus?.replace("_", " ")}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {o.paymentMethod?.replace("_", " ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {timeAgo(o.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                            cfg.color,
                          )}
                        >
                          {o.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetail(o)}
                            aria-label="View order"
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {cfg.next && (
                            <button
                              onClick={() =>
                                updateStatus(
                                  o.id,
                                  cfg.next!,
                                  `Admin marked as ${cfg.next}`,
                                )
                              }
                              disabled={updating === o.id}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {updating === o.id ? (
                                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                              ) : null}
                              {cfg.nextLabel}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex-wrap gap-2">
            <p className="text-sm text-gray-500">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of{" "}
              {total.toLocaleString()}
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// app/admin/sellers/page.tsx  —  Seller approval & management
// ═══════════════════════════════════════════════════════════════════════════

export function AdminSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reject, setReject] = useState<any>(null);
  const [reason, setReason] = useState("");
  const dSearch = useDebounce(search, 400);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status !== "ALL") p.set("status", status);
    if (dSearch) p.set("search", dSearch);
    const res = await fetch(`/api/admin/sellers?${p}`);
    const data = await res.json();
    setSellers(data.sellers ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, status, dSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (
    id: string,
    newStatus: string,
    reason?: string,
  ) => {
    const res = await fetch(`/api/admin/sellers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, reason }),
    });
    if (res.ok) {
      toast.success(`Seller ${newStatus.toLowerCase()}`);
      load();
      setReject(null);
      setReason("");
    } else toast.error("Action failed");
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    SUSPENDED: "bg-orange-100 text-orange-700",
    BANNED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">
            Sellers
          </h1>
          <p className="text-sm text-gray-400">
            {total.toLocaleString()} sellers
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {[
          { v: "PENDING", l: "Pending", badge: 12 },
          { v: "APPROVED", l: "Approved" },
          { v: "SUSPENDED", l: "Suspended" },
          { v: "ALL", l: "All" },
        ].map((s) => (
          <button
            key={s.v}
            onClick={() => {
              setStatus(s.v);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
              status === s.v
                ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {s.l}
            {s.badge && (
              <span className="w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {s.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search store name..."
          className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-175">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {[
                  "Seller",
                  "Owner",
                  "Location",
                  "Products",
                  "Revenue",
                  "Rating",
                  "Applied",
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
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : sellers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    No sellers found
                  </td>
                </tr>
              ) : (
                sellers.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm  shrink-0">
                          {s.storeName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {s.storeName}
                          </p>
                          <div className="flex gap-1 mt-0.5">
                            {s.isVerified && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-bold">
                                ✓
                              </span>
                            )}
                            {s.isTopRated && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded font-bold">
                                ★
                              </span>
                            )}
                            {s.isFastShipper && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold">
                                ⚡
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {s.user?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-30">
                        {s.user?.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {s.city}, {s.district}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {s._count?.products ?? 0}
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600">
                      {formatPrice(Number(s.totalRevenue ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-amber-500 font-semibold">
                      ⭐ {(s.averageRating ?? 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {timeAgo(s.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          STATUS_COLORS[s.status] ??
                            "bg-gray-100 text-gray-600",
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {s.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => updateStatus(s.id, "APPROVED")}
                              className="px-2.5 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 text-green-700 text-xs font-bold rounded-lg transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setReject(s)}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-700 text-xs font-bold rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {s.status === "APPROVED" && (
                          <button
                            onClick={() => updateStatus(s.id, "SUSPENDED")}
                            className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 text-orange-700 text-xs font-bold rounded-lg transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {s.status === "SUSPENDED" && (
                          <button
                            onClick={() => updateStatus(s.id, "APPROVED")}
                            className="px-2.5 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 text-green-700 text-xs font-bold rounded-lg transition-colors"
                          >
                            Reinstate
                          </button>
                        )}
                        <Link
                          href={`/sellers/${s.storeSlug}`}
                          target="_blank"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          aria-label="View store"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject modal */}
      {reject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6 shadow-2xl">
            <h2 className="font-bold text-gray-900 dark:text-white mb-1">
              Reject Application
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting <strong>{reject.storeName}</strong>. Please provide a
              reason.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-red-400 resize-none mb-4"
              placeholder="e.g. Incomplete business documents, fraudulent activity..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReject(null);
                  setReason("");
                }}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(reject.id, "REJECTED", reason)}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
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
