"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { formatPrice, MOCK_CATEGORIES, useUIStore, useAuthStore } from "@/app/lib/store";

import { EmojiIcon, EmojiText } from "@/app/components/ui/EmojiIcon";
const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const MUTED    = "var(--color-muted)";

type SellerProduct = {
  id: string; name: string; category: string; emoji: string;
  basePrice: number; comparePrice: number; stock: number;
  description: string; freeShipping: boolean; isFlashSale: boolean;
  badge: string; status: "active" | "draft";
  imageUrl?: string;
};

type SellerOrder = {
  id: string; orderNumber: string; customer: string; customerEmail: string; product: string;
  qty: number; total: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  date: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100   text-blue-700",
  SHIPPED:    "bg-purple-100 text-purple-700",
  DELIVERED:  "bg-green-100  text-green-700",
  CANCELLED:  "bg-red-100    text-red-700",
};


const INITIAL_ORDERS: SellerOrder[] = [
  { id:"o1", orderNumber:"NX-2025-47832", customer:"Arun Sharma",   customerEmail:"arun@example.com",   product:"Apple iPhone 16 Pro Max", qty:1, total:195000, status:"DELIVERED",  date:"2025-05-18" },
  { id:"o2", orderNumber:"NX-2025-47234", customer:"Priya Thapa",   customerEmail:"priya@example.com",  product:"Sony WH-1000XM6",         qty:2, total:77000,  status:"SHIPPED",    date:"2025-05-19" },
  { id:"o3", orderNumber:"NX-2025-48001", customer:"Ram Bahadur",   customerEmail:"ram@example.com",    product:"MacBook Pro M4",           qty:1, total:285000, status:"PROCESSING", date:"2025-05-20" },
  { id:"o4", orderNumber:"NX-2025-48102", customer:"Sita Maharjan", customerEmail:"sita@example.com",   product:"AirPods Pro 4",            qty:1, total:32000,  status:"PENDING",    date:"2025-05-20" },
];

const EMOJIS = ["📱","💻","🎧","⌚","📺","🎮","👟","👗","👖","🏠","🍵","📚","💄","⚽","🧹","📖","🎵","🛍️","💍","🎒"];

