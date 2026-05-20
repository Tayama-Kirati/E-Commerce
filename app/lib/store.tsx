"use client";
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Parameters<typeof clsx>) { return twMerge(clsx(inputs)); }

// ── Types  
export type User = {
  name: string;
  email: string;
  role: string;
  loyaltyPoints?: number;
  loyaltyTier?: string;
};
export type Session = { user: User };
export type Toast = { msg: string; type: "success" | "error" | string; id: number };

export type Product = {
  id: string;
  name: string;
  basePrice: number;
  stock: number;
  freeShipping: boolean;
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  stock: number;
  freeShipping: boolean;
  qty: number;
  emoji?: string;
  cartItemId?: string;
  [key: string]: any;
};

export type CartContextType = {
  cartItems: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  syncFromServer: () => void;
  mergeGuestCart: () => void;
  cartSyncing: boolean;
  cartCount: number;
  cartTotal: number;
  cartShipping: number;
  cartGrand: number;
  toggleCart: () => void;
  itemCount: () => number;
  total: () => number;
};

export type UIContextType = {
  page: string;
  nav: (page: string, data?: any) => void;
  pageData: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  notifPanelOpen: boolean;
  toggleNotifPanel: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  toast: Toast | null;
};

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
};

export type WishContextType = {
  ids: string[];
  toggle: (productId: string) => void;
  isIn: (productId: string) => boolean;
};

// ── Utilities ─────────────────────────────────────────────────────────────────

export const formatPrice = (n: any) => `रू ${Number(n).toLocaleString("en-NP")}`;

export function timeAgo(date: any) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" });
}

