"use client";

import { create }   from "zustand";
import { persist }  from "zustand/middleware";
import { toast }    from "react-hot-toast";


export interface CartItem {
  id?:          string;   // server-side cart item ID (set after sync)
  productId:    string;
  variantId?:   string | null;
  name:         string;
  slug:         string;
  image?:       string | null;
  price:        number;
  originalPrice?:number;
  discountPercent?:number;
  quantity:     number;
  stock:        number;
  maxQty:       number;
  available:    boolean;
  sku?:         string | null;
  sellerId?:    string;
  sellerName?:  string;
  variantName?: string | null;
  freeShipping: boolean;
  isEco:        boolean;
  stockWarning?:string;
}

interface CartSummary {
  subtotal:    number;
  totalItems:  number;
  savings:     number;
  shippingCost:number;
  freeShipping:boolean;
  total:       number;
  threshold:   number;  // rems needed for free shipping
  hasUnavailable:boolean;
}

interface CartStore {
  // State
  items:         CartItem[];
  savedItems:    CartItem[];
  summary:       CartSummary;
  isOpen:        boolean;
  isSyncing:     boolean;
  lastSynced:    number | null;   // timestamp
  isServerCart:  boolean;         // true once loaded from server

  // Cart actions
  addItem:       (productId: string, variantId?: string | null, quantity?: number) => Promise<void>;
  removeItem:    (productId: string, variantId?: string | null) => Promise<void>;
  updateQty:     (productId: string, quantity: number, variantId?: string | null) => Promise<void>;
  saveForLater:  (productId: string, variantId?: string | null) => Promise<void>;
  moveToCart:    (productId: string, variantId?: string | null) => Promise<void>;
  clearCart:     () => Promise<void>;

  // Sync
  syncFromServer:() => Promise<void>;
  mergeGuestCart:() => Promise<void>;

  // UI
  toggleCart:    () => void;
  openCart:      () => void;
  closeCart:     () => void;

  // Helpers
  itemCount:     () => number;
  getItem:       (productId: string, variantId?: string | null) => CartItem | undefined;
  isInCart:      (productId: string, variantId?: string | null) => boolean;

  // Internal
  _setItems:     (items: CartItem[], saved: CartItem[], summary: CartSummary) => void;
  _computeSummary:(items: CartItem[]) => CartSummary;
}

