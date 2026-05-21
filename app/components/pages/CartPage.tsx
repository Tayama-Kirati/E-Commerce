"use client";
import { useState } from "react";
import Image from "next/image";
import { useCartStore, useUIStore, useAuthStore } from "@/app/lib/store";

const GOLD    = "#C68313";
const BORDER  = "#E8E8E8";
const MUTED   = "var(--color-muted)";
const CHARCOAL = "var(--color-heading)";

export function CartPage() {
  const { cartItems, removeItem, updateQty, clearCart } = useCartStore();
  const { nav } = useUIStore();
  const { user } = useAuthStore();

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(cartItems.map(i => i.id))
  );
  const [voucher, setVoucher] = useState("");

  const allSelected = cartItems.length > 0 && cartItems.every(i => selected.has(i.id));

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(cartItems.map(i => i.id)));

  const toggleItem = (id: string) =>
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const selectedItems   = cartItems.filter(i => selected.has(i.id));
  const selectedCount   = selectedItems.length;
  const selectedTotal   = selectedItems.reduce((s, i) => s + Number(i.basePrice ?? i.price ?? 0) * i.qty, 0);
  const selectedShip    = selectedTotal >= 1000 || selectedItems.every(i => i.freeShipping) ? 0 : (selectedItems.length ? 150 : 0);
  const selectedGrand   = selectedTotal + selectedShip;

  // Group items by seller
  const grouped = cartItems.reduce<Record<string, typeof cartItems>>((acc, item) => {
    const key = item.seller?.storeName ?? "PeaNut Store";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  if (cartItems.length === 0) return (
    <div className="max-w-6xl mx-auto px-4 py-24 text-center">
      <div className="text-7xl mb-5">🛒</div>
      <h2 className="text-2xl font-black mb-2" style={{ color: CHARCOAL }}>Your cart is empty</h2>
      <p className="text-sm mb-8" style={{ color: MUTED }}>Add some amazing products to get started!</p>
      <button onClick={() => nav("products")} className="px-8 py-3.5 text-white font-black rounded-xl" style={{ backgroundColor: GOLD }}>
        Start Shopping
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

        {/* ── Left: Cart items ─────────────────────────────── */}
        <div>
          {/* Select all header */}
          <div
            className="flex items-center justify-between px-4 py-3 mb-2 rounded-xl bg-white dark:bg-[#1A1814]"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded cursor-pointer accent-[#C68313]"
              />
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                SELECT ALL ({cartItems.length} ITEM{cartItems.length !== 1 ? "S" : ""})
              </span>
            </label>
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-red-500"
              style={{ color: MUTED }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              DELETE
            </button>
          </div>

          {/* Seller groups */}
          {Object.entries(grouped).map(([sellerName, items]) => {
            const allSellerSel = items.every(i => selected.has(i.id));
            const sellerSelTotal = items.filter(i => selected.has(i.id))
              .reduce((s, i) => s + Number(i.basePrice ?? i.price ?? 0) * i.qty, 0);
            const threshold = 1000;
            const remaining = Math.max(0, threshold - sellerSelTotal);
            const progress  = Math.min(100, (sellerSelTotal / threshold) * 100);

            return (
              <div
                key={sellerName}
                className="bg-white dark:bg-[#1A1814] rounded-xl overflow-hidden mb-3"
                style={{ border: `1px solid ${BORDER}` }}
              >
                {/* Seller row */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <input
                    type="checkbox"
                    checked={allSellerSel}
                    onChange={() => {
                      const s = new Set(selected);
                      if (allSellerSel) items.forEach(i => s.delete(i.id));
                      else items.forEach(i => s.add(i.id));
                      setSelected(s);
                    }}
                    className="w-4 h-4 rounded cursor-pointer accent-[#C68313]"
                  />
                  <svg className="w-4 h-4 shrink-0" style={{ color: MUTED }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span className="text-sm font-bold" style={{ color: CHARCOAL }}>{sellerName}</span>
                  <svg className="w-4 h-4" style={{ color: MUTED }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>

                {/* Free shipping progress */}
                {remaining > 0 && (
                  <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "#FFF8F0" }}>
                    <p className="text-xs mb-1.5" style={{ color: MUTED }}>
                      Spend{" "}
                      <span className="font-bold" style={{ color: GOLD }}>रू {remaining.toLocaleString()}</span>
                      {" "}more to enjoy free Standard delivery
                    </p>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: GOLD }}
                      />
                    </div>
                  </div>
                )}

                {/* Items */}
                {items.map((item, idx) => {
                  const price = Number(item.basePrice ?? item.price ?? 0);
                  const orig  = Number(item.comparePrice ?? 0);
                  const disc  = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 px-4 py-4"
                      style={{ borderTop: idx > 0 ? `1px solid ${BORDER}` : undefined }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-[#C68313] mt-8 shrink-0"
                      />

                      {/* Image */}
                      <div
                        className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0"
                        style={{ border: `1px solid ${BORDER}`, backgroundColor: "#F9F9F9" }}
                      >
                        {(item as any).images?.[0]?.url ? (
                          <Image
                            src={(item as any).images[0].url}
                            alt={item.name ?? ""}
                            fill sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: CHARCOAL }}>
                          {item.name}
                        </p>
                        <p className="text-xs mb-2" style={{ color: MUTED }}>No Brand</p>

                        <div className="flex items-center justify-between flex-wrap gap-3">
                          {/* Price block */}
                          <div>
                            <span className="font-black text-base" style={{ color: GOLD }}>
                              रू {price.toLocaleString()}
                            </span>
                            {orig > price && (
                              <>
                                <span className="text-xs line-through ml-2" style={{ color: MUTED }}>
                                  रू {orig.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold ml-1" style={{ color: "#EF4444" }}>
                                  -{disc}%
                                </span>
                              </>
                            )}
                            {(item.stock ?? 99) <= 10 && (item.stock ?? 99) > 0 && (
                              <p className="text-xs font-semibold mt-0.5" style={{ color: GOLD }}>
                                {item.stock} item(s) left
                              </p>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2">
                            {/* Wishlist */}
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-red-50"
                              style={{ color: MUTED }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                              </svg>
                            </button>

                            {/* Qty */}
                            <div className="flex items-center rounded" style={{ border: `1px solid ${BORDER}` }}>
                              <button
                                onClick={() => updateQty(item.id, item.qty - 1)}
                                className="w-8 h-8 flex items-center justify-center text-base font-bold transition-colors hover:bg-gray-50"
                                style={{ color: MUTED }}
                              >−</button>
                              <span className="w-8 text-center text-sm font-bold" style={{ color: CHARCOAL }}>
                                {item.qty}
                              </span>
                              <button
                                onClick={() => updateQty(item.id, item.qty + 1)}
                                disabled={item.qty >= (item.stock ?? 99)}
                                className="w-8 h-8 flex items-center justify-center text-base font-bold transition-colors hover:bg-gray-50 disabled:opacity-30"
                                style={{ color: MUTED }}
                              >+</button>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-red-50"
                              style={{ color: MUTED }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── Right: Order Summary ──────────────────────────── */}
        <div className="h-fit sticky top-24">
          <div className="bg-white dark:bg-[#1A1814] rounded-xl p-5" style={{ border: `1px solid ${BORDER}` }}>
            <h2 className="font-black text-base mb-4" style={{ color: CHARCOAL }}>Order Summary</h2>

            <div className="space-y-2.5 text-sm mb-4">
              <div className="flex justify-between">
                <span style={{ color: MUTED }}>
                  Subtotal ({selectedCount} item{selectedCount !== 1 ? "s" : ""})
                </span>
                <span className="font-semibold" style={{ color: CHARCOAL }}>
                  रू {selectedTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: MUTED }}>Shipping Fee</span>
                <span className="font-semibold" style={{ color: selectedShip === 0 && selectedCount > 0 ? "#16A34A" : CHARCOAL }}>
                  {selectedShip === 0 && selectedCount > 0 ? "Free 🎉" : `रू ${selectedShip.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Voucher */}
            <div className="flex gap-2 mb-4">
              <input
                value={voucher}
                onChange={e => setVoucher(e.target.value)}
                placeholder="Enter Voucher Code"
                className="flex-1 px-3 py-2 text-sm rounded outline-none"
                style={{ border: `1px solid ${BORDER}`, color: CHARCOAL, backgroundColor: "var(--color-bg)" }}
              />
              <button
                className="px-4 py-2 rounded text-sm font-bold text-white shrink-0"
                style={{ backgroundColor: GOLD }}
              >
                APPLY
              </button>
            </div>

            {/* Total */}
            <div
              className="flex justify-between font-black text-base mb-5 pt-3"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <span style={{ color: CHARCOAL }}>Total</span>
              <span style={{ color: GOLD }}>रू {selectedGrand.toLocaleString()}</span>
            </div>

            {user ? (
              <button
                onClick={() => nav("checkout")}
                disabled={selectedCount === 0}
                className="w-full py-3.5 rounded text-white font-black text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: GOLD }}
              >
                PROCEED TO CHECKOUT({selectedCount})
              </button>
            ) : (
              <button
                onClick={() => nav("role-select")}
                className="w-full py-3.5 rounded text-white font-black text-sm hover:opacity-90"
                style={{ backgroundColor: GOLD }}
              >
                SIGN IN TO CHECKOUT
              </button>
            )}

            <button
              onClick={() => nav("products")}
              className="w-full mt-3 text-sm font-semibold transition-colors hover:underline"
              style={{ color: GOLD }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
