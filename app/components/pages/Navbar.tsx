"use client";
import { useState, useEffect, useRef } from "react";
import { cn, formatPrice, MOCK_CATEGORIES, MOCK_PRODUCTS, useCartStore, useUIStore, useAuthStore, useWishlistStore, useDebounce, apiGet } from "@/app/lib/store";

export function Navbar() {
  const { nav, searchQuery, setSearchQuery, darkMode, setDarkMode, toggleMobileMenu } = useUIStore();
  const { cartCount, setCartOpen } = useCartStore();
  const { user } = useAuthStore();
  const { ids: wishIds } = useWishlistStore();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const searchRef = useRef(null);
  const dSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (dSearch.length < 2) { setSuggestions([]); return; }
    apiGet(`/api/products/search?q=${encodeURIComponent(dSearch)}&limit=5`, null)
      .then(d => setSuggestions(d?.products ?? []))
      .catch(() => setSuggestions(
        MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(dSearch.toLowerCase())).slice(0, 5)
      ));
  }, [dSearch]);

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
      <div className="bg-violet-600 text-white text-xs py-1.5 text-center font-medium">
        🚚 Free delivery on orders above <strong>रू 1,000</strong> &nbsp;·&nbsp; ⚡ Flash Sale Live Now
      </div>
      <header className={cn("sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 transition-shadow", scrolled && "shadow-sm")}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={toggleMobileMenu} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors" aria-label="Menu">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <button onClick={() => nav("home")} className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-black text-sm">N</div>
            <span className="text-xl font-black hidden sm:block dark:text-white">Nex<span className="text-violet-600">Mart</span></span>
          </button>
          <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearch}>
              <div className={cn("flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 transition-all", searchFocus && "ring-2 ring-violet-500 bg-white dark:bg-gray-900")}>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setSearchFocus(true)} onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
                  placeholder="Search products, brands, categories…" aria-label="Search NexMart"
                  className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 min-w-0" />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}
              </div>
            </form>
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
                    <span className="text-sm font-bold text-violet-600 shrink-0">{formatPrice(Number(p.basePrice))}</span>
                  </button>
                ))}
                <button onMouseDown={() => { nav("products"); setSearchFocus(false); }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors border-t border-gray-50 dark:border-gray-800">
                  Search for "{searchQuery}" →
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors" aria-label="Toggle theme">{darkMode ? "☀️" : "🌙"}</button>
            <button onClick={() => nav("wishlist")} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={`Wishlist (${wishIds.length})`}>
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              {wishIds.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{wishIds.length}</span>}
            </button>
            <button onClick={() => setCartOpen(true)} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={`Cart (${cartCount} items)`}>
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              {cartCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-violet-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cartCount > 99 ? "99+" : cartCount}</span>}
            </button>
            {user ? (
              <div id="profile-menu" className="relative">
                <button onClick={() => setProfileOpen(v => !v)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">{user.name?.[0]?.toUpperCase()}</div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:block">{user.name?.split(" ")[0]}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    {[
                      { label:"My Profile", icon:"👤", page:"profile" },
                      { label:"My Orders",  icon:"📦", page:"orders"  },
                      { label:"Wishlist",   icon:"❤️", page:"wishlist"},
                      ...(user.role==="SELLER" ? [{ label:"Seller Hub",  icon:"🏪", page:"seller" }] : []),
                      ...(["ADMIN","SUPER_ADMIN"].includes(user.role) ? [{ label:"Admin Panel", icon:"⚙️", page:"admin" }] : []),
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
