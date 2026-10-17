"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  CartCtx, UICtx, AuthCtx, WishCtx,
  User, CartItem, Toast,
  cn, apiGet, apiPost,
} from "@/app/lib/store";

// Layout
import { Navbar }          from "@/app/components/pages/Navbar";
import { CategorySidebar } from "@/app/components/pages/CategorySidebar";
import { CartSidebar }     from "@/app/components/pages/CartSidebar";
import { NotifPanel }      from "@/app/components/pages/NotifPanel";
import { Footer }          from "@/app/components/pages/Footer";
import { ToastMessage }    from "@/app/components/pages/ToastMessage";
import { ChatWidget }      from "@/app/components/pages/ChatWidget";

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
import { CustomerCarePage }  from "@/app/components/pages/CustomerCarePage";
import { AboutUsPage }       from "@/app/components/pages/AboutUsPage";
import { MyReviewsPage }     from "@/app/components/pages/MyReviewsPage";
import { MyReturnsPage }     from "@/app/components/pages/MyReturnsPage";
import { SellerStorePage }   from "@/app/components/pages/SellerStorePage";


const SELLER_BLOCKED = new Set([
  "home","products","product","cart","checkout",
  "orders","order","track","wishlist","reviews","returns",
]);

export default function App() {
  // The signed-in user always comes from the NextAuth session (an httpOnly cookie),
  // so it can't drift from what the server sees.
  const { data: session, status: sessionStatus } = useSession();
  const [user,          setUserState]  = useState<User | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    const su = session?.user as any;
    setUserState(su ? { name: su.name ?? su.email, email: su.email, role: su.role ?? "CUSTOMER" } : null);
    try { localStorage.removeItem("peanut_user"); } catch {}
  }, [session, sessionStatus]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    // Signing out from any page must also end the server session
    if (!u) {
      fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      signOut({ redirect: false });
    }
  }, []);
  const [cartItems,     setCartItems]  = useState<CartItem[]>([]);
  const [cartOpen,      setCartOpen]   = useState(false);
  const [cartSyncing,   setCartSyncing]= useState(false);
  const [wishIds,       setWishIds]    = useState<string[]>([]);
  const [page,          setPage]       = useState("home");
  const [pageData,      setPageData]   = useState<any>(null);
  const [darkMode,      setDarkMode]   = useState(false);
  const [mobileMenuOpen,setMobileMenu] = useState(false);
  const [notifOpen,     setNotifOpen]  = useState(false);
  const [toast,         setToast]      = useState<Toast | null>(null);
  const [searchQuery,   setSearchQuery]= useState("");
  const [maintenance,   setMaintenance]= useState(false);

  useEffect(() => {
    apiGet("/api/settings/public", null).then((s: any) => setMaintenance(!!s?.maintenanceMode));
  }, []);

  const showToast = useCallback((msg: string, type: Toast["type"] = "success") => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const nav = useCallback((p: any, data = null) => {
    const role = user?.role;
    // Redirect sellers away from customer-only pages
    const target = (role === "SELLER" && SELLER_BLOCKED.has(p)) ? "seller" : p;
    setPage(target); setPageData(data);
    // Simple ids (product slug, order id, store slug) go in the URL so the page can be shared and refreshed
    const id = typeof data === "string" || typeof data === "number" ? `&id=${encodeURIComponent(String(data))}` : "";
    const url = target === "home" ? "/" : `/?page=${target}${id}`;
    window.history.pushState({ page: target, pageData: data }, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenu(false);
  }, [user?.role]);

  const cartCount    = useMemo(() => cartItems.reduce((s,i) => s + i.qty, 0), [cartItems]);
  const cartTotal    = useMemo(() => cartItems.reduce((s,i) => s + Number(i.basePrice) * i.qty, 0), [cartItems]);
  const cartShipping = cartTotal >= 1000 || cartItems.every(i => i.freeShipping) ? 0 : 150;
  const cartGrand    = cartTotal + cartShipping;

  const addItem = useCallback(async (product: any, qty = 1) => {
    if (!user) {
      showToast("Please login first to add items to cart", "error");
      setPage("login");
      setPageData(null);
      window.history.pushState({ page: "login", pageData: null }, "", "/?page=login");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCartItems(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, product.stock) } : i);
      return [...prev, { ...product, qty }];
    });
    showToast(`${product.name.slice(0, 30)}… added to cart 🛒`);
    const res = await apiPost("/api/cart", { productId: product.id, variantId: product.variantId ?? null, quantity: qty });
    if (res?.error) showToast("Sync failed — item added locally", "error");
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

  // Open the page named in the URL (deep links, shared links, email redirects)
  // and seed the history state so the first entry is navigable
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page") || "home";
    const id = params.get("id");
    setPage(p);
    setPageData(id as any);
    window.history.replaceState({ page: p, pageData: id }, "", window.location.href);
  }, []);

  // Browser back / forward
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const p = e.state?.page || "home";
      setPage(p);
      setPageData(e.state?.pageData ?? null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Load the saved wishlist whenever someone signs in; clear it on sign-out
  useEffect(() => {
    if (!user) { setWishIds([]); return; }
    apiGet("/api/user/wishlist", null).then((d: any) => setWishIds(d?.ids ?? []));
  }, [user?.email]);

  const toggleWishlist = useCallback(async (productId: any) => {
    if (!user) {
      showToast("Please login to save items to your wishlist", "error");
      return;
    }
    const already = wishIds.includes(productId);
    setWishIds(prev => already ? prev.filter(x => x !== productId) : [...prev, productId]);
    showToast(already ? "Removed from wishlist" : "Saved to wishlist");
    const res = await apiPost("/api/user/wishlist", { productId, wishlisted: !already });
    if (!res || res.error) {
      setWishIds(prev => already ? [...prev, productId] : prev.filter(x => x !== productId));
      showToast("Could not update wishlist", "error");
    }
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


  // When a seller logs in (or page loads with seller session), redirect to seller hub
  useEffect(() => {
    if (user?.role === "SELLER" && SELLER_BLOCKED.has(page)) {
      setPage("seller");
      setPageData(null);
      window.history.replaceState({ page: "seller", pageData: null }, "", "/?page=seller");
    }
  }, [user?.role]);

  useEffect(() => { document.documentElement.classList.toggle("dark", darkMode); }, [darkMode]);

  // Maintenance mode: everyone but admins sees a holding page (admins can still sign in)
  if (maintenance && !authCtx.isAdmin && page !== "login") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="max-w-md">
          <p className="text-3xl font-black mb-3" style={{ color: "var(--color-heading)" }}>We&apos;ll be right back</p>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            PeaNut is down for scheduled maintenance. Your cart and orders are safe — please check back shortly.
          </p>
        </div>
      </div>
    );
  }

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
              <div className="flex">
                {user?.role !== "SELLER" && <CategorySidebar />}
                <main className="flex-1 min-w-0">
                  {/* Seller: only show seller hub and shared pages */}
                  {user?.role === "SELLER" ? (
                    <>
                      {(page === "seller" || SELLER_BLOCKED.has(page) || page === "profile") && <SellerDashPage />}
                      {page === "customer-care" && <CustomerCarePage />}
                      {page === "about"         && <AboutUsPage />}
                      {page === "store"         && <SellerStorePage />}
                    </>
                  ) : (
                    <>
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
                      {page === "admin"         && <AdminPage />}
                      {page === "customer-care" && <CustomerCarePage />}
                      {page === "about"         && <AboutUsPage />}
                      {page === "reviews"       && <MyReviewsPage />}
                      {page === "returns"       && <MyReturnsPage />}
                      {page === "store"         && <SellerStorePage />}
                    </>
                  )}
                </main>
              </div>
              <Footer />
              {user?.role !== "SELLER" && <ChatWidget />}
            </div>
          </WishCtx.Provider>
        </CartCtx.Provider>
      </UICtx.Provider>
    </AuthCtx.Provider>
  );
}

 
 