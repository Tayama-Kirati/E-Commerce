"use client";

import { create } from "zustand";

interface UIStore {
  mobileMenuOpen:    boolean;
  notifPanelOpen:    boolean;
  commandPaletteOpen:boolean;

  toggleMobileMenu:     () => void;
  closeMobileMenu:      () => void;
  toggleNotifPanel:     () => void;
  closeNotifPanel:      () => void;
  toggleCommandPalette: () => void;
  closeCommandPalette:  () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  mobileMenuOpen:    false,
  notifPanelOpen:    false,
  commandPaletteOpen:false,

  toggleMobileMenu:     () => set((s) => ({ mobileMenuOpen:    !s.mobileMenuOpen    })),
  closeMobileMenu:      () => set({ mobileMenuOpen: false }),
  toggleNotifPanel:     () => set((s) => ({ notifPanelOpen:    !s.notifPanelOpen    })),
  closeNotifPanel:      () => set({ notifPanelOpen: false }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen:!s.commandPaletteOpen })),
  closeCommandPalette:  () => set({ commandPaletteOpen: false }),
}));


// ─────────────────────────────────────────────────────────────────────────────
// store/wishlistStore.ts
// Wishlist persisted to localStorage, synced to /api/user/wishlist on login
// Used by: ProductCard, WishlistPage (nexmart-cart-customer/04)
// ─────────────────────────────────────────────────────────────────────────────

import { persist } from "zustand/middleware";

interface WishlistStore {
  ids:    string[];
  isIn:   (id: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  load:   () => Promise<void>;
  clear:  () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],

      isIn: (id) => get().ids.includes(id),

      toggle: async (productId) => {
        const already = get().ids.includes(productId);
        // Optimistic
        set({ ids: already ? get().ids.filter((x) => x !== productId) : [...get().ids, productId] });
        // Server sync — silently ignored for guests
        try {
          await fetch("/api/user/wishlist", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ productId }),
          });
        } catch { /* guest-only, skip */ }
      },

      load: async () => {
        try {
          const res  = await fetch("/api/user/wishlist");
          if (!res.ok) return;
          const data = await res.json();
          set({ ids: (data.items ?? []).map((i: any) => i.productId as string) });
        } catch { /* ignore */ }
      },

      clear: () => set({ ids: [] }),
    }),
    { name: "nexmart-wishlist-v1", partialize: (s) => ({ ids: s.ids }) }
  )
);