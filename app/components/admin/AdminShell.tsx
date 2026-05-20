"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  Package,
  Tag,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  TrendingUp,
  Shield,
  RefreshCcw,
  ExternalLink,
  Command,
  AlertCircle,
  HelpCircle,
  Inbox,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useMemo } from "react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
  children?: NavItem[];
  section?: string;
}

const CreditCard = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const NAV: NavItem[] = [
  // Overview
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="w-4 h-4" />,
    section: "OVERVIEW",
  },

  // People
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    icon: <Users className="w-4 h-4" />,
    section: "PEOPLE",
  },
  {
    id: "sellers",
    label: "Sellers",
    href: "/admin/sellers",
    icon: <Store className="w-4 h-4" />,
    badge: 12,
    badgeColor: "bg-amber-500",
    section: "PEOPLE",
  },

  // Catalog
  {
    id: "products",
    label: "Products",
    href: "/admin/products",
    icon: <ShoppingBag className="w-4 h-4" />,
    section: "CATALOG",
  },
  {
    id: "categories",
    label: "Categories",
    href: "/admin/categories",
    icon: <Tag className="w-4 h-4" />,
    section: "CATALOG",
  },
  {
    id: "inventory",
    label: "Inventory",
    href: "/admin/inventory",
    icon: <Package className="w-4 h-4" />,
    section: "CATALOG",
  },

  // Commerce
  {
    id: "orders",
    label: "Orders",
    href: "/admin/orders",
    icon: <Inbox className="w-4 h-4" />,
    badge: 3,
    badgeColor: "bg-red-500",
    section: "COMMERCE",
  },
  {
    id: "coupons",
    label: "Coupons",
    href: "/admin/coupons",
    icon: <Tag className="w-4 h-4" />,
    section: "COMMERCE",
  },
  {
    id: "returns",
    label: "Returns",
    href: "/admin/returns",
    icon: <RefreshCcw className="w-4 h-4" />,
    badge: 5,
    badgeColor: "bg-orange-500",
    section: "COMMERCE",
  },
  {
    id: "payments",
    label: "Payments",
    href: "/admin/payments",
    icon: <CreditCard className="w-4 h-4" />,
    section: "COMMERCE",
  },

  // Content
  {
    id: "banners",
    label: "Banners & Ads",
    href: "/admin/banners",
    icon: <ImageIcon className="w-4 h-4" />,
    section: "CONTENT",
  },
  {
    id: "blog",
    label: "Blog / CMS",
    href: "/admin/blog",
    icon: <FileText className="w-4 h-4" />,
    section: "CONTENT",
  },

  // Support
  {
    id: "support",
    label: "Support Tickets",
    href: "/admin/support",
    icon: <MessageSquare className="w-4 h-4" />,
    badge: 8,
    badgeColor: "bg-red-500",
    section: "SUPPORT",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/admin/reports",
    icon: <TrendingUp className="w-4 h-4" />,
    section: "SUPPORT",
  },

  // System
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings className="w-4 h-4" />,
    section: "SYSTEM",
  },
  {
    id: "security",
    label: "Security Logs",
    href: "/admin/security",
    icon: <Shield className="w-4 h-4" />,
    section: "SYSTEM",
  },
];

const SECTIONS = [
  "OVERVIEW",
  "PEOPLE",
  "CATALOG",
  "COMMERCE",
  "CONTENT",
  "SUPPORT",
  "SYSTEM",
];

// ─── Shell ────────────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(5);
  const pathname = usePathname();

  // Keyboard shortcut: Cmd/Ctrl+K → command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Persist theme
  useEffect(() => {
    const saved = localStorage.getItem("admin-theme");
    const isDark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("admin-theme", next ? "dark" : "light");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
        pathname={pathname}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onToggleMobile={() => setMobileOpen((v) => !v)}
          dark={dark}
          onToggleDark={toggleDark}
          cmdOpen={cmdOpen}
          setCmdOpen={setCmdOpen}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          unread={unread}
          setUnread={setUnread}
          pathname={pathname}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-350 mx-auto px-4 sm:px-6 py-6">{children}</div>
        </main>
      </div>

      {/* Command palette */}
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
    </div>
  );
}

