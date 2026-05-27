"use client";
import { useState, useEffect, useRef } from "react";
import { formatPrice, MOCK_CATEGORIES, MOCK_PRODUCTS, useCartStore, useUIStore, useAuthStore, useWishlistStore, useDebounce, apiGet } from "@/app/lib/store";
import { useTheme } from "@/app/apps/providers/ThemeProvider";

const GOLD      = "#C68313";
const GOLD_DARK = "#9B6210";
const CHARCOAL  = "var(--color-heading)";
const IVORY     = "var(--color-surface-warm)";
const BORDER    = "#E8D5A8";
const MUTED     = "var(--color-muted)";

const POPULAR_SEARCHES = ["iPhone 16", "Sony headphones", "MacBook Pro", "Nike Air Max", "Apple Watch"];

const CAT_COUNTS: Record<string, number> = {
  electronics: 8, fashion: 6, home: 4, beauty: 5, sports: 3, books: 4,
};

export function Navbar() {
  const { nav, searchQuery, setSearchQuery, toggleMobileMenu } = useUIStore();
  const { cartCount, setCartOpen } = useCartStore();
  const { user, setUser } = useAuthStore();
  const { ids: wishIds } = useWishlistStore();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled]       = useState(false);
  const [profileOpen, setProfileOpen]         = useState(false);
  const [searchOpen, setSearchOpen]           = useState(false);
  const [signOutConfirm, setSignOutConfirm]   = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const modalInputRef = useRef<HTMLInputElement>(null);
  const dSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (dSearch.length < 2) { setSuggestions([]); return; }
    apiGet(`/api/products/search?q=${encodeURIComponent(dSearch)}&limit=6`, null)
      .then(d => setSuggestions(d?.products ?? []))
      .catch(() => setSuggestions(
        MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(dSearch.toLowerCase())).slice(0, 6)
      ));
  }, [dSearch]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => modalInputRef.current?.focus(), 60);
    else setSearchQuery("");
  }, [searchOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") setSearchOpen(false);
    };
    const pm = (e: MouseEvent) => { if (!(e.target as Element).closest("#profile-menu")) setProfileOpen(false); };
    document.addEventListener("keydown", h);
    document.addEventListener("mousedown", pm);
    return () => { document.removeEventListener("keydown", h); document.removeEventListener("mousedown", pm); };
  }, []);

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { nav("products"); setSearchOpen(false); }
  };


  return (
    <header
      className="sticky top-0 z-40 bg-white dark:bg-[#1A1814] transition-all duration-300"
      style={{
        borderBottom: `1px solid ${BORDER}`,
        boxShadow: scrolled ? "0 4px 24px rgba(198,131,19,0.1)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

        {/* Mobile menu */}
        <button onClick={toggleMobileMenu} className="lg:hidden p-2 rounded-xl transition-colors"
          style={{ color: "var(--color-muted)" }} aria-label="Menu">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        {/* Logo */}
        <button onClick={() => nav(user?.role === "SELLER" ? "seller" : "home")} className="flex items-center shrink-0">
          <span className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)", color: CHARCOAL }}>
            Pea<span style={{ color: GOLD }}>Nut</span>
          </span>
        </button>

        {/* Search trigger — hidden for sellers */}
        {user?.role !== "SELLER" && (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 max-w-xl mx-2 flex items-center gap-2 rounded-full px-4 py-2 bg-white dark:bg-[#242018] text-left transition-all duration-200 hover:border-[#C68313]"
            style={{ border: `1.5px solid ${BORDER}` }}
            aria-label="Open search"
          >
            <svg className="w-4 h-4 shrink-0" style={{ color: MUTED }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span className="flex-1 text-sm min-w-0 truncate" style={{ color: MUTED }}>
              Search products, brands, categories
            </span>
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0"
              style={{ backgroundColor: "#F3EDE0", color: MUTED, border: `1px solid ${BORDER}` }}>
              <span>⌘</span><span>K</span>
            </kbd>
          </button>
        )}

        {/* Seller hub label */}
        {user?.role === "SELLER" && (
          <span className="flex-1 text-sm font-semibold px-2" style={{ color: MUTED }}>Seller Hub</span>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Cart — hidden for sellers */}
          {user?.role !== "SELLER" && (
            <button onClick={() => setCartOpen(true)}
              className="relative w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:bg-surface-warm"
              style={{ borderColor: GOLD, color: GOLD }} aria-label={`Cart (${cartCount} items)`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-black rounded-full flex items-center justify-center bg-red-500">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          )}

          {/* Wishlist — hidden for sellers */}
          {user?.role !== "SELLER" && (
            <button onClick={() => nav("wishlist")}
              className="relative w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:bg-surface-warm"
              style={{ borderColor: GOLD, color: GOLD }} aria-label={`Wishlist (${wishIds.length})`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              {wishIds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-black rounded-full flex items-center justify-center bg-red-500">
                  {wishIds.length}
                </span>
              )}
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:bg-surface-warm"
            style={{ borderColor: GOLD, color: GOLD }}
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            )}
          </button>

          {/* About Us */}
          <button
            onClick={() => nav("about")}
            className="hidden lg:block text-sm font-medium whitespace-nowrap px-1 hover:underline transition-colors"
            style={{ color: GOLD }}
          >
            About Us
          </button>

          {/* Help & Support */}
          <button
            onClick={() => nav("customer-care")}
            className="hidden lg:block text-sm font-medium whitespace-nowrap px-1 hover:underline transition-colors"
            style={{ color: GOLD }}
          >
            Help &amp; Support
          </button>

          {/* Auth */}
          {user ? (
            <div id="profile-menu" className="relative">
              <button onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-colors hover:bg-surface-warm">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: `linear-gradient(135deg,${GOLD},#D4A63A)` }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-semibold hidden md:block" style={{ color: "var(--color-text)" }}>
                  {user.name?.split(" ")[0]}
                </span>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1A1814] rounded-2xl z-50 overflow-hidden"
                  style={{ border: `1px solid ${BORDER}`, boxShadow: "0 16px 48px rgba(28,26,22,0.16)" }}
                >
                  {/* Header */}
                  <div className="relative px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, #2D2418 0%, #1C1A16 100%)` }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shrink-0 ring-2 ring-[rgba(198,131,19,0.4)]"
                        style={{ background: `linear-gradient(135deg,${GOLD},#E8A020)`, color: "#fff" }}
                      >
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{user.name}</p>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: "#B8A882" }}>{user.email}</p>
                        <span
                          className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-1"
                          style={{ backgroundColor: "rgba(198,131,19,0.2)", color: GOLD, border: "1px solid rgba(198,131,19,0.3)" }}
                        >
                          {user.role === "SUPER_ADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Admin" : user.role === "SELLER" ? "Seller" : "Customer"}
                        </span>
                      </div>
                    </div>

                    {/* Quick stats — only for customers */}
                    {user.role !== "SELLER" && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {[
                          { label: "Wishlist", value: wishIds.length, icon: (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                          )},
                          { label: "Cart items", value: cartCount, icon: (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                            </svg>
                          )},
                        ].map(s => (
                          <div key={s.label} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                            <span style={{ color: GOLD }}>{s.icon}</span>
                            <div>
                              <p className="text-xs font-black text-white">{s.value}</p>
                              <p className="text-[10px]" style={{ color: "#B8A882" }}>{s.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nav items */}
                  <div className="py-2">
                    {(user.role === "SELLER" ? [
                      { label: "Seller Hub", sub: "Manage your store & orders", page: "seller", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                      )},
                      { label: "Help & Support", sub: "Seller guides & FAQs", page: "customer-care", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      )},
                    ] : [
                      { label: "Manage My Account", sub: "Edit your info & preferences", page: "profile", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      )},
                      { label: "My Orders", sub: "Track & manage orders", page: "orders", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                      )},
                      { label: "My Wishlist & Followed Stores", sub: `${wishIds.length} saved item${wishIds.length !== 1 ? "s" : ""}`, page: "wishlist", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                      )},
                      { label: "My Reviews", sub: "Your product reviews", page: "reviews", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                      )},
                      { label: "My Returns & Cancellations", sub: "Refunds & return requests", page: "returns", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 2 1 2-1 2 1 2-1 4 2z"/>
                        </svg>
                      )},
                      ...(["ADMIN","SUPER_ADMIN"].includes(user.role) ? [{ label: "Admin Panel", sub: "Site management", page: "admin", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      )}] : []),
                    ]).map(item => (
                      <button
                        key={item.page}
                        onClick={() => { nav(item.page); setProfileOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-all duration-150 group hover:bg-surface-warm"
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-white dark:group-hover:bg-[#2A2520]"
                          style={{ backgroundColor: IVORY, color: MUTED }}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{item.label}</p>
                          <p className="text-[11px]" style={{ color: MUTED }}>{item.sub}</p>
                        </div>
                        <svg className="w-3.5 h-3.5 opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: CHARCOAL }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="px-3 pb-3 pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <button
                      onClick={() => { setProfileOpen(false); setSignOutConfirm(true); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150 group hover:bg-red-50"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-400 group-hover:bg-red-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-500">Log out</p>
                        <p className="text-[11px] text-red-400">See you next time</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => nav("role-select")}
                className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-full border-2 transition-all duration-300 hover:bg-surface-warm"
                style={{ borderColor: GOLD, color: GOLD }}>
                Log In
              </button>
              <button onClick={() => nav("role-select")}
                className="text-sm font-semibold text-white px-5 py-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: GOLD }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = GOLD_DARK; e.currentTarget.style.boxShadow = "0 4px 16px rgba(198,131,19,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.boxShadow = "none"; }}>
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Search modal ─────────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#1A1814] rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)", border: `1px solid ${BORDER}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input row */}
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <svg className="w-5 h-5 shrink-0" style={{ color: MUTED }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  ref={modalInputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Try 'serum', 'gift', 'fragrance'..."
                  className="flex-1 bg-transparent text-base outline-none"
                  style={{ color: CHARCOAL }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-[11px] font-mono font-semibold px-2 py-1 rounded-md shrink-0"
                  style={{ backgroundColor: "#F3EDE0", color: MUTED, border: `1px solid ${BORDER}` }}
                >
                  ESC
                </button>
              </div>
            </form>

            <div className="p-5">
              {searchQuery.length < 2 ? (
                <>
                  {/* Popular searches */}
                  <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: MUTED }}>
                    POPULAR SEARCHES
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {POPULAR_SEARCHES.map(s => (
                      <button
                        key={s}
                        onClick={() => setSearchQuery(s)}
                        className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 hover:border-[#C68313] hover:text-[#C68313]"
                        style={{ border: `1px solid ${BORDER}`, color: CHARCOAL }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Shop categories */}
                  <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: MUTED }}>
                    SHOP CATEGORIES
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {MOCK_CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { nav("products", { category: c.slug }); setSearchOpen(false); }}
                        className="flex items-center gap-3 p-3 rounded-xl text-left transition-colors duration-150"
                        style={{ border: `1px solid ${BORDER}` }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = IVORY; e.currentTarget.style.borderColor = GOLD; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.borderColor = BORDER; }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ backgroundColor: IVORY }}>
                          {c.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>{c.name}</p>
                          <p className="text-xs" style={{ color: MUTED }}>{CAT_COUNTS[c.id] ?? 0} items</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : suggestions.length > 0 ? (
                /* Product results */
                <div className="flex flex-col -mx-1">
                  {suggestions.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { nav("product", p.slug); setSearchOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 hover:bg-surface-warm"
                    >
                      <span className="text-2xl shrink-0">{p.emoji ?? "🛍️"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>{p.name}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{p.category?.name}</p>
                      </div>
                      <span className="text-sm font-bold shrink-0" style={{ color: GOLD }}>
                        {formatPrice(Number(p.basePrice ?? p.price ?? 0))}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => { nav("products"); setSearchOpen(false); }}
                    className="mt-2 w-full py-2.5 text-sm font-semibold rounded-xl transition-colors hover:bg-surface-warm"
                    style={{ color: GOLD, borderTop: `1px solid ${BORDER}` }}
                  >
                    See all results for &ldquo;{searchQuery}&rdquo; →
                  </button>
                </div>
              ) : (
                <p className="text-center py-6 text-sm" style={{ color: MUTED }}>
                  No results for &ldquo;{searchQuery}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sign-out confirmation ─────────────────────────────────────── */}
      {signOutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
          onClick={() => setSignOutConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#1A1814] rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.2)", border: `1px solid ${BORDER}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon header */}
            <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "#FEF2F2" }}>
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </div>
              <h3 className="text-lg font-black mb-1" style={{ color: CHARCOAL }}>Sign out?</h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                You'll need to sign back in to access your orders, wishlist, and account details.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 px-6 pb-6">
              <button
                onClick={() => setSignOutConfirm(false)}
                className="py-3 rounded-xl text-sm font-bold transition-all duration-150 hover:opacity-80"
                style={{ backgroundColor: IVORY, color: CHARCOAL, border: `1px solid ${BORDER}` }}
              >
                Stay signed in
              </button>
              <button
                onClick={() => { const wasSeller = user?.role === "SELLER"; setUser(null); setSignOutConfirm(false); nav(wasSeller ? "login" : "home"); }}
                className="py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "#EF4444" }}
              >
                Yes, sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
