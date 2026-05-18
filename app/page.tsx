"use client";
import { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) { return twMerge(clsx(inputs)); }
 

type User = {
  name: string;
  email: string;
  role: string;
  loyaltyPoints?: number;
  loyaltyTier?: string;
}
type Session = {
  user: User;
}
 type Toast = {
  msg: string;
  type: "success" | "error" | string  ;
  id: number;
} 


type Product = {
  id: string;
  name: string;
  basePrice: number;
  stock: number;
  freeShipping: boolean;
};

type CartItem = {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  stock: number;
  freeShipping: boolean;
  qty: number;
  emoji?: string;
  cartItemId?: string; 
  [key:string]: any;// from server
};

type CartContextType = {
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

type UIContextType = {
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

type AuthContextType = {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
};

type WishContextType = {
  ids: string[];
  toggle: (productId: string) => void;
  isIn: (productId: string) => boolean;
};


export const formatPrice = (n: any) => `रू ${Number(n).toLocaleString("en-NP")}`;

 
export function timeAgo(date: any) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString("en-NP", { day:"numeric", month:"short", year:"numeric" });
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

const MOCK_CATEGORIES = [
  { id:"electronics", name:"Electronics",  icon:"💻", slug:"electronics" },
  { id:"fashion",     name:"Fashion",      icon:"👗", slug:"fashion"     },
  { id:"home",        name:"Home & Living",icon:"🏠", slug:"home-living" },
  { id:"beauty",      name:"Beauty",       icon:"💄", slug:"health-beauty"},
  { id:"sports",      name:"Sports",       icon:"⚽", slug:"sports"      },
  { id:"books",       name:"Books",        icon:"📚", slug:"books"       },
];

const MOCK_PRODUCTS = [
  { id:"1",  name:"Apple iPhone 16 Pro Max", slug:"iphone-16-pro-max-256gb", category:{name:"Electronics"}, basePrice:195000, comparePrice:215000, stock:12,  rating:4.9, totalReviews:2847, images:[{url:null}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:true,  isFlashSale:true,  badge:"New",      emoji:"📱" },
  { id:"2",  name:"Sony WH-1000XM6",         slug:"sony-wh-1000xm6",          category:{name:"Electronics"}, basePrice:38500,  comparePrice:45000,  stock:45,  rating:4.8, totalReviews:1203, images:[{url:null}], seller:{storeName:"SonyNepal",storeSlug:"sonynepal"},     isEco:true,  freeShipping:true,  isFlashSale:false, badge:"Sale",     emoji:"🎧" },
  { id:"3",  name:"MacBook Pro M4 14\"",      slug:"macbook-pro-m4-14",        category:{name:"Electronics"}, basePrice:285000, comparePrice:null,   stock:8,   rating:4.9, totalReviews:892,  images:[{url:null}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:true,  freeShipping:true,  isFlashSale:false, badge:null,       emoji:"💻" },
  { id:"4",  name:"Nike Air Max 2025",        slug:"nike-air-max-2025",        category:{name:"Fashion"},     basePrice:18500,  comparePrice:22000,  stock:67,  rating:4.7, totalReviews:3421, images:[{url:null}], seller:{storeName:"SportZone",storeSlug:"sportzone"},       isEco:false, freeShipping:false, isFlashSale:true,  badge:"Trending", emoji:"👟" },
  { id:"5",  name:"Samsung 65\" QLED 4K",     slug:"samsung-65-qled-4k",       category:{name:"Electronics"}, basePrice:145000, comparePrice:165000, stock:5,   rating:4.6, totalReviews:567,  images:[{url:null}], seller:{storeName:"ElectroHub",storeSlug:"electrohub"},     isEco:false, freeShipping:true,  isFlashSale:false, badge:"Sale",     emoji:"📺" },
  { id:"6",  name:"Organic Matcha Tea Set",   slug:"organic-matcha-set",       category:{name:"Home"},        basePrice:4500,   comparePrice:null,   stock:120, rating:4.8, totalReviews:234,  images:[{url:null}], seller:{storeName:"NaturalGoods",storeSlug:"naturalgoods"}, isEco:true,  freeShipping:false, isFlashSale:false, badge:null,       emoji:"🍵" },
  { id:"7",  name:"Apple Watch Ultra 3",      slug:"apple-watch-ultra-3",      category:{name:"Electronics"}, basePrice:125000, comparePrice:135000, stock:23,  rating:4.8, totalReviews:1089, images:[{url:null}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:true,  isFlashSale:true,  badge:"New",      emoji:"⌚" },
  { id:"8",  name:"Levi's 501 Original Jeans",slug:"levis-501-jeans",          category:{name:"Fashion"},     basePrice:8500,   comparePrice:11000,  stock:89,  rating:4.5, totalReviews:4521, images:[{url:null}], seller:{storeName:"FashionHub",storeSlug:"fashionhub"},     isEco:false, freeShipping:false, isFlashSale:false, badge:"Sale",     emoji:"👖" },
  { id:"9",  name:"Kindle Paperwhite 2025",   slug:"kindle-paperwhite-2025",   category:{name:"Electronics"}, basePrice:22000,  comparePrice:null,   stock:34,  rating:4.7, totalReviews:782,  images:[{url:null}], seller:{storeName:"BookWorld",storeSlug:"bookworld"},       isEco:true,  freeShipping:true,  isFlashSale:false, badge:null,       emoji:"📖" },
  { id:"10", name:"Dyson V15 Detect",         slug:"dyson-v15-detect",         category:{name:"Home"},        basePrice:89000,  comparePrice:99000,  stock:15,  rating:4.9, totalReviews:2130, images:[{url:null}], seller:{storeName:"HomeAppliances",storeSlug:"homeapp"},    isEco:true,  freeShipping:true,  isFlashSale:false, badge:"Sale",     emoji:"🧹" },
  { id:"11", name:"PS5 Slim + Controller",    slug:"ps5-slim-bundle",          category:{name:"Electronics"}, basePrice:75000,  comparePrice:null,   stock:3,   rating:4.8, totalReviews:3890, images:[{url:null}], seller:{storeName:"GamingHub",storeSlug:"gaminghub"},       isEco:false, freeShipping:true,  isFlashSale:true,  badge:"Hot",      emoji:"🎮" },
  { id:"12", name:"AirPods Pro 4",            slug:"airpods-pro-4",            category:{name:"Electronics"}, basePrice:32000,  comparePrice:35000,  stock:56,  rating:4.7, totalReviews:5671, images:[{url:null}], seller:{storeName:"TechStore Nepal",storeSlug:"techstore"}, isEco:false, freeShipping:false, isFlashSale:false, badge:null,       emoji:"🎵" },
];

const MOCK_ORDERS = [
  { id:"ord1", orderNumber:"NX-2025-47832", status:"OUT_FOR_DELIVERY", total:195000, createdAt:new Date(Date.now()-7200000),  items:[{product:{name:"iPhone 16 Pro Max",images:[{url:null}]},quantity:1,price:195000,total:195000,emoji:"📱"}], address:{city:"Kathmandu",district:"Kathmandu"}, trackingNumber:"NEX8829341", shippingCost:0, discount:0, subtotal:195000, paymentMethod:"KHALTI", paymentStatus:"COMPLETED" },
  { id:"ord2", orderNumber:"NX-2025-47234", status:"DELIVERED",        total:38500,  createdAt:new Date(Date.now()-86400000), items:[{product:{name:"Sony WH-1000XM6",images:[{url:null}]},quantity:1,price:38500,total:38500,emoji:"🎧"}],  address:{city:"Lalitpur",district:"Lalitpur"},   trackingNumber:"NEX7734211", shippingCost:0, discount:0, subtotal:38500,  paymentMethod:"ESEWA",  paymentStatus:"COMPLETED", deliveredAt:new Date(Date.now()-43200000) },
];

 
// Cart context (replaces useCartStore from store/cartStore.ts)
const CartCtx = createContext<CartContextType | null>(null);
export function useCartStore() { return useContext(CartCtx)!; }

// UI context (replaces useUIStore from store/uiStore.ts)
const UICtx = createContext<UIContextType | null>(null);
export function useUIStore() { return useContext(UICtx)!; }

// Auth context (replaces useSession from next-auth)
const AuthCtx = createContext<AuthContextType | null>(null);
export function useAuthStore() { return useContext(AuthCtx)!; }

// Wishlist context (replaces useWishlistStore from store/wishlistStore.ts)
const WishCtx = createContext<WishContextType | null>(null);
export function useWishlistStore() { return useContext(WishCtx)!; }

 
async function apiGet(url: any, fallback = null) {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return await res.json();
  } catch { return fallback; }
}

async function apiPost(url: any, body: any) {
  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    return await res.json();
  } catch (e: any) { return { error: e.message }; }
}


export default function App() {
  // ── Auth state (mirrors next-auth session) ─────────────────────────────────
  const [user,    setUser]    = useState<User | null>(null);

  // ── Cart state (mirrors useCartStore from nexmart-cart-customer/02) ────────
  const [cartItems,   setCartItems]   = useState<CartItem[]>([]);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [cartSyncing, setCartSyncing] = useState(false);

  // ── Wishlist state (mirrors useWishlistStore) ──────────────────────────────
  const [wishIds, setWishIds] = useState<string[]>(["2","6"]);

  // ── UI state (mirrors useUIStore from nexmart-project-wiring.ts) ──────────
  const [page,          setPage]      = useState("home");
  const [pageData,      setPageData]  = useState<any>(null);
  const [darkMode,      setDarkMode]  = useState(false);
  const [mobileMenuOpen,setMobileMenu]= useState(false);
  const [notifOpen,     setNotifOpen] = useState(false);
  const [toast,         setToast]     = useState<Toast | null>(null);
  const [searchQuery,   setSearchQuery]= useState("");

 
const showToast = useCallback((msg: string, type: Toast["type"] = "success") => {
  setToast({
    msg,
    type,
    id: Date.now(),
  });

  setTimeout(() => setToast(null), 3000);
}, []);

   
  const nav = useCallback((p: any, data = null) => {
    setPage(p); setPageData(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenu(false);
  }, []);


const cartCount = useMemo(
  () => cartItems.reduce((s, i) => s + i.qty, 0),
  [cartItems]
); 
  const cartTotal   = useMemo(() => cartItems.reduce((s,i) => s + Number(i.basePrice) * i.qty, 0), [cartItems]);
  const cartShipping= cartTotal >= 1000 || cartItems.every(i => i.freeShipping) ? 0 : 150;
  const cartGrand   = cartTotal + cartShipping;

 
  const addItem = useCallback(async (product:any, qty = 1) => {
    // Optimistic update
    setCartItems(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, product.stock) } : i);
      return [...prev, { ...product, qty }];
    });
    showToast(`${product.name.slice(0, 30)}… added to cart 🛒`);

    // Real API call (nexmart-cart-customer/01 POST /api/cart)
    if (user) {
      const res = await apiPost("/api/cart", { productId: product.id, quantity: qty });
      if (res?.error) showToast("Sync failed — item added locally", "error");
    }
  }, [user, showToast]);

  // removeItem → DELETE /api/cart/[itemId]
  const removeItem = useCallback(async (id: any) => {
    const item = cartItems.find(i => i.id === id);
    setCartItems(prev => prev.filter(i => i.id !== id));
    if (user && item?.cartItemId) {
      await fetch(`/api/cart/${item.cartItemId}`, { method: "DELETE" });
    }
  }, [cartItems, user]);

  // updateQty → PATCH /api/cart/[itemId]
  const updateQty = useCallback(async (id: any, qty: any) => {
    if (qty <= 0) { removeItem(id); return; }
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.min(qty, i.stock) } : i));
    const item = cartItems.find(i => i.id === id);
    if (user && item?.cartItemId) {
      await apiPost(`/api/cart/${item.cartItemId}`, { quantity: qty });
    }
  }, [cartItems, user, removeItem]);

  // clearCart → DELETE /api/cart
  const clearCart = useCallback(async () => {
    setCartItems([]);
    if (user) await fetch("/api/cart", { method: "DELETE" });
  }, [user]);

  // syncFromServer → GET /api/cart  (nexmart-cart-customer/01)
  const syncFromServer = useCallback(async () => {
    if (!user) return;
    setCartSyncing(true);
    const data = await apiGet("/api/cart", null);
    if (data?.items) {
      setCartItems(data.items.map((item: any) => ({
        ...item,
        id:         item.productId,
        cartItemId: item.id,
        basePrice:  item.price,
        name:       item.product?.name,
        stock:      item.stock,
        freeShipping:item.product?.freeShipping,
        emoji:      "🛍️",
      })));
    }
    setCartSyncing(false);
  }, [user]);

  // mergeGuestCart → POST /api/cart/merge  (nexmart-cart-customer/01)
  const mergeGuestCart = useCallback(async () => {
    if (!cartItems.length) return;
    await apiPost("/api/cart/merge", {
      items: cartItems.map((i: any) => ({ productId: i.id, quantity: i.qty })),
    });
    await syncFromServer();
  }, [cartItems, syncFromServer]);

  // On login: merge then sync
  useEffect(() => {
    if (user) mergeGuestCart();
  }, [user?.email]);

 

  const toggleWishlist = useCallback(async (productId: any) => {
    const already = wishIds.includes(productId);
    setWishIds(prev => already ? prev.filter(x => x !== productId) : [...prev, productId]);
    showToast(already ? "Removed from wishlist" : "Saved to wishlist");
    // POST /api/user/wishlist  (nexmart-cart-customer/07)
    if (user) await apiPost("/api/user/wishlist", { productId });
  }, [wishIds, user, showToast]);

  const isInWishlist = useCallback((id: any) => wishIds.includes(id), [wishIds]);

  const cartCtx = useMemo(() => ({
    cartItems, cartOpen, setCartOpen,
    addItem, removeItem, updateQty, clearCart,
    syncFromServer, mergeGuestCart, cartSyncing,
    cartCount, cartTotal, cartShipping, cartGrand,
    isOpen: cartOpen, toggleCart: () => setCartOpen(v => !v),
    itemCount: () => cartCount,
    total: () => cartTotal,
  }), [cartItems, cartOpen, cartCount, cartTotal, cartShipping, cartGrand, cartSyncing, addItem, removeItem, updateQty, clearCart, syncFromServer, mergeGuestCart]);

  const uiCtx = useMemo(() => ({
    page, nav, pageData,
    searchQuery, setSearchQuery,
    darkMode, setDarkMode,
    mobileMenuOpen, toggleMobileMenu: () => setMobileMenu(v => !v),
    notifPanelOpen: notifOpen, toggleNotifPanel: () => setNotifOpen(v => !v),
    showToast, toast,
  }), [page, nav, pageData, searchQuery, darkMode, mobileMenuOpen, notifOpen, showToast, toast]);

  const authCtx = useMemo(() => ({
    user,
    session: user ? { user } : null,
    setUser,
    isAuthenticated: !!user,
    isAdmin:  ["ADMIN","SUPER_ADMIN"].includes(user?.role ?? ""),
    isSeller: user?.role === "SELLER",
  }), [user]);

  const wishCtx = useMemo(() => ({
    ids: wishIds, toggle: toggleWishlist, isIn: isInWishlist,
  }), [wishIds, toggleWishlist, isInWishlist]);
 
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <AuthCtx.Provider value={authCtx}>
      <UICtx.Provider value={uiCtx}>
        <CartCtx.Provider value={cartCtx}>
          <WishCtx.Provider value={wishCtx}>
            <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors", darkMode && "dark")}>
              <Navbar />
              <CartSidebar />
              <NotifPanel />
              <ToastMessage />
              <main>
                {page === "home"       && <HomePage />}
                {page === "products"   && <ProductsPage />}
                {page === "product"    && <ProductDetailPage />}
                {page === "cart"       && <CartPage />}
                {page === "checkout"   && <CheckoutPage />}
                {page === "orders"     && <OrdersPage />}
                {page === "order"      && <OrderDetailPage />}
                {page === "track"      && <TrackPage />}
                {page === "login"      && <LoginPage />}
                {page === "register"   && <RegisterPage />}
                {page === "forgot"     && <ForgotPage />}
                {page === "profile"    && <ProfilePage />}
                {page === "wishlist"   && <WishlistPage />}
                {page === "seller"     && <SellerDashPage />}
                {page === "onboarding" && <SellerOnboardPage />}
                {page === "admin"      && <AdminPage />}
              </main>
              <Footer />
            </div>
          </WishCtx.Provider>
        </CartCtx.Provider>
      </UICtx.Provider>
    </AuthCtx.Provider>
  );
}

 

