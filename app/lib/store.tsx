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
  {
    id: "motors", name: "Motors, Tools & DIY", icon: "🔧", slug: "motors",
    children: [
      { id: "power-tools", name: "Power Tools", slug: "power-tools", children: [] },
      { id: "hand-tools", name: "Hand Tools", slug: "hand-tools", children: [] },
      { id: "safety", name: "Safety & Security", slug: "safety", children: [] },
      { id: "electrical", name: "Electrical", slug: "electrical", children: [] },
    ],
  },
  {
    id: "home", name: "Home & Lifestyle", icon: "🏠", slug: "home-living",
    children: [
      { id: "furniture", name: "Furniture", slug: "furniture", children: [
        { id: "sofas", name: "Sofas & Couches", slug: "sofas" },
        { id: "beds", name: "Beds & Mattresses", slug: "beds" },
        { id: "dining", name: "Dining Sets", slug: "dining" },
        { id: "office-chairs", name: "Office Chairs", slug: "office-chairs" },
      ]},
      { id: "lighting", name: "Lighting", slug: "lighting", children: [] },
      { id: "kitchen", name: "Kitchen Appliances", slug: "kitchen", children: [] },
      { id: "decor", name: "Home Décor", slug: "home-decor", children: [] },
    ],
  },
  {
    id: "sports", name: "Sports & Outdoor", icon: "⚽", slug: "sports",
    children: [
      { id: "gym", name: "Gym & Fitness", slug: "gym", children: [] },
      { id: "outdoor-sports", name: "Outdoor Sports", slug: "outdoor-sports", children: [] },
      { id: "cycling", name: "Cycling", slug: "cycling", children: [] },
      { id: "team-sports", name: "Team Sports", slug: "team-sports", children: [] },
    ],
  },
  {
    id: "electronics-acc", name: "Electronic Accessories", icon: "🔌", slug: "electronic-accessories",
    children: [
      { id: "mobile-acc", name: "Mobile Accessories", slug: "mobile-accessories", children: [
        { id: "power-banks", name: "Power Banks", slug: "power-banks" },
        { id: "phone-cases", name: "Phone Cases", slug: "phone-cases" },
        { id: "screen-protectors", name: "Screen Protectors", slug: "screen-protectors" },
        { id: "cables", name: "Cables & Converters", slug: "cables" },
        { id: "tablet-acc", name: "Tablet Accessories", slug: "tablet-accessories" },
        { id: "wall-chargers", name: "Wall Chargers", slug: "wall-chargers" },
        { id: "wireless-chargers", name: "Wireless Chargers", slug: "wireless-chargers" },
      ]},
      { id: "console-acc", name: "Console Accessories", slug: "console-accessories", children: [] },
      { id: "storage", name: "Storage", slug: "storage", children: [] },
      { id: "computer-comp", name: "Computer Components", slug: "computer-components", children: [
        { id: "memory", name: "Memory & Storage", slug: "memory" },
        { id: "gpu", name: "Graphics Cards", slug: "graphics-cards" },
        { id: "cpu", name: "Processors", slug: "processors" },
      ]},
      { id: "wearable", name: "Wearables", slug: "wearables", children: [] },
      { id: "network", name: "Network Components", slug: "network", children: [] },
      { id: "computer-acc", name: "Computer Accessories", slug: "computer-accessories", children: [] },
    ],
  },
  {
    id: "groceries", name: "Groceries & Pets", icon: "🛒", slug: "groceries",
    children: [
      { id: "fresh", name: "Fresh Food", slug: "fresh-food", children: [] },
      { id: "dry", name: "Dry Goods", slug: "dry-goods", children: [] },
      { id: "pets", name: "Pet Supplies", slug: "pet-supplies", children: [] },
    ],
  },
  {
    id: "electronics", name: "Electronic Devices", icon: "📱", slug: "electronics",
    children: [
      { id: "phones", name: "Phones", slug: "phones", children: [] },
      { id: "laptops", name: "Laptops", slug: "laptops", children: [] },
      { id: "cameras", name: "Cameras", slug: "cameras", children: [] },
      { id: "tvs", name: "TVs & Monitors", slug: "tvs", children: [] },
    ],
  },
  {
    id: "tv-home", name: "TV & Home Appliances", icon: "📺", slug: "tv-appliances",
    children: [
      { id: "televisions", name: "Televisions", slug: "televisions", children: [] },
      { id: "washing", name: "Washing Machines", slug: "washing-machines", children: [] },
      { id: "refrigerators", name: "Refrigerators", slug: "refrigerators", children: [] },
      { id: "air-cond", name: "Air Conditioners", slug: "air-conditioners", children: [] },
    ],
  },
  {
    id: "mens-fashion", name: "Men's Fashion", icon: "👔", slug: "mens-fashion",
    children: [
      { id: "mens-clothing", name: "Clothing", slug: "mens-clothing", children: [] },
      { id: "mens-shoes", name: "Shoes", slug: "mens-shoes", children: [] },
      { id: "mens-accessories", name: "Accessories", slug: "mens-accessories", children: [] },
    ],
  },
  {
    id: "watches", name: "Watches & Accessories", icon: "⌚", slug: "watches",
    children: [
      { id: "mens-watches", name: "Men's Watches", slug: "mens-watches", children: [] },
      { id: "womens-watches", name: "Women's Watches", slug: "womens-watches", children: [] },
      { id: "smartwatches", name: "Smartwatches", slug: "smartwatches", children: [] },
    ],
  },
  {
    id: "womens-fashion", name: "Women's Fashion", icon: "👗", slug: "womens-fashion",
    children: [
      { id: "womens-clothing", name: "Clothing", slug: "womens-clothing", children: [] },
      { id: "womens-shoes", name: "Shoes", slug: "womens-shoes", children: [] },
      { id: "bags", name: "Bags & Wallets", slug: "bags", children: [] },
    ],
  },
  {
    id: "beauty", name: "Health & Beauty", icon: "💄", slug: "health-beauty",
    children: [
      { id: "skincare", name: "Skincare", slug: "skincare", children: [] },
      { id: "makeup", name: "Makeup", slug: "makeup", children: [] },
      { id: "haircare", name: "Hair Care", slug: "haircare", children: [] },
      { id: "healthcare", name: "Health Care", slug: "healthcare", children: [] },
    ],
  },
  {
    id: "babies", name: "Babies & Toys", icon: "🧸", slug: "babies-toys",
    children: [
      { id: "baby-clothing", name: "Baby Clothing", slug: "baby-clothing", children: [] },
      { id: "toys", name: "Toys & Games", slug: "toys", children: [] },
      { id: "baby-gear", name: "Baby Gear", slug: "baby-gear", children: [] },
    ],
  },
];

