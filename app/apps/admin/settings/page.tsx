"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import cn from "clsx";

export default function AdminSettingsPage() {
 const [saving, setSaving] = useState(false);
 const [settings, setSettings] = useState({
 siteName: "PeaNut",
 siteTagline: "Nepal's AI-Powered Marketplace",
 supportEmail: "support@peanut.com",
 commissionRate: 8,
 minWithdrawal: 500,
 maxWithdrawal: 500000,
 payoutCycle: 15,
 freeShippingThreshold: 1000,
 maintenanceMode: false,
 newSellerAuto: false,
 loyaltyEnabled: true,
 affiliateEnabled: true,
 flashSaleEnabled: true,
 referralRewardPoints: 200,
 returnWindowDays: 7,
 });

 useEffect(() => {
 fetch("/api/admin/settings")
 .then((r) => (r.ok ? r.json() : null))
 .then((d) => d?.settings && setSettings((prev) => ({ ...prev, ...d.settings })))
 .catch(() => toast.error("Could not load settings"));
 }, []);

 const save = async () => {
 setSaving(true);
 const res = await fetch("/api/admin/settings", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(settings),
 });
 const data = await res.json().catch(() => ({}));
 setSaving(false);
 if (res.ok) {
 setSettings((prev) => ({ ...prev, ...data.settings }));
 toast.success("Settings saved successfully!");
 } else {
 toast.error(data.details?.[0]?.message ?? data.error ?? "Could not save settings");
 }
 };

 const toggle = (key: keyof typeof settings) =>
 setSettings((prev) => ({
 ...prev,
 [key]: !prev[key as keyof typeof settings],
 }));

 return (
 <div className="space-y-6 max-w-3xl">
 <div>
 <h1 className="text-xl font-black text-gray-900 dark:text-white">
 Platform Settings
 </h1>
 <p className="text-sm text-gray-400">
 Configure global platform behavior
 </p>
 </div>

 {[
 {
 title: "General",
 fields: [
 { label: "Site Name", key: "siteName", type: "text" },
 { label: "Tagline", key: "siteTagline", type: "text" },
 { label: "Support Email", key: "supportEmail", type: "email" },
 ],
 },
 {
 title: "Commerce",
 fields: [
 {
 label: "Platform Commission (%)",
 key: "commissionRate",
 type: "number",
 },
 {
 label: "Free Shipping Threshold (NPR)",
 key: "freeShippingThreshold",
 type: "number",
 },
 {
 label: "Min Withdrawal (NPR)",
 key: "minWithdrawal",
 type: "number",
 },
 {
 label: "Max Withdrawal (NPR)",
 key: "maxWithdrawal",
 type: "number",
 },
 {
 label: "Payout Cycle (days)",
 key: "payoutCycle",
 type: "number",
 },
 {
 label: "Return Window (days)",
 key: "returnWindowDays",
 type: "number",
 },
 {
 label: "Referral Reward (points)",
 key: "referralRewardPoints",
 type: "number",
 },
 ],
 },
 ].map((section) => (
 <div
 key={section.title}
 className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
 >
 <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
 {section.title}
 </h2>
 <div className="space-y-4">
 {section.fields.map((f) => (
 <div
 key={f.key}
 className="grid grid-cols-[160px_1fr] gap-4 items-center"
 >
 <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
 {f.label}
 </label>
 <input
 type={f.type}
 value={
 settings[f.key as keyof typeof settings] as string | number
 }
 onChange={(e) =>
 setSettings((prev) => ({
 ...prev,
 [f.key]:
 f.type === "number"
 ? Number(e.target.value)
 : e.target.value,
 }))
 }
 className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 max-w-xs"
 />
 </div>
 ))}
 </div>
 </div>
 ))}

 {/* Feature toggles */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
 Feature Toggles
 </h2>
 <div className="space-y-3">
 {[
 {
 key: "maintenanceMode",
 label: "Maintenance Mode",
 desc: "Take the site offline for maintenance",
 danger: true,
 },
 {
 key: "newSellerAuto",
 label: "Auto-Approve Sellers",
 desc: "Skip manual review for new sellers",
 },
 {
 key: "loyaltyEnabled",
 label: "Loyalty Program",
 desc: "Enable points & rewards system",
 },
 {
 key: "affiliateEnabled",
 label: "Affiliate System",
 desc: "Enable referral links and commissions",
 },
 {
 key: "flashSaleEnabled",
 label: "Flash Sales",
 desc: "Allow sellers to create flash sales",
 },
 ].map((f) => (
 <div key={f.key} className="flex items-center justify-between py-2">
 <div>
 <p
 className={cn(
 "text-sm font-semibold",
 f.danger ? "text-red-600" : "text-gray-900 dark:text-white",
 )}
 >
 {f.label}
 </p>
 <p className="text-xs text-gray-400">{f.desc}</p>
 </div>
 <button
 onClick={() => toggle(f.key as keyof typeof settings)}
 role="switch"
 aria-checked={
 settings[f.key as keyof typeof settings] as boolean
 }
 className={cn(
 "w-12 h-6 rounded-full transition-colors relative shrink-0",
 settings[f.key as keyof typeof settings]
 ? f.danger
 ? "bg-red-500"
 : "bg-blue-600"
 : "bg-gray-200 dark:bg-gray-700",
 )}
 >
 <div
 className={cn(
 "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
 settings[f.key as keyof typeof settings]
 ? "translate-x-6"
 : "translate-x-0.5",
 )}
 />
 </button>
 </div>
 ))}
 </div>
 </div>

 <button
 onClick={save}
 disabled={saving}
 className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
 >
 {saving ? (
 <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : null}
 {saving ? "Saving..." : "Save All Settings"}
 </button>

 <ShippingZonesManager />
 <BannersManager />
 </div>
 );
}

// ── Shipping zones ────────────────────────────────────────────────────────────

type Zone = { id: string; name: string; provinces: string[]; rate: number; freeAbove: number | null; estimatedDays: string; isActive: boolean };

const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];
const fieldCls = "px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500";

