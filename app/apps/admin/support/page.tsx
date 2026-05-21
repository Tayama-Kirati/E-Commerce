"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
 MessageSquare,
 Search,
 Eye,
 Send,
 X,
 ChevronDown,
 AlertCircle,
 Clock,
 CheckCircle,
 Tag as TagIcon,
 Filter,
 RefreshCcw,
 ChevronLeft,
 ChevronRight,
} from "lucide-react";
import { cn, timeAgo } from "@/app/lib/utils";
import { useDebounce } from "@/app/hooks/useDebounce";
import { toast } from "react-hot-toast";

const PRIORITY_COLORS: Record<string, string> = {
 URGENT: "bg-red-200 text-red-800 dark:bg-red-900/40",
 HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30",
 MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
 LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800",
};
const STATUS_COLORS: Record<string, string> = {
 OPEN: "bg-red-100 text-red-700 dark:bg-red-900/30",
 IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
 RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30",
 CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800",
};

export default function AdminSupportPage() {
 const [tickets, setTickets] = useState<any[]>([]);
 const [total, setTotal] = useState(0);
 const [loading, setLoading] = useState(true);
 const [status, setStatus] = useState("OPEN");
 const [priority, setPriority] = useState("");
 const [search, setSearch] = useState("");
 const [page, setPage] = useState(1);
 const [active, setActive] = useState<any>(null);
 const [reply, setReply] = useState("");
 const [sending, setSending] = useState(false);
 const dSearch = useDebounce(search, 400);
 const LIMIT = 20;

 const mock = [
 {
 id: "SK-8821",
 subject: "Order not received",
 user: { name: "Priya M.", email: "priya@gmail.com" },
 priority: "HIGH",
 status: "OPEN",
 category: "ORDER",
 createdAt: new Date(Date.now() - 7200000),
 replies: [],
 },
 {
 id: "SK-8820",
 subject: "Refund still pending",
 user: { name: "Raj K.", email: "raj@email.com" },
 priority: "HIGH",
 status: "OPEN",
 category: "PAYMENT",
 createdAt: new Date(Date.now() - 14400000),
 replies: [],
 },
 {
 id: "SK-8819",
 subject: "Wrong item delivered",
 user: { name: "Sita T.", email: "sita@mail.com" },
 priority: "MEDIUM",
 status: "IN_PROGRESS",
 category: "ORDER",
 createdAt: new Date(Date.now() - 21600000),
 replies: [{ body: "We are looking into this.", isStaff: true }],
 },
 {
 id: "SK-8818",
 subject: "Cannot log in to app",
 user: { name: "Dev S.", email: "dev@email.com" },
 priority: "LOW",
 status: "OPEN",
 category: "ACCOUNT",
 createdAt: new Date(Date.now() - 86400000),
 replies: [],
 },
 {
 id: "SK-8817",
 subject: "Product arrived damaged",
 user: { name: "Mina P.", email: "mina@mail.com" },
 priority: "URGENT",
 status: "OPEN",
 category: "PRODUCT",
 createdAt: new Date(Date.now() - 3600000),
 replies: [],
 },
 ];

 const load = useCallback(async () => {
 setLoading(true);
 try {
 const p = new URLSearchParams({
 page: String(page),
 limit: String(LIMIT),
 });
 if (status !== "ALL") p.set("status", status);
 if (priority) p.set("priority", priority);
 if (dSearch) p.set("search", dSearch);
 const res = await fetch(`/api/admin/support?${p}`);
 const data = await res.json();
 setTickets(data.tickets ?? []);
 setTotal(data.total ?? 0);
 } catch {
 setTickets(mock);
 } finally {
 setLoading(false);
 }
 }, [page, status, priority, dSearch]);

 useEffect(() => {
 load();
 }, [load]);

 const sendReply = async () => {
 if (!reply.trim() || !active) return;
 setSending(true);
 const res = await fetch(`/api/admin/support/${active.id}/reply`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ body: reply, status: "IN_PROGRESS" }),
 });
 setSending(false);
 if (res.ok) {
 toast.success("Reply sent!");
 setActive((prev: any) => ({
 ...prev,
 replies: [
 ...(prev.replies ?? []),
 { body: reply, isStaff: true, createdAt: new Date() },
 ],
 status: "IN_PROGRESS",
 }));
 setReply("");
 } else toast.error("Reply failed");
 };

 const closeTicket = async (id: string) => {
 await fetch(`/api/admin/support/${id}/reply`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 body: "This ticket has been resolved.",
 status: "RESOLVED",
 }),
 });
 toast.success("Ticket resolved");
 load();
 if (active?.id === id) setActive(null);
 };

 const items = tickets.length
 ? tickets
 : mock.filter((t) => status === "ALL" || t.status === status);

 return (
 <div className="space-y-5">
 <div className="flex items-center justify-between flex-wrap gap-3">
 <div>
 <h1 className="text-xl font-black text-gray-900 dark:text-white">
 Support Tickets
 </h1>
 <p className="text-sm text-gray-400">
 {total || items.length} tickets
 </p>
 </div>
 </div>

 {/* Status tabs */}
 <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
 {[
 { v: "OPEN", l: "Open" },
 { v: "IN_PROGRESS", l: "In Progress" },
 { v: "RESOLVED", l: "Resolved" },
 { v: "CLOSED", l: "Closed" },
 { v: "ALL", l: "All" },
 ].map((s) => (
 <button
 key={s.v}
 onClick={() => {
 setStatus(s.v);
 setPage(1);
 }}
 className={cn(
 "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
 status === s.v
 ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
 : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
 )}
 >
 {s.l}
 </button>
 ))}
 <select
 value={priority}
 onChange={(e) => setPriority(e.target.value)}
 className="ml-auto px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 outline-none"
 >
 <option value="">All Priority</option>
 <option value="URGENT">Urgent</option>
 <option value="HIGH">High</option>
 <option value="MEDIUM">Medium</option>
 <option value="LOW">Low</option>
 </select>
 </div>

 {/* Two-column layout */}
 <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
 {/* Ticket list */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
 <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
 <div className="flex items-center gap-2">
 <Search className="w-4 h-4 text-gray-400" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search tickets..."
 className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
 />
 </div>
 </div>
 <div className="divide-y divide-gray-50 dark:divide-gray-800">
 {loading
 ? [...Array(4)].map((_, i) => (
 <div key={i} className="p-4">
 <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
 </div>
 ))
 : items.map((t) => (
 <button
 key={t.id}
 onClick={() => setActive(t)}
 className={cn(
 "flex items-start gap-3 w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
 active?.id === t.id &&
 "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500",
 )}
 >
 <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
 <AlertCircle className="w-4 h-4 text-gray-400" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start gap-2 mb-1">
 <p className="text-sm font-semibold text-gray-900 dark:text-white flex-1 truncate">
 {t.subject}
 </p>
 <span
 className={cn(
 "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
 PRIORITY_COLORS[t.priority],
 )}
 >
 {t.priority}
 </span>
 </div>
 <p className="text-xs text-gray-500 truncate">
 #{t.id} · {t.user?.name} · {t.category}
 </p>
 <div className="flex items-center gap-2 mt-1">
 <span
 className={cn(
 "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
 STATUS_COLORS[t.status],
 )}
 >
 {t.status.replace("_", " ")}
 </span>
 <span className="text-xs text-gray-400">
 {timeAgo(t.createdAt)}
 </span>
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>

 {/* Ticket detail */}
 {active ? (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
 <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
 <div>
 <p className="font-bold text-gray-900 dark:text-white text-sm">
 {active.subject}
 </p>
 <p className="text-xs text-gray-400">
 #{active.id} · {active.user?.name}
 </p>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => closeTicket(active.id)}
 className="px-2.5 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 text-green-700 text-xs font-bold rounded-lg transition-colors"
 >
 ✓ Resolve
 </button>
 <button onClick={() => setActive(null)} aria-label="Close">
 <X className="w-4 h-4 text-gray-400" />
 </button>
 </div>
 </div>

 {/* Customer info */}
 <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
 {active.user?.name[0]}
 </div>
 <div>
 <p className="text-sm font-semibold text-gray-900 dark:text-white">
 {active.user?.name}
 </p>
 <p className="text-xs text-gray-400">{active.user?.email}</p>
 </div>
 <div className="ml-auto flex gap-1">
 <span
 className={cn(
 "text-xs font-bold px-2 py-0.5 rounded-full",
 PRIORITY_COLORS[active.priority],
 )}
 >
 {active.priority}
 </span>
 <span
 className={cn(
 "text-xs font-bold px-2 py-0.5 rounded-full",
 STATUS_COLORS[active.status],
 )}
 >
 {active.status.replace("_", " ")}
 </span>
 </div>
 </div>
 </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-3">
 {/* Original message */}
 <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
 <p className="text-xs font-bold text-gray-400 mb-1">Customer</p>
 <p className="text-sm text-gray-700 dark:text-gray-300">
 {active.body ??
 "Customer submitted this support request. Please investigate and respond."}
 </p>
 <p className="text-xs text-gray-400 mt-1">
 {timeAgo(active.createdAt)}
 </p>
 </div>

 {/* Reply thread */}
 {(active.replies ?? []).map((r: any, i: number) => (
 <div
 key={i}
 className={cn(
 "rounded-xl p-3",
 r.isStaff
 ? "bg-blue-50 dark:bg-blue-900/20 ml-4"
 : "bg-gray-50 dark:bg-gray-800 mr-4",
 )}
 >
 <p
 className={cn(
 "text-xs font-bold mb-1",
 r.isStaff ? "text-blue-600" : "text-gray-400",
 )}
 >
 {r.isStaff ? "Support Team" : "Customer"}
 </p>
 <p className="text-sm text-gray-700 dark:text-gray-300">
 {r.body}
 </p>
 <p className="text-xs text-gray-400 mt-1">
 {r.createdAt ? timeAgo(r.createdAt) : "Just now"}
 </p>
 </div>
 ))}
 </div>

 {/* Reply input */}
 <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
 <textarea
 value={reply}
 onChange={(e) => setReply(e.target.value)}
 rows={3}
 className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 resize-none mb-2"
 placeholder="Type your reply..."
 />
 <button
 onClick={sendReply}
 disabled={!reply.trim() || sending}
 className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
 >
 {sending ? (
 <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : (
 <Send className="w-4 h-4" />
 )}
 Send Reply
 </button>
 </div>
 </div>
 ) : (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-center py-16">
 <div className="text-center">
 <MessageSquare className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
 <p className="text-sm text-gray-400">
 Select a ticket to view details
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
