import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  ids:          Set<string>;
  isLoaded:     boolean;
  toggle:       (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loadFromServer:() => Promise<void>;
  clear:        () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids:      new Set<string>(),
      isLoaded: false,

      isInWishlist: (id) => get().ids.has(id),

      toggle: async (productId) => {
        const res  = await fetch("/api/user/wishlist", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        set((state) => {
          const newIds = new Set(state.ids);
          if (data.wishlisted) newIds.add(productId);
          else                 newIds.delete(productId);
          return { ids: newIds };
        });
      },

      loadFromServer: async () => {
        try {
          const res  = await fetch("/api/user/wishlist");
          const data = await res.json();
          if (res.ok) {
            set({
              ids:      new Set(data.items.map((i: any) => i.productId)),
              isLoaded: true,
            });
          }
        } catch { /* silently fail for unauthenticated users */ }
      },

      clear: () => set({ ids: new Set(), isLoaded: false }),
    }),
    {
      name:    "nexmart-wishlist",
      storage: {
        // Custom serializer since Set isn't JSON serializable
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return { ...parsed, state: { ...parsed.state, ids: new Set(parsed.state.ids ?? []) } };
        },
        setItem: (name, value) => {
          const toStore = { ...value, state: { ...value.state, ids: Array.from(value.state.ids) } };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);


 
 
 

 
 