const defaultSummary: CartSummary = {
  subtotal:0, totalItems:0, savings:0, shippingCost:150,
  freeShipping:false, total:150, threshold:1000, hasUnavailable:false,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items:        [],
      savedItems:   [],
      summary:      defaultSummary,
      isOpen:       false,
      isSyncing:    false,
      lastSynced:   null,
      isServerCart: false,

       

      syncFromServer: async () => {
        set({ isSyncing: true });
        try {
          const res  = await fetch("/api/cart");
          if (!res.ok) throw new Error();
          const data = await res.json();

          const mapItem = (raw: any): CartItem => ({
            id:             raw.id,
            productId:      raw.productId,
            variantId:      raw.variantId,
            name:           raw.product.name,
            slug:           raw.product.slug,
            image:          raw.variant?.image ?? raw.product.images?.[0]?.url ?? null,
            price:          raw.price,
            originalPrice:  raw.originalPrice,
            discountPercent:raw.discountPercent,
            quantity:       raw.quantity,
            stock:          raw.stock,
            maxQty:         raw.maxQty,
            available:      raw.available,
            sku:            raw.variant?.sku ?? null,
            sellerId:       raw.product.seller?.id,
            sellerName:     raw.product.seller?.storeName,
            variantName:    raw.variant?.name ?? null,
            freeShipping:   raw.product.freeShipping,
            isEco:          raw.product.isEco,
            stockWarning:   raw.stockWarning,
          });

          set({
            items:        data.items.map(mapItem),
            savedItems:   data.savedItems.map(mapItem),
            summary:      data.summary,
            isSyncing:    false,
            lastSynced:   Date.now(),
            isServerCart: true,
          });
        } catch {
          set({ isSyncing: false });
        }
      },

       

      mergeGuestCart: async () => {
        const { items } = get();
        if (!items.length) return;
        await fetch("/api/cart/merge", {
          method:  "POST",
          headers: { "Content-Type":"application/json" },
          body:    JSON.stringify({
            items: items.map((i) => ({ productId:i.productId, variantId:i.variantId, quantity:i.quantity })),
          }),
        });
        await get().syncFromServer();
      },

       

      addItem: async (productId, variantId, quantity = 1) => {
        // Optimistic update
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
                  ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxQty) }
                  : i
              ),
            };
          }
          return state;
        });

        try {
          const res  = await fetch("/api/cart", {
            method:  "POST",
            headers: { "Content-Type":"application/json" },
            body:    JSON.stringify({ productId, variantId, quantity }),
          });
          const data = await res.json();

          if (!res.ok) {
            // Revert optimistic update
            await get().syncFromServer();
            throw new Error(data.error ?? "Failed to add item");
          }
          // Sync to get accurate server state
          await get().syncFromServer();
        } catch (err) {
          throw err;
        }
      },

       
      removeItem: async (productId, variantId) => {
        const item = get().items.find(
          (i) => i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
        );
        // Optimistic
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && (i.variantId ?? null) === (variantId ?? null))
          ),
        }));

        if (item?.id) {
          const res = await fetch(`/api/cart/${item.id}`, { method: "DELETE" });
          if (!res.ok) await get().syncFromServer();
        }
        // Recompute summary
        const { items } = get();
        set({ summary: get()._computeSummary(items) });
      },

       

      updateQty: async (productId, quantity, variantId) => {
        if (quantity === 0) { await get().removeItem(productId, variantId); return; }

        // Optimistic
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
              ? { ...i, quantity: Math.min(quantity, i.maxQty) }
              : i
          ),
        }));

        const item = get().items.find(
          (i) => i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
        );
        if (item?.id) {
          const res = await fetch(`/api/cart/${item.id}`, {
            method:  "PATCH",
            headers: { "Content-Type":"application/json" },
            body:    JSON.stringify({ quantity }),
          });
          if (!res.ok) {
            const data = await res.json();
            toast.error(data.error ?? "Update failed");
            await get().syncFromServer();
          }
        }
        const { items } = get();
        set({ summary: get()._computeSummary(items) });
      },

       

      saveForLater: async (productId, variantId) => {
        const item = get().items.find(
          (i) => i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
        );
        if (!item) return;

        set((state) => ({
          items:      state.items.filter((i) => !(i.productId === productId && (i.variantId??null) === (variantId??null))),
          savedItems: [...state.savedItems, { ...item }],
        }));

        if (item.id) {
          await fetch(`/api/cart/${item.id}`, {
            method:  "PATCH",
            headers: { "Content-Type":"application/json" },
            body:    JSON.stringify({ savedForLater: true }),
          });
        }
      },

       

      moveToCart: async (productId, variantId) => {
        const item = get().savedItems.find(
          (i) => i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
        );
        if (!item) return;

        set((state) => ({
          items:      [...state.items, { ...item }],
          savedItems: state.savedItems.filter((i) => !(i.productId === productId && (i.variantId??null) === (variantId??null))),
        }));

        if (item.id) {
          await fetch(`/api/cart/${item.id}`, {
            method:  "PATCH",
            headers: { "Content-Type":"application/json" },
            body:    JSON.stringify({ savedForLater: false }),
          });
        }
      },

       
      clearCart: async () => {
        set({ items: [], summary: defaultSummary });
        await fetch("/api/cart", { method: "DELETE" });
      },
 

      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart:   () => set({ isOpen: true  }),
      closeCart:  () => set({ isOpen: false }),

       

      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),

      getItem: (productId, variantId) =>
        get().items.find(
          (i) => i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
        ),

      isInCart: (productId, variantId) => !!get().getItem(productId, variantId),

       

      _setItems: (items, saved, summary) => set({ items, savedItems: saved, summary }),

      _computeSummary: (items) => {
        const subtotal   = items.reduce((s,i) => s + i.price * i.quantity, 0);
        const totalItems = items.reduce((s,i) => s + i.quantity, 0);
        const savings    = items.reduce((s,i) => s + ((i.originalPrice ?? i.price) - i.price) * i.quantity, 0);
        const free       = subtotal >= 1000 || items.every((i) => i.freeShipping);
        return {
          subtotal, totalItems, savings,
          shippingCost:    free ? 0 : 150,
          freeShipping:    free,
          total:           subtotal + (free ? 0 : 150),
          threshold:       free ? 0 : Math.max(0, 1000 - subtotal),
          hasUnavailable:  items.some((i) => !i.available),
        };
      },
    }),
    {
      name:    "peanut-cart-v2",
      partialize:(state) => ({
        items:       state.items,
        savedItems:  state.savedItems,
        summary:     state.summary,
      }),
    }
  )
);


 