const _u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&w=400&h=400&fit=crop&q=80`;
const _p = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;

export const MOCK_PRODUCTS = [
  // ── phones (under Electronic Devices) ──────────────────────────────────────
  { id:"p01", name:"Apple iPhone 15 Pro 256GB",       slug:"iphone-15-pro-256gb",      category:{name:"Phones", slug:"phones"},                      basePrice:145000, comparePrice:162000, stock:14,  rating:4.9, totalReviews:4521, images:[{url:_u("1695048133142-1a20484d2569")}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:true,  isFlashSale:true,  badge:"Hot",  emoji:"📱" },
  { id:"p02", name:"Samsung Galaxy S24 Ultra 256GB",  slug:"samsung-s24-ultra-256gb",  category:{name:"Phones", slug:"phones"},                      basePrice:125000, comparePrice:140000, stock:18,  rating:4.8, totalReviews:3210, images:[{url:_u("1610945415295-d9bbf067e59c")}], seller:{storeName:"ElectroHub",storeSlug:"electrohub"},     isEco:false, freeShipping:true,  isFlashSale:true,  badge:"Sale", emoji:"📱" },
  { id:"p51", name:"Xiaomi Redmi Note 13 Pro 128GB",  slug:"redmi-note-13-pro",        category:{name:"Phones", slug:"phones"},                      basePrice:38000,  comparePrice:45000,  stock:55,  rating:4.5, totalReviews:2100, images:[{url:_p("redmi-note-smartphone")}],      seller:{storeName:"ElectroHub",storeSlug:"electrohub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"📱" },

  // ── laptops ─────────────────────────────────────────────────────────────────
  { id:"p03", name:"MacBook Air M3 13-inch",          slug:"macbook-air-m3-13",        category:{name:"Laptops", slug:"laptops"},                    basePrice:175000, comparePrice:null,   stock:9,   rating:4.9, totalReviews:1234, images:[{url:_u("1517336714731-489689fd1ca8")}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:true,  freeShipping:true,  isFlashSale:false, badge:null,   emoji:"💻" },
  { id:"p52", name:"Dell Inspiron 15 Intel i5 16GB",  slug:"dell-inspiron-15-i5",      category:{name:"Laptops", slug:"laptops"},                    basePrice:92000,  comparePrice:110000, stock:22,  rating:4.5, totalReviews:876,  images:[{url:_p("dell-laptop-silver")}],          seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:true,  isFlashSale:true,  badge:"Sale", emoji:"💻" },

  // ── cameras ─────────────────────────────────────────────────────────────────
  { id:"p06", name:"Canon EOS R50 Mirrorless Camera", slug:"canon-eos-r50",            category:{name:"Cameras", slug:"cameras"},                    basePrice:98000,  comparePrice:115000, stock:12,  rating:4.7, totalReviews:876,  images:[{url:_u("1516035069371-29a1b244cc32")}], seller:{storeName:"CameraWorld",storeSlug:"cameraworld"},   isEco:false, freeShipping:true,  isFlashSale:false, badge:"Sale", emoji:"📷" },
  { id:"p53", name:"Sony ZV-E10 Vlog Camera",         slug:"sony-zv-e10",              category:{name:"Cameras", slug:"cameras"},                    basePrice:75000,  comparePrice:88000,  stock:15,  rating:4.6, totalReviews:543,  images:[{url:_p("sony-vlog-camera")}],            seller:{storeName:"CameraWorld",storeSlug:"cameraworld"},   isEco:false, freeShipping:true,  isFlashSale:true,  badge:"Sale", emoji:"📷" },

  // ── electronics (headphones/earphones, no sub-subcategory) ──────────────────
  { id:"p04", name:"Sony WH-1000XM5 Headphones",     slug:"sony-wh-1000xm5",          category:{name:"Electronic Devices", slug:"electronics"},      basePrice:36500,  comparePrice:45000,  stock:42,  rating:4.8, totalReviews:2876, images:[{url:_u("1505740420928-5e560c06d30e")}], seller:{storeName:"SonyNepal",storeSlug:"sonynepal"},       isEco:true,  freeShipping:true,  isFlashSale:true,  badge:"Sale", emoji:"🎧" },
  { id:"p05", name:"AirPods Pro 2nd Generation",      slug:"airpods-pro-2nd-gen",      category:{name:"Electronic Devices", slug:"electronics"},      basePrice:32000,  comparePrice:36000,  stock:55,  rating:4.7, totalReviews:5123, images:[{url:_u("1572635196237-14b3f281503f")}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🎵" },

  // ── power-banks ─────────────────────────────────────────────────────────────
  { id:"p07", name:"Anker 26800mAh Power Bank",       slug:"anker-powerbank-26800",    category:{name:"Power Banks", slug:"power-banks"},              basePrice:5500,   comparePrice:7500,   stock:110, rating:4.6, totalReviews:3421, images:[{url:_p("powerbank-anker")}],             seller:{storeName:"GadgetWorld",storeSlug:"gadgetworld"},   isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🔋" },
  { id:"p54", name:"Romoss Sense 8+ 30000mAh Bank",   slug:"romoss-sense-8-30000",     category:{name:"Power Banks", slug:"power-banks"},              basePrice:3800,   comparePrice:5200,   stock:200, rating:4.4, totalReviews:1876, images:[{url:_p("romoss-powerbank-white")}],      seller:{storeName:"GadgetWorld",storeSlug:"gadgetworld"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🔋" },

  // ── phone-cases ─────────────────────────────────────────────────────────────
  { id:"p08", name:"Spigen Slim Armor Phone Case",    slug:"spigen-slim-armor-case",   category:{name:"Phone Cases", slug:"phone-cases"},              basePrice:1800,   comparePrice:2500,   stock:400, rating:4.5, totalReviews:6200, images:[{url:_u("1592899677977-9c10ca588bbd")}],  seller:{storeName:"GadgetWorld",storeSlug:"gadgetworld"},   isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"📱" },
  { id:"p55", name:"OtterBox Defender Series Case",   slug:"otterbox-defender-case",   category:{name:"Phone Cases", slug:"phone-cases"},              basePrice:2800,   comparePrice:3800,   stock:180, rating:4.6, totalReviews:2100, images:[{url:_p("otterbox-rugged-case")}],        seller:{storeName:"GadgetWorld",storeSlug:"gadgetworld"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"📱" },

  // ── wall-chargers ───────────────────────────────────────────────────────────
  { id:"p09", name:"Baseus 65W GaN Fast Charger",     slug:"baseus-65w-gan-charger",   category:{name:"Wall Chargers", slug:"wall-chargers"},          basePrice:3200,   comparePrice:4500,   stock:85,  rating:4.7, totalReviews:1876, images:[{url:_u("1583863788434-e58a36330cf0")}],  seller:{storeName:"GadgetWorld",storeSlug:"gadgetworld"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🔌" },
  { id:"p56", name:"Apple 20W USB-C Power Adapter",   slug:"apple-20w-usbc-adapter",   category:{name:"Wall Chargers", slug:"wall-chargers"},          basePrice:2500,   comparePrice:3000,   stock:250, rating:4.7, totalReviews:5432, images:[{url:_p("apple-charger-white")}],         seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🔌" },

  // ── cables ───────────────────────────────────────────────────────────────────
  { id:"p10", name:"USB-C Braided Cable 2m 3-Pack",   slug:"usbc-braided-cable-2m",    category:{name:"Cables & Converters", slug:"cables"},           basePrice:1200,   comparePrice:2000,   stock:500, rating:4.4, totalReviews:8910, images:[{url:_p("usbc-cable-braided")}],          seller:{storeName:"GadgetWorld",storeSlug:"gadgetworld"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🔌" },

  // ── screen-protectors ───────────────────────────────────────────────────────
  { id:"p57", name:"Spigen Tempered Glass Screen Guard",slug:"spigen-screen-guard",    category:{name:"Screen Protectors", slug:"screen-protectors"},  basePrice:750,    comparePrice:1200,   stock:600, rating:4.5, totalReviews:9800, images:[{url:_p("tempered-glass-protector")}],    seller:{storeName:"GadgetWorld",storeSlug:"gadgetworld"},   isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"📱" },

  // ── wireless-chargers ───────────────────────────────────────────────────────
  { id:"p58", name:"Anker 15W Qi2 Wireless Charging Pad",slug:"anker-15w-qi2-pad",    category:{name:"Wireless Chargers", slug:"wireless-chargers"}, basePrice:3500,   comparePrice:4800,   stock:120, rating:4.6, totalReviews:1234, images:[{url:_p("wireless-charging-pad-anker")}], seller:{storeName:"GadgetWorld",storeSlug:"gadgetworld"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🔋" },

  // ── console-accessories ─────────────────────────────────────────────────────
  { id:"p59", name:"PS5 DualSense Wireless Controller",slug:"ps5-dualsense-controller",category:{name:"Console Accessories", slug:"console-accessories"}, basePrice:9500, comparePrice:12000, stock:35, rating:4.8, totalReviews:3210, images:[{url:_p("ps5-dualsense-white")}],         seller:{storeName:"GamingHub",storeSlug:"gaminghub"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Hot",  emoji:"🎮" },
  { id:"p60", name:"Xbox Series X Controller",         slug:"xbox-series-x-controller",category:{name:"Console Accessories", slug:"console-accessories"}, basePrice:8500, comparePrice:10000, stock:40, rating:4.7, totalReviews:1876, images:[{url:_p("xbox-controller-black")}],       seller:{storeName:"GamingHub",storeSlug:"gaminghub"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🎮" },

  // ── storage ─────────────────────────────────────────────────────────────────
  { id:"p61", name:"Samsung T7 1TB Portable SSD",      slug:"samsung-t7-1tb-ssd",      category:{name:"Storage", slug:"storage"},                    basePrice:12500,  comparePrice:15000,  stock:65,  rating:4.8, totalReviews:2100, images:[{url:_p("samsung-portable-ssd")}],        seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"💾" },
  { id:"p62", name:"SanDisk 256GB Ultra USB 3.0 Drive", slug:"sandisk-256gb-usb-drive", category:{name:"Storage", slug:"storage"},                    basePrice:2800,   comparePrice:3500,   stock:300, rating:4.5, totalReviews:4321, images:[{url:_p("sandisk-usb-drive")}],           seller:{storeName:"GadgetWorld",storeSlug:"gadgetworld"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"💾" },

  // ── computer-components ─────────────────────────────────────────────────────
  { id:"p63", name:"Kingston 16GB DDR5 4800MHz RAM",   slug:"kingston-16gb-ddr5",       category:{name:"Computer Components", slug:"computer-components"}, basePrice:8500, comparePrice:11000, stock:80, rating:4.6, totalReviews:876,  images:[{url:_p("ram-memory-stick")}],            seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🖥️" },
  { id:"p64", name:"Samsung 980 Pro 1TB NVMe SSD",     slug:"samsung-980-pro-1tb",      category:{name:"Computer Components", slug:"computer-components"}, basePrice:14500, comparePrice:18000, stock:45, rating:4.8, totalReviews:1543, images:[{url:_p("nvme-ssd-m2")}],                seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"💾" },

  // ── wearables ───────────────────────────────────────────────────────────────
  { id:"p65", name:"Xiaomi Mi Smart Band 8 Pro",       slug:"xiaomi-smart-band-8-pro",  category:{name:"Wearables", slug:"wearables"},                basePrice:6500,   comparePrice:8500,   stock:150, rating:4.5, totalReviews:3210, images:[{url:_p("xiaomi-fitness-band")}],         seller:{storeName:"ElectroHub",storeSlug:"electrohub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"⌚" },

  // ── network ─────────────────────────────────────────────────────────────────
  { id:"p66", name:"TP-Link Archer AX55 WiFi 6 Router",slug:"tplink-archer-ax55",       category:{name:"Network Components", slug:"network"},          basePrice:9500,   comparePrice:12000,  stock:45,  rating:4.6, totalReviews:876,  images:[{url:_p("tplink-wifi-router")}],          seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"📡" },

  // ── computer-accessories ────────────────────────────────────────────────────
  { id:"p67", name:"Logitech MX Keys Wireless Keyboard",slug:"logitech-mx-keys",        category:{name:"Computer Accessories", slug:"computer-accessories"}, basePrice:14500, comparePrice:18000, stock:60, rating:4.7, totalReviews:2100, images:[{url:_p("logitech-keyboard")}],          seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"⌨️" },
  { id:"p68", name:"Razer DeathAdder V3 Gaming Mouse",  slug:"razer-deathadder-v3",     category:{name:"Computer Accessories", slug:"computer-accessories"}, basePrice:8500, comparePrice:11000,  stock:75, rating:4.7, totalReviews:1654, images:[{url:_p("razer-gaming-mouse")}],          seller:{storeName:"GamingHub",storeSlug:"gaminghub"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🖱️" },

  // ── televisions ─────────────────────────────────────────────────────────────
  { id:"p11", name:"Samsung 55\" 4K QLED Smart TV",    slug:"samsung-55-qled-smart-tv", category:{name:"Televisions", slug:"televisions"},             basePrice:95000,  comparePrice:118000, stock:10,  rating:4.7, totalReviews:892,  images:[{url:_u("1593359677879-a4bb92f829d1")}],  seller:{storeName:"HomeAppliances",storeSlug:"homeapp"},    isEco:false, freeShipping:true,  isFlashSale:false, badge:"Sale", emoji:"📺" },
  { id:"p69", name:"LG 43\" Full HD Smart TV",          slug:"lg-43-fhd-smart-tv",       category:{name:"Televisions", slug:"televisions"},             basePrice:55000,  comparePrice:68000,  stock:18,  rating:4.5, totalReviews:543,  images:[{url:_p("lg-smart-tv-43")}],              seller:{storeName:"HomeAppliances",storeSlug:"homeapp"},    isEco:false, freeShipping:true,  isFlashSale:true,  badge:"Sale", emoji:"📺" },

  // ── washing-machines ────────────────────────────────────────────────────────
  { id:"p12", name:"LG 8 kg Inverter Washing Machine", slug:"lg-8kg-inverter-washer",   category:{name:"Washing Machines", slug:"washing-machines"},   basePrice:52000,  comparePrice:65000,  stock:8,   rating:4.5, totalReviews:432,  images:[{url:_p("washing-machine-lg")}],          seller:{storeName:"HomeAppliances",storeSlug:"homeapp"},    isEco:true,  freeShipping:true,  isFlashSale:true,  badge:"Sale", emoji:"🫧" },

  // ── air-conditioners ────────────────────────────────────────────────────────
  { id:"p13", name:"Daikin 1.5 Ton Split AC",          slug:"daikin-1-5ton-split-ac",   category:{name:"Air Conditioners", slug:"air-conditioners"},   basePrice:72000,  comparePrice:86000,  stock:15,  rating:4.6, totalReviews:321,  images:[{url:_p("air-conditioner-daikin")}],      seller:{storeName:"HomeAppliances",storeSlug:"homeapp"},    isEco:true,  freeShipping:true,  isFlashSale:false, badge:null,   emoji:"❄️" },

  // ── refrigerators ───────────────────────────────────────────────────────────
  { id:"p14", name:"LG 260L Double Door Refrigerator", slug:"lg-260l-double-door",      category:{name:"Refrigerators", slug:"refrigerators"},         basePrice:68000,  comparePrice:78000,  stock:6,   rating:4.6, totalReviews:214,  images:[{url:_p("refrigerator-lg-silver")}],      seller:{storeName:"HomeAppliances",storeSlug:"homeapp"},    isEco:true,  freeShipping:true,  isFlashSale:false, badge:null,   emoji:"🧊" },

  // ── furniture ───────────────────────────────────────────────────────────────
  { id:"p15", name:"3-Seater Fabric Sofa — Ash Grey",  slug:"3-seater-sofa-ash-grey",   category:{name:"Furniture", slug:"furniture"},                 basePrice:42000,  comparePrice:56000,  stock:5,   rating:4.5, totalReviews:178,  images:[{url:_u("1555041469-a586c61ea9bc")}],      seller:{storeName:"FurnishHome",storeSlug:"furnishhome"},   isEco:false, freeShipping:true,  isFlashSale:false, badge:"Sale", emoji:"🛋️" },
  { id:"p70", name:"Ergonomic Office Chair with Lumbar",slug:"ergonomic-office-chair",   category:{name:"Furniture", slug:"furniture"},                 basePrice:28000,  comparePrice:38000,  stock:20,  rating:4.6, totalReviews:543,  images:[{url:_p("ergonomic-office-chair")}],      seller:{storeName:"FurnishHome",storeSlug:"furnishhome"},   isEco:false, freeShipping:true,  isFlashSale:true,  badge:"Sale", emoji:"🪑" },

  // ── kitchen ─────────────────────────────────────────────────────────────────
  { id:"p16", name:"Philips Air Fryer 4.1 Litre",      slug:"philips-air-fryer-4l",     category:{name:"Kitchen Appliances", slug:"kitchen"},          basePrice:18500,  comparePrice:23000,  stock:38,  rating:4.7, totalReviews:2145, images:[{url:_u("1574269909862-7e1d70bb8078")}],  seller:{storeName:"KitchenHub",storeSlug:"kitchenhub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Hot",  emoji:"🍳" },
  { id:"p17", name:"Nescafé Dolce Gusto Coffee Maker",  slug:"dolce-gusto-coffee-maker", category:{name:"Kitchen Appliances", slug:"kitchen"},          basePrice:14500,  comparePrice:18000,  stock:22,  rating:4.6, totalReviews:987,  images:[{url:_u("1495474472287-4d71bcdd2085")}],  seller:{storeName:"KitchenHub",storeSlug:"kitchenhub"},     isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"☕" },
  { id:"p71", name:"Bosch Hand Blender 700W",           slug:"bosch-hand-blender-700w",  category:{name:"Kitchen Appliances", slug:"kitchen"},          basePrice:6500,   comparePrice:8500,   stock:65,  rating:4.5, totalReviews:876,  images:[{url:_p("hand-blender-kitchen")}],        seller:{storeName:"KitchenHub",storeSlug:"kitchenhub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🥣" },

  // ── lighting ────────────────────────────────────────────────────────────────
  { id:"p72", name:"Philips Hue Smart LED Bulb 4-Pack", slug:"philips-hue-led-4pack",   category:{name:"Lighting", slug:"lighting"},                  basePrice:5500,   comparePrice:7500,   stock:120, rating:4.6, totalReviews:1234, images:[{url:_p("smart-led-bulb-philips")}],      seller:{storeName:"FurnishHome",storeSlug:"furnishhome"},   isEco:true,  freeShipping:false, isFlashSale:false, badge:null,   emoji:"💡" },

  // ── home-decor ──────────────────────────────────────────────────────────────
  { id:"p73", name:"IKEA RIBBA Picture Frame Set of 3", slug:"ikea-ribba-frame-set",    category:{name:"Home Décor", slug:"home-decor"},               basePrice:2800,   comparePrice:3800,   stock:200, rating:4.4, totalReviews:876,  images:[{url:_p("picture-frame-set-white")}],     seller:{storeName:"FurnishHome",storeSlug:"furnishhome"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🖼️" },

  // ── home-living (Dyson — no closer subcategory) ─────────────────────────────
  { id:"p18", name:"Dyson V15 Detect Vacuum Cleaner",  slug:"dyson-v15-detect",         category:{name:"Home & Lifestyle", slug:"home-living"},         basePrice:89000,  comparePrice:99000,  stock:12,  rating:4.9, totalReviews:2130, images:[{url:_p("dyson-vacuum-cleaner")}],        seller:{storeName:"HomeAppliances",storeSlug:"homeapp"},    isEco:true,  freeShipping:true,  isFlashSale:false, badge:"Sale", emoji:"🧹" },

  // ── mens-clothing ───────────────────────────────────────────────────────────
  { id:"p19", name:"Nike Dri-FIT Training T-Shirt",    slug:"nike-dri-fit-training-tee",category:{name:"Clothing", slug:"mens-clothing"},              basePrice:3500,   comparePrice:5000,   stock:200, rating:4.5, totalReviews:4210, images:[{url:_u("1521572163474-6864f9cf17ab")}],  seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"👕" },
  { id:"p20", name:"Levi's 511 Slim Fit Jeans",        slug:"levis-511-slim-fit-jeans", category:{name:"Clothing", slug:"mens-clothing"},              basePrice:7500,   comparePrice:10500,  stock:85,  rating:4.6, totalReviews:5621, images:[{url:_u("1542272604-787c3835535d")}],      seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:false, badge:"Sale", emoji:"👖" },
  { id:"p74", name:"Allen Solly Men's Formal Shirt",   slug:"allen-solly-formal-shirt", category:{name:"Clothing", slug:"mens-clothing"},              basePrice:2800,   comparePrice:4000,   stock:150, rating:4.4, totalReviews:1876, images:[{url:_p("mens-formal-shirt-blue")}],      seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"👔" },

  // ── mens-shoes ──────────────────────────────────────────────────────────────
  { id:"p21", name:"Adidas Ultraboost 22 Shoes",       slug:"adidas-ultraboost-22",     category:{name:"Shoes", slug:"mens-shoes"},                   basePrice:16500,  comparePrice:21000,  stock:42,  rating:4.7, totalReviews:3210, images:[{url:_u("1542291026-7eec264c27ff")}],      seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Hot",  emoji:"👟" },
  { id:"p22", name:"Woodland Leather Casual Shoes",    slug:"woodland-leather-casual",  category:{name:"Shoes", slug:"mens-shoes"},                   basePrice:6500,   comparePrice:8500,   stock:60,  rating:4.4, totalReviews:1432, images:[{url:_p("leather-shoes-brown-mens")}],    seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"👞" },

  // ── mens-accessories ────────────────────────────────────────────────────────
  { id:"p75", name:"Ray-Ban Wayfarer Classic Sunglasses",slug:"rayban-wayfarer-classic",category:{name:"Accessories", slug:"mens-accessories"},       basePrice:18500,  comparePrice:24000,  stock:35,  rating:4.7, totalReviews:1210, images:[{url:_p("rayban-wayfarer-sunglasses")}],  seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🕶️" },
  { id:"p76", name:"Fossil Leather Braided Belt",       slug:"fossil-leather-belt",      category:{name:"Accessories", slug:"mens-accessories"},       basePrice:3500,   comparePrice:5000,   stock:100, rating:4.4, totalReviews:543,  images:[{url:_u("1553062407-98eeb64c6a62")}],      seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"👜" },

  // ── womens-clothing ─────────────────────────────────────────────────────────
  { id:"p23", name:"Floral Wrap Maxi Dress",           slug:"floral-wrap-maxi-dress",   category:{name:"Clothing", slug:"womens-clothing"},            basePrice:4800,   comparePrice:7200,   stock:68,  rating:4.4, totalReviews:1876, images:[{url:_u("1572804013309-59a88b7e92f1")}],  seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"👗" },
  { id:"p26", name:"H&M Oversized Knit Sweater",       slug:"hm-oversized-knit-sweater",category:{name:"Clothing", slug:"womens-clothing"},            basePrice:3200,   comparePrice:4500,   stock:110, rating:4.4, totalReviews:2100, images:[{url:_p("womens-sweater-knit")}],          seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🧥" },
  { id:"p77", name:"Ethnic Cotton Kurta Set",           slug:"ethnic-cotton-kurta-set",  category:{name:"Clothing", slug:"womens-clothing"},            basePrice:2500,   comparePrice:3800,   stock:90,  rating:4.5, totalReviews:1543, images:[{url:_p("ethnic-kurta-women")}],          seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:true,  freeShipping:false, isFlashSale:false, badge:null,   emoji:"👘" },

  // ── womens-shoes ────────────────────────────────────────────────────────────
  { id:"p25", name:"Block Heel Ankle Boots",           slug:"block-heel-ankle-boots",   category:{name:"Shoes", slug:"womens-shoes"},                  basePrice:6800,   comparePrice:9500,   stock:52,  rating:4.3, totalReviews:654,  images:[{url:_u("1543163521-1bf539c55dd2")}],      seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:false, badge:"Sale", emoji:"👢" },
  { id:"p78", name:"Bata Comfort Wedge Sandals",        slug:"bata-wedge-sandals",       category:{name:"Shoes", slug:"womens-shoes"},                  basePrice:3200,   comparePrice:4500,   stock:80,  rating:4.3, totalReviews:876,  images:[{url:_p("wedge-sandals-women")}],          seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"👡" },

  // ── bags ────────────────────────────────────────────────────────────────────
  { id:"p24", name:"Coach Signature Crossbody Bag",    slug:"coach-signature-crossbody",category:{name:"Bags & Wallets", slug:"bags"},                 basePrice:18500,  comparePrice:24000,  stock:18,  rating:4.7, totalReviews:987,  images:[{url:_u("1548036328-c9fa89d128fa")}],      seller:{storeName:"LuxuryBags",storeSlug:"luxurybags"},     isEco:false, freeShipping:true,  isFlashSale:false, badge:null,   emoji:"👜" },
  { id:"p79", name:"Caprese Faux Leather Tote Bag",    slug:"caprese-tote-bag",          category:{name:"Bags & Wallets", slug:"bags"},                 basePrice:4500,   comparePrice:6500,   stock:65,  rating:4.4, totalReviews:1210, images:[{url:_p("leather-tote-bag-women")}],      seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"👛" },

  // ── mens-watches ────────────────────────────────────────────────────────────
  { id:"p27", name:"Casio Edifice Chronograph Watch",  slug:"casio-edifice-chronograph",category:{name:"Men's Watches", slug:"mens-watches"},          basePrice:22000,  comparePrice:28000,  stock:28,  rating:4.7, totalReviews:1654, images:[{url:_u("1523275335684-37898b6baf30")}],  seller:{storeName:"WatchWorld",storeSlug:"watchworld"},     isEco:false, freeShipping:true,  isFlashSale:false, badge:"Sale", emoji:"⌚" },
  { id:"p80", name:"Seiko 5 Automatic Men's Watch",    slug:"seiko-5-automatic-mens",   category:{name:"Men's Watches", slug:"mens-watches"},          basePrice:15000,  comparePrice:19000,  stock:40,  rating:4.6, totalReviews:876,  images:[{url:_p("seiko-automatic-watch")}],       seller:{storeName:"WatchWorld",storeSlug:"watchworld"},     isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"⌚" },

  // ── womens-watches ──────────────────────────────────────────────────────────
  { id:"p30", name:"Titan Raga Ladies Watch",          slug:"titan-raga-ladies",        category:{name:"Women's Watches", slug:"womens-watches"},       basePrice:9500,   comparePrice:12000,  stock:60,  rating:4.5, totalReviews:543,  images:[{url:_p("titan-ladies-watch-gold")}],      seller:{storeName:"WatchWorld",storeSlug:"watchworld"},     isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"⌚" },
  { id:"p81", name:"Fossil Jacqueline Ladies Watch",   slug:"fossil-jacqueline-ladies", category:{name:"Women's Watches", slug:"womens-watches"},       basePrice:12500,  comparePrice:16000,  stock:35,  rating:4.6, totalReviews:432,  images:[{url:_p("fossil-ladies-watch")}],          seller:{storeName:"WatchWorld",storeSlug:"watchworld"},     isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"⌚" },

  // ── smartwatches ────────────────────────────────────────────────────────────
  { id:"p28", name:"Apple Watch Series 9 GPS 45mm",    slug:"apple-watch-s9-gps-45mm",  category:{name:"Smartwatches", slug:"smartwatches"},            basePrice:72000,  comparePrice:80000,  stock:20,  rating:4.8, totalReviews:3210, images:[{url:_u("1546868871-7041f2a55e12")}],      seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:true,  isFlashSale:true,  badge:"New",  emoji:"⌚" },
  { id:"p29", name:"Fossil Gen 6 Hybrid Smartwatch",   slug:"fossil-gen6-hybrid",       category:{name:"Smartwatches", slug:"smartwatches"},            basePrice:18500,  comparePrice:22000,  stock:35,  rating:4.5, totalReviews:876,  images:[{url:_p("fossil-smartwatch-hybrid")}],    seller:{storeName:"WatchWorld",storeSlug:"watchworld"},     isEco:false, freeShipping:true,  isFlashSale:false, badge:null,   emoji:"⌚" },

  // ── gym ─────────────────────────────────────────────────────────────────────
  { id:"p31", name:"PowerBlock 2.5–24kg Adjustable Dumbbells",slug:"powerblock-dumbbells",category:{name:"Gym & Fitness", slug:"gym"},              basePrice:18500,  comparePrice:24000,  stock:22,  rating:4.6, totalReviews:987,  images:[{url:_u("1534438327276-14e5300c3a48")}],  seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:true,  isFlashSale:false, badge:null,   emoji:"🏋️" },
  { id:"p82", name:"Nivia Yoga Mat 6mm Anti-Slip",     slug:"nivia-yoga-mat-6mm",       category:{name:"Gym & Fitness", slug:"gym"},                  basePrice:2500,   comparePrice:3500,   stock:200, rating:4.5, totalReviews:2100, images:[{url:_p("yoga-mat-purple")}],             seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:true,  freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🧘" },
  { id:"p83", name:"Resistance Bands Set of 5",        slug:"resistance-bands-set-5",   category:{name:"Gym & Fitness", slug:"gym"},                  basePrice:1800,   comparePrice:2500,   stock:300, rating:4.4, totalReviews:3210, images:[{url:_p("resistance-bands-set")}],        seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🏋️" },

  // ── cycling ─────────────────────────────────────────────────────────────────
  { id:"p32", name:"Trek Marlin 5 Mountain Bike",      slug:"trek-marlin-5-mtb",        category:{name:"Cycling", slug:"cycling"},                    basePrice:55000,  comparePrice:65000,  stock:7,   rating:4.7, totalReviews:432,  images:[{url:_u("1558618666-fcd25c85cd64")}],      seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:false, badge:"Sale", emoji:"🚲" },
  { id:"p84", name:"Bontrager Ballista MIPS Helmet",   slug:"bontrager-ballista-helmet",category:{name:"Cycling", slug:"cycling"},                    basePrice:8500,   comparePrice:11000,  stock:45,  rating:4.6, totalReviews:321,  images:[{url:_p("cycling-helmet-white")}],        seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"⛑️" },

  // ── outdoor-sports ──────────────────────────────────────────────────────────
  { id:"p33", name:"Nike Air Zoom Pegasus 40",         slug:"nike-air-zoom-peg-40",     category:{name:"Outdoor Sports", slug:"outdoor-sports"},       basePrice:14500,  comparePrice:18000,  stock:55,  rating:4.7, totalReviews:2870, images:[{url:_u("1542291026-7eec264c27ff")}],      seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Hot",  emoji:"👟" },
  { id:"p85", name:"Quechua 20L Hiking Backpack",      slug:"quechua-20l-backpack",     category:{name:"Outdoor Sports", slug:"outdoor-sports"},       basePrice:4500,   comparePrice:6500,   stock:80,  rating:4.5, totalReviews:876,  images:[{url:_p("hiking-backpack-green")}],       seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🎒" },

  // ── team-sports ─────────────────────────────────────────────────────────────
  { id:"p34", name:"Nivia Football Size 5 Pro",        slug:"nivia-football-size5-pro", category:{name:"Team Sports", slug:"team-sports"},             basePrice:2800,   comparePrice:3500,   stock:180, rating:4.4, totalReviews:2100, images:[{url:_p("football-soccer-ball")}],        seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"⚽" },
  { id:"p86", name:"Yonex Badminton Racket Combo",     slug:"yonex-badminton-combo",    category:{name:"Team Sports", slug:"team-sports"},             basePrice:3500,   comparePrice:5000,   stock:120, rating:4.6, totalReviews:1543, images:[{url:_p("badminton-racket-yonex")}],      seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🏸" },

  // ── skincare ────────────────────────────────────────────────────────────────
  { id:"p35", name:"CeraVe Moisturizing Cream 454g",   slug:"cerave-moisturizing-454g", category:{name:"Skincare", slug:"skincare"},                  basePrice:2800,   comparePrice:3500,   stock:150, rating:4.8, totalReviews:6543, images:[{url:_u("1556228578-8c89e6adf883")}],      seller:{storeName:"BeautyHub",storeSlug:"beautyhub"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🧴" },
  { id:"p37", name:"Garnier Vitamin C Serum 30ml",     slug:"garnier-vitc-serum-30ml",  category:{name:"Skincare", slug:"skincare"},                  basePrice:1200,   comparePrice:1600,   stock:300, rating:4.5, totalReviews:5210, images:[{url:_p("vitamin-c-serum-skincare")}],    seller:{storeName:"BeautyHub",storeSlug:"beautyhub"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"💊" },
  { id:"p87", name:"Neutrogena Sunscreen SPF 50+ 88ml",slug:"neutrogena-spf50-sunscreen",category:{name:"Skincare", slug:"skincare"},                 basePrice:1500,   comparePrice:2000,   stock:250, rating:4.6, totalReviews:3210, images:[{url:_p("sunscreen-neutrogena")}],        seller:{storeName:"BeautyHub",storeSlug:"beautyhub"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"☀️" },

  // ── makeup ──────────────────────────────────────────────────────────────────
  { id:"p36", name:"MAC Ruby Woo Lipstick",            slug:"mac-ruby-woo-lipstick",    category:{name:"Makeup", slug:"makeup"},                      basePrice:3500,   comparePrice:4500,   stock:75,  rating:4.7, totalReviews:4321, images:[{url:_u("1522335789203-aabd1fc54bc9")}],  seller:{storeName:"BeautyHub",storeSlug:"beautyhub"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"💄" },
  { id:"p88", name:"Maybelline Fit Me Foundation 30ml",slug:"maybelline-fitme-foundation",category:{name:"Makeup", slug:"makeup"},                    basePrice:1200,   comparePrice:1600,   stock:200, rating:4.4, totalReviews:3876, images:[{url:_p("foundation-maybelline")}],       seller:{storeName:"BeautyHub",storeSlug:"beautyhub"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"💄" },

  // ── haircare ────────────────────────────────────────────────────────────────
  { id:"p38", name:"Dove Intense Repair Shampoo 1L",   slug:"dove-intense-repair-shampoo",category:{name:"Hair Care", slug:"haircare"},               basePrice:950,    comparePrice:1300,   stock:350, rating:4.4, totalReviews:3890, images:[{url:_p("shampoo-dove-bottle")}],          seller:{storeName:"BeautyHub",storeSlug:"beautyhub"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🧴" },
  { id:"p89", name:"Philips BHD501 Hair Dryer 2100W",  slug:"philips-bhd501-hair-dryer",category:{name:"Hair Care", slug:"haircare"},                  basePrice:5500,   comparePrice:7500,   stock:80,  rating:4.6, totalReviews:1876, images:[{url:_p("hair-dryer-philips")}],          seller:{storeName:"BeautyHub",storeSlug:"beautyhub"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"💨" },

  // ── healthcare ──────────────────────────────────────────────────────────────
  { id:"p90", name:"Omron HEM-7143T Blood Pressure Monitor",slug:"omron-hem7143t-bp",  category:{name:"Health Care", slug:"healthcare"},              basePrice:5500,   comparePrice:7000,   stock:60,  rating:4.7, totalReviews:1210, images:[{url:_p("blood-pressure-monitor")}],      seller:{storeName:"BeautyHub",storeSlug:"beautyhub"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"💊" },

  // ── pet-supplies ────────────────────────────────────────────────────────────
  { id:"p39", name:"Pedigree Adult Dry Dog Food 3kg",   slug:"pedigree-dry-dog-3kg",    category:{name:"Pet Supplies", slug:"pet-supplies"},           basePrice:2800,   comparePrice:3500,   stock:200, rating:4.6, totalReviews:1234, images:[{url:_p("dog-food-pedigree")}],           seller:{storeName:"PetCorner",storeSlug:"petcorner"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🐕" },
  { id:"p41", name:"Whiskas Wet Cat Food 24-Pack",      slug:"whiskas-wet-cat-24pk",     category:{name:"Pet Supplies", slug:"pet-supplies"},           basePrice:2200,   comparePrice:2800,   stock:145, rating:4.4, totalReviews:654,  images:[{url:_u("1514888286974-6c03e2ca1dba")}],  seller:{storeName:"PetCorner",storeSlug:"petcorner"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🐱" },
  { id:"p91", name:"Ruffwear Front Range Dog Harness",  slug:"ruffwear-front-range",     category:{name:"Pet Supplies", slug:"pet-supplies"},           basePrice:3500,   comparePrice:5000,   stock:80,  rating:4.7, totalReviews:543,  images:[{url:_p("dog-harness-pet")}],             seller:{storeName:"PetCorner",storeSlug:"petcorner"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🐾" },

  // ── dry-goods ───────────────────────────────────────────────────────────────
  { id:"p40", name:"Tata Tea Gold 500g + 100g Free",    slug:"tata-tea-gold-500g",       category:{name:"Dry Goods", slug:"dry-goods"},                basePrice:480,    comparePrice:620,    stock:500, rating:4.5, totalReviews:8762, images:[{url:_u("1556679343-c7306c1976bc")}],      seller:{storeName:"NaturalGoods",storeSlug:"naturalgoods"}, isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🍵" },
  { id:"p42", name:"Himalayan Basmati Rice 5kg",        slug:"himalayan-basmati-5kg",    category:{name:"Dry Goods", slug:"dry-goods"},                basePrice:1200,   comparePrice:1500,   stock:400, rating:4.6, totalReviews:2340, images:[{url:_p("basmati-rice-bag")}],            seller:{storeName:"NaturalGoods",storeSlug:"naturalgoods"}, isEco:true,  freeShipping:false, isFlashSale:false, badge:null,   emoji:"🌾" },

  // ── fresh-food ──────────────────────────────────────────────────────────────
  { id:"p92", name:"Organic Vegetable Box 2kg Assorted",slug:"organic-veg-box-2kg",     category:{name:"Fresh Food", slug:"fresh-food"},               basePrice:850,    comparePrice:1200,   stock:100, rating:4.5, totalReviews:543,  images:[{url:_p("organic-vegetables-fresh")}],   seller:{storeName:"NaturalGoods",storeSlug:"naturalgoods"}, isEco:true,  freeShipping:false, isFlashSale:false, badge:null,   emoji:"🥦" },

  // ── power-tools ─────────────────────────────────────────────────────────────
  { id:"p43", name:"Bosch GSB 501 Cordless Drill",      slug:"bosch-gsb-501-drill",      category:{name:"Power Tools", slug:"power-tools"},             basePrice:8500,   comparePrice:12000,  stock:45,  rating:4.5, totalReviews:432,  images:[{url:_u("1504148455328-c376907d081c")}],  seller:{storeName:"ToolMart Nepal",storeSlug:"toolmart"},   isEco:false, freeShipping:false, isFlashSale:false, badge:"Sale", emoji:"🔧" },
  { id:"p46", name:"Black+Decker 1500W Pressure Washer",slug:"bd-pressure-washer",       category:{name:"Power Tools", slug:"power-tools"},             basePrice:14500,  comparePrice:18000,  stock:18,  rating:4.5, totalReviews:321,  images:[{url:_p("pressure-washer-machine")}],     seller:{storeName:"ToolMart Nepal",storeSlug:"toolmart"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"💦" },

  // ── hand-tools ──────────────────────────────────────────────────────────────
  { id:"p44", name:"Stanley 25-Piece Home Tool Kit",    slug:"stanley-25pc-tool-kit",    category:{name:"Hand Tools", slug:"hand-tools"},               basePrice:6500,   comparePrice:9000,   stock:60,  rating:4.6, totalReviews:543,  images:[{url:_u("1572981779307-38b8cabb2407")}],  seller:{storeName:"ToolMart Nepal",storeSlug:"toolmart"},   isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🔨" },
  { id:"p93", name:"Taparia 12-Piece Screwdriver Set",  slug:"taparia-screwdriver-set",  category:{name:"Hand Tools", slug:"hand-tools"},               basePrice:1800,   comparePrice:2500,   stock:200, rating:4.5, totalReviews:876,  images:[{url:_p("screwdriver-set-tools")}],       seller:{storeName:"ToolMart Nepal",storeSlug:"toolmart"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🔩" },

  // ── safety ──────────────────────────────────────────────────────────────────
  { id:"p45", name:"3M Safety Goggles & Gloves Set",    slug:"3m-safety-goggles-gloves", category:{name:"Safety & Security", slug:"safety"},            basePrice:2800,   comparePrice:4000,   stock:120, rating:4.4, totalReviews:234,  images:[{url:_p("safety-goggles-gloves")}],       seller:{storeName:"ToolMart Nepal",storeSlug:"toolmart"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"⛑️" },
  { id:"p94", name:"Karam Safety High-Vis Vest",        slug:"karam-safety-vest",        category:{name:"Safety & Security", slug:"safety"},            basePrice:1200,   comparePrice:1800,   stock:300, rating:4.3, totalReviews:132,  images:[{url:_p("safety-vest-yellow")}],          seller:{storeName:"ToolMart Nepal",storeSlug:"toolmart"},   isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🦺" },

  // ── electrical ──────────────────────────────────────────────────────────────
  { id:"p95", name:"Havells 4-Socket Extension Board 3m",slug:"havells-extension-3m",   category:{name:"Electrical", slug:"electrical"},               basePrice:1200,   comparePrice:1800,   stock:400, rating:4.5, totalReviews:2100, images:[{url:_p("extension-board-4socket")}],     seller:{storeName:"ToolMart Nepal",storeSlug:"toolmart"},   isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🔌" },

  // ── toys ────────────────────────────────────────────────────────────────────
  { id:"p47", name:"LEGO Classic Bricks 500 Pieces",    slug:"lego-classic-bricks-500",  category:{name:"Toys & Games", slug:"toys"},                  basePrice:8500,   comparePrice:11000,  stock:65,  rating:4.8, totalReviews:2543, images:[{url:_u("1587654780291-39c9404d746b")}],  seller:{storeName:"ToyLand",storeSlug:"toyland"},           isEco:false, freeShipping:false, isFlashSale:true,  badge:"Hot",  emoji:"🧱" },
  { id:"p48", name:"Fisher-Price Laugh & Learn Toy",    slug:"fisher-price-laugh-learn",  category:{name:"Toys & Games", slug:"toys"},                  basePrice:3500,   comparePrice:5000,   stock:80,  rating:4.7, totalReviews:1210, images:[{url:_u("1515488042361-ee00e0ddd4e4")}],  seller:{storeName:"BabyWorld",storeSlug:"babyworld"},       isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🧸" },
  { id:"p50", name:"Barbie Dreamhouse Playset",         slug:"barbie-dreamhouse-playset", category:{name:"Toys & Games", slug:"toys"},                  basePrice:12500,  comparePrice:16000,  stock:35,  rating:4.6, totalReviews:876,  images:[{url:_p("barbie-dreamhouse-pink")}],      seller:{storeName:"ToyLand",storeSlug:"toyland"},           isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"🏠" },
  { id:"p96", name:"Monopoly Classic Board Game",       slug:"monopoly-classic",          category:{name:"Toys & Games", slug:"toys"},                  basePrice:2500,   comparePrice:3500,   stock:150, rating:4.7, totalReviews:3210, images:[{url:_p("monopoly-board-game")}],         seller:{storeName:"ToyLand",storeSlug:"toyland"},           isEco:false, freeShipping:false, isFlashSale:false, badge:null,   emoji:"🎲" },

  // ── baby-gear ───────────────────────────────────────────────────────────────
  { id:"p49", name:"Maxi-Cosi Pebble 360 Baby Seat",    slug:"maxi-cosi-pebble-360",     category:{name:"Baby Gear", slug:"baby-gear"},                 basePrice:32000,  comparePrice:38000,  stock:10,  rating:4.8, totalReviews:321,  images:[{url:_p("baby-car-seat-safety")}],        seller:{storeName:"BabyWorld",storeSlug:"babyworld"},       isEco:false, freeShipping:true,  isFlashSale:false, badge:null,   emoji:"👶" },
  { id:"p97", name:"Chicco Bravo Trio Stroller Set",    slug:"chicco-bravo-trio-stroller",category:{name:"Baby Gear", slug:"baby-gear"},                 basePrice:28000,  comparePrice:35000,  stock:8,   rating:4.7, totalReviews:214,  images:[{url:_p("baby-stroller-chicco")}],        seller:{storeName:"BabyWorld",storeSlug:"babyworld"},       isEco:false, freeShipping:true,  isFlashSale:true,  badge:"Sale", emoji:"🚼" },

  // ── baby-clothing ───────────────────────────────────────────────────────────
  { id:"p98", name:"Mothercare Cotton Onesie Set of 3", slug:"mothercare-onesie-set-3",  category:{name:"Baby Clothing", slug:"baby-clothing"},         basePrice:1800,   comparePrice:2500,   stock:200, rating:4.6, totalReviews:876,  images:[{url:_p("baby-onesie-set-white")}],       seller:{storeName:"BabyWorld",storeSlug:"babyworld"},       isEco:true,  freeShipping:false, isFlashSale:false, badge:null,   emoji:"👶" },
  { id:"p99", name:"Carter's Baby Romper 3-Pack",       slug:"carters-baby-romper-3pk",  category:{name:"Baby Clothing", slug:"baby-clothing"},         basePrice:2200,   comparePrice:3000,   stock:150, rating:4.5, totalReviews:543,  images:[{url:_p("baby-romper-colorful")}],        seller:{storeName:"BabyWorld",storeSlug:"babyworld"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Sale", emoji:"👶" },
];

export const MOCK_ORDERS = [
  { id:"ord1", orderNumber:"NX-2025-47832", status:"OUT_FOR_DELIVERY", total:195000, createdAt:new Date("2025-05-23T10:00:00Z"), items:[{product:{name:"iPhone 16 Pro Max",images:[{url:null}]},quantity:1,price:195000,total:195000,emoji:"📱"}], address:{city:"Kathmandu",district:"Kathmandu"}, trackingNumber:"NEX8829341", shippingCost:0, discount:0, subtotal:195000, paymentMethod:"KHALTI", paymentStatus:"COMPLETED" },
  { id:"ord2", orderNumber:"NX-2025-47234", status:"DELIVERED",        total:38500,  createdAt:new Date("2025-05-22T10:00:00Z"), items:[{product:{name:"Sony WH-1000XM6",images:[{url:null}]},quantity:1,price:38500,total:38500,emoji:"🎧"}],  address:{city:"Lalitpur",district:"Lalitpur"},   trackingNumber:"NEX7734211", shippingCost:0, discount:0, subtotal:38500,  paymentMethod:"KHALTI",  paymentStatus:"COMPLETED", deliveredAt:new Date("2025-05-23T04:00:00Z") },
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