function AdminSidebar({
  collapsed,
  mobileOpen,
  closeMobile,
  pathname,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  closeMobile: () => void;
  pathname: string;
}) {
  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col h-full transition-all duration-300 z-50",
        // Desktop
        "hidden lg:flex",
        collapsed ? "w-16" : "w-60",
        // Mobile
        "lg:relative fixed top-0 left-0",
        mobileOpen ? "flex w-60 lg:hidden" : "hidden lg:flex",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-gray-800 shrink-0",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
          N
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-lg font-black text-white">
              Nex<span className="text-blue-400">Mart</span>
            </span>
            <span className="block text-xs text-gray-500 -mt-0.5">
              Admin Console
            </span>
          </div>
        )}
        {/* Mobile close */}
        <button
          onClick={closeMobile}
          aria-label="Close menu"
          className="ml-auto lg:hidden text-gray-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800">
        {SECTIONS.map((section) => {
          const items = NAV.filter((n) => n.section === section);
          if (!items.length) return null;
          return (
            <div key={section} className="mb-1">
              {!collapsed && (
                <p className="px-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  {section}
                </p>
              )}
              {items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  active={active(item.href)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom — user + version */}
      <div
        className={cn(
          "border-t border-gray-800 p-3 shrink-0",
          collapsed && "flex justify-center",
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer group">
            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold  shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-200">Super Admin</p>
              <p className="text-xs text-gray-500 truncate">
                admin@nexmart.com
              </p>
            </div>
            <LogOut className="w-3.5 h-3.5 text-gray-600 group-hover:text-red-400 transition-colors shrink-0" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            A
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarItem({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={cn(
        "flex items-center gap-3 mx-2 px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
        collapsed && "justify-center px-0 mx-1",
        active
          ? "bg-blue-600 text-white"
          : "text-gray-400 hover:text-white hover:bg-gray-800/70",
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span
          className={cn(
            "text-[10px] font-black px-1.5 py-0.5 rounded-full text-white min-w-4.5 text-center leading-none flex items-center justify-center",
            item.badgeColor ?? "bg-red-500",
          )}
        >
          {item.badge}
        </span>
      )}
      {/* Tooltip for collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 border border-gray-700 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          {item.label}
          {item.badge && (
            <span
              className={cn(
                "ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full text-white",
                item.badgeColor ?? "bg-red-500",
              )}
            >
              {item.badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function AdminTopbar({
  collapsed,
  onToggleCollapse,
  onToggleMobile,
  dark,
  onToggleDark,
  cmdOpen,
  setCmdOpen,
  notifOpen,
  setNotifOpen,
  unread,
  setUnread,
  pathname,
}: any) {
  const router = useRouter();
  const { data: session } = useSession();

  // Breadcrumbs from pathname
  const crumbs = useMemo(() => {
    const parts = pathname.replace("/admin", "").split("/").filter(Boolean);
    const result = [{ label: "Admin", href: "/admin" }];
    let path = "/admin";
    parts.forEach((p: any) => {
      path += `/${p}`;
      result.push({
        label: p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "),
        href: path,
      });
    });
    return result;
  }, [pathname]);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 px-4 py-3 shrink-0 sticky top-0 z-30">
      <button
        onClick={onToggleCollapse}
        aria-label="Toggle sidebar"
        className="hidden lg:flex p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={onToggleMobile}
        aria-label="Open menu"
        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="hidden sm:flex items-center gap-1 text-sm min-w-0 flex-1"
      >
        {crumbs.map((c, i) => (
          <React.Fragment key={c.href}>
            {i > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
            )}
            <Link
              href={c.href}
              className={cn(
                "truncate transition-colors hover:text-blue-600",
                i === crumbs.length - 1
                  ? "text-gray-900 dark:text-white font-semibold"
                  : "text-gray-400 dark:text-gray-500",
              )}
            >
              {c.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-auto shrink-0">
        {/* Cmd+K search */}
        <button
          onClick={() => setCmdOpen(true)}
          aria-label="Command palette (⌘K)"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-medium transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd className="ml-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-1.5 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* View site */}
        <Link
          href="/"
          target="_blank"
          aria-label="View site"
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>

        {/* Theme */}
        <button
          onClick={onToggleDark}
          aria-label="Toggle theme"
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v: boolean) => !v);
              if (unread > 0) setUnread(0);
            }}
            aria-label={`${unread} notifications`}
            className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <AdminNotifDropdown onClose={() => setNotifOpen(false)} />
          )}
        </div>

        {/* Profile */}
        <AdminProfileMenu session={session} />
      </div>
    </header>
  );
}

// ─── Notif dropdown ───────────────────────────────────────────────────────

const MOCK_NOTIFS = [
  {
    id: "1",
    type: "seller",
    icon: "🏪",
    title: "New Seller Application",
    body: "TechWorld Store wants to join.",
    time: "2m ago",
    read: false,
    href: "/admin/sellers",
  },
  {
    id: "2",
    type: "order",
    icon: "📦",
    title: "Order Cancelled",
    body: "Order #NX-2025-47821 cancelled.",
    time: "15m ago",
    read: false,
    href: "/admin/orders",
  },
  {
    id: "3",
    type: "support",
    icon: "💬",
    title: "Urgent Support Ticket",
    body: "Priya M. reported missing order.",
    time: "1h ago",
    read: false,
    href: "/admin/support",
  },
  {
    id: "4",
    type: "product",
    icon: "🛍️",
    title: "Product Flagged",
    body: "Counterfeit report on SKU-443.",
    time: "3h ago",
    read: true,
    href: "/admin/products",
  },
  {
    id: "5",
    type: "payment",
    icon: "💳",
    title: "Refund Processed",
    body: "रू 45,000 refunded to Raj K.",
    time: "5h ago",
    read: true,
    href: "/admin/payments",
  },
];

function AdminNotifDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="font-bold text-sm text-gray-900 dark:text-white">
          Notifications
        </span>
        <button className="text-xs text-blue-600 font-semibold hover:underline">
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {MOCK_NOTIFS.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            onClick={onClose}
            className={cn(
              "flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0",
              !n.read && "bg-blue-50/60 dark:bg-blue-900/10",
            )}
          >
            <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {n.title}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{n.body}</p>
              <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
            </div>
            {!n.read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-2" />
            )}
          </Link>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
        <Link
          href="/admin/notifications"
          onClick={onClose}
          className="block text-center text-xs font-semibold text-blue-600 hover:underline"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

function AdminProfileMenu({ session }: { session: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile menu"
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-7 h-7 bg-linear-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
          {session?.user?.avatar ? (
            <Image
              src={session.user.avatar}
              alt="Avatar"
              width={28}
              height={28}
              className="object-cover"
            />
          ) : (
            "A"
          )}
        </div>
        <span className="hidden md:block text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-20 truncate">
          {session?.user?.name?.split(" ")[0] ?? "Admin"}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-900 dark:text-white">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session?.user?.email}
            </p>
            <span className="inline-block mt-1 text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
              {session?.user?.role}
            </span>
          </div>
          {[
            {
              href: "/admin/settings",
              icon: <Settings className="w-3.5 h-3.5" />,
              label: "Settings",
            },
            {
              href: "/admin/security",
              icon: <Shield className="w-3.5 h-3.5" />,
              label: "Security Logs",
            },
            {
              href: "/",
              icon: <ExternalLink className="w-3.5 h-3.5" />,
              label: "View Site",
            },
          ].map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-400">{i.icon}</span>
              {i.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const CMD_ITEMS = [
  {
    group: "Pages",
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    group: "Pages",
    label: "Users",
    href: "/admin/users",
    icon: <Users className="w-4 h-4" />,
  },
  {
    group: "Pages",
    label: "Sellers",
    href: "/admin/sellers",
    icon: <Store className="w-4 h-4" />,
  },
  {
    group: "Pages",
    label: "Products",
    href: "/admin/products",
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  {
    group: "Pages",
    label: "Orders",
    href: "/admin/orders",
    icon: <Inbox className="w-4 h-4" />,
  },
  {
    group: "Pages",
    label: "Support Tickets",
    href: "/admin/support",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    group: "Actions",
    label: "Add New Product",
    href: "/admin/products/new",
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  {
    group: "Actions",
    label: "Create Coupon",
    href: "/admin/coupons/new",
    icon: <Tag className="w-4 h-4" />,
  },
  {
    group: "Actions",
    label: "Approve Sellers",
    href: "/admin/sellers?status=PENDING",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  {
    group: "Actions",
    label: "View Reports",
    href: "/admin/reports",
    icon: <TrendingUp className="w-4 h-4" />,
  },
];

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.trim()
    ? CMD_ITEMS.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase()),
      )
    : CMD_ITEMS;

  const go = (href: string) => {
    router.push(href);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === "Enter" && filtered[cursor]) go(filtered[cursor].href);
  };

  const groups = [...new Set(filtered.map((i) => i.group))];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKey}
            placeholder="Search pages, actions, users..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <kbd className="text-[10px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded font-mono text-gray-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            groups.map((group) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {group}
                </p>
                {filtered
                  .filter((i) => i.group === group)
                  .map((item, gi) => {
                    const globalIdx = filtered.indexOf(item);
                    return (
                      <button
                        key={item.href}
                        onClick={() => go(item.href)}
                        onMouseEnter={() => setCursor(globalIdx)}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors",
                          globalIdx === cursor
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                        )}
                      >
                        <span
                          className={cn(
                            globalIdx === cursor
                              ? "text-blue-600"
                              : "text-gray-400",
                          )}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                        {globalIdx === cursor && (
                          <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />
                        )}
                      </button>
                    );
                  })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
              ↑↓
            </kbd>{" "}
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
              ↵
            </kbd>{" "}
            Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
              ESC
            </kbd>{" "}
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
