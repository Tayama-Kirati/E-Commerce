"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CartCtx, UICtx, AuthCtx, WishCtx,
  User, CartItem, Toast,
  cn, apiGet, apiPost,
} from "@/app/lib/store";

// Layout
import { Navbar }       from "@/app/components/pages/Navbar";
import { CartSidebar }  from "@/app/components/pages/CartSidebar";
import { NotifPanel }   from "@/app/components/pages/NotifPanel";
import { Footer }       from "@/app/components/pages/Footer";
import { ToastMessage } from "@/app/components/pages/ToastMessage";

// Pages
import { HomePage }          from "@/app/components/pages/HomePage";
import { ProductsPage }      from "@/app/components/pages/ProductsPage";
import { ProductDetailPage } from "@/app/components/pages/ProductDetailPage";
import { CartPage }          from "@/app/components/pages/CartPage";
import { CheckoutPage }      from "@/app/components/pages/CheckoutPage";
import { OrdersPage }        from "@/app/components/pages/OrdersPage";
import { OrderDetailPage }   from "@/app/components/pages/OrderDetailPage";
import { TrackPage }         from "@/app/components/pages/TrackPage";
import { LoginPage }         from "@/app/components/pages/LoginPage";
import { RegisterPage }      from "@/app/components/pages/RegisterPage";
import { ForgotPage }        from "@/app/components/pages/ForgotPage";
import { ProfilePage }       from "@/app/components/pages/ProfilePage";
import { WishlistPage }      from "@/app/components/pages/WishlistPage";
import { SellerDashPage }    from "@/app/components/pages/SellerDashPage";
import { SellerOnboardPage } from "@/app/components/pages/SellerOnboardPage";
import { AdminPage }         from "@/app/components/pages/AdminPage";
import { RoleSelectPage }    from "@/app/components/pages/RoleSelectPage";


export default function App() {
  const [user,          setUser]       = useState<User | null>(null);
  const [cartItems,     setCartItems]  = useState<CartItem[]>([]);
  const [cartOpen,      setCartOpen]   = useState(false);
  const [cartSyncing,   setCartSyncing]= useState(false);
  const [wishIds,       setWishIds]    = useState<string[]>(["2","6"]);
  const [page,          setPage]       = useState("home");
  const [pageData,      setPageData]   = useState<any>(null);
  const [darkMode,      setDarkMode]   = useState(false);
  const [mobileMenuOpen,setMobileMenu] = useState(false);
  const [notifOpen,     setNotifOpen]  = useState(false);
  const [toast,         setToast]      = useState<Toast | null>(null);
  const [searchQuery,   setSearchQuery]= useState("");

  const showToast = useCallback((msg: string, type: Toast["type"] = "success") => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const nav = useCallback((p: any, data = null) => {
    setPage(p); setPageData(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenu(false);
  }, []);

  const cartCount    = useMemo(() => cartItems.reduce((s,i) => s + i.qty, 0), [cartItems]);
  const cartTotal    = useMemo(() => cartItems.reduce((s,i) => s + Number(i.basePrice) * i.qty, 0), [cartItems]);
  const cartShipping = cartTotal >= 1000 || cartItems.every(i => i.freeShipping) ? 0 : 150;
  const cartGrand    = cartTotal + cartShipping;

  const addItem = useCallback(async (product: any, qty = 1) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, product.stock) } : i);
      return [...prev, { ...product, qty }];
    });
    showToast(`${product.name.slice(0, 30)}… added to cart 🛒`);
    if (user) {
      const res = await apiPost("/api/cart", { productId: product.id, quantity: qty });
      if (res?.error) showToast("Sync failed — item added locally", "error");
    }
  }, [user, showToast]);

  const removeItem = useCallback(async (id: any) => {
    const item = cartItems.find(i => i.id === id);
    setCartItems(prev => prev.filter(i => i.id !== id));
    if (user && item?.cartItemId) await fetch(`/api/cart/${item.cartItemId}`, { method: "DELETE" });
  }, [cartItems, user]);

  const updateQty = useCallback(async (id: any, qty: any) => {
    if (qty <= 0) { removeItem(id); return; }
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.min(qty, i.stock) } : i));
    const item = cartItems.find(i => i.id === id);
    if (user && item?.cartItemId) await apiPost(`/api/cart/${item.cartItemId}`, { quantity: qty });
  }, [cartItems, user, removeItem]);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    if (user) await fetch("/api/cart", { method: "DELETE" });
  }, [user]);

  const syncFromServer = useCallback(async () => {
    if (!user) return;
    setCartSyncing(true);
    const data = await apiGet("/api/cart", null);
    if (data?.items) {
      setCartItems(data.items.map((item: any) => ({
        ...item, id: item.productId, cartItemId: item.id,
        basePrice: item.price, name: item.product?.name,
        stock: item.stock, freeShipping: item.product?.freeShipping, emoji: "🛍️",
      })));
    }
    setCartSyncing(false);
  }, [user]);

  const mergeGuestCart = useCallback(async () => {
    if (!cartItems.length) return;
    await apiPost("/api/cart/merge", { items: cartItems.map((i: any) => ({ productId: i.id, quantity: i.qty })) });
    await syncFromServer();
  }, [cartItems, syncFromServer]);

  useEffect(() => { if (user) mergeGuestCart(); }, [user?.email]);

  const toggleWishlist = useCallback(async (productId: any) => {
    const already = wishIds.includes(productId);
    setWishIds(prev => already ? prev.filter(x => x !== productId) : [...prev, productId]);
    showToast(already ? "Removed from wishlist" : "Saved to wishlist");
    if (user) await apiPost("/api/user/wishlist", { productId });
  }, [wishIds, user, showToast]);

  const isInWishlist = useCallback((id: any) => wishIds.includes(id), [wishIds]);

  const cartCtx = useMemo(() => ({
    cartItems, cartOpen, setCartOpen,
    addItem, removeItem, updateQty, clearCart,
    syncFromServer, mergeGuestCart, cartSyncing,
    cartCount, cartTotal, cartShipping, cartGrand,
    isOpen: cartOpen, toggleCart: () => setCartOpen(v => !v),
    itemCount: () => cartCount, total: () => cartTotal,
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
    user, session: user ? { user } : null, setUser,
    isAuthenticated: !!user,
    isAdmin:  ["ADMIN","SUPER_ADMIN"].includes(user?.role ?? ""),
    isSeller: user?.role === "SELLER",
  }), [user]);

  const wishCtx = useMemo(() => ({
    ids: wishIds, toggle: toggleWishlist, isIn: isInWishlist,
  }), [wishIds, toggleWishlist, isInWishlist]);

  useEffect(() => { document.documentElement.classList.toggle("dark", darkMode); }, [darkMode]);

  return (
    <AuthCtx.Provider value={authCtx}>
      <UICtx.Provider value={uiCtx}>
        <CartCtx.Provider value={cartCtx}>
          <WishCtx.Provider value={wishCtx}>
            <div className={cn("min-h-screen transition-colors", darkMode && "dark")}>
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
                {page === "role-select" && <RoleSelectPage />}
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

 
 