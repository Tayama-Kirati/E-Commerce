"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, ShoppingCart, Bell, User, Menu, X,
  Mic, Camera, Sun, Moon, Globe, ChevronDown,
  Heart, Package, LogOut, Settings, Store,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "../../lib/utils";
import { useCartStore }     from "../../store/cartStore";
import { useUIStore }       from "../../store/uiStore";
import { useSearch }        from "../../hooks/useSearch";
import { useDebounce }      from "../../hooks/useDebounce";
import { MegaMenu }         from "./MegaMenu";
import { CartSidebar }      from "../cart/CartSidebar";
import { NotifPanel }       from "./NotifPanel";

const CURRENCIES = [
  { code: "NPR", symbol: "रू", flag: "🇳🇵" },
  { code: "USD", symbol: "$",  flag: "🇺🇸" },
  { code: "INR", symbol: "₹",  flag: "🇮🇳" },
];

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ne", label: "नेपाली", flag: "🇳🇵" },
  { code: "hi", label: "हिन्दी",  flag: "🇮🇳" },
];

export function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { itemCount, isOpen: cartOpen, toggleCart } = useCartStore();
  const { toggleMobileMenu, mobileMenuOpen, toggleNotifPanel } = useUIStore();
  const { theme, setTheme } = useTheme();
  const { query, setQuery, results, isSearching, trending, clear } = useSearch();

  const [scrolled,        setScrolled]        = useState(false);
  const [searchFocused,   setSearchFocused]   = useState(false);
  const [profileOpen,     setProfileOpen]     = useState(false);
  const [currencyOpen,    setCurrencyOpen]    = useState(false);
  const [currency,        setCurrency]        = useState("NPR");
  const [language,        setLanguage]        = useState("en");
  const [unreadCount,     setUnreadCount]     = useState(0);
  const searchRef  = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current  && !searchRef.current.contains(e.target as Node))  setSearchFocused(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/notifications?unread=true&limit=1")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => {});
  }, [session]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchFocused(false);
  };

  const handleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      router.push(`/search?q=${encodeURIComponent(transcript)}`);
    };
    recognition.start();
  };

  const showDropdown = searchFocused && (query.length >= 2 ? !!results : trending.length > 0);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 transition-shadow duration-200",
          scrolled && "shadow-sm shadow-gray-200/50 dark:shadow-gray-900/50"
        )}
      >
        {/* Top bar — currency / language / deals */}
        <div className="bg-blue-600 text-white text-xs py-1.5 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>🚚 Free delivery on orders above रू 1,000</span>
              <span className="opacity-50">|</span>
              <Link href="/flash-deals" className="hover:underline flex items-center gap-1">
                ⚡ Flash Sale Live Now
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {/* Language picker */}
              <div className="relative group">
                <button className="flex items-center gap-1 hover:opacity-80">
                  <Globe className="w-3 h-3" />
                  {LANGUAGES.find((l) => l.code === language)?.flag}{" "}
                  {LANGUAGES.find((l) => l.code === language)?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-6 bg-white text-gray-800 rounded-xl shadow-lg border border-gray-100 py-1 w-36 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {LANGUAGES.map((l) => (
                    <button key={l.code} onClick={() => setLanguage(l.code)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left">
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <span className="opacity-50">|</span>
              {/* Currency picker */}
              <div className="relative group">
                <button className="flex items-center gap-1 hover:opacity-80">
                  {CURRENCIES.find((c) => c.code === currency)?.flag}{" "}
                  {currency}
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-6 bg-white text-gray-800 rounded-xl shadow-lg border border-gray-100 py-1 w-28 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {CURRENCIES.map((c) => (
                    <button key={c.code} onClick={() => setCurrency(c.code)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left">
                      {c.flag} {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 h-16">

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link href="/" className=" shrink-0 flex items-center gap-1.5">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white font-black text-sm">N</div>
              <span className="text-xl font-black text-gray-900 dark:text-white hidden sm:block tracking-tight">
                Nex<span className="text-blue-600">Mart</span>
              </span>
            </Link>

            {/* Search bar */}
            <div ref={searchRef} className="flex-1 max-w-2xl relative">
              <form onSubmit={handleSearchSubmit}>
                <div className={cn(
                  "flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border rounded-2xl px-4 py-2.5 transition-all duration-200",
                  searchFocused
                    ? "border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30 bg-white dark:bg-gray-900"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                )}>
                  <Search className="w-4 h-4 text-gray-400  shrink-0" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Search products, brands, categories..."
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none min-w-0"
                    autoComplete="off"
                    aria-label="Search NexMart"
                    aria-expanded={showDropdown}
                    aria-haspopup="listbox"
                  />
                  {query && (
                    <button type="button" onClick={clear} aria-label="Clear search"
                      className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-2 ml-1">
                    <button type="button" onClick={handleVoiceSearch} aria-label="Voice search"
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                      <Mic className="w-4 h-4" />
                    </button>
                    <Link href="/search?mode=image" aria-label="Image search"
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                      <Camera className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </form>

              {/* Search dropdown */}
              {showDropdown && (
                <div
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 z-50 overflow-hidden animate-scale-in"
                >
                  {isSearching ? (
                    <div className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </div>
                  ) : query.length >= 2 && results ? (
                    <>
                      {results.categories?.length > 0 && (
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
                          {results.categories.map((cat: any) => (
                            <Link key={cat.id} href={`/categories/${cat.slug}`}
                              onClick={() => { setSearchFocused(false); clear(); }}
                              role="option"
                              className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <span className="text-lg">{cat.icon ?? "📁"}</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                              <span className="ml-auto text-xs text-gray-400">Category</span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {results.products?.length > 0 && (
                        <div className="px-4 pt-2 pb-3 border-t border-gray-50 dark:border-gray-800">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Products</p>
                          {results.products.map((p: any) => (
                            <Link key={p.id} href={`/products/${p.slug}`}
                              onClick={() => { setSearchFocused(false); clear(); }}
                              role="option"
                              className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center  shrink-0 overflow-hidden">
                                {p.images?.[0] ? (
                                  <Image src={p.images[0].url} alt={p.name} width={36} height={36} className="object-cover" />
                                ) : "🛍️"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                                <p className="text-xs text-gray-400">{p.category?.name}</p>
                              </div>
                              <span className="text-sm font-bold text-blue-600  shrink-0">
                                रू {Number(p.basePrice).toLocaleString()}
                              </span>
                            </Link>
                          ))}
                          <Link href={`/search?q=${encodeURIComponent(query)}`}
                            onClick={() => setSearchFocused(false)}
                            className="flex items-center justify-center gap-2 mt-2 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors">
                            <Search className="w-4 h-4" />
                            View all results for &quot;{query}&quot;
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    // Trending searches
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trending</p>
                      {trending.slice(0, 6).map((term: any) => (
                        <button key={term}
                          onClick={() => { setQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); setSearchFocused(false); }}
                          role="option"
                          className="flex items-center gap-3 w-full py-2 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                          <Search className="w-3.5 h-3.5 text-gray-300" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1  shrink-0">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hidden md:flex p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Wishlist */}
              <Link href="/account/wishlist"
                className="hidden sm:flex p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors"
                aria-label="Wishlist">
                <Heart className="w-5 h-5" />
              </Link>

              {/* Notifications */}
              {session?.user && (
                <button onClick={toggleNotifPanel} aria-label="Notifications"
                  className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Cart */}
              <button onClick={toggleCart} aria-label={`Cart (${itemCount()} items)`}
                className="relative flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {itemCount() > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount() > 99 ? "99+" : itemCount()}
                  </span>
                )}
              </button>

              {/* Profile */}
              {session?.user ? (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Profile menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden  shrink-0">
                      {session.user.avatar ? (
                        <Image src={session.user.avatar} alt="Avatar" width={32} height={32} className="object-cover" />
                      ) : (
                        session.user.name?.[0] ?? "U"
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none">
                        {session.user.name?.split(" ")[0] ?? "Account"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{session.user.role}</p>
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform hidden md:block", profileOpen && "rotate-180")} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{session.user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                      </div>
                      {[
                        { href: "/account/profile",  icon: <User     className="w-4 h-4" />, label: "My Profile"   },
                        { href: "/account/orders",   icon: <Package  className="w-4 h-4" />, label: "My Orders"    },
                        { href: "/account/wishlist", icon: <Heart    className="w-4 h-4" />, label: "Wishlist"     },
                        ...(session.user.role === "SELLER" ? [
                          { href: "/seller/dashboard", icon: <Store  className="w-4 h-4" />, label: "Seller Hub"  },
                        ] : []),
                        ...(["ADMIN","SUPER_ADMIN"].includes(session.user.role) ? [
                          { href: "/admin",           icon: <Settings className="w-4 h-4" />, label: "Admin Panel" },
                        ] : []),
                      ].map((item) => (
                        <Link key={item.href} href={item.href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <span className="text-gray-400">{item.icon}</span>{item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 dark:border-gray-800 mt-1">
                        <button
                          onClick={async () => { setProfileOpen(false); await fetch("/api/auth/logout",{method:"POST"}); window.location.href="/login"; }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" />Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login"
                    className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register"
                    className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mega Menu Bar */}
        <MegaMenu />
      </header>

      {/* Sidebars */}
      <CartSidebar />
      <NotifPanel />
    </>
  );
}

 