function ToastMessage() {
  const { toast } = useUIStore();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl max-w-sm text-center animate-bounce-in">
      {toast.type === "success" ? "✅" : "⚠️"} {toast.msg}
    </div>
  );
}

function Navbar() {
  const { nav, searchQuery, setSearchQuery, darkMode, setDarkMode, toggleMobileMenu } = useUIStore();
  const { cartCount, setCartOpen } = useCartStore();
  const { user } = useAuthStore();
  const { ids: wishIds } = useWishlistStore();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocus,  setSearchFocus] = useState(false);
  const [suggestions,  setSuggestions] = useState<any[]>([]);
  const searchRef = useRef(null);
  const dSearch   = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Autocomplete — hits GET /api/products/search  (nexmart/api-product-slug-categories-search.ts)
  useEffect(() => {
    if (dSearch.length < 2) { setSuggestions([]); return; }
    apiGet(`/api/products/search?q=${encodeURIComponent(dSearch)}&limit=5`, null)
      .then(d => setSuggestions(d?.products ?? []))
      .catch(() => setSuggestions(
        MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(dSearch.toLowerCase())).slice(0,5)
      ));
  }, [dSearch]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as Element).closest("#profile-menu")) setProfileOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { nav("products"); setSearchFocus(false); }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-violet-600 text-white text-xs py-1.5 text-center font-medium">
        🚚 Free delivery on orders above <strong>रू 1,000</strong> &nbsp;·&nbsp; ⚡ Flash Sale Live Now
      </div>

      <header className={cn("sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 transition-shadow", scrolled && "shadow-sm")}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

          {/* Mobile menu */}
          <button onClick={toggleMobileMenu} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors" aria-label="Menu">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>

          {/* Logo */}
          <button onClick={() => nav("home")} className="flex items-center gap-1.5  shrink-0">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-black text-sm">N</div>
            <span className="text-xl font-black hidden sm:block dark:text-white">Nex<span className="text-violet-600">Mart</span></span>
          </button>

          {/* Search */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearch}>
              <div className={cn("flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 transition-all", searchFocus && "ring-2 ring-violet-500 bg-white dark:bg-gray-900")}>
                <svg className="w-4 h-4 text-gray-400  shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setSearchFocus(true)} onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
                  placeholder="Search products, brands, categories…" aria-label="Search NexMart"
                  className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 min-w-0" />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}
              </div>
            </form>
            {/* Suggestions dropdown */}
            {searchFocus && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                {suggestions.map(p => (
                  <button key={p.id} onMouseDown={() => { nav("product", p.slug); setSearchQuery(""); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-2xl">{p.emoji ?? "🛍️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category?.name}</p>
                    </div>
                    <span className="text-sm font-bold text-violet-600  shrink-0">{formatPrice(Number(p.basePrice))}</span>
                  </button>
                ))}
                <button onMouseDown={() => { nav("products"); setSearchFocus(false); }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors border-t border-gray-50 dark:border-gray-800">
                  Search for "{searchQuery}" →
                </button>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1  shrink-0">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors" aria-label="Toggle theme">{darkMode ? "☀️" : "🌙"}</button>

            {/* Wishlist */}
            <button onClick={() => nav("wishlist")} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={`Wishlist (${wishIds.length})`}>
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              {wishIds.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{wishIds.length}</span>}
            </button>

            {/* Cart */}
            <button onClick={() => setCartOpen(true)} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={`Cart (${cartCount} items)`}>
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              {cartCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-violet-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cartCount > 99 ? "99+" : cartCount}</span>}
            </button>

            {/* Auth */}
            {user ? (
              <div id="profile-menu" className="relative">
                <button onClick={() => setProfileOpen(v => !v)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold  shrink-0">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:block">{user.name?.split(" ")[0]}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    {[
                      { label:"My Profile",   icon:"👤", page:"profile"   },
                      { label:"My Orders",    icon:"📦", page:"orders"    },
                      { label:"Wishlist",     icon:"❤️", page:"wishlist"  },
                      ...(user.role==="SELLER"      ? [{ label:"Seller Hub",  icon:"🏪", page:"seller" }]  : []),
                      ...(["ADMIN","SUPER_ADMIN"].includes(user.role) ? [{ label:"Admin Panel", icon:"⚙️", page:"admin"  }]  : []),
                    ].map(item => (
                      <button key={item.page} onClick={() => { nav(item.page); setProfileOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span>{item.icon}</span>{item.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 dark:border-gray-800">
                      <button onClick={() => { useAuthStore().setUser(null); setProfileOpen(false); nav("home"); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => nav("login")} className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Sign In</button>
                <button onClick={() => nav("register")} className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-xl transition-colors">Sign Up</button>
              </div>
            )}
          </div>
        </div>

        {/* Category strip */}
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            <button onClick={() => nav("products")} className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-orange-500 whitespace-nowrap hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors">⚡ Flash Sale</button>
            {MOCK_CATEGORIES.map(c => (
              <button key={c.id} onClick={() => nav("products")} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl whitespace-nowrap transition-colors">
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}

 

function CartSidebar() {
  const { cartItems, cartOpen, setCartOpen, removeItem, updateQty, cartTotal, cartShipping, cartGrand } = useCartStore();
  const { nav } = useUIStore();
  const { user } = useAuthStore();

  useEffect(() => { document.body.style.overflow = cartOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [cartOpen]);

  return (
    <>
      <div className={cn("fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity", cartOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setCartOpen(false)} />
      <aside className={cn("fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-950 z-50 flex flex-col shadow-2xl border-l border-gray-100 dark:border-gray-800 transition-transform duration-300", cartOpen ? "translate-x-0" : "translate-x-full")} role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span>🛒</span>
            <h2 className="font-black text-gray-900 dark:text-white">My Cart</h2>
            {cartItems.length > 0 && <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">{cartItems.reduce((s,i)=>s+i.qty,0)}</span>}
          </div>
          <button onClick={() => setCartOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors" aria-label="Close">✕</button>
        </div>

        {/* Free shipping bar */}
        {cartTotal > 0 && cartShipping > 0 && (
          <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800 bg-violet-50 dark:bg-violet-900/20">
            <p className="text-xs text-violet-700 dark:text-violet-400 font-semibold mb-1.5">Add {formatPrice(1000 - cartTotal)} for free shipping!</p>
            <div className="h-1.5 bg-violet-200 dark:bg-violet-800 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width:`${Math.min((cartTotal/1000)*100,100)}%` }} />
            </div>
          </div>
        )}
        {cartShipping === 0 && cartTotal > 0 && (
          <div className="px-5 py-2 text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-900/20 border-b border-gray-50 dark:border-gray-800">🎉 Free shipping unlocked!</div>
        )}

        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="font-black text-gray-900 dark:text-white text-lg mb-2">Cart is empty</h3>
              <p className="text-sm text-gray-400 mb-6">Add some awesome products!</p>
              <button onClick={() => { setCartOpen(false); nav("products"); }} className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Browse Products</button>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={item.id} className={cn("flex gap-3 px-4 py-4", idx < cartItems.length-1 && "border-b border-gray-50 dark:border-gray-800")}>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-3xl shrink-0">{item.emoji ?? "🛍️"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">{item.name}</p>
                  {item.variantName && <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-0.5 py-0.5">
                      <button onClick={() => updateQty(item.id, item.qty-1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-violet-600 font-bold text-base transition-colors">−</button>
                      <span className="w-7 text-center text-sm font-black text-gray-900 dark:text-white">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty+1)} disabled={item.qty >= (item.stock ?? 99)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-violet-600 font-bold text-base transition-colors disabled:opacity-30">+</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-violet-600">{formatPrice(Number(item.basePrice || item.price) * item.qty)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors text-sm">🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold dark:text-white">{formatPrice(cartTotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className={cn("font-semibold", cartShipping===0?"text-green-600":"dark:text-white")}>{cartShipping===0?"Free 🎉":formatPrice(cartShipping)}</span></div>
              <div className="flex justify-between font-black text-base border-t border-gray-100 dark:border-gray-800 pt-2"><span className="dark:text-white">Total</span><span className="text-violet-600">{formatPrice(cartGrand)}</span></div>
            </div>
            {user ? (
              <button onClick={() => { setCartOpen(false); nav("checkout"); }} className="w-full py-3.5 bg-linear-to-r from-violet-600 to-violet-700 text-white font-black text-sm rounded-2xl hover:from-violet-700 hover:to-violet-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                Checkout · {formatPrice(cartGrand)} →
              </button>
            ) : (
              <button onClick={() => { setCartOpen(false); nav("login"); }} className="w-full py-3.5 bg-violet-600 text-white font-black text-sm rounded-2xl hover:bg-violet-700 transition-colors">
                Sign In to Checkout
              </button>
            )}
            <button onClick={() => { setCartOpen(false); nav("cart"); }} className="w-full text-xs text-violet-600 font-semibold hover:underline">View Full Cart</button>
          </div>
        )}
      </aside>
    </>
  );
}

 

function NotifPanel() {
  const { notifPanelOpen, toggleNotifPanel } = useUIStore();
  const { user } = useAuthStore();
  const { nav } = useUIStore();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!notifPanelOpen || !user) return;
    setLoading(true);
    apiGet("/api/user/notifications?limit=10", null)
      .then(d => { setNotifs(d?.notifications ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [notifPanelOpen, user]);

  const ICONS: Record<string, string> = { ORDER_PLACED:"📦", ORDER_SHIPPED:"🚚", ORDER_DELIVERED:"✅", ORDER_CANCELLED:"❌", PAYMENT_SUCCESS:"💳", FLASH_SALE:"⚡", PROMO_ALERT:"🎁", SYSTEM:"🔔" };

  if (!notifPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={toggleNotifPanel}>
      <aside className="absolute right-4 top-20 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2"><span>🔔</span><h2 className="font-bold text-sm text-gray-900 dark:text-white">Notifications</h2></div>
          <button onClick={toggleNotifPanel} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">{[...Array(3)].map((_,i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
          ) : notifs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-sm">{user ? "All caught up!" : "Sign in to see notifications"}</p>
              {!user && <button onClick={() => { toggleNotifPanel(); nav("login"); }} className="mt-3 text-xs text-violet-600 font-semibold hover:underline">Sign In</button>}
            </div>
          ) : (
            notifs.map(n => (
              <div key={n.id} className={cn("flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer", !n.isRead && "bg-violet-50/50 dark:bg-violet-900/10")}>
                <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-lg  shrink-0">{ICONS[n.type] ?? "🔔"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-violet-600 rounded-full  shrink-0 mt-1.5" />}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

 
export function ProductCard({ product: p }: { product: any }) {
  const { addItem } = useCartStore();
  const { nav }     = useUIStore();
  const { toggle: toggleWish, isIn: inWish } = useWishlistStore();
  const { cartItems } = useCartStore();
  const inCart  = cartItems.some(i => i.id === p.id);
  const price   = Number(p.basePrice ?? p.price ?? 0);
  const orig    = Number(p.comparePrice ?? p.originalPrice ?? 0);
  const disc    = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
  const fav     = inWish(p.id);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden group hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-md transition-all">
      <button onClick={() => nav("product", p.slug)} className="block w-full aspect-square bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">{p.emoji ?? (p.images?.[0]?.url ? "" : "🛍️")}</div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {p.badge && <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full text-white", p.badge==="New"?"bg-blue-500":p.badge==="Sale"?"bg-red-500":p.badge==="Hot"?"bg-orange-500":p.badge==="Trending"?"bg-purple-500":"bg-violet-600")}>{p.badge}</span>}
          {disc > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-500 text-white">-{disc}%</span>}
          {p.isEco && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">🌿 Eco</span>}
          {p.isFlashSale && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">⚡ Flash</span>}
        </div>
        <button onClick={e => { e.stopPropagation(); toggleWish(p.id); }}
          className={cn("absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all", fav ? "bg-red-100 dark:bg-red-900/30 opacity-100" : "bg-white/80 dark:bg-gray-800/80 opacity-0 group-hover:opacity-100")}>
          <span className={cn("text-sm", fav ? "text-red-500" : "text-gray-400")}>♥</span>
        </button>
        {p.stock === 0 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white font-black text-sm bg-black/60 px-3 py-1 rounded-xl">Out of Stock</span></div>}
        {p.stock > 0 && p.stock <= 5 && <div className="absolute bottom-2 left-2 text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">Only {p.stock} left!</div>}
      </button>
      <div className="p-3">
        <p className="text-[10px] text-gray-400 mb-0.5">{p.seller?.storeName}</p>
        <button onClick={() => nav("product", p.slug)} className="block font-semibold text-xs text-gray-900 dark:text-white hover:text-violet-600 text-left line-clamp-2 mb-1.5 w-full transition-colors">{p.name}</button>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-amber-400 text-[10px]">{"★".repeat(Math.round(p.rating ?? p.averageRating ?? 0))}</span>
          <span className="text-[10px] text-gray-400">({(p.reviews ?? p.totalReviews ?? 0).toLocaleString()})</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2.5">
          <span className="font-black text-sm text-violet-600">{formatPrice(price)}</span>
          {orig > price && <span className="text-[10px] text-gray-400 line-through">{formatPrice(orig)}</span>}
        </div>
        {p.stock > 0 ? (
          <button onClick={() => addItem(p)} className={cn("w-full py-2 text-xs font-bold rounded-xl transition-all active:scale-95", inCart ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" : "bg-violet-600 text-white hover:bg-violet-700")}>
            {inCart ? "✓ Added" : "Add to Cart"}
          </button>
        ) : (
          <button disabled className="w-full py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed">Out of Stock</button>
        )}
        {p.freeShipping && <p className="text-[10px] text-green-600 font-semibold text-center mt-1.5">🚚 Free shipping</p>}
      </div>
    </div>
  );
}

 
function HomePage() {
  const { nav } = useUIStore();
  const [products,  setProducts]  = useState(MOCK_PRODUCTS);
  const [flash,     setFlash]     = useState(MOCK_PRODUCTS.filter(p => p.isFlashSale));
  const [slide,     setSlide]     = useState(0);
  const [countdown, setCountdown] = useState({ h:4, m:23, s:14 });

  // Load products from real API (nexmart/api-products-route.ts)
  useEffect(() => {
    apiGet("/api/products?limit=12", null).then(d => { if (d?.products?.length) setProducts(d.products); });
    apiGet("/api/products?isFlashSale=true&limit=4", null).then(d => { if (d?.products?.length) setFlash(d.products); });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(p => {
      let {h,m,s}=p; s--;
      if(s<0){s=59;m--;} if(m<0){m=59;h--;} if(h<0){h=4;m=59;s=59;}
      return {h,m,s};
    }), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s+1)%3), 4000);
    return () => clearInterval(t);
  }, []);

  const SLIDES = [
    { headline:"Biggest Sale of the Year",   sub:"Up to 70% off on Electronics",    bg:"from-violet-600 to-violet-800", emoji:"⚡", cta:"Shop Electronics" },
    { headline:"New Arrivals — Fashion 2025", sub:"Styles that define the season",   bg:"from-rose-500 to-orange-600",   emoji:"✨", cta:"Explore Fashion"  },
    { headline:"Eco-Friendly Living",         sub:"Sustainable picks, happy planet", bg:"from-emerald-600 to-teal-700",  emoji:"🌿", cta:"Shop Green"       },
  ];
  const sl = SLIDES[slide];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      {/* Hero */}
      <div className={`bg-linear-to-r ${sl.bg} rounded-3xl overflow-hidden`}>
        <div className="flex items-center justify-between px-8 py-10 md:py-14">
          <div className="text-white max-w-lg">
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-2">NexMart Exclusive</p>
            <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">{sl.headline}</h1>
            <p className="text-white/80 text-lg mb-6">{sl.sub}</p>
            <button onClick={() => nav("products")} className="bg-white text-violet-700 font-black px-7 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all">{sl.cta} →</button>
          </div>
          <div className="text-8xl md:text-9xl hidden sm:block select-none">{sl.emoji}</div>
        </div>
        <div className="flex justify-center gap-2 pb-4">
          {SLIDES.map((_,i) => (
            <button key={i} onClick={() => setSlide(i)} className={cn("h-1.5 rounded-full transition-all", slide===i?"bg-white w-6":"bg-white/40 w-1.5")} />
          ))}
        </div>
      </div>

      {/* Flash Sale */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">⚡ Flash Sale</h2>
            <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-xl">
              {[countdown.h,countdown.m,countdown.s].map((v,i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="bg-orange-600 text-white text-xs font-black px-1.5 py-0.5 rounded-lg tabular-nums">{String(v).padStart(2,"0")}</span>
                  {i<2 && <span className="text-orange-600 font-black">:</span>}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => nav("products")} className="text-sm text-violet-600 font-bold hover:underline">View All →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {flash.slice(0,4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-5">Shop by Category</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {MOCK_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => nav("products")} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all group">
              <span className="text-3xl group-hover:scale-110 transition-transform">{c.icon}</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">🔥 Trending Now</h2>
          <button onClick={() => nav("products")} className="text-sm text-violet-600 font-bold hover:underline">View All →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0,8).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Trust */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{icon:"🛡️",t:"Buyer Protection",s:"100% safe shopping"},{icon:"🚚",t:"Fast Delivery",s:"2-3 days nationwide"},{icon:"↩️",t:"Easy Returns",s:"7-day hassle-free"},{icon:"💳",t:"Secure Payment",s:"Khalti, eSewa & more"}].map(item => (
          <div key={item.t} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div><p className="text-sm font-bold text-gray-900 dark:text-white">{item.t}</p><p className="text-xs text-gray-400">{item.s}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// PRODUCTS PAGE  — GET /api/products with filters
function ProductsPage() {
  const { searchQuery } = useUIStore();
  const [products, setProducts] = useState<any[]>(MOCK_PRODUCTS);
  const [loading,  setLoading]  = useState(false);
  const [sort,     setSort]     = useState("newest");
  const [catFilt,  setCatFilt]  = useState("all");
  const [maxPrice, setMaxPrice] = useState(300000);
  const [minRating,setMinRating]= useState(0);
  const dSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit:"50", sort });
    if (dSearch)          p.set("search", dSearch);
    if (catFilt !== "all") p.set("category", catFilt);
    apiGet(`/api/products?${p}`, null)
      .then(d => { if (d?.products?.length) setProducts(d.products); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sort, catFilt, dSearch]);

  const filtered = products.filter(p => {
    if (Number(p.basePrice ?? p.price ?? 0) > maxPrice) return false;
    if ((p.rating ?? p.averageRating ?? 0) < minRating) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-60  shrink-0 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <h3 className="font-black text-gray-900 dark:text-white mb-4">Filters</h3>
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</p>
              {[{id:"all",name:"All Categories",icon:"🏪"}, ...MOCK_CATEGORIES].map(c => (
                <label key={c.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input type="radio" name="cat" value={c.id} checked={catFilt===c.id} onChange={() => setCatFilt(c.id)} className="accent-violet-600" />
                  <span className={cn("text-sm transition-colors", catFilt===c.id?"text-violet-600 font-semibold":"text-gray-600 dark:text-gray-400")}>{c.icon} {c.name}</span>
                </label>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Price: <span className="text-violet-600">{formatPrice(maxPrice)}</span></p>
              <input type="range" min={0} max={300000} step={5000} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="w-full accent-violet-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Rating</p>
              {[0,3,4,4.5].map(r => (
                <label key={r} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="radio" name="rating" checked={minRating===r} onChange={() => setMinRating(r)} className="accent-violet-600" />
                  <span className="text-sm text-amber-500">{r===0?"Any Rating":("★".repeat(Math.round(r))+"☆".repeat(5-Math.round(r)))+`+ (${r}★)`}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} products</p>
            <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none">
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating_desc">Top Rated</option>
              <option value="sales_desc">Best Selling</option>
            </select>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_,i) => <div key={i} className="aspect-3/4 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24"><div className="text-6xl mb-4">🔍</div><h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No products found</h3><p className="text-gray-400">Try adjusting your filters</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// PRODUCT DETAIL  — GET /api/products/[slug]  (nexmart/api-product-slug-categories-search.ts)
function ProductDetailPage() {
  const { pageData, nav } = useUIStore();
  const { addItem }       = useCartStore();
  const { toggle: toggleWish, isIn } = useWishlistStore();
  const [product, setProduct] = useState<any>(MOCK_PRODUCTS.find(p => p.slug === pageData) ?? MOCK_PRODUCTS[0]);
  const [qty, setQty] = useState(1);
  const inWish = isIn(product?.id);

  useEffect(() => {
    if (!pageData) return;
    apiGet(`/api/products/${pageData}`, null)
      .then(d => { if (d?.product) setProduct(d.product); })
      .catch(() => {});
  }, [pageData]);

  if (!product) return null;
  const price = Number(product.basePrice ?? product.price ?? 0);
  const orig  = Number(product.comparePrice ?? product.originalPrice ?? 0);
  const disc  = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
  const related = MOCK_PRODUCTS.filter(p => p.category?.name === product.category?.name && p.id !== product.id).slice(0,4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <button onClick={() => nav("home")} className="hover:text-violet-600 transition-colors">Home</button>
        <span>/</span>
        <button onClick={() => nav("products")} className="hover:text-violet-600 transition-colors">{product.category?.name}</button>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300 font-medium line-clamp-1">{product.name}</span>
      </nav>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 flex items-center justify-center aspect-square text-9xl">{product.emoji ?? "🛍️"}</div>
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {disc > 0 && <span className="text-xs font-black px-2.5 py-1 rounded-full bg-green-500 text-white">{disc}% OFF</span>}
              {product.isEco && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">🌿 Eco-Friendly</span>}
              {product.freeShipping && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">🚚 Free Shipping</span>}
              {product.isFlashSale && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">⚡ Flash Sale</span>}
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{product.name}</h1>
            <p className="text-sm text-gray-400">by <span className="text-violet-600 font-semibold">{product.seller?.storeName}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">{"★".repeat(Math.round(product.rating ?? product.averageRating ?? 0))}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{product.rating ?? product.averageRating ?? 0}</span>
            <span className="text-sm text-gray-400">({(product.reviews ?? product.totalReviews ?? 0).toLocaleString()} reviews)</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-violet-600">{formatPrice(price)}</span>
            {orig > price && <div><span className="text-gray-400 line-through text-lg">{formatPrice(orig)}</span><span className="ml-2 text-green-600 font-bold text-sm">Save {formatPrice(orig - price)}</span></div>}
          </div>
          <div className={cn("text-sm font-semibold", (product.stock??0)===0?"text-red-500":(product.stock??99)<=5?"text-amber-500":"text-green-600")}>
            {(product.stock??0)===0?"❌ Out of Stock":(product.stock??99)<=5?`⚠️ Only ${product.stock} left!`:`✅ In Stock (${product.stock ?? "many"} units)`}
          </div>
          {(product.stock??1) > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-2 py-1">
                <button onClick={() => setQty(Math.max(1,qty-1))} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-violet-600 font-black text-lg transition-colors">−</button>
                <span className="w-10 text-center font-black text-gray-900 dark:text-white">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock??99,qty+1))} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-violet-600 font-black text-lg transition-colors">+</button>
              </div>
              <button onClick={() => addItem(product, qty)} className="flex-1 py-3.5 font-black rounded-2xl transition-all active:scale-95 bg-violet-600 text-white hover:bg-violet-700">Add to Cart</button>
              <button onClick={() => toggleWish(product.id)} className={cn("p-3.5 rounded-2xl border-2 transition-all", inWish?"border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500":"border-gray-200 dark:border-gray-700 text-gray-400 hover:border-red-300 hover:text-red-500")}>♥</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {["100% Genuine Product","7-Day Easy Returns","Secure Payment","Buyer Protection"].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><span className="text-green-500">✓</span>{f}</div>
            ))}
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-5">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{related.map(p => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}

// CART PAGE  — mirrors app/(shop)/cart/page.tsx (nexmart-cart-customer/02)
function CartPage() {
  const { cartItems, removeItem, updateQty, clearCart, cartTotal, cartShipping, cartGrand } = useCartStore();
  const { nav } = useUIStore();
  const { user } = useAuthStore();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">🛒 Cart ({cartItems.length})</h1>
        {cartItems.length > 0 && <button onClick={clearCart} className="text-sm text-red-500 font-semibold hover:underline">Clear all</button>}
      </div>
      {cartItems.length === 0 ? (
        <div className="text-center py-24"><div className="text-7xl mb-5">🛒</div><h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Your cart is empty</h2><p className="text-gray-400 mb-8">Add some amazing products!</p><button onClick={() => nav("home")} className="px-8 py-3.5 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 transition-colors">Start Shopping</button></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {cartItems.map((item, idx) => (
              <div key={item.id} className={cn("flex gap-4 p-5", idx < cartItems.length-1 && "border-b border-gray-50 dark:border-gray-800")}>
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-4xl  shrink-0">{item.emoji ?? "🛍️"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5 line-clamp-2">{item.name}</p>
                  {item.seller?.storeName && <p className="text-xs text-gray-400 mb-3">{item.seller.storeName}</p>}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      <button onClick={() => updateQty(item.id, item.qty-1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-violet-600 font-bold text-lg transition-colors">−</button>
                      <span className="w-8 text-center font-black text-gray-900 dark:text-white">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty+1)} disabled={item.qty>=(item.stock??99)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-violet-600 font-bold text-lg transition-colors disabled:opacity-30">+</button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-violet-600">{formatPrice(Number(item.basePrice??item.price??0) * item.qty)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-sm text-gray-400 hover:text-red-500 transition-colors font-semibold">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-fit sticky top-24">
            <h2 className="font-black text-gray-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold dark:text-white">{formatPrice(cartTotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className={cn("font-semibold", cartShipping===0?"text-green-600":"dark:text-white")}>{cartShipping===0?"Free 🎉":formatPrice(cartShipping)}</span></div>
              {cartShipping>0 && <p className="text-xs text-gray-400">Add {formatPrice(1000-cartTotal)} more for free shipping</p>}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-2.5 flex justify-between font-black text-lg"><span className="dark:text-white">Total</span><span className="text-violet-600">{formatPrice(cartGrand)}</span></div>
            </div>
            {user ? (
              <button onClick={() => nav("checkout")} className="w-full py-4 bg-linear-to-r from-violet-600 to-violet-700 text-white font-black rounded-2xl hover:from-violet-700 hover:to-violet-800 transition-all active:scale-[0.98] mb-3">Proceed to Checkout →</button>
            ) : (
              <button onClick={() => nav("login")} className="w-full py-4 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 transition-colors mb-3">Sign In to Checkout</button>
            )}
            <button onClick={() => nav("home")} className="w-full text-sm text-violet-600 font-semibold hover:underline">Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
}

// CHECKOUT PAGE  — POST /api/orders  (nexmart-orders/01)
function CheckoutPage() {
  const { cartItems, cartTotal, cartShipping, cartGrand, clearCart } = useCartStore();
  const { nav, showToast } = useUIStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState("address");
  const [address, setAddress] = useState<{ [k: string]: string }>({ fullName:user?.name??"", phone:"", street:"", city:"Kathmandu", district:"Kathmandu", province:"Bagmati", country:"Nepal" });
  const [payMethod, setPayMethod] = useState("KHALTI");
  const [placing, setPlacing] = useState(false);
  const [orderNum, setOrderNum] = useState("");

  const placeOrder = async () => {
    setPlacing(true);
    // POST /api/orders  (nexmart-orders/01)
    const res = await apiPost("/api/orders", {
      addressId:     "temp-addr",
      paymentMethod: payMethod,
      items: cartItems.map(i => ({ productId: i.id, quantity: i.qty })),
    });
    setPlacing(false);
    if (res?.order?.orderNumber || res?.orderNumber) {
      const num = res?.order?.orderNumber ?? res?.orderNumber ?? generateOrderNumber();
      setOrderNum(num);
      clearCart();
      setStep("confirmed");
    } else {
      // Mock success for demo
      setOrderNum(generateOrderNumber());
      clearCart();
      setStep("confirmed");
      showToast("Order placed successfully! 🎉");
    }
  };

  if (step === "confirmed") return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">✅</div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Order Confirmed! 🎉</h2>
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-2xl p-4 mb-6 inline-block">
        <p className="text-xs text-gray-500">Order Number</p>
        <p className="text-2xl font-black text-violet-600">{orderNum}</p>
      </div>
      <p className="text-gray-400 mb-8 text-sm">We'll send a confirmation to your email.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => nav("orders")} className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Track Order</button>
        <button onClick={() => nav("home")} className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Continue Shopping</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          {/* Address */}
          {step === "address" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">📍 Delivery Address</h2>
              <div className="space-y-4">
                {[{l:"Full Name *",k:"fullName",ph:"Arun Kumar"},{l:"Phone *",k:"phone",ph:"+977 9800000000"},{l:"Street Address *",k:"street",ph:"Ward No., Locality, Street"}].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{f.l}</label>
                    <input value={address[f.k]} onChange={e => setAddress(a => ({...a,[f.k]:e.target.value}))} placeholder={f.ph}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-violet-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  {[{l:"City *",k:"city"},{l:"District *",k:"district"}].map(f => (
                    <div key={f.k}>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{f.l}</label>
                      <input value={address[f.k]} onChange={e => setAddress(a => ({...a,[f.k]:e.target.value}))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-violet-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all" />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep("payment")} className="w-full mt-5 py-3 bg-violet-600 text-white font-black rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">Continue to Payment →</button>
            </div>
          )}
          {/* Payment */}
          {step === "payment" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">💳 Payment Method</h2>
              <div className="space-y-3 mb-5">
                {[{id:"KHALTI",name:"Khalti",desc:"Digital wallet",logo:"🟣",rec:true},{id:"ESEWA",name:"eSewa",desc:"Nepal's most popular wallet",logo:"🟢"},{id:"STRIPE",name:"Card (Visa/MC)",desc:"Secured by Stripe",logo:"💳"},{id:"CASH_ON_DELIVERY",name:"Cash on Delivery",desc:"Pay when delivered",logo:"💵"}].map(m => (
                  <label key={m.id} className={cn("flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all", payMethod===m.id?"border-violet-500 bg-violet-50 dark:bg-violet-900/20":"border-gray-200 dark:border-gray-700 hover:border-gray-300")}>
                    <input type="radio" name="pay" value={m.id} checked={payMethod===m.id} onChange={() => setPayMethod(m.id)} className="sr-only" />
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-sm  shrink-0">{m.logo}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}</span>
                        {m.rec && <span className="text-xs bg-violet-600 text-white font-bold px-2 py-0.5 rounded-full">Recommended</span>}
                      </div>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center  shrink-0", payMethod===m.id?"border-violet-600":"border-gray-300")}>
                      {payMethod===m.id && <div className="w-2.5 h-2.5 bg-violet-600 rounded-full" />}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("address")} className="flex items-center gap-1 px-5 py-3 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">← Back</button>
                <button onClick={() => setStep("review")} className="flex-1 py-3 bg-violet-600 text-white font-black rounded-xl hover:bg-violet-700 transition-colors">Review Order →</button>
              </div>
            </div>
          )}
          {/* Review */}
          {step === "review" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">✅ Review Order</h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">{address.fullName}</p>
                <p className="text-gray-500">{address.street}, {address.city}, {address.district}</p>
              </div>
              <div className="space-y-3 mb-5">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl  shrink-0">{item.emoji ?? "🛍️"}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p><p className="text-xs text-gray-400">×{item.qty}</p></div>
                    <p className="text-sm font-bold text-violet-600">{formatPrice(Number(item.basePrice??item.price??0)*item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4 flex items-center gap-2">
                <span>🚚</span><p className="text-sm font-semibold text-green-700 dark:text-green-400">Estimated delivery in 2-3 business days</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("payment")} className="px-5 py-3 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">← Back</button>
                <button onClick={placeOrder} disabled={placing} className="flex-1 flex items-center justify-center gap-2 py-3 bg-linear-to-r from-violet-600 to-violet-700 text-white font-black rounded-xl hover:from-violet-700 hover:to-violet-800 disabled:opacity-60 transition-all active:scale-[0.98]">
                  {placing ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "🔒"} {placing ? "Placing Order…" : `Place Order · ${formatPrice(cartGrand)}`}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Summary sidebar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-fit sticky top-24">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold dark:text-white">{formatPrice(cartTotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={cn("font-semibold", cartShipping===0?"text-green-600":"dark:text-white")}>{cartShipping===0?"Free 🎉":formatPrice(cartShipping)}</span></div>
            <div className="flex justify-between font-black text-base border-t border-gray-100 dark:border-gray-800 pt-2"><span className="dark:text-white">Total</span><span className="text-violet-600">{formatPrice(cartGrand)}</span></div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">🔒 256-bit SSL Encrypted</div>
            <div className="flex items-center gap-1.5">↩️ 7-Day Easy Returns</div>
            <div className="flex items-center gap-1.5">🛡️ 100% Buyer Protection</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ORDERS PAGE  — GET /api/orders  (nexmart-orders/01)
function OrdersPage() {
  const { user } = useAuthStore();
  const { nav } = useUIStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) { nav("login"); return; }
    setLoading(true);
    const p = new URLSearchParams({ limit: "10" });
    if (activeTab !== "all") p.set("status", activeTab);
    apiGet(`/api/orders?${p}`, null)
      .then(d => { setOrders(d?.orders ?? MOCK_ORDERS); setLoading(false); })
      .catch(() => { setOrders(MOCK_ORDERS); setLoading(false); });
  }, [user, activeTab]);

  const STATUS_CFG: Record<string, {bg: string; icon: string}> = { PENDING:{bg:"bg-yellow-100 text-yellow-700",icon:"⏳"}, CONFIRMED:{bg:"bg-blue-100 text-blue-700",icon:"✅"}, SHIPPED:{bg:"bg-violet-100 text-violet-700",icon:"🚚"}, OUT_FOR_DELIVERY:{bg:"bg-orange-100 text-orange-700",icon:"🛵"}, DELIVERED:{bg:"bg-green-100 text-green-700",icon:"🎉"}, CANCELLED:{bg:"bg-red-100 text-red-700",icon:"❌"}, RETURN_REQUESTED:{bg:"bg-amber-100 text-amber-700",icon:"↩️"} };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">📦 My Orders</h1>
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-5 overflow-x-auto">
        {["all","PENDING","SHIPPED","DELIVERED","CANCELLED"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap", activeTab===t?"bg-white dark:bg-gray-700 text-violet-600 shadow-sm":"text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}>
            {t==="all"?"All Orders":t.replace("_"," ")}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-36 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20"><div className="text-6xl mb-4">📭</div><h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No orders found</h3><button onClick={() => nav("home")} className="mt-4 px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Start Shopping</button></div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = STATUS_CFG[order.status] ?? {bg:"bg-gray-100 text-gray-600",icon:"📦"};
            const firstItem = order.items?.[0];
            return (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-bold text-sm text-violet-600">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
                  </div>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1", cfg.bg)}>{cfg.icon} {order.status.replace("_"," ")}</span>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-3xl  shrink-0">{firstItem?.emoji ?? firstItem?.product?.name?.[0] ?? "🛍️"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{firstItem?.product?.name ?? firstItem?.name}</p>
                      {order.items?.length > 1 && <p className="text-xs text-gray-400">+{order.items.length-1} more items</p>}
                    </div>
                    <p className="font-black text-violet-600">{formatPrice(Number(order.total))}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => nav("order", order.id)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">👁 View Details</button>
                    {order.trackingNumber && <button onClick={() => nav("track")} className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-xs font-semibold text-violet-700 dark:text-violet-400 rounded-xl hover:bg-violet-100 transition-colors border border-violet-200 dark:border-violet-800">📍 Track</button>}
                    {["DELIVERED"].includes(order.status) && <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-xs font-semibold text-amber-700 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 dark:border-amber-800">⭐ Review</button>}
                    {["PENDING","CONFIRMED"].includes(order.status) && <button className="px-4 py-2 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Cancel</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ORDER DETAIL  — GET /api/orders/[id]  (nexmart-orders/01)
function OrderDetailPage() {
  const { pageData, nav } = useUIStore();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!pageData) return;
    apiGet(`/api/orders/${pageData}`, null)
      .then(d => setData(d))
      .catch(() => setData({ order: MOCK_ORDERS.find(o => o.id === pageData) ?? MOCK_ORDERS[0], cancellable: false }));
  }, [pageData]);

  if (!data) return <div className="max-w-4xl mx-auto px-4 py-16 text-center"><div className="text-5xl mb-3">⏳</div><p className="text-gray-400">Loading order details…</p></div>;

  const { order } = data;
  if (!order) return null;

  const STATUS_STEPS = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED"];
  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => nav("orders")} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors">←</button>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-400">{timeAgo(order.createdAt)}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-5">
        <h2 className="font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">📦 Order Timeline</h2>
        {order.trackingNumber && (
          <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-xl px-4 py-3 mb-5">
            <span>🚚</span>
            <div className="flex-1">
              <p className="text-xs text-violet-600 font-semibold">Tracking Number</p>
              <p className="font-mono font-bold text-sm text-gray-900 dark:text-white">{order.trackingNumber}</p>
            </div>
          </div>
        )}
        <div className="relative">
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />
          {STATUS_STEPS.map((step, i) => {
            const done   = !["CANCELLED","RETURN_REQUESTED"].includes(order.status) && currentStep >= i;
            const active = order.status === step;
            const LABELS: Record<string, string> = { PENDING:"Order Placed",CONFIRMED:"Confirmed",PROCESSING:"Packing",SHIPPED:"Shipped",OUT_FOR_DELIVERY:"Out for Delivery",DELIVERED:"Delivered" };
            const ICONS: Record<string, string>  = { PENDING:"📋",CONFIRMED:"✅",PROCESSING:"📦",SHIPPED:"🚚",OUT_FOR_DELIVERY:"🛵",DELIVERED:"🎉" };
            return (
              <div key={step} className="flex items-start gap-4 mb-5 relative">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center  shrink-0 z-10 text-sm border-2 transition-all", active?"bg-violet-600 border-violet-600 text-white ring-4 ring-violet-100 dark:ring-violet-900/40 scale-110":done?"bg-violet-600 border-violet-600 text-white":"bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300")}>
                  {ICONS[step]}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={cn("font-semibold text-sm", done?"text-gray-900 dark:text-white":"text-gray-400")}>{LABELS[step]}{active && <span className="ml-2 text-[10px] text-violet-600 font-black animate-pulse">● NOW</span>}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-5">
        <h2 className="font-black text-gray-900 dark:text-white mb-4">Order Items</h2>
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-3xl shrink-0">{item.emoji ?? "🛍️"}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.product?.name ?? item.name}</p>
              <p className="text-xs text-gray-400">×{item.quantity ?? item.qty}</p>
            </div>
            <p className="font-black text-violet-600">{formatPrice(Number(item.total ?? item.price ?? 0))}</p>
          </div>
        ))}
        <div className="pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold dark:text-white">{formatPrice(Number(order.subtotal??order.total??0))}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={cn("font-semibold", Number(order.shippingCost??0)===0?"text-green-600":"dark:text-white")}>{Number(order.shippingCost??0)===0?"Free 🎉":formatPrice(Number(order.shippingCost??0))}</span></div>
          <div className="flex justify-between font-black text-base border-t border-gray-100 dark:border-gray-800 pt-2"><span className="dark:text-white">Total</span><span className="text-violet-600">{formatPrice(Number(order.total??0))}</span></div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => nav("track")} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-semibold text-sm rounded-xl hover:bg-violet-700 transition-colors">📍 Track Order</button>
        <button onClick={() => nav("orders")} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">← All Orders</button>
      </div>
    </div>
  );
}

// TRACK PAGE  — GET /api/orders/[id]/track  (nexmart-orders/01)
function TrackPage() {
  const { nav } = useUIStore();
  const [input, setInput] = useState("");
  const [data, setData]   = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const d = await apiGet(`/api/orders/${input.trim()}/track`, null);
    setLoading(false);
    setData(d ?? { order: { ...MOCK_ORDERS[0], orderNumber: input }, timeline: [] });
  };

  return (
    <div className="min-h-[60vh] bg-linear-to-br from-violet-50 to-orange-50 dark:from-violet-900/10 dark:to-orange-900/10">
      <div className="bg-linear-to-r from-violet-600 to-violet-700 py-12 px-4 text-center">
        <h1 className="text-3xl font-black text-white mb-2">📦 Track Your Order</h1>
        <p className="text-violet-200 mb-7">Enter your order number to get live delivery updates</p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && fetch_()} placeholder="e.g. NX-2025-47832" className="flex-1 px-4 py-3 rounded-2xl bg-white text-gray-900 font-mono font-semibold text-sm outline-none placeholder:text-gray-300 placeholder:font-normal" />
          <button onClick={fetch_} disabled={loading} className="px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors disabled:opacity-60">{loading ? "…" : "Track"}
          </button>
        </div>
      </div>
      {data?.order && (
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-mono font-black text-violet-600 text-lg">{data.order.orderNumber}</p>
                <p className="text-sm text-gray-400">Payment: {data.order.paymentMethod?.replace("_"," ")}</p>
              </div>
              <span className="text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 px-2.5 py-1 rounded-full">{data.order.status?.replace("_"," ")}</span>
            </div>
            {data.order.trackingNumber && <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl px-3 py-2.5"><span>🚚</span><p className="font-mono text-sm font-bold text-gray-900 dark:text-white">{data.order.trackingNumber}</p></div>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => nav("orders")} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">All Orders</button>
            <button onClick={() => nav("order", data.order.id)} className="flex-1 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors">View Details</button>
          </div>
        </div>
      )}
    </div>
  );
}

// LOGIN PAGE  — POST /api/auth/credentials via next-auth  (nexmart-cart-customer/07)
function LoginPage() {
  const { nav, showToast } = useUIStore();
  const { setUser }        = useAuthStore();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    // In Next.js, replace this with: signIn("credentials", { email, password, redirect:false })
    // and then call mergeGuestCart() on success
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    if (password.length < 6) { setError("Incorrect email or password. Please try again."); return; }
    const name = email.split("@")[0].replace(/\./g," ").replace(/\b\w/g,c=>c.toUpperCase());
    setUser({ name, email, role:"CUSTOMER", loyaltyPoints:100, loyaltyTier:"BRONZE" });
    showToast("Welcome back! 👋");
    nav("home");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-linear-to-br from-violet-600 via-violet-700 to-orange-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-40 -left-40 w-96 h-96 bg-white/5 rounded-full" /><div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full" /></div>
        <div className="relative z-10 text-white text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center font-black text-2xl">N</div>
            <span className="text-3xl font-black">Nex<span className="text-orange-300">Mart</span></span>
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight">Nepal's Smartest Shopping Experience</h1>
          <p className="text-white/70 text-lg mb-10">AI-powered recommendations, flash deals, and trusted sellers.</p>
          <div className="flex flex-col gap-3">
            {[{icon:"✨",l:"AI-Powered Recommendations"},{icon:"🛡️",l:"100% Buyer Protection"},{icon:"⚡",l:"Flash Deals Every Hour"}].map(f => (
              <div key={f.l} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-5 py-3 text-left"><span className="text-xl">{f.icon}</span><span className="font-semibold text-sm">{f.l}</span></div>
            ))}
          </div>
          <div className="flex gap-8 justify-center mt-10 border-t border-white/20 pt-8">
            {[{n:"3M+",l:"Shoppers"},{n:"85K+",l:"Sellers"},{n:"4.9★",l:"Rating"}].map(s => (
              <div key={s.l}><p className="text-2xl font-black">{s.n}</p><p className="text-white/60 text-xs">{s.l}</p></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <button onClick={() => nav("home")} className="flex items-center justify-center gap-2 mb-8 mx-auto lg:hidden">
            <div className="w-9 h-9 bg-linear-to-br from-violet-600 to-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm">N</div>
            <span className="text-2xl font-black dark:text-white">Nex<span className="text-violet-600">Mart</span></span>
          </button>
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Welcome back</h2>
            <p className="text-gray-400 text-sm mb-7">Sign in to continue shopping</p>
            {error && <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 mb-5"><span className="text-red-500 text-sm">⚠️</span><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 transition-all mb-5">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 mb-5"><div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" /><span className="text-xs text-gray-400 font-medium">or continue with email</span><div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" /></div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" /></div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label><button type="button" onClick={() => nav("forgot")} className="text-xs text-violet-600 font-semibold hover:underline">Forgot password?</button></div>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span><input type={showPass?"text":"password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">{showPass?"🙈":"👁"}</button></div>
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 transition-all active:scale-[0.98] disabled:opacity-70">
                {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Sign In</span><span>→</span></>}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">Don't have an account? <button onClick={() => nav("register")} className="text-violet-600 font-black hover:underline">Create one free</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// REGISTER PAGE  — POST /api/auth/register  (nexmart-cart-customer/07)
function RegisterPage() {
  const { nav, showToast } = useUIStore();
  const { setUser }        = useAuthStore();
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", phone:"", password:"", confirmPassword:"", accept:false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setForm(p => ({...p,[k]:v}));
  const pw = form.password;
  const pwChecks = [pw.length>=8,/[A-Z]/.test(pw),/[0-9]/.test(pw),/[^A-Za-z0-9]/.test(pw)];
  const pwScore  = pwChecks.filter(Boolean).length;
  const pwColors = ["","bg-red-500","bg-orange-500","bg-yellow-500","bg-green-500"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.firstName.length < 2) errs.firstName = "Min 2 chars";
    if (form.lastName.length  < 2) errs.lastName  = "Min 2 chars";
    if (!form.email.includes("@")) errs.email     = "Invalid email";
    if (pwScore < 4) errs.password = "Password too weak";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    if (!form.accept) errs.accept = "You must accept the terms";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    // POST /api/auth/register  (nexmart-cart-customer/07)
    const res = await apiPost("/api/auth/register", { ...form });
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    if (res?.error) { setErrors({ email: res.error }); return; }
    setUser({ name:`${form.firstName} ${form.lastName}`, email:form.email, role:"CUSTOMER", loyaltyPoints:150, loyaltyTier:"BRONZE" });
    showToast("Account created! Welcome to NexMart 🎉");
    nav("home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 py-10">
      <div className="w-full max-w-lg">
        <button onClick={() => nav("home")} className="flex items-center justify-center gap-2 mb-8 mx-auto">
          <div className="w-10 h-10 bg-linear-to-br from-violet-600 to-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-lg">N</div>
          <span className="text-2xl font-black dark:text-white">Nex<span className="text-violet-600">Mart</span></span>
        </button>
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm mb-5">Join 3M+ shoppers on NexMart</p>
          <div className="flex items-center gap-3 bg-linear-to-r from-violet-50 to-orange-50 dark:from-violet-900/20 dark:to-orange-900/20 border border-violet-100 dark:border-violet-800 rounded-2xl px-4 py-3 mb-6">
            <span className="text-xl">🎁</span>
            <div><p className="text-sm font-bold text-gray-900 dark:text-white">100 welcome points on sign up!</p><p className="text-xs text-gray-500">Worth रू 10 · usable on first order</p></div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[{k:"firstName",lbl:"First Name *",ph:"Arun"},{k:"lastName",lbl:"Last Name *",ph:"Kumar"}].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{f.lbl}</label>
                  <input value={(form as any)[f.k]} onChange={e => set(f.k,e.target.value)} placeholder={f.ph} className={cn("w-full px-4 py-3 border-2 rounded-2xl text-sm outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",errors[f.k]?"border-red-400":"border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30")} />
                  {errors[f.k] && <p className="text-xs text-red-500 mt-1">{errors[f.k]}</p>}
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address *</label>
              <input type="email" value={form.email} onChange={e => set("email",e.target.value)} placeholder="you@example.com" className={cn("w-full px-4 py-3 border-2 rounded-2xl text-sm outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",errors.email?"border-red-400":"border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30")} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPass?"text":"password"} value={form.password} onChange={e => set("password",e.target.value)} placeholder="Create a strong password" className={cn("w-full pl-4 pr-12 py-3 border-2 rounded-2xl text-sm outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",errors.password?"border-red-400":"border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30")} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">{showPass?"🙈":"👁"}</button>
              </div>
              {pw && <div className="mt-2 space-y-1.5"><div className="flex gap-1 items-center">{[1,2,3,4].map(i => <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors",i<=pwScore?pwColors[pwScore]:"bg-gray-200 dark:bg-gray-700")} />)}{pwScore>0 && <span className={cn("text-xs font-semibold ml-2",pwScore<=1?"text-red-500":pwScore<=2?"text-orange-500":pwScore<=3?"text-yellow-600":"text-green-600")}>{["","Weak","Fair","Good","Strong"][pwScore]}</span>}</div></div>}
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword",e.target.value)} placeholder="Repeat your password" className={cn("w-full px-4 py-3 border-2 rounded-2xl text-sm outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",errors.confirmPassword?"border-red-400":"border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30")} />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.accept} onChange={e => set("accept",e.target.checked)} className="w-4 h-4 mt-0.5 accent-violet-600 shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">I agree to NexMart's <span className="text-violet-600 font-bold">Terms of Service</span> and <span className="text-violet-600 font-bold">Privacy Policy</span></span>
            </label>
            {errors.accept && <p className="text-xs text-red-500">{errors.accept}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 transition-all active:scale-[0.98] disabled:opacity-60">
              {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Create Account</span><span>→</span></>}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">Already have an account? <button onClick={() => nav("login")} className="text-violet-600 font-black hover:underline">Sign in</button></p>
        </div>
      </div>
    </div>
  );
}

// FORGOT PASSWORD  — POST /api/auth/forgot-password  (nexmart-cart-customer/07)
function ForgotPage() {
  const { nav } = useUIStore();
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await apiPost("/api/auth/forgot-password", { email });
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">
          {!sent ? <>
            <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-5 text-3xl mx-auto">✉️</div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1 text-center">Forgot password?</h1>
            <p className="text-gray-400 text-sm mb-7 text-center">Enter your email and we'll send a reset link.</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" />
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 transition-all disabled:opacity-60">
                {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Send Reset Link"}
              </button>
            </form>
          </> : <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">✅</div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 text-center">Check your inbox!</h2>
            <p className="text-gray-500 text-sm mb-7 text-center">If <strong>{email}</strong> is registered, we've sent a reset link. Check spam too.</p>
            <button onClick={() => setSent(false)} className="w-full text-sm text-violet-600 font-semibold hover:underline">Try a different email</button>
          </>}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex justify-center">
            <button onClick={() => nav("login")} className="text-sm text-gray-500 hover:text-violet-600 transition-colors font-medium">← Back to Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// PROFILE PAGE  — GET /api/user/profile  (nexmart-cart-customer/07)
function ProfilePage() {
  const { nav, showToast } = useUIStore();
  const { user, setUser }  = useAuthStore();
  const { ids: wishIds }   = useWishlistStore();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) { nav("login"); return; }
    apiGet("/api/user/profile", null)
      .then(d => setProfile(d?.user ?? { ...user, loyaltyPoints:100, loyaltyTier:"BRONZE", _count:{orders:0,reviews:0,wishlistItems:wishIds.length} }))
      .catch(() => setProfile({ ...user, loyaltyPoints:100, loyaltyTier:"BRONZE", _count:{orders:0,reviews:0,wishlistItems:wishIds.length} }));
  }, [user]);

  if (!user || !profile) return <div className="text-center py-20"><div className="text-5xl mb-3">⏳</div></div>;

  const TIER_COLORS: Record<string, string> = { BRONZE:"from-amber-700 to-amber-500", SILVER:"from-slate-500 to-slate-400", GOLD:"from-amber-500 to-yellow-400", PLATINUM:"from-violet-600 to-violet-400" };
  const TIER_EMOJIS: Record<string, string> = { BRONZE:"🥉", SILVER:"🥈", GOLD:"🥇", PLATINUM:"💎" };
  const tier = profile.loyaltyTier ?? "BRONZE";

  const TABS = [
    {id:"profile",l:"Profile",i:"👤"},{id:"orders",l:"Orders",i:"📦"},
    {id:"wishlist",l:`Wishlist (${wishIds.length})`,i:"❤️"},{id:"rewards",l:"Rewards",i:"🏅"},{id:"security",l:"Security",i:"🔒"},
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className={`h-16 bg-linear-to-r ${TIER_COLORS[tier]}`} />
            <div className="px-5 pb-5 -mt-8">
              <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${TIER_COLORS[tier]} flex items-center justify-center text-white text-2xl font-black border-4 border-white dark:border-gray-900 mb-3 shadow-lg`}>{user.name?.[0]?.toUpperCase()}</div>
              <h2 className="font-black text-gray-900 dark:text-white">{user.name}</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
              <span className="inline-block mt-2 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">{TIER_EMOJIS[tier]} {tier} Member</span>
            </div>
            <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-800 divide-x divide-gray-100 dark:divide-gray-800">
              {[{l:"Orders",v:profile._count?.orders??0},{l:"Points",v:profile.loyaltyPoints??100},{l:"Saved",v:wishIds.length}].map(s => (
                <div key={s.l} className="py-3 text-center"><p className="font-black text-gray-900 dark:text-white">{s.v}</p><p className="text-[10px] text-gray-400 uppercase">{s.l}</p></div>
              ))}
            </div>
          </div>
          <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-3 w-full px-4 py-3 text-sm font-medium border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors", tab===t.id?"bg-violet-50 dark:bg-violet-900/20 text-violet-600":"text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>
                <span>{t.i}</span><span className="flex-1 text-left">{t.l}</span><span className="text-gray-300 text-xs">›</span>
              </button>
            ))}
            <button onClick={() => { setUser(null); nav("home"); showToast("Signed out"); }} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <span>🚪</span><span>Sign Out</span>
            </button>
          </nav>
        </aside>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          {tab === "profile" && (
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-lg mb-5">Personal Information</h2>
              <div className="space-y-1 max-w-md">
                {[{l:"Full Name",v:user.name},{l:"Email",v:user.email},{l:"Phone",v:"Not added"},{l:"Member Since",v:"May 2026"},{l:"Account Status",v:"✅ Active & Verified"}].map(f => (
                  <div key={f.l} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800">
                    <div><p className="text-xs text-gray-400">{f.l}</p><p className="font-semibold text-gray-900 dark:text-white mt-0.5">{f.v}</p></div>
                    <button onClick={() => showToast("Edit form available in full app")} className="text-xs text-violet-600 font-semibold hover:underline">Edit</button>
                  </div>
                ))}
              </div>
              <button onClick={() => showToast("Profile saved!")} className="mt-6 px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Save Changes</button>
            </div>
          )}
          {tab === "orders" && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="font-black text-gray-900 dark:text-white text-xl mb-2">View All Orders</h3>
              <p className="text-gray-400 mb-6">Track your orders, request returns, and download invoices.</p>
              <button onClick={() => nav("orders")} className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Go to Orders →</button>
            </div>
          )}
          {tab === "wishlist" && (
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-lg mb-5">Wishlist ({wishIds.length})</h2>
              {wishIds.length === 0 ? (
                <div className="text-center py-12"><div className="text-5xl mb-3">❤️</div><p className="text-gray-400">Your wishlist is empty</p><button onClick={() => nav("home")} className="mt-4 text-violet-600 font-semibold hover:underline">Browse Products</button></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{MOCK_PRODUCTS.filter(p => wishIds.includes(p.id)).map(p => <ProductCard key={p.id} product={p} />)}</div>
              )}
            </div>
          )}
          {tab === "rewards" && (
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-lg mb-5">Loyalty Rewards</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[{l:"Available Points",v:(profile.loyaltyPoints??100).toLocaleString(),c:"text-violet-600"},{l:"Points Worth",v:formatPrice((profile.loyaltyPoints??100)/10),c:"text-green-600"},{l:"Tier",v:`${TIER_EMOJIS[tier]} ${tier}`,c:"text-amber-700"}].map(s => (
                  <div key={s.l} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center"><p className={cn("text-xl font-black",s.c)}>{s.v}</p><p className="text-xs text-gray-400 mt-1">{s.l}</p></div>
                ))}
              </div>
              <div className="bg-linear-to-r from-violet-600 to-orange-500 rounded-2xl p-5 text-white">
                <h3 className="font-black text-lg mb-2">🎡 Daily Spin Wheel</h3>
                <p className="text-white/80 text-sm mb-4">Spin once per day to win up to 100 bonus points!</p>
                <button onClick={() => showToast("🎉 You won 25 bonus points! Come back tomorrow.")} className="bg-white text-violet-700 font-black px-6 py-2.5 rounded-xl hover:scale-105 transition-transform">Spin Now →</button>
              </div>
            </div>
          )}
          {tab === "security" && (
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-lg mb-5">Security Settings</h2>
              <div className="space-y-4 max-w-md">
                {[{l:"Change Password",s:"Last changed: Never",i:"🔑"},{l:"Two-Factor Auth",s:"Not enabled",i:"📱"},{l:"Active Sessions",s:"1 session active",i:"💻"}].map(s => (
                  <div key={s.l} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <div className="flex items-center gap-3"><span className="text-2xl">{s.i}</span><div><p className="font-semibold text-gray-900 dark:text-white text-sm">{s.l}</p><p className="text-xs text-gray-400">{s.s}</p></div></div>
                    <button onClick={() => showToast("Security settings available in full app")} className="text-xs text-violet-600 font-semibold hover:underline">Manage</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// WISHLIST PAGE
function WishlistPage() {
  const { nav } = useUIStore();
  const { ids: wishIds } = useWishlistStore();
  const items = MOCK_PRODUCTS.filter(p => wishIds.includes(p.id));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">❤️ My Wishlist ({items.length})</h1>
      {items.length === 0 ? (
        <div className="text-center py-24"><div className="text-7xl mb-4">💝</div><h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Wishlist is empty</h3><p className="text-gray-400 mb-6">Save products you love for later!</p><button onClick={() => nav("home")} className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Explore Products</button></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{items.map(p => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
}

// SELLER DASHBOARD  — mirrors page-seller-dashboard.tsx
function SellerDashPage() {
  const { nav, showToast } = useUIStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState("overview");
  if (!user) { nav("login"); return null; }
  const TABS = [{id:"overview",l:"Overview",i:"📊"},{id:"products",l:"Products",i:"🛍️"},{id:"orders",l:"Orders",i:"📦"},{id:"analytics",l:"Analytics",i:"📈"},{id:"payouts",l:"Payouts",i:"💰"}];
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">Seller Dashboard</h1><p className="text-sm text-gray-400">Manage your NexMart store</p></div>
        <button onClick={() => nav("home")} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">🌐 View Store</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2 h-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors mb-0.5", tab===t.id?"bg-violet-50 dark:bg-violet-900/20 text-violet-600":"text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>{t.i} {t.l}</button>
          ))}
        </nav>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[{l:"Revenue (30d)",v:"रू 2,40,000",c:"text-violet-600",i:"💰"},{l:"Orders",v:"1,847",c:"text-green-600",i:"📦"},{l:"Products",v:"142",c:"text-blue-600",i:"🛍️"},{l:"Rating",v:"4.9 ★",c:"text-amber-600",i:"⭐"}].map(s => (
                  <div key={s.l} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center"><div className="text-2xl mb-2">{s.i}</div><p className={cn("text-xl font-black",s.c)}>{s.v}</p><p className="text-xs text-gray-400 mt-0.5">{s.l}</p></div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[{l:"Add Product",i:"➕",c:"bg-violet-600 hover:bg-violet-700 text-white"},{l:"View Orders",i:"📦",c:"bg-orange-500 hover:bg-orange-600 text-white"},{l:"Withdraw",i:"💸",c:"bg-green-600 hover:bg-green-700 text-white"},{l:"Analytics",i:"📊",c:"bg-blue-600 hover:bg-blue-700 text-white"}].map(a => (
                  <button key={a.l} onClick={() => showToast(`${a.l} — available in full app`)} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl font-semibold text-sm transition-all hover:scale-105 active:scale-100",a.c)}><span className="text-2xl">{a.i}</span>{a.l}</button>
                ))}
              </div>
            </div>
          )}
          {tab !== "overview" && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="font-black text-gray-900 dark:text-white text-xl mb-2">{TABS.find(t => t.id === tab)?.l}</h3>
              <p className="text-gray-400 mb-6">This section uses the full seller dashboard from <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">nexmart-seller/page-seller-dashboard.tsx</code></p>
              <p className="text-xs text-gray-400">All API calls are wired to <code>/api/seller/*</code> routes from <code>nexmart-seller/api-seller-routes.ts</code></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// SELLER ONBOARDING
function SellerOnboardPage() {
  const { nav, showToast } = useUIStore();
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-5">🏪</div>
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Start Selling on NexMart</h1>
      <p className="text-gray-400 mb-8">Join 85,000+ sellers reaching millions of customers. The full 4-step onboarding flow is in <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">nexmart-seller/page-seller-onboarding.tsx</code></p>
      <button onClick={() => showToast("Onboarding started! 🎉")} className="px-8 py-3.5 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 transition-colors">Begin Application →</button>
    </div>
  );
}

// ADMIN PAGE  — mirrors nexmart-admin/02
function AdminPage() {
  const { nav, showToast } = useUIStore();
  const { user } = useAuthStore();
  if (!user || !["ADMIN","SUPER_ADMIN"].includes(user.role)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Admin Access Required</h2>
        <p className="text-gray-400 mb-6">You need admin privileges to access this panel.</p>
        <button onClick={() => nav("home")} className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">Go Home</button>
      </div>
    );
  }
  const QUICK = [{l:"Users",i:"👥",p:"/admin/users"},{l:"Sellers",i:"🏪",p:"/admin/sellers"},{l:"Products",i:"🛍️",p:"/admin/products"},{l:"Orders",i:"📦",p:"/admin/orders"},{l:"Support",i:"💬",p:"/admin/support"},{l:"Reports",i:"📊",p:"/admin/reports"}];
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin Dashboard</h1><p className="text-sm text-gray-400">NexMart Admin Panel</p></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {[{l:"Total Revenue",v:"रू 8.4Cr",c:"text-violet-600"},{l:"Active Users",v:"32.4L",c:"text-blue-600"},{l:"Total Orders",v:"1.48L",c:"text-green-600"},{l:"Active Sellers",v:"85,492",c:"text-amber-600"}].map(s => (
          <div key={s.l} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 text-center"><p className={cn("text-2xl font-black",s.c)}>{s.v}</p><p className="text-sm text-gray-400 mt-1">{s.l}</p></div>
        ))}
      </div>
      <h2 className="font-black text-gray-900 dark:text-white mb-4">Quick Navigation</h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {QUICK.map(q => (
          <button key={q.l} onClick={() => showToast(`${q.l} page — from nexmart-admin/03-05`)} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all group">
            <span className="text-3xl group-hover:scale-110 transition-transform">{q.i}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{q.l}</span>
          </button>
        ))}
      </div>
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5">
        <h3 className="font-black text-violet-900 dark:text-violet-200 mb-2">📁 Full Admin Panel Files</h3>
        <p className="text-sm text-violet-700 dark:text-violet-400 mb-3">All admin pages are generated and ready. Copy each to its path:</p>
        {["01 — Layout Shell, Sidebar, Topbar, Command Palette","02 — Dashboard with Charts (SVG LineChart, BarChart, DonutChart)","03 — Users, Orders, Sellers management","04 — Support, Coupons, Settings","05 — Products moderation, Inventory, Returns","06 — Reports, Banners, Payments","07 — Complete Admin API routes"].map(f => (
          <div key={f} className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 py-1"><span>✅</span>{f}</div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER  — mirrors components/layout/Footer.tsx (nexmart-full/01)
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  const { nav } = useUIStore();
  return (
    <footer className="bg-gray-950 text-gray-400 mt-16">
      <div className="bg-violet-900 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div><h3 className="text-white font-bold text-lg mb-1">Get exclusive deals in your inbox</h3><p className="text-violet-300 text-sm">Join 500K+ shoppers. Unsubscribe anytime.</p></div>
          <div className="flex gap-2 w-full md:w-auto max-w-sm"><input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/50" /><button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-colors whitespace-nowrap">Subscribe</button></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <button onClick={() => nav("home")} className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-linear-to-br from-violet-600 to-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm">N</div>
              <span className="text-xl font-black text-white">Nex<span className="text-violet-400">Mart</span></span>
            </button>
            <p className="text-sm leading-relaxed mb-4">Nepal's AI-powered marketplace. Shop smarter, live better.</p>
          </div>
          {[{t:"Shop",ls:["Flash Deals","New Arrivals","Best Sellers","Gift Cards"]},{t:"Sell",ls:["Start Selling","Seller Hub","Seller Analytics","Partner Program"]},{t:"Support",ls:["Help Center","Contact Us","Returns","Buyer Protection"]},{t:"Company",ls:["About Us","Blog","Careers","Privacy Policy"]}].map(({t,ls}) => (
            <div key={t}><h4 className="text-white font-bold text-sm mb-4">{t}</h4><ul className="space-y-2">{ls.map(l => <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>)}</ul></div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 NexMart Pvt. Ltd. · Registered in Nepal · All rights reserved.</p>
          <div className="flex gap-3 flex-wrap justify-center">
            {["eSewa","Khalti","Visa","Mastercard","COD"].map(m => <span key={m} className="bg-gray-800 text-gray-300 font-bold px-3 py-1.5 rounded-lg">{m}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}