function ShippingZonesManager() {
 const [zones, setZones] = useState<Zone[]>([]);
 const [draft, setDraft] = useState({ name: "", provinces: [] as string[], rate: 150, freeAbove: "1000", estimatedDays: "2-4" });

 const load = () =>
 fetch("/api/admin/shipping-zones").then((r) => r.json()).then((d) => setZones(d.zones ?? []));
 useEffect(() => { load(); }, []);

 const add = async () => {
 if (!draft.name.trim()) return toast.error("Give the zone a name");
 const res = await fetch("/api/admin/shipping-zones", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...draft, freeAbove: draft.freeAbove === "" ? null : Number(draft.freeAbove) }),
 });
 if (res.ok) {
 toast.success("Shipping zone added");
 setDraft({ name: "", provinces: [], rate: 150, freeAbove: "1000", estimatedDays: "2-4" });
 load();
 } else toast.error("Could not add zone");
 };

 const toggleZone = async (z: Zone) => {
 await fetch(`/api/admin/shipping-zones/${z.id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ isActive: !z.isActive }),
 });
 load();
 };

 const remove = async (id: string) => {
 if (!confirm("Delete this shipping zone?")) return;
 await fetch(`/api/admin/shipping-zones/${id}`, { method: "DELETE" });
 load();
 };

 return (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Shipping Zones</h2>
 <p className="text-xs text-gray-400 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
 Rates by province. A zone with no provinces is the fallback. With no zones, shipping is रू 150 and free above the threshold above.
 </p>
 <div className="space-y-2 mb-5">
 {zones.length === 0 && <p className="text-sm text-gray-400">No zones yet — the default rate applies everywhere.</p>}
 {zones.map((z) => (
 <div key={z.id} className="flex items-center gap-3 flex-wrap py-2 border-b border-gray-50 dark:border-gray-800 text-sm">
 <span className="font-semibold text-gray-900 dark:text-white">{z.name}</span>
 <span className="text-gray-400">{z.provinces.length ? z.provinces.join(", ") : "All other provinces"}</span>
 <span className="text-gray-700 dark:text-gray-300">रू {z.rate}{z.freeAbove != null && ` · free above रू ${z.freeAbove}`} · {z.estimatedDays} days</span>
 <span className="ml-auto flex gap-2">
 <button onClick={() => toggleZone(z)} className="text-xs font-semibold text-blue-600 hover:underline">{z.isActive ? "Disable" : "Enable"}</button>
 <button onClick={() => remove(z.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
 </span>
 </div>
 ))}
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Zone name (e.g. Kathmandu Valley)" className={fieldCls} />
 <input value={draft.estimatedDays} onChange={(e) => setDraft({ ...draft, estimatedDays: e.target.value })} placeholder="Delivery days (e.g. 1-2)" className={fieldCls} />
 <label className="text-xs text-gray-500">Rate (NPR)
 <input type="number" min={0} value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: Number(e.target.value) })} className={cn(fieldCls, "w-full mt-1")} />
 </label>
 <label className="text-xs text-gray-500">Free above (NPR, blank = never)
 <input type="number" min={0} value={draft.freeAbove} onChange={(e) => setDraft({ ...draft, freeAbove: e.target.value })} className={cn(fieldCls, "w-full mt-1")} />
 </label>
 </div>
 <div className="flex flex-wrap gap-2 mt-3">
 {PROVINCES.map((p) => {
 const on = draft.provinces.includes(p);
 return (
 <button key={p} type="button"
 onClick={() => setDraft({ ...draft, provinces: on ? draft.provinces.filter((x) => x !== p) : [...draft.provinces, p] })}
 className={cn("px-3 py-1 rounded-full text-xs font-semibold border", on ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 dark:border-gray-700 text-gray-500")}>
 {p}
 </button>
 );
 })}
 </div>
 <button onClick={add} className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">Add Zone</button>
 </div>
 );
}

// ── Homepage banners ──────────────────────────────────────────────────────────

type Banner = { id: string; title: string; subtitle: string | null; imageUrl: string | null; linkUrl: string | null; ctaLabel: string | null; position: number; isActive: boolean };

function BannersManager() {
 const [banners, setBanners] = useState<Banner[]>([]);
 const [draft, setDraft] = useState({ title: "", subtitle: "", imageUrl: "", linkUrl: "", ctaLabel: "Shop now" });

 const load = () => fetch("/api/admin/banners").then((r) => r.json()).then((d) => setBanners(d.banners ?? []));
 useEffect(() => { load(); }, []);

 const add = async () => {
 if (!draft.title.trim()) return toast.error("Give the banner a title");
 const res = await fetch("/api/admin/banners", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...draft, position: banners.length }),
 });
 if (res.ok) {
 toast.success("Banner added");
 setDraft({ title: "", subtitle: "", imageUrl: "", linkUrl: "", ctaLabel: "Shop now" });
 load();
 } else toast.error("Could not add banner");
 };

 const update = async (id: string, data: Partial<Banner>) => {
 await fetch(`/api/admin/banners/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
 load();
 };

 const remove = async (id: string) => {
 if (!confirm("Delete this banner?")) return;
 await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
 load();
 };

 return (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Homepage Banners</h2>
 <p className="text-xs text-gray-400 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">Shown in the homepage hero slider, in order.</p>
 <div className="space-y-2 mb-5">
 {banners.length === 0 && <p className="text-sm text-gray-400">No banners — the built-in slides are shown.</p>}
 {banners.map((b, i) => (
 <div key={b.id} className="flex items-center gap-3 flex-wrap py-2 border-b border-gray-50 dark:border-gray-800 text-sm">
 <span className="font-semibold text-gray-900 dark:text-white">{b.title}</span>
 {b.subtitle && <span className="text-gray-400">{b.subtitle}</span>}
 <span className="ml-auto flex gap-2">
 <button disabled={i === 0} onClick={() => update(b.id, { position: Math.max(0, b.position - 1) })} className="text-xs font-semibold text-gray-500 disabled:opacity-30">Up</button>
 <button onClick={() => update(b.id, { isActive: !b.isActive })} className="text-xs font-semibold text-blue-600 hover:underline">{b.isActive ? "Hide" : "Show"}</button>
 <button onClick={() => remove(b.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
 </span>
 </div>
 ))}
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Headline" className={fieldCls} />
 <input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} placeholder="Subtitle" className={fieldCls} />
 <input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} placeholder="Image URL (optional)" className={fieldCls} />
 <input value={draft.linkUrl} onChange={(e) => setDraft({ ...draft, linkUrl: e.target.value })} placeholder="Link (e.g. /?page=products)" className={fieldCls} />
 <input value={draft.ctaLabel} onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })} placeholder="Button label" className={fieldCls} />
 </div>
 <button onClick={add} className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">Add Banner</button>
 </div>
 );
}

