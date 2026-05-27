"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore, useUIStore } from "@/app/lib/store";

const GOLD     = "#C68313";
const BORDER   = "#E8E8E8";
const MUTED    = "var(--color-muted)";
const CHARCOAL = "var(--color-heading)";

// ─── Nepal cascading address data ─────────────────────────────────────────────

const PROVINCES = [
  "Province 1", "Madhesh Province", "Bagmati Province", "Gandaki Province",
  "Lumbini Province", "Karnali Province", "Sudurpashchim Province",
];

const CITIES: Record<string, string[]> = {
  "Bagmati Province":       ["Kathmandu", "Lalitpur", "Bhaktapur", "Chitwan"],
  "Province 1":             ["Biratnagar", "Dharan", "Itahari", "Damak"],
  "Madhesh Province":       ["Birgunj", "Janakpur", "Rajbiraj", "Lahan"],
  "Gandaki Province":       ["Pokhara", "Damauli", "Baglung", "Gorkha"],
  "Lumbini Province":       ["Butwal", "Bhairahawa", "Nepalgunj", "Tulsipur"],
  "Karnali Province":       ["Surkhet", "Jumla", "Birendranagar"],
  "Sudurpashchim Province": ["Dhangadhi", "Mahendranagar", "Tikapur"],
};

const AREAS: Record<string, string[]> = {
  Kathmandu:  ["Thamel", "New Baneshwor", "Koteshwor", "Chabahil", "Balaju", "Kirtipur", "Bouddha", "Patan Dhoka"],
  Lalitpur:   ["Patan", "Jwalakhel", "Sanepa", "Kupondole", "Ekantakuna"],
  Bhaktapur:  ["Durbar Square", "Suryabinayak", "Thimi", "Katunje"],
  Chitwan:    ["Bharatpur", "Narayangadh", "Sauraha", "Ratnanagar"],
  Pokhara:    ["Lakeside", "Newroad", "Mahendrapul", "Prithvi Chowk"],
  Biratnagar: ["Traffic Chowk", "Rangeli", "Itahara", "Tamrakar Galli"],
  Birgunj:    ["Adarshanagar", "Powerhouse", "Narayani", "Ghantaghar"],
  Butwal:     ["Milanchowk", "Golpark", "Devinagar"],
  Dhangadhi:  ["Bhimdatta", "Pipalwana", "Attariya"],
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  building: string;
  colony: string;
  province: string;
  city: string;
  area: string;
  address: string;
  label: "HOME" | "OFFICE";
  isDefault: boolean;
};

const STORAGE_KEY = "peanut_saved_addresses";

function loadAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAddresses(list: SavedAddress[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FormField({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: MUTED }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm rounded outline-none transition-colors"
        style={{ border: `1px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "var(--color-bg)" }}
        onFocus={e => { e.currentTarget.style.borderColor = GOLD; }}
        onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, placeholder, options, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; options: string[]; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: MUTED }}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 text-sm rounded outline-none appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ border: `1px solid ${BORDER}`, color: value ? CHARCOAL : MUTED, backgroundColor: "var(--color-bg)" }}
          onFocus={e => { e.currentTarget.style.borderColor = GOLD; }}
          onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: MUTED }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Address Modal ────────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<SavedAddress, "id" | "isDefault"> = {
  fullName: "", phone: "", building: "", colony: "",
  province: "", city: "", area: "", address: "", label: "HOME",
};

function AddressModal({
  initial, onClose, onSave, title,
}: {
  initial: Omit<SavedAddress, "id" | "isDefault">;
  onClose: () => void;
  onSave: (data: Omit<SavedAddress, "id" | "isDefault">) => void;
  title: string;
}) {
  const [f, setF] = useState(initial);
  const set = <K extends keyof typeof f>(k: K, v: typeof f[K]) =>
    setF(prev => ({ ...prev, [k]: v }));

  const cities = CITIES[f.province] ?? [];
  const areas  = AREAS[f.city] ?? [];

  const valid = f.fullName.trim() && f.phone.trim() && f.province && f.city;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1A1814] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="text-lg font-black" style={{ color: CHARCOAL }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: MUTED }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Two-column form */}
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <FormField label="Full name *" value={f.fullName} onChange={v => set("fullName", v)} placeholder="Enter your first and last name" />
            <FormField label="Phone Number *" value={f.phone} onChange={v => set("phone", v)} placeholder="Please enter your phone number" type="tel" />
            <FormField label="Building / House No / Floor / Street" value={f.building} onChange={v => set("building", v)} placeholder="Please enter" />
            <FormField label="Colony / Suburb / Locality / Landmark" value={f.colony} onChange={v => set("colony", v)} placeholder="Please enter" />
          </div>
          <div className="space-y-4">
            <SelectField
              label="Region *"
              value={f.province}
              onChange={v => { set("province", v as any); set("city", ""); set("area", ""); }}
              placeholder="Please choose your region"
              options={PROVINCES}
            />
            <SelectField
              label="City *"
              value={f.city}
              onChange={v => { set("city", v as any); set("area", ""); }}
              placeholder="Please choose your city"
              options={cities}
              disabled={!f.province}
            />
            <SelectField
              label="Area"
              value={f.area}
              onChange={v => set("area", v as any)}
              placeholder="Please choose your area"
              options={areas}
              disabled={!f.city}
            />
            <FormField
              label="Address"
              value={f.address}
              onChange={v => set("address", v)}
              placeholder="For Example: House# 123, Street# 123, ABC Road"
            />
          </div>
        </div>

        {/* Label selector */}
        <div className="px-6 pb-5">
          <p className="text-sm font-semibold mb-3" style={{ color: CHARCOAL }}>
            Select a label for effective delivery:
          </p>
          <div className="flex gap-3">
            {(["OFFICE", "HOME"] as const).map(lbl => (
              <button
                key={lbl}
                onClick={() => set("label", lbl)}
                className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-bold transition-all"
                style={{
                  border: `2px solid ${f.label === lbl ? GOLD : BORDER}`,
                  color: f.label === lbl ? GOLD : MUTED,
                  backgroundColor: f.label === lbl ? "#FFF8F0" : "transparent",
                }}
              >
                {lbl === "OFFICE" ? "🏢" : "🏠"} {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded text-sm font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{ border: `1px solid ${BORDER}`, color: MUTED }}
          >
            CANCEL
          </button>
          <button
            onClick={() => valid && onSave(f)}
            disabled={!valid}
            className="flex-1 py-3 rounded text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: GOLD }}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Address Card ─────────────────────────────────────────────────────────────

function AddressCard({
  addr, selected, onSelect, onEdit, onDelete, onSetDefault,
}: {
  addr: SavedAddress;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const line = [addr.colony, addr.area, addr.city, addr.province].filter(Boolean).join(", ");

  return (
    <div
      className="rounded-xl p-4 cursor-pointer transition-all"
      style={{
        border: `2px solid ${selected ? GOLD : BORDER}`,
        backgroundColor: selected ? "#FFF8F0" : "var(--color-bg)",
      }}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Radio */}
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
          style={{ borderColor: selected ? GOLD : BORDER }}
        >
          {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[11px] font-black px-2 py-0.5 rounded text-white shrink-0"
              style={{ backgroundColor: GOLD }}
            >
              {addr.label}
            </span>
            {addr.isDefault && (
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded shrink-0"
                style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
              >
                Default
              </span>
            )}
            <span className="text-sm font-bold" style={{ color: CHARCOAL }}>{addr.fullName}</span>
            <span className="text-sm" style={{ color: MUTED }}>{addr.phone}</span>
          </div>
          <p className="text-sm" style={{ color: MUTED }}>{line || addr.address}</p>
          {addr.building && (
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>{addr.building}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="text-xs font-bold transition-opacity hover:opacity-70"
            style={{ color: GOLD }}
          >
            Edit
          </button>
          {!addr.isDefault && (
            <button
              onClick={onSetDefault}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: MUTED }}
            >
              Set default
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-xs font-semibold transition-colors hover:text-red-500"
            style={{ color: MUTED }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

export function CheckoutPage() {
  const { cartItems, cartTotal, cartShipping, clearCart } = useCartStore();
  const { nav, showToast } = useUIStore();
  const [addresses,  setAddresses]  = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [modal,      setModal]      = useState<{ mode: "add" | "edit"; addr?: SavedAddress } | null>(null);
  const [promoCode,  setPromoCode]  = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied,  setCouponApplied]  = useState<string | null>(null);
  const [couponError,    setCouponError]    = useState<string | null>(null);
  const [couponLoading,  setCouponLoading]  = useState(false);
  const [showPay,    setShowPay]    = useState(false);
  const [payMethod,  setPayMethod]  = useState("KHALTI");
  const [placing,    setPlacing]    = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);
  const [orderNum,   setOrderNum]   = useState("");

  const [deliveryRange, setDeliveryRange] = useState({ d1: "", d2: "" });

  // Client-only: load saved addresses + compute delivery date range
  useEffect(() => {
    const stored = loadAddresses();
    if (stored.length) {
      setAddresses(stored);
      setSelectedId(stored.find(a => a.isDefault)?.id ?? stored[0]?.id ?? "");
    }
    const today = new Date();
    const d1 = new Date(today); d1.setDate(d1.getDate() + 2);
    const d2 = new Date(today); d2.setDate(d2.getDate() + 3);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    setDeliveryRange({ d1: fmt(d1), d2: fmt(d2) });
  }, []);

  // Persist whenever addresses change (skip empty initial state)
  useEffect(() => {
    if (addresses.length > 0) saveAddresses(addresses);
  }, [addresses]);

  const selectedAddr = addresses.find(a => a.id === selectedId) ?? addresses[0];
  const deliveryFee  = cartShipping > 0 ? cartShipping : 170;
  const grandTotal   = cartTotal + deliveryFee - couponDiscount;

  const applyCoupon = async () => {
    if (!promoCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res  = await fetch("/api/coupons/validate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: promoCode, orderTotal: cartTotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid coupon");
        setCouponDiscount(0);
        setCouponApplied(null);
      } else {
        setCouponDiscount(data.discountAmount);
        setCouponApplied(data.coupon.code);
        showToast(`Coupon applied — रू ${data.discountAmount.toLocaleString()} off!`);
      }
    } catch {
      setCouponError("Failed to validate coupon");
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setCouponDiscount(0);
    setCouponApplied(null);
    setCouponError(null);
    setPromoCode("");
  };


  const handleSaveAddress = (data: Omit<SavedAddress, "id" | "isDefault">) => {
    if (modal?.mode === "edit" && modal.addr) {
      setAddresses(prev =>
        prev.map(a => a.id === modal.addr!.id ? { ...a, ...data } : a)
      );
    } else {
      const newAddr: SavedAddress = {
        ...data,
        id: `addr-${Date.now()}`,
        isDefault: addresses.length === 0,
      };
      setAddresses(prev => [...prev, newAddr]);
      setSelectedId(newAddr.id);
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    const remaining = addresses.filter(a => a.id !== id);
    if (remaining.length && addresses.find(a => a.id === id)?.isDefault) {
      remaining[0].isDefault = true;
    }
    setAddresses(remaining);
    if (selectedId === id) setSelectedId(remaining[0]?.id ?? "");
  };

  const handleSetDefault = (id: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const placeOrder = async () => {
    if (!selectedAddr) return;
    setPlacing(true);

    // Map local address fields to the API schema
    const street = [selectedAddr.building, selectedAddr.colony]
      .filter(Boolean).join(", ") || selectedAddr.address || selectedAddr.area || selectedAddr.city;

    let orderId: string;
    let orderNumber: string;
    let requiresPayment: boolean;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            fullName: selectedAddr.fullName,
            phone: selectedAddr.phone,
            street,
            city: selectedAddr.city,
            district: selectedAddr.city,
            province: selectedAddr.province,
            label: selectedAddr.label,
          },
          paymentMethod: payMethod,
          items: cartItems.map(i => ({ productId: i.productId ?? i.id, quantity: i.qty })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Failed to place order. Please try again.", "error");
        setPlacing(false);
        return;
      }

      orderId = data.order.id;
      orderNumber = data.order.orderNumber;
      requiresPayment = data.requiresPayment;
    } catch {
      showToast("Network error. Please try again.", "error");
      setPlacing(false);
      return;
    }

    clearCart();

    if (!requiresPayment) {
      setPlacing(false);
      setOrderNum(orderNumber);
      setConfirmed(true);
      showToast("Order placed successfully! 🎉");
      return;
    }

    // Initiate gateway payment
    try {
      if (payMethod === "KHALTI") {
        const res = await fetch("/api/payments/khalti", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const payData = await res.json();
        if (payData.paymentUrl) {
          window.location.href = payData.paymentUrl;
          return;
        }
        showToast(payData.error ?? "Failed to initiate Khalti payment.", "error");
      } else if (payMethod === "ESEWA") {
        const res = await fetch("/api/payments/esewa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const payData = await res.json();
        if (payData.params) {
          // eSewa requires a form POST to their gateway
          const form = document.createElement("form");
          form.method = "POST";
          form.action = "https://uat.esewa.com.np/epay/main";
          form.style.display = "none";
          Object.entries(payData.params).forEach(([k, v]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = k;
            input.value = String(v);
            form.appendChild(input);
          });
          document.body.appendChild(form);
          form.submit();
          return;
        }
        showToast(payData.error ?? "Failed to initiate eSewa payment.", "error");
      }
    } catch {
      showToast("Payment gateway error. Your order was saved — contact support.", "error");
    }

    setPlacing(false);
  };

  // ── Confirmation screen ────────────────────────────────────
  if (confirmed) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 text-5xl" style={{ backgroundColor: "#DCFCE7" }}>
        ✅
      </div>
      <h2 className="text-2xl font-black mb-2" style={{ color: CHARCOAL }}>Order Confirmed!</h2>
      <div className="rounded-2xl p-4 mb-6 inline-block" style={{ backgroundColor: "#FFF8F0", border: `1px solid ${BORDER}` }}>
        <p className="text-xs mb-1" style={{ color: MUTED }}>Order Number</p>
        <p className="text-2xl font-black" style={{ color: GOLD }}>{orderNum}</p>
      </div>
      <p className="text-sm mb-8" style={{ color: MUTED }}>We'll send a confirmation to your email.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => nav("orders")} className="px-6 py-3 text-white font-bold rounded-xl" style={{ backgroundColor: GOLD }}>
          Track Order
        </button>
        <button onClick={() => nav("home")} className="px-6 py-3 font-bold rounded-xl" style={{ border: `1px solid ${BORDER}`, color: CHARCOAL }}>
          Continue Shopping
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Address modal */}
      {modal && (
        <AddressModal
          title={modal.mode === "add" ? "Add new shipping Address" : "Edit shipping Address"}
          initial={modal.addr ? {
            fullName: modal.addr.fullName, phone: modal.addr.phone,
            building: modal.addr.building, colony: modal.addr.colony,
            province: modal.addr.province, city: modal.addr.city,
            area: modal.addr.area, address: modal.addr.address, label: modal.addr.label,
          } : EMPTY_FORM}
          onClose={() => setModal(null)}
          onSave={handleSaveAddress}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-5 items-start">

        {/* ── Left column ──────────────────────────────────── */}
        <div className="space-y-3">

          {/* Shipping address section */}
          <div className="bg-white dark:bg-[#1A1814] rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>

            {/* Section header */}
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <h2 className="font-black text-base" style={{ color: CHARCOAL }}>Shipping Address</h2>
              <button
                onClick={() => setModal({ mode: "add" })}
                className="flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-70"
                style={{ color: GOLD }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Add New Address
              </button>
            </div>

            {/* Address cards list */}
            <div className="p-4 space-y-3">
              {addresses.length === 0 ? (
                <div className="text-center py-8" style={{ color: MUTED }}>
                  <p className="text-sm mb-3">No saved addresses yet.</p>
                  <button
                    onClick={() => setModal({ mode: "add" })}
                    className="text-sm font-bold underline"
                    style={{ color: GOLD }}
                  >
                    Add your first address
                  </button>
                </div>
              ) : (
                addresses.map(addr => (
                  <AddressCard
                    key={addr.id}
                    addr={addr}
                    selected={selectedId === addr.id}
                    onSelect={() => setSelectedId(addr.id)}
                    onEdit={() => setModal({ mode: "edit", addr })}
                    onDelete={() => handleDelete(addr.id)}
                    onSetDefault={() => handleSetDefault(addr.id)}
                  />
                ))
              )}
            </div>

            {/* Collect nearby tip — shown when an address is selected */}
            {selectedAddr && (
              <div className="px-5 pb-4">
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ border: `1.5px dashed ${GOLD}`, backgroundColor: "#FFF8F0" }}
                >
                  <button className="flex items-center justify-between gap-2 w-full text-sm font-semibold" style={{ color: GOLD }}>
                    <span>Collect your parcels from a nearby location at a minimal delivery fee.</span>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>1 suggested collection point(s) nearby</p>
                </div>
              </div>
            )}
          </div>

          {/* Package & items */}
          <div className="bg-white dark:bg-[#1A1814] rounded-xl p-5" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-sm" style={{ color: CHARCOAL }}>Package 1 of 1</span>
              <span className="text-xs" style={{ color: MUTED }}>
                Shipped by <span className="font-bold" style={{ color: CHARCOAL }}>TechMart Nepal</span>
              </span>
            </div>

            {/* Delivery option */}
            <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Delivery or Pickup</p>
            <div
              className="flex items-start gap-3 p-3 rounded-xl mb-5 cursor-pointer"
              style={{ border: `2px solid ${GOLD}`, backgroundColor: "#FFF8F0" }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                style={{ borderColor: GOLD }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
              </div>
              <div>
                <p className="text-sm font-black" style={{ color: CHARCOAL }}>रू {deliveryFee}</p>
                <p className="text-xs font-semibold" style={{ color: CHARCOAL }}>Standard Delivery</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {deliveryRange.d1 && deliveryRange.d2 ? `Guaranteed by ${deliveryRange.d1}–${deliveryRange.d2}` : "2–3 day delivery"}
                </p>
              </div>
            </div>

            {/* Cart items */}
            <div className="space-y-4" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
              {cartItems.map(item => {
                const price = Number(item.basePrice ?? item.price ?? 0);
                const orig  = Number((item as any).comparePrice ?? 0);
                const disc  = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0"
                      style={{ border: `1px solid ${BORDER}`, backgroundColor: "#F9F9F9" }}
                    >
                      {(item as any).images?.[0]?.url ? (
                        <Image
                          src={(item as any).images[0].url}
                          alt={item.name ?? ""}
                          fill sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-2" style={{ color: CHARCOAL }}>{item.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-black text-sm" style={{ color: GOLD }}>रू {price.toLocaleString()}</span>
                        {orig > price && (
                          <span className="text-xs line-through" style={{ color: MUTED }}>रू {orig.toLocaleString()}</span>
                        )}
                        {disc > 0 && (
                          <span className="text-xs font-bold" style={{ color: "#EF4444" }}>-{disc}%</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm" style={{ color: MUTED }}>
                      Qty: <span className="font-bold" style={{ color: CHARCOAL }}>{item.qty}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────── */}
        <div className="h-fit sticky top-24 space-y-3">

          {/* Promotion */}
          <div className="bg-white dark:bg-[#1A1814] rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <h3 className="font-black text-sm mb-3" style={{ color: CHARCOAL }}>Promotion</h3>
            {couponApplied ? (
              <div className="flex items-center justify-between px-3 py-2 rounded" style={{ backgroundColor: "#DCFCE7", border: "1px solid #16A34A" }}>
                <span className="text-sm font-semibold text-green-700">✓ {couponApplied} — रू {couponDiscount.toLocaleString()} off</span>
                <button onClick={removeCoupon} className="text-xs text-green-600 hover:text-red-500 font-bold transition-colors">Remove</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value); setCouponError(null); }}
                    onKeyDown={e => e.key === "Enter" && applyCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 text-sm rounded outline-none"
                    style={{ border: `1px solid ${couponError ? "#EF4444" : BORDER}`, color: CHARCOAL, backgroundColor: "var(--color-bg)" }}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !promoCode.trim()}
                    className="px-4 py-2 rounded text-sm font-bold text-white shrink-0 disabled:opacity-50"
                    style={{ backgroundColor: GOLD }}
                  >
                    {couponLoading ? "…" : "APPLY"}
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
              </>
            )}
          </div>

          {/* Invoice */}
          <div className="bg-white dark:bg-[#1A1814] rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm" style={{ color: CHARCOAL }}>Invoice and Contact Info</h3>
              <button className="text-sm font-bold" style={{ color: GOLD }}>Edit</button>
            </div>
          </div>

          {/* Order detail */}
          <div className="bg-white dark:bg-[#1A1814] rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <h3 className="font-black text-sm mb-3" style={{ color: CHARCOAL }}>Order Detail</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: MUTED }}>Items Total ({cartItems.length} Item{cartItems.length !== 1 ? "s" : ""})</span>
                <span className="font-semibold" style={{ color: CHARCOAL }}>रू {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: MUTED }}>Delivery Fee</span>
                <span className="font-semibold" style={{ color: CHARCOAL }}>रू {deliveryFee.toLocaleString()}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "#16A34A" }}>Coupon ({couponApplied})</span>
                  <span className="font-semibold text-green-600">− रू {couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                <span style={{ color: CHARCOAL }}>Total:</span>
                <span style={{ color: GOLD }}>रू {grandTotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-right" style={{ color: MUTED }}>All taxes included</p>
            </div>
          </div>

          {/* Payment — revealed after Proceed to Pay */}
          {showPay && (
            <div className="bg-white dark:bg-[#1A1814] rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="font-black text-sm mb-3" style={{ color: CHARCOAL }}>Payment Method</h3>
              <div className="space-y-2">
                {[
                  { id: "KHALTI",           label: "Khalti",           icon: "🟣" },
                  { id: "ESEWA",            label: "eSewa",            icon: "🟢" },
                  { id: "CASH_ON_DELIVERY", label: "Cash on Delivery", icon: "💵" },
                ].map(m => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                    style={{
                      border: `1.5px solid ${payMethod === m.id ? GOLD : BORDER}`,
                      backgroundColor: payMethod === m.id ? "#FFF8F0" : "transparent",
                    }}
                  >
                    <input type="radio" name="pay" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} className="sr-only"/>
                    <span className="text-lg">{m.icon}</span>
                    <span className="flex-1 text-sm font-semibold" style={{ color: CHARCOAL }}>{m.label}</span>
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: payMethod === m.id ? GOLD : BORDER }}>
                      {payMethod === m.id && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }}/>}
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={placeOrder}
                disabled={placing || !selectedAddr}
                className="w-full mt-3 py-3 rounded text-white font-black text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: GOLD }}
              >
                {placing && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
                {placing ? "Placing Order…" : "Confirm & Place Order"}
              </button>
            </div>
          )}

          {!showPay && (
            <button
              onClick={() => setShowPay(true)}
              disabled={!selectedAddr || addresses.length === 0}
              className="w-full py-3.5 rounded text-white font-black text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: GOLD }}
            >
              Proceed to Pay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