export const generateOrderNumber = () =>
  `NX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

export function useDebounce(value: any, delay: any) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

// ── Mock Data  

export const MOCK_CATEGORIES = [
  { id: "electronics", name: "Electronics",   icon: "💻", slug: "electronics"  },
  { id: "fashion",     name: "Fashion",        icon: "👗", slug: "fashion"      },
  { id: "home",        name: "Home & Living",  icon: "🏠", slug: "home-living"  },
  { id: "beauty",      name: "Beauty",         icon: "💄", slug: "health-beauty"},
  { id: "sports",      name: "Sports",         icon: "⚽", slug: "sports"       },
  { id: "books",       name: "Books",          icon: "📚", slug: "books"        },
];

export const MOCK_PRODUCTS = [
  { id:"1",  name:"Apple iPhone 16 Pro Max",  slug:"iphone-16-pro-max-256gb", category:{name:"Electronics"}, basePrice:195000, comparePrice:215000, stock:12,  rating:4.9, totalReviews:2847, images:[{url:null}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:true,  isFlashSale:true,  badge:"New",      emoji:"📱" },
  { id:"2",  name:"Sony WH-1000XM6",          slug:"sony-wh-1000xm6",         category:{name:"Electronics"}, basePrice:38500,  comparePrice:45000,  stock:45,  rating:4.8, totalReviews:1203, images:[{url:null}], seller:{storeName:"SonyNepal",storeSlug:"sonynepal"},     isEco:true,  freeShipping:true,  isFlashSale:false, badge:"Sale",     emoji:"🎧" },
  { id:"3",  name:"MacBook Pro M4 14\"",       slug:"macbook-pro-m4-14",       category:{name:"Electronics"}, basePrice:285000, comparePrice:null,   stock:8,   rating:4.9, totalReviews:892,  images:[{url:null}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:true,  freeShipping:true,  isFlashSale:false, badge:null,       emoji:"💻" },
  { id:"4",  name:"Nike Air Max 2025",         slug:"nike-air-max-2025",       category:{name:"Fashion"},     basePrice:18500,  comparePrice:22000,  stock:67,  rating:4.7, totalReviews:3421, images:[{url:null}], seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Trending", emoji:"👟" },
  { id:"5",  name:"Samsung 65\" QLED 4K",      slug:"samsung-65-qled-4k",      category:{name:"Electronics"}, basePrice:145000, comparePrice:165000, stock:5,   rating:4.6, totalReviews:567,  images:[{url:null}], seller:{storeName:"ElectroHub",storeSlug:"electrohub"},     isEco:false, freeShipping:true,  isFlashSale:false, badge:"Sale",     emoji:"📺" },
  { id:"6",  name:"Organic Matcha Tea Set",    slug:"organic-matcha-set",      category:{name:"Home"},        basePrice:4500,   comparePrice:null,   stock:120, rating:4.8, totalReviews:234,  images:[{url:null}], seller:{storeName:"NaturalGoods",storeSlug:"naturalgoods"}, isEco:true,  freeShipping:false, isFlashSale:false, badge:null,       emoji:"🍵" },
  { id:"7",  name:"Apple Watch Ultra 3",       slug:"apple-watch-ultra-3",     category:{name:"Electronics"}, basePrice:125000, comparePrice:135000, stock:23,  rating:4.8, totalReviews:1089, images:[{url:null}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:true,  isFlashSale:true,  badge:"New",      emoji:"⌚" },
  { id:"8",  name:"Levi's 501 Original Jeans", slug:"levis-501-jeans",         category:{name:"Fashion"},     basePrice:8500,   comparePrice:11000,  stock:89,  rating:4.5, totalReviews:4521, images:[{url:null}], seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:false, badge:"Sale",     emoji:"👖" },
  { id:"9",  name:"Kindle Paperwhite 2025",    slug:"kindle-paperwhite-2025",  category:{name:"Electronics"}, basePrice:22000,  comparePrice:null,   stock:34,  rating:4.7, totalReviews:782,  images:[{url:null}], seller:{storeName:"BookWorld",storeSlug:"bookworld"},       isEco:true,  freeShipping:true,  isFlashSale:false, badge:null,       emoji:"📖" },
  { id:"10", name:"Dyson V15 Detect",          slug:"dyson-v15-detect",        category:{name:"Home"},        basePrice:89000,  comparePrice:99000,  stock:15,  rating:4.9, totalReviews:2130, images:[{url:null}], seller:{storeName:"HomeAppliances",storeSlug:"homeapp"},    isEco:true,  freeShipping:true,  isFlashSale:false, badge:"Sale",     emoji:"🧹" },
  { id:"11", name:"PS5 Slim + Controller",     slug:"ps5-slim-bundle",         category:{name:"Electronics"}, basePrice:75000,  comparePrice:null,   stock:3,   rating:4.8, totalReviews:3890, images:[{url:null}], seller:{storeName:"GamingHub",storeSlug:"gaminghub"},       isEco:false, freeShipping:true,  isFlashSale:true,  badge:"Hot",      emoji:"🎮" },
  { id:"12", name:"AirPods Pro 4",             slug:"airpods-pro-4",           category:{name:"Electronics"}, basePrice:32000,  comparePrice:35000,  stock:56,  rating:4.7, totalReviews:5671, images:[{url:null}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:false, isFlashSale:false, badge:null,       emoji:"🎵" },
];

export const MOCK_ORDERS = [
  { id:"ord1", orderNumber:"NX-2025-47832", status:"OUT_FOR_DELIVERY", total:195000, createdAt:new Date(Date.now()-7200000),  items:[{product:{name:"iPhone 16 Pro Max",images:[{url:null}]},quantity:1,price:195000,total:195000,emoji:"📱"}], address:{city:"Kathmandu",district:"Kathmandu"}, trackingNumber:"NEX8829341", shippingCost:0, discount:0, subtotal:195000, paymentMethod:"KHALTI", paymentStatus:"COMPLETED" },
  { id:"ord2", orderNumber:"NX-2025-47234", status:"DELIVERED",        total:38500,  createdAt:new Date(Date.now()-86400000), items:[{product:{name:"Sony WH-1000XM6",images:[{url:null}]},quantity:1,price:38500,total:38500,emoji:"🎧"}],  address:{city:"Lalitpur",district:"Lalitpur"},   trackingNumber:"NEX7734211", shippingCost:0, discount:0, subtotal:38500,  paymentMethod:"ESEWA",  paymentStatus:"COMPLETED", deliveredAt:new Date(Date.now()-43200000) },
];

// ── Contexts ──────────────────────────────────────────────────────────────────

export const CartCtx = createContext<CartContextType | null>(null);
export function useCartStore() { return useContext(CartCtx)!; }

export const UICtx = createContext<UIContextType | null>(null);
export function useUIStore() { return useContext(UICtx)!; }

export const AuthCtx = createContext<AuthContextType | null>(null);
export function useAuthStore() { return useContext(AuthCtx)!; }

export const WishCtx = createContext<WishContextType | null>(null);
export function useWishlistStore() { return useContext(WishCtx)!; }

// ── API Helpers  

export async function apiGet(url: any, fallback = null) {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return await res.json();
  } catch { return fallback; }
}

export async function apiPost(url: any, body: any) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e: any) { return { error: e.message }; }
}