function Input({ label, note, ...props }: any) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>
        <EmojiText>{label}</EmojiText>{note && <span className="font-normal ml-1" style={{ color: MUTED }}>{note}</span>}
      </label>
      <input {...props}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, ...(props.style ?? {}) }}
        onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(198,131,19,0.1)`; }}
        onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }} />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none" onClick={onChange}>
      <div className="w-10 h-5 rounded-full relative transition-colors" style={{ backgroundColor: value ? GOLD : "#D1D5DB" }}>
        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all" style={{ left: value ? "22px" : "2px" }} />
      </div>
      <span className="text-xs font-semibold" style={{ color: CHARCOAL }}><EmojiText>{label}</EmojiText></span>
    </label>
  );
}

type UploadedImage = { url: string; publicId?: string; mediaType?: "image" | "video" };
type Category = { id: string; name: string };
 

function ProductModal({ product, onSave, onClose }: {
  product: Partial<SellerProduct> | null;
  onSave: (p: SellerProduct) => void;
  onClose: () => void;
}) {
  const isEdit = !!product?.id;

  const [form, setForm] = useState({
    name:         product?.name         ?? "",
    categoryId:   "",
    categoryName: product?.category     ?? "Electronics",
    emoji:        product?.emoji        ?? "🛍️",
    basePrice:    product?.basePrice    ?? 0,
    comparePrice: product?.comparePrice ?? 0,
    stock:        product?.stock        ?? 0,
    description:  product?.description  ?? "",
    freeShipping: product?.freeShipping ?? false,
    isFlashSale:  product?.isFlashSale  ?? false,
    badge:        product?.badge        ?? "",
    status:       (product?.status      ?? "active") as "active" | "draft",
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const [categories,     setCategories]     = useState<Category[]>(MOCK_CATEGORIES.map(c => ({ id: c.id, name: c.name })));
  const [images,         setImages]         = useState<UploadedImage[]>([]);
  const [classifying,    setClassifying]    = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [newCatOpen,     setNewCatOpen]     = useState(false);
  const [newCatName,     setNewCatName]     = useState("");
  const [newCatIcon,     setNewCatIcon]     = useState("");
  const [newCatSaving,   setNewCatSaving]   = useState(false);
  const [newCatError,    setNewCatError]    = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const createCategory = async () => {
    if (!newCatName.trim()) { setNewCatError("Name is required"); return; }
    setNewCatSaving(true);
    setNewCatError("");
    try {
      const res  = await fetch("/api/categories", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newCatName.trim(), icon: newCatIcon.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setNewCatError(data.error ?? "Failed to create"); return; }
      const cat: Category = { id: data.category.id, name: data.category.name };
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      set("categoryId", cat.id);
      set("categoryName", cat.name);
      setNewCatOpen(false);
      setNewCatName("");
      setNewCatIcon("");
    } catch {
      setNewCatError("Network error. Try again.");
    } finally {
      setNewCatSaving(false);
    }
  };
  // Track which name was last classified to avoid repeat calls
  const lastClassified = useRef("");

  // Load real categories
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.categories?.length) {
          const cats: Category[] = data.categories.map((c: any) => ({ id: c.id, name: c.name }));
          setCategories(cats);
          const match = cats.find(c => c.name === form.categoryName) ?? cats[0];
          if (match) setForm(p => ({ ...p, categoryId: match.id, categoryName: match.name }));
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // AI-classify category when name is long enough and categories are loaded
  useEffect(() => {
    const name = form.name.trim();
    if (name.length < 4 || categories.length === 0) return;
    if (lastClassified.current === name) return;
    const t = setTimeout(async () => {
      if (lastClassified.current === name) return;
      lastClassified.current = name;
      setClassifying(true);
      try {
        const res = await fetch("/api/ai/classify-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, categories }),
        });
        if (!res.ok) return;
        const { categoryId, categoryName } = await res.json();
        setForm(p => ({ ...p, categoryId, categoryName }));
      } catch { /* silent */ } finally {
        setClassifying(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [form.name, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    const added: UploadedImage[] = [];
    for (const file of Array.from(files).slice(0, 6 - images.length)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "peanut/products");
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const d = await res.json();
          added.push({ url: d.url, publicId: d.publicId, mediaType: d.mediaType ?? "image" });
        }
      } catch { /* skip failed uploads */ }
    }
    setImages(prev => [...prev, ...added]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (i: number) => setImages(prev => prev.filter((_, j) => j !== i));

  const disc = form.comparePrice > form.basePrice
    ? Math.round(((form.comparePrice - form.basePrice) / form.comparePrice) * 100)
    : 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())                    e.name        = "Product name is required";
    if (!form.basePrice || isNaN(form.basePrice) || form.basePrice <= 0)
                                              e.basePrice   = "Enter a valid price";
    if (isNaN(form.stock) || form.stock < 0 || !Number.isInteger(form.stock))
                                              e.stock       = "Enter a whole number (e.g. 10)";
    if (!form.categoryId)                     e.categoryId  = "Select a category";
    if (!isEdit && form.description.trim().length < 10)
                                              e.description = "Description must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    if (isEdit) {
      onSave({
        id:           product!.id!,
        name:         form.name,
        category:     form.categoryName,
        emoji:        form.emoji,
        basePrice:    form.basePrice,
        comparePrice: form.comparePrice,
        stock:        form.stock,
        description:  form.description,
        freeShipping: form.freeShipping,
        isFlashSale:  form.isFlashSale,
        badge:        form.badge,
        status:       form.status,
        imageUrl:     images[0]?.url ?? product?.imageUrl,
      });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         form.name,
          categoryId:   form.categoryId,
          description:  form.description.trim().length >= 10 ? form.description : "Quality product from PeaNut marketplace.",
          basePrice:    form.basePrice,
          comparePrice: form.comparePrice > 0 ? form.comparePrice : null,
          stock:        form.stock,
          freeShipping: form.freeShipping,
          isFlashSale:  form.isFlashSale,
          isActive:     form.status === "active",
          tags:         [],
          images:       images.map((img, i) => ({ url: img.url, alt: `${form.name} ${i + 1}`, ...(img.publicId ? { publicId: img.publicId } : {}) })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = data.details?.[0];
        const fieldMsg = detail ? `${detail.path.join(".") || "field"}: ${detail.message}` : null;
        setErrors({ _form: fieldMsg ?? data.error ?? "Failed to create product. Please try again." });
        setSaving(false);
        return;
      }

      const p = data.product;
      onSave({
        id:           p.id,
        name:         p.name,
        category:     p.category?.name ?? form.categoryName,
        emoji:        form.emoji,
        basePrice:    Number(p.basePrice),
        comparePrice: Number(p.comparePrice ?? 0),
        stock:        p.stock,
        description:  p.description,
        freeShipping: p.freeShipping,
        isFlashSale:  p.isFlashSale,
        badge:        form.badge,
        status:       p.isActive ? "active" : "draft",
        imageUrl:     p.images?.[0]?.url,
      });
    } catch {
      setErrors({ _form: "Network error. Please try again." });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" style={{ border: `1px solid ${BORDER}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white rounded-t-3xl z-10" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="text-base font-black" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors hover:bg-gray-100" style={{ color: MUTED }}><EmojiIcon emoji="✕" /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── 1. Product Name (first, drives image suggestions) ──────── */}
          <div>
            <Input
              label="Product Name *"
              value={form.name}
              onChange={(e: any) => set("name", e.target.value)}
              placeholder="e.g. Apple iPhone 15 Pro Max 256GB"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* ── 2. Photos & Videos ─────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: CHARCOAL }}>
              Photos &amp; Videos <span style={{ color: MUTED }}>(up to 6 · first item is the cover)</span>
            </label>

            {/* Upload zone */}
            <div
              role="button" tabIndex={0}
              onClick={() => !uploading && images.length < 6 && fileRef.current?.click()}
              onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
              className="rounded-xl flex flex-col items-center justify-center gap-1.5 py-5 cursor-pointer transition-colors"
              style={{
                border: `2px dashed ${BORDER}`,
                backgroundColor: IVORY,
                opacity: images.length >= 6 ? 0.5 : 1,
                cursor: images.length >= 6 ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? (
                <>
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD }} />
                  <p className="text-xs font-semibold" style={{ color: MUTED }}>Uploading…</p>
                </>
              ) : (
                <>
                  <span className="text-2xl"><EmojiIcon emoji="📷" /></span>
                  <p className="text-xs font-bold" style={{ color: CHARCOAL }}>
                    {images.length === 0 ? "Upload photos or videos" : `Upload more (${images.length}/6)`}
                  </p>
                  <p className="text-[11px] text-center" style={{ color: MUTED }}>
                    Images: JPG, PNG, WebP · max 10 MB
                    <br />
                    Videos: MP4, WebM, MOV · max 100 MB
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileRef} type="file" multiple className="sr-only"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />

            {/* Selected media */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                {images.map((img, i) => (
                  <div key={img.url} className="relative aspect-square rounded-xl overflow-hidden group"
                    style={{ border: `2px solid ${i === 0 ? GOLD : BORDER}` }}>
                    {img.mediaType === "video" ? (
                      <>
                        <video src={img.url} className="w-full h-full object-cover" muted playsInline />
                        <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                          VIDEO
                        </span>
                      </>
                    ) : (
                      <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                    )}
                    {i === 0 && (
                      <span className="absolute bottom-0 inset-x-0 text-[10px] font-bold text-center py-0.5 text-white"
                        style={{ backgroundColor: "rgba(198,131,19,0.85)" }}>Cover</span>
                    )}
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fallback emoji — only when no photos */}
          {images.length === 0 && (
            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: CHARCOAL }}>
                Fallback Icon <span style={{ color: MUTED }}>(used when no photo selected)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => set("emoji", e)}
                    className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                    style={{ backgroundColor: form.emoji === e ? IVORY : "#F9F9F9", border: `2px solid ${form.emoji === e ? GOLD : BORDER}` }}>
                    <EmojiText>{e}</EmojiText>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── 3. Category + Badge ────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              {/* Label row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold" style={{ color: CHARCOAL }}>Category *</label>
                  {classifying && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: GOLD }}>
                      <span className="w-2.5 h-2.5 border border-t-transparent rounded-full animate-spin inline-block" style={{ borderColor: GOLD }} />
                      AI classifying…
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setNewCatOpen(o => !o); setNewCatName(""); setNewCatIcon(""); setNewCatError(""); }}
                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all"
                  style={{ backgroundColor: newCatOpen ? GOLD : IVORY, color: newCatOpen ? "#fff" : GOLD, border: `1px solid ${GOLD}` }}
                >
                  <EmojiText>{newCatOpen ? "✕ Cancel" : "+ New"}</EmojiText>
                </button>
              </div>

              {/* Inline create-category form */}
              {newCatOpen && (
                <div className="mb-2 rounded-xl p-3 space-y-2" style={{ backgroundColor: "#FFFBF0", border: `1.5px solid ${GOLD}55` }}>
                  <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: GOLD }}>New Category</p>
                  <div className="flex gap-2">
                    <input
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={async e => { if (e.key === "Enter") { e.preventDefault(); await createCategory(); } }}
                      placeholder="Category name…"
                      className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
                      onFocus={e => e.target.style.borderColor = GOLD}
                      onBlur={e => e.target.style.borderColor = BORDER}
                    />
                    <input
                      value={newCatIcon}
                      onChange={e => setNewCatIcon(e.target.value)}
                      placeholder="🏷️"
                      className="w-12 px-2 py-2 rounded-lg text-xs text-center outline-none"
                      style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
                      onFocus={e => e.target.style.borderColor = GOLD}
                      onBlur={e => e.target.style.borderColor = BORDER}
                    />
                  </div>
                  {newCatError && <p className="text-[11px] text-red-500 font-semibold">{newCatError}</p>}
                  <button
                    type="button"
                    onClick={createCategory}
                    disabled={newCatSaving || !newCatName.trim()}
                    className="w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                    style={{ backgroundColor: GOLD }}
                  >
                    {newCatSaving ? "Creating…" : "Create & Select"}
                  </button>
                </div>
              )}

              <select value={form.categoryId}
                onChange={e => { const cat = categories.find(c => c.id === e.target.value); set("categoryId", e.target.value); if (cat) set("categoryName", cat.name); }}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${errors.categoryId ? "#EF4444" : classifying ? GOLD : BORDER}`, color: CHARCOAL, backgroundColor: "white" }}>
                <option value="" disabled>Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>Badge <span style={{ color: MUTED }}>(optional)</span></label>
              <select value={form.badge} onChange={e => set("badge", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "white" }}>
                <option value="">No Badge</option>
                {["New","Sale","Hot","Trending","Limited"].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* ── 4. Prices ──────────────────────────────────────────────── */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input label="Selling Price (रू) *" type="number" value={form.basePrice || ""} onChange={(e: any) => set("basePrice", Number(e.target.value))} placeholder="0" />
                {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice}</p>}
              </div>
              <div>
                <Input label="Original / MRP (रू)" note="— for discount strike-through" type="number" value={form.comparePrice || ""} onChange={(e: any) => set("comparePrice", Number(e.target.value))} placeholder="0 = no discount" />
              </div>
            </div>
            {disc > 0 && (
              <div className="mt-2 px-4 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: IVORY, color: GOLD }}>
                <EmojiIcon emoji="✓" /> {disc}% discount — customers will see रू {form.comparePrice.toLocaleString()} crossed out
              </div>
            )}
          </div>

          {/* ── 5. Stock ───────────────────────────────────────────────── */}
          <div>
            <Input label="Stock Quantity *" type="number" step={1} min={0} value={form.stock || ""} onChange={(e: any) => set("stock", Number(e.target.value))} placeholder="0" />
            {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
          </div>

          {/* ── 6. Description ─────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>
              Product Description {!isEdit && <span style={{ color: "#EF4444" }}>*</span>} {!isEdit && <span style={{ color: MUTED, fontWeight: "normal" }}>(min. 10 characters)</span>}
            </label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Describe your product — features, specifications, what's in the box..."
              rows={3} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
              style={{ border: `1.5px solid ${errors.description ? "#EF4444" : BORDER}`, color: CHARCOAL }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(198,131,19,0.1)`; }}
              onBlur={e => { e.target.style.borderColor = errors.description ? "#EF4444" : BORDER; e.target.style.boxShadow = "none"; }} />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* ── 7. Toggles ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-6">
            <Toggle label="🚚 Free Shipping" value={form.freeShipping} onChange={() => set("freeShipping", !form.freeShipping)} />
            <Toggle label="⚡ Flash Sale"    value={form.isFlashSale}  onChange={() => set("isFlashSale",  !form.isFlashSale)}  />
          </div>

          {/* ── 8. Status ──────────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: CHARCOAL }}>Listing Status</label>
            <div className="flex gap-2">
              {([["active","✓ Active — visible to shoppers"],["draft","◷ Draft — hidden from shoppers"]] as const).map(([s, label]) => (
                <button key={s} type="button" onClick={() => set("status", s)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={form.status === s ? { backgroundColor: GOLD, color: "#fff" } : { backgroundColor: IVORY, color: MUTED, border: `1px solid ${BORDER}` }}>
                  <EmojiText>{label}</EmojiText>
                </button>
              ))}
            </div>
          </div>

          {errors._form && (
            <div className="px-4 py-3 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-200">
              {errors._form}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 sticky bottom-0 bg-white rounded-b-3xl" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: IVORY, color: MUTED, border: `1px solid ${BORDER}` }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: GOLD }}
            onMouseEnter={e => { if (!saving && !uploading) e.currentTarget.style.backgroundColor = "#9B6210"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = GOLD; }}>
            {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState({ name: "", icon: "", parentId: "" });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.categories) setCategories(d.categories); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Category name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res  = await fetch("/api/categories", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: form.name.trim(), icon: form.icon.trim() || null, parentId: form.parentId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create category"); return; }

      const created = data.category;
      if (form.parentId) {
        setCategories(prev => prev.map(c =>
          c.id === form.parentId
            ? { ...c, children: [...(c.children ?? []), { ...created, _count: { products: 0 } }] }
            : c
        ));
      } else {
        setCategories(prev => [...prev, { ...created, children: [], _count: { products: 0 } }]
          .sort((a, b) => a.name.localeCompare(b.name)));
      }
      setForm({ name: "", icon: "", parentId: "" });
      showToast("Category created!");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Failed to delete category", "error"); return; }
      setCategories(prev =>
        prev
          .filter(c => c.id !== id)
          .map(c => ({ ...c, children: (c.children ?? []).filter((ch: any) => ch.id !== id) })),
      );
      showToast("Category deleted!");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-black text-base" style={{ color: CHARCOAL }}>Categories</h2>

      {/* ── Create form ── */}
      <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="font-bold text-sm" style={{ color: CHARCOAL }}>Add New Category</h3>

        <div className="grid grid-cols-[1fr_80px] gap-3">
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>Category Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Electronics, Clothing, Books…"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
              onFocus={e => e.target.style.borderColor = GOLD}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>Icon</label>
            <input
              value={form.icon}
              onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
              placeholder="🛒"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-center outline-none transition-all"
              style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
              onFocus={e => e.target.style.borderColor = GOLD}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>
            Parent Category <span style={{ color: MUTED }}>(leave empty for top-level)</span>
          </label>
          <select
            value={form.parentId}
            onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "white" }}
          >
            <option value="">— Top-level category —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

        <button
          onClick={handleCreate} disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
          style={{ backgroundColor: GOLD }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = "#9B6210"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = GOLD; }}
        >
          {saving ? "Creating…" : "+ Create Category"}
        </button>
      </div>

      {/* ── Category list ── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h3 className="font-bold text-sm" style={{ color: CHARCOAL }}>
            All Categories <span className="font-normal text-xs" style={{ color: MUTED }}>({categories.length} top-level)</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD }} />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm" style={{ color: MUTED }}>No categories yet. Create the first one above.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {categories.map(cat => (
              <div key={cat.id}>
                {/* Top-level row */}
                <div className="flex items-center transition-colors hover:bg-amber-50/50">
                  <button
                    onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                    className="flex-1 flex items-center gap-3 px-5 py-3.5 text-left min-w-0"
                  >
                    <span className="text-xl w-7 text-center shrink-0"><EmojiIcon emoji={cat.icon ?? "🏷️"} /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{cat.name}</p>
                      <p className="text-[11px]" style={{ color: MUTED }}>
                        {cat._count?.products ?? 0} products
                        {cat.children?.length > 0 && ` · ${cat.children.length} subcategories`}
                      </p>
                    </div>
                    {cat.children?.length > 0 && (
                      <span className="text-xs mr-2" style={{ color: MUTED }}>
                        {expandedId === cat.id ? <EmojiIcon emoji={"▲"} /> : <EmojiIcon emoji={"▼"} />}
                      </span>
                    )}
                  </button>

                  {/* Delete controls */}
                  <div className="pr-4 shrink-0">
                    {deleteConfirm === cat.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          disabled={deleting}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-500 text-white disabled:opacity-50"
                        >
                          {deleting ? "…" : "Delete"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 text-[11px] rounded-lg"
                          style={{ backgroundColor: IVORY, color: MUTED, border: `1px solid ${BORDER}` }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(cat.id)}
                        className="p-1.5 rounded-lg text-sm transition-colors"
                        style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}
                        title="Delete category"
                      >
                        <EmojiIcon emoji="🗑️" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategories */}
                {expandedId === cat.id && cat.children?.length > 0 && (
                  <div style={{ backgroundColor: IVORY }}>
                    {cat.children.map((child: any) => (
                      <div key={child.id} className="flex items-center gap-3 px-5 py-2.5 pl-14"
                        style={{ borderTop: `1px solid ${BORDER}` }}>
                        <span className="text-base w-5 text-center shrink-0"><EmojiIcon emoji={child.icon ?? "↳"} /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: CHARCOAL }}>{child.name}</p>
                          <p className="text-[11px]" style={{ color: MUTED }}>{child._count?.products ?? 0} products</p>
                        </div>
                        {/* Delete subcategory */}
                        <div className="shrink-0">
                          {deleteConfirm === child.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => deleteCategory(child.id)}
                                disabled={deleting}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-500 text-white disabled:opacity-50"
                              >
                                {deleting ? "…" : "Delete"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-[11px] rounded-lg"
                                style={{ backgroundColor: "#fff", color: MUTED, border: `1px solid ${BORDER}` }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(child.id)}
                              className="p-1.5 rounded-lg text-sm transition-colors"
                              style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}
                              title="Delete subcategory"
                            >
                              <EmojiIcon emoji="🗑️" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StoreSettings({ user, showToast }: { user: any; showToast: any }) {
  const [store, setStore] = useState({
    name: user.name + "'s Store", description: "Quality products at great prices",
    phone: "+977-98XXXXXXXX", email: user.email,
    returnPolicy: "7-day hassle-free returns", processingTime: "1-2 business days",
    bankName: "Nepal Investment Bank", accountNo: "",
  });
  const s = (k: string, v: string) => setStore(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5">
      <h2 className="font-black text-base" style={{ color: CHARCOAL }}>Store Settings</h2>
      <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="font-bold text-sm" style={{ color: CHARCOAL }}>Store Information</h3>
        <Input label="Store Name" value={store.name} onChange={(e: any) => s("name", e.target.value)} placeholder="Your store name" />
        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: CHARCOAL }}>Store Description</label>
          <textarea value={store.description} onChange={e => s("description", e.target.value)} rows={2}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Contact Phone" value={store.phone} onChange={(e: any) => s("phone", e.target.value)} />
          <Input label="Contact Email" type="email" value={store.email} onChange={(e: any) => s("email", e.target.value)} />``
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="font-bold text-sm" style={{ color: CHARCOAL }}>Store Policies</h3>
        <Input label="Return Policy" value={store.returnPolicy} onChange={(e: any) => s("returnPolicy", e.target.value)} placeholder="e.g. 7-day hassle-free returns" />
        <Input label="Processing Time" value={store.processingTime} onChange={(e: any) => s("processingTime", e.target.value)} placeholder="e.g. 1-2 business days" />
      </div>
      <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="font-bold text-sm" style={{ color: CHARCOAL }}>Payout Bank Details</h3>
        <Input label="Bank Name" value={store.bankName} onChange={(e: any) => s("bankName", e.target.value)} placeholder="Your bank name" />
        <Input label="Account Number" value={store.accountNo} onChange={(e: any) => s("accountNo", e.target.value)} placeholder="Your bank account number" />
      </div>
      <button onClick={() => showToast("Store settings saved!")}
        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
        style={{ backgroundColor: GOLD }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
        Save All Settings
      </button>
    </div>
  );
}

export function SellerDashPage() {
  const { nav, showToast } = useUIStore();
  const { user } = useAuthStore();
  const [tab, setTab]           = useState("overview");
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orders, setOrders]     = useState<SellerOrder[]>(INITIAL_ORDERS);
  const [modal, setModal]       = useState<{ open: boolean; product: Partial<SellerProduct> | null }>({ open: false, product: null });
  const [orderFilter, setOrderFilter]   = useState("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [sellerProfile, setSellerProfile] = useState<{ storeName?: string; storeSlug?: string; isVerified?: boolean } | null>(null);

  if (!user) { nav("login"); return null; }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/seller/lookup?email=${encodeURIComponent(user.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.seller) setSellerProfile(d.seller); })
      .catch(() => {});
  }, [user?.email]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!sellerProfile?.storeSlug) return;
    setProductsLoading(true);
    fetch(`/api/products?seller=${encodeURIComponent(sellerProfile.storeSlug)}&limit=100&sort=newest`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.products) return;
        const mapped: SellerProduct[] = d.products.map((p: any) => ({
          id:           p.id,
          name:         p.name,
          category:     p.category?.name ?? "",
          emoji:        p.emoji ?? "🛍️",
          basePrice:    Number(p.basePrice),
          comparePrice: Number(p.comparePrice ?? 0),
          stock:        p.stock,
          description:  p.shortDesc ?? p.description ?? "",
          freeShipping: p.freeShipping,
          isFlashSale:  p.isFlashSale,
          badge:        p.badge ?? "",
          status:       p.isActive ? "active" : "draft",
          imageUrl:     p.images?.[0]?.url,
        }));
        setProducts(mapped);
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, [sellerProfile?.storeSlug]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    fetch("/api/seller/orders?limit=100")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.orders?.length) return;
        const mapped: SellerOrder[] = d.orders.map((o: any) => ({
          id:            o.id,
          orderNumber:   o.orderNumber,
          customer:      o.user?.name  ?? "Customer",
          customerEmail: o.user?.email ?? "",
          product:       o.items.map((i: any) => i.product?.name ?? "Product").join(", "),
          qty:           o.items.reduce((s: number, i: any) => s + i.quantity, 0),
          total:         Number(o.total),
          status:        o.status,
          date:          new Date(o.createdAt).toISOString().slice(0, 10),
        }));
        setOrders(mapped);
      })
      .catch(() => {});
  }, []);

  const filteredOrders = orders.filter(o =>
    (orderFilter === "ALL" || o.status === orderFilter) &&
    (!search || o.orderNumber.includes(search) || o.customer.toLowerCase().includes(search.toLowerCase()))
  );

  const saveProduct = (p: SellerProduct) => {
    const exists = products.find(x => x.id === p.id);
    setProducts(prev => exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
    showToast(exists ? "Product updated!" : "Product added to your store!");
    setModal({ open: false, product: null });
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast("Product removed from your store");
    setDeleteConfirm(null);
  };

  const updateOrderStatus = (id: string, status: SellerOrder["status"]) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    showToast("Order status updated");
  };

  const TABS = [
    { id:"overview",    label:"Overview",       icon:"📊" },
    { id:"products",    label:"My Products",    icon:"🛍️" },
    { id:"orders",      label:"Orders",         icon:"📦" },
    { id:"customers",   label:"Customers",      icon:"👥" },
    { id:"categories",  label:"Categories",     icon:"🏷️" },
    { id:"analytics",   label:"Analytics",      icon:"📈" },
    { id:"payouts",     label:"Payouts",        icon:"💰" },
    { id:"settings",    label:"Store Settings", icon:"⚙️" },
  ];

  return (
    <div style={{ backgroundColor: "#FDFBF7", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
              Seller Hub
            </h1>
            <p className="text-xs" style={{ color: MUTED }}>{sellerProfile?.storeName ?? user.name + "'s Store"} · PeaNut Marketplace</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav("store", sellerProfile?.storeSlug || user.email)}
              className="px-3 py-2 text-xs font-bold rounded-xl transition-all"
              style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
              <EmojiIcon emoji="🌐" /> View My Store
            </button>
            <button onClick={() => setModal({ open: true, product: null })}
              className="px-4 py-2 text-xs font-bold text-white rounded-xl transition-all"
              style={{ backgroundColor: GOLD }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
              + Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">

          {/* Sidebar */}
          <aside>
            <div className="bg-white rounded-2xl p-2 sticky top-20" style={{ border: `1px solid ${BORDER}` }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-semibold transition-all mb-0.5 text-left"
                  style={tab === t.id ? { backgroundColor: IVORY, color: GOLD } : { color: MUTED }}>
                  <span className="text-base"><EmojiIcon emoji={t.icon} /></span>{t.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div>

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div className="space-y-5">
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon:"💰", label:"Revenue (30d)",    value:"रू 2,40,000", sub:"+12%",     color: GOLD        },
                    { icon:"📦", label:"Total Orders",     value:String(orders.length), sub:"this month", color:"#22C55E"  },
                    { icon:"🛍️", label:"Active Products",  value:String(products.filter(p=>p.status==="active").length), sub:"listed", color:"#3B82F6" },
                    { icon:"⭐", label:"Store Rating",     value:"4.9 ★",        sub:"245 reviews", color: GOLD      },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4" style={{ border: `1px solid ${BORDER}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl"><EmojiIcon emoji={s.icon} /></span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: IVORY, color: MUTED }}><EmojiText>{s.sub}</EmojiText></span>
                      </div>
                      <p className="text-xl font-black" style={{ color: s.color }}><EmojiText>{s.value}</EmojiText></p>
                      <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <h3 className="font-black text-sm" style={{ color: CHARCOAL }}>Recent Orders</h3>
                    <button onClick={() => setTab("orders")} className="text-xs font-bold" style={{ color: GOLD }}>View all <EmojiIcon emoji="→" /></button>
                  </div>
                  {orders.slice(0,4).map((o, i) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: i < 3 ? `1px solid ${BORDER}` : "none" }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: CHARCOAL }}>{o.orderNumber}</p>
                        <p className="text-[11px]" style={{ color: MUTED }}>{o.customer} · {o.product.slice(0,28)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black" style={{ color: GOLD }}>{formatPrice(o.total)}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View My Store banner */}
                <div
                  className="flex items-center justify-between gap-4 p-5 rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${GOLD}22, #fff7e6)`, border: `1.5px solid ${GOLD}55` }}
                >
                  <div>
                    <p className="font-black text-sm" style={{ color: CHARCOAL }}>
                      <EmojiIcon emoji="🌐" /> {sellerProfile?.storeName ?? user.name + "'s Store"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                      {sellerProfile?.storeSlug
                        ? "Your public store page — customers can browse all your products here."
                        : "Your application is under review. Store page will be live once approved."}
                    </p>
                  </div>
                  <button
                    onClick={() => nav("store", sellerProfile?.storeSlug || user.email)}
                    className="shrink-0 px-4 py-2 rounded-xl text-xs font-black text-white transition-all"
                    style={{ backgroundColor: GOLD }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}
                  >
                    View My Store <EmojiIcon emoji="→" />
                  </button>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { l:"Add Product",    i:"➕", fn: () => setModal({ open: true, product: null }) },
                    { l:"View Orders",    i:"📦", fn: () => setTab("orders")   },
                    { l:"Analytics",      i:"📊", fn: () => setTab("analytics") },
                    { l:"Store Settings", i:"⚙️", fn: () => setTab("settings") },
                  ].map(a => (
                    <button key={a.l} onClick={a.fn}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl text-xs font-bold transition-all"
                      style={{ border: `1px solid ${BORDER}`, color: CHARCOAL }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL; e.currentTarget.style.transform = "none"; }}>
                      <span className="text-2xl"><EmojiText>{a.i}</EmojiText></span>{a.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRODUCTS ── */}
            {tab === "products" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-base" style={{ color: CHARCOAL }}>
                    My Products <span className="text-sm font-normal" style={{ color: MUTED }}>({products.length})</span>
                  </h2>
                  <button onClick={() => setModal({ open: true, product: null })}
                    className="px-4 py-2 text-xs font-bold text-white rounded-xl transition-all"
                    style={{ backgroundColor: GOLD }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
                    + Add New Product
                  </button>
                </div>

                {productsLoading ? (
                  <div className="bg-white rounded-2xl p-16 text-center" style={{ border: `1px solid ${BORDER}` }}>
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: GOLD }} />
                    <p className="text-sm" style={{ color: MUTED }}>Loading your products…</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center" style={{ border: `1px solid ${BORDER}` }}>
                    <div className="text-6xl mb-4"><EmojiIcon emoji="🛍️" /></div>
                    <h3 className="font-black text-lg mb-2" style={{ color: CHARCOAL }}>No products yet</h3>
                    <p className="text-sm mb-5" style={{ color: MUTED }}>Add your first product to start selling on PeaNut</p>
                    <button onClick={() => setModal({ open: true, product: null })}
                      className="px-6 py-2.5 text-sm font-bold text-white rounded-xl"
                      style={{ backgroundColor: GOLD }}>
                      + Add First Product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ border: `1px solid ${BORDER}` }}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl" style={{ backgroundColor: IVORY }}>
                          {p.imageUrl ? <Image src={p.imageUrl} alt={p.name} width={48} height={48} className="object-cover w-full h-full" /> : <EmojiIcon emoji={p.emoji} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-sm font-bold truncate" style={{ color: CHARCOAL }}>{p.name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {p.status}
                            </span>
                            {p.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: GOLD }}>
                                {p.badge}
                              </span>
                            )}
                            {p.isFlashSale && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0 bg-orange-500"><EmojiIcon emoji="⚡" /> Flash</span>}
                          </div>
                          <p className="text-[11px]" style={{ color: MUTED }}>
                            {p.category} · Stock: {p.stock}
                            <EmojiText>{p.freeShipping && " · 🚚 Free shipping"}</EmojiText>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black" style={{ color: GOLD }}>{formatPrice(p.basePrice)}</p>
                          {p.comparePrice > p.basePrice && (
                            <p className="text-[11px] line-through" style={{ color: MUTED }}>{formatPrice(p.comparePrice)}</p>
                          )}
                          {p.comparePrice > p.basePrice && (
                            <p className="text-[10px] font-bold" style={{ color: "#22C55E" }}>
                              {Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100)}% off
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setModal({ open: true, product: p })}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                            style={{ backgroundColor: IVORY, color: GOLD, border: `1px solid ${BORDER}` }}>
                            Edit
                          </button>
                          {deleteConfirm === p.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => deleteProduct(p.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500 text-white">Yes, delete</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1.5 text-xs rounded-lg" style={{ backgroundColor: IVORY, color: MUTED }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(p.id)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                              style={{ backgroundColor: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="font-black text-base" style={{ color: CHARCOAL }}>
                    Orders <span className="text-sm font-normal" style={{ color: MUTED }}>({filteredOrders.length})</span>
                  </h2>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search order # or customer..."
                    className="px-4 py-2 rounded-xl text-xs outline-none"
                    style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL, width: "220px" }}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                {/* Status filters */}
                <div className="flex gap-2 flex-wrap">
                  {["ALL","PENDING","PROCESSING","SHIPPED","DELIVERED","CANCELLED"].map(s => (
                    <button key={s} onClick={() => setOrderFilter(s)}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-full transition-all"
                      style={orderFilter === s
                        ? { backgroundColor: GOLD, color: "#fff" }
                        : { backgroundColor: IVORY, color: MUTED, border: `1px solid ${BORDER}` }}>
                      <EmojiText>{s}</EmojiText>
                    </button>
                  ))}
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center" style={{ border: `1px solid ${BORDER}` }}>
                    <div className="text-5xl mb-3"><EmojiIcon emoji="📦" /></div>
                    <p className="font-bold" style={{ color: CHARCOAL }}>No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map(o => (
                      <div key={o.id} className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-black" style={{ color: CHARCOAL }}>{o.orderNumber}</p>
                            <p className="text-xs" style={{ color: MUTED }}>{o.customer} · {o.date}</p>
                          </div>
                          <p className="text-sm font-black" style={{ color: GOLD }}>{formatPrice(o.total)}</p>
                        </div>
                        <p className="text-xs mb-3 font-medium" style={{ color: CHARCOAL }}>
                          {o.product} × {o.qty}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                          {o.status !== "DELIVERED" && o.status !== "CANCELLED" && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: MUTED }}>Update status:</span>
                              <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as SellerOrder["status"])}
                                className="text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                                style={{ border: `1px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "white" }}>
                                <option value="PENDING">PENDING</option>
                                <option value="PROCESSING">PROCESSING</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CUSTOMERS ── */}
            {tab === "customers" && (() => {
              // Group orders by customer email
              const customerMap = new Map<string, { name: string; email: string; orders: SellerOrder[] }>();
              for (const o of orders) {
                const key = o.customerEmail || o.customer;
                if (!customerMap.has(key)) customerMap.set(key, { name: o.customer, email: o.customerEmail, orders: [] });
                customerMap.get(key)!.orders.push(o);
              }
              const customers = [...customerMap.values()].sort((a, b) =>
                b.orders.reduce((s, o) => s + o.total, 0) - a.orders.reduce((s, o) => s + o.total, 0)
              );

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-black text-base" style={{ color: CHARCOAL }}>
                      Customers <span className="text-sm font-normal" style={{ color: MUTED }}>({customers.length})</span>
                    </h2>
                    <p className="text-xs" style={{ color: MUTED }}>Customers who ordered from your store</p>
                  </div>

                  {customers.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center" style={{ border: `1px solid ${BORDER}` }}>
                      <div className="text-6xl mb-4"><EmojiIcon emoji="👥" /></div>
                      <h3 className="font-black text-lg mb-2" style={{ color: CHARCOAL }}>No customers yet</h3>
                      <p className="text-sm" style={{ color: MUTED }}>Customers will appear here once they place orders</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customers.map(c => {
                        const totalSpent   = c.orders.reduce((s, o) => s + o.total, 0);
                        const pendingCount = c.orders.filter(o => o.status === "PENDING" || o.status === "PROCESSING").length;
                        const initials     = c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

                        return (
                          <div key={c.email} className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                            {/* Customer header */}
                            <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                                style={{ backgroundColor: GOLD }}>
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black truncate" style={{ color: CHARCOAL }}>{c.name}</p>
                                <p className="text-xs truncate" style={{ color: MUTED }}>{c.email}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-black" style={{ color: GOLD }}>{formatPrice(totalSpent)}</p>
                                <p className="text-[11px]" style={{ color: MUTED }}>total spent · {c.orders.length} order{c.orders.length !== 1 ? "s" : ""}</p>
                              </div>
                              {pendingCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 shrink-0">
                                  {pendingCount} pending
                                </span>
                              )}
                            </div>

                            {/* Order list */}
                            <div className="divide-y" style={{ borderColor: BORDER }}>
                              {c.orders.map(o => (
                                <div key={o.id} className="flex items-center justify-between px-5 py-3 gap-4">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold" style={{ color: CHARCOAL }}>{o.orderNumber}</p>
                                    <p className="text-[11px] truncate" style={{ color: MUTED }}>{o.product} × {o.qty}</p>
                                    <p className="text-[11px]" style={{ color: MUTED }}>{o.date}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-black mb-1" style={{ color: GOLD }}>{formatPrice(o.total)}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── ANALYTICS ── */}
            {tab === "analytics" && (
              <div className="space-y-5">
                <h2 className="font-black text-base" style={{ color: CHARCOAL }}>Analytics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { l:"Total Revenue",   v:"रू 8,40,000", sub:"All time"       },
                    { l:"This Month",      v:"रू 2,40,000", sub:"+12% vs last"   },
                    { l:"Avg Order Value", v:"रू 52,000",   sub:"Per order"      },
                    { l:"Conversion",      v:"3.8%",         sub:"Views → orders" },
                  ].map(s => (
                    <div key={s.l} className="bg-white rounded-2xl p-4 text-center" style={{ border: `1px solid ${BORDER}` }}>
                      <p className="text-lg font-black mb-1" style={{ color: GOLD }}>{s.v}</p>
                      <p className="text-xs font-semibold" style={{ color: CHARCOAL }}>{s.l}</p>
                      <p className="text-[11px]" style={{ color: MUTED }}><EmojiText>{s.sub}</EmojiText></p>
                    </div>
                  ))}
                </div>

                {/* Revenue bar chart */}
                <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
                  <h3 className="font-black text-sm mb-5" style={{ color: CHARCOAL }}>Monthly Revenue — 2025</h3>
                  <div className="flex items-end gap-1.5 h-36">
                    {[
                      { m:"Jan",v:180000 },{ m:"Feb",v:220000 },{ m:"Mar",v:195000 },
                      { m:"Apr",v:310000 },{ m:"May",v:240000 },{ m:"Jun",v:0 },
                      { m:"Jul",v:0 },    { m:"Aug",v:0 },    { m:"Sep",v:0 },
                      { m:"Oct",v:0 },    { m:"Nov",v:0 },    { m:"Dec",v:0 },
                    ].map(({ m, v }) => (
                      <div key={m} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-lg transition-all"
                          style={{ height: v ? `${(v / 310000) * 120}px` : "4px", backgroundColor: v ? GOLD : "#F0EBE0", minHeight: "4px" }} />
                        <span className="text-[9px]" style={{ color: MUTED }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top products */}
                <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
                  <h3 className="font-black text-sm mb-4" style={{ color: CHARCOAL }}>Top Selling Products</h3>
                  <div className="space-y-4">
                    {products.slice(0,3).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 text-[11px] font-black flex items-center justify-center rounded-full text-white shrink-0"
                          style={{ backgroundColor: [GOLD,"#9B6210","#D4A63A"][i] }}>
                          {i + 1}
                        </span>
                        <span className="text-xl"><EmojiIcon emoji={p.emoji} /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate mb-1" style={{ color: CHARCOAL }}>{p.name}</p>
                          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: IVORY }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${[100, 70, 45][i]}%`, backgroundColor: GOLD }} />
                          </div>
                        </div>
                        <p className="text-xs font-black shrink-0" style={{ color: GOLD }}>{formatPrice(p.basePrice)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PAYOUTS ── */}
            {tab === "payouts" && (
              <div className="space-y-5">
                <h2 className="font-black text-base" style={{ color: CHARCOAL }}>Payouts</h2>

                {/* Balance card */}
                <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #1C1A16 0%, #2D2418 100%)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#BBA882" }}>Available Balance</p>
                  <p className="text-4xl font-black text-white mb-1">रू 1,84,500</p>
                  <p className="text-xs mb-6" style={{ color: "#BBA882" }}>Next payout: 25 May 2025</p>
                  <button onClick={() => showToast("Withdrawal request submitted! Funds arrive within 2 business days.")}
                    className="px-8 py-2.5 rounded-full text-sm font-black text-white transition-all"
                    style={{ backgroundColor: GOLD }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#9B6210"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = GOLD}>
                    Withdraw Funds
                  </button>
                </div>

                {/* Transaction history */}
                <div className="bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <h3 className="font-black text-sm" style={{ color: CHARCOAL }}>Transaction History</h3>
                  </div>
                  {[
                    { date:"15 May 2025", amount:120000, type:"Payout",    status:"Completed" },
                    { date:"01 May 2025", amount:85000,  type:"Payout",    status:"Completed" },
                    { date:"28 Apr 2025", amount:15000,  type:"Refund",    status:"Processed" },
                    { date:"15 Apr 2025", amount:210000, type:"Payout",    status:"Completed" },
                    { date:"01 Apr 2025", amount:95000,  type:"Payout",    status:"Completed" },
                  ].map((t, i, arr) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: CHARCOAL }}>{t.type}</p>
                        <p className="text-[11px]" style={{ color: MUTED }}>{t.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black" style={{ color: t.type === "Refund" ? "#EF4444" : GOLD }}>
                          {t.type === "Refund" ? "−" : "+"}{formatPrice(t.amount)}
                        </p>
                        <span className="text-[10px] font-bold" style={{ color: "#22C55E" }}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CATEGORIES ── */}
            {tab === "categories" && <CategoriesTab showToast={showToast} />}

            {/* ── SETTINGS ── */}
            {tab === "settings" && <StoreSettings user={user} showToast={showToast} />}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <ProductModal product={modal.product} onSave={saveProduct} onClose={() => setModal({ open: false, product: null })} />
      )}
    </div>
  );
}
