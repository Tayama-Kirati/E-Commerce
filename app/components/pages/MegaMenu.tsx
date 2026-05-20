"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Shirt,
  Home,
  Heart,
  Dumbbell,
  BookOpen,
  Car,
  Baby,
  ShoppingBag,
  Zap,
  Percent,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

const MEGA_CATEGORIES = [
  {
    id: "flash",
    label: "⚡ Flash Sale",
    href: "/flash-deals",
    color: "text-orange-500",
    highlight: true,
    children: [],
  },
  {
    id: "electronics",
    label: "Electronics",
    icon: <Smartphone className="w-4 h-4" />,
    href: "/categories/electronics",
    children: [
      { label: "Smartphones", href: "/categories/smartphones", icon: "📱" },
      { label: "Laptops", href: "/categories/laptops", icon: "💻" },
      { label: "Audio", href: "/categories/audio", icon: "🎧" },
      { label: "Tablets", href: "/categories/tablets", icon: "📟" },
      { label: "Cameras", href: "/categories/cameras", icon: "📷" },
      { label: "Smart Watches", href: "/categories/wearables", icon: "⌚" },
      { label: "Gaming", href: "/categories/gaming", icon: "🎮" },
      { label: "TV & Displays", href: "/categories/tv", icon: "🖥️" },
    ],
    featured: {
      label: "Apple iPhone 16 Pro",
      img: "📱",
      badge: "New",
      href: "/products/apple-iphone-16-pro-max-256gb",
    },
  },
  {
    id: "fashion",
    label: "Fashion",
    icon: <Shirt className="w-4 h-4" />,
    href: "/categories/fashion",
    children: [
      { label: "Men's Clothing", href: "/categories/mens-wear", icon: "👔" },
      { label: "Women's Wear", href: "/categories/womens-wear", icon: "👗" },
      { label: "Footwear", href: "/categories/footwear", icon: "👟" },
      { label: "Accessories", href: "/categories/accessories", icon: "👜" },
      { label: "Kids Fashion", href: "/categories/kids-fashion", icon: "🧒" },
      { label: "Ethnic Wear", href: "/categories/ethnic", icon: "🧣" },
    ],
    featured: {
      label: "New Season Collection",
      img: "👗",
      badge: "Trending",
      href: "/categories/fashion",
    },
  },
  {
    id: "home",
    label: "Home",
    icon: <Home className="w-4 h-4" />,
    href: "/categories/home-living",
    children: [],
  },
  {
    id: "beauty",
    label: "Beauty",
    icon: <Heart className="w-4 h-4" />,
    href: "/categories/health-beauty",
    children: [],
  },
  {
    id: "sports",
    label: "Sports",
    icon: <Dumbbell className="w-4 h-4" />,
    href: "/categories/sports",
    children: [],
  },
  {
    id: "books",
    label: "Books",
    icon: <BookOpen className="w-4 h-4" />,
    href: "/categories/books",
    children: [],
  },
  {
    id: "auto",
    label: "Auto",
    icon: <Car className="w-4 h-4" />,
    href: "/categories/automotive",
    children: [],
  },
  {
    id: "kids",
    label: "Kids",
    icon: <Baby className="w-4 h-4" />,
    href: "/categories/kids-baby",
    children: [],
  },
  {
    id: "grocery",
    label: "Grocery",
    icon: <ShoppingBag className="w-4 h-4" />,
    href: "/categories/grocery",
    children: [],
  },
  {
    id: "deals",
    label: "Deals",
    icon: <Percent className="w-4 h-4" />,
    href: "/deals",
    color: "text-red-500",
    children: [],
  },
  {
    id: "trending",
    label: "Trending",
    icon: <TrendingUp className="w-4 h-4" />,
    href: "/trending",
    color: "text-green-600",
    children: [],
  },
];

export function MegaMenu() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = MEGA_CATEGORIES.find((c) => c.id === activeId);

  const enter = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const cat = MEGA_CATEGORIES.find((c) => c.id === id);
    if (cat?.children?.length) setActiveId(id);
  };
  const leave = () => {
    timeoutRef.current = setTimeout(() => setActiveId(null), 150);
  };

  return (
    <div
      className="border-t border-gray-100 dark:border-gray-800 hidden lg:block relative"
      onMouseLeave={leave}
    >
      <div className="max-w-7xl mx-auto px-4">
        <nav
          className="flex items-center gap-1 overflow-x-auto scrollbar-none"
          aria-label="Product categories"
        >
          {MEGA_CATEGORIES.map((cat) => (
            <div key={cat.id} onMouseEnter={() => enter(cat.id)}>
              <Link
                href={cat.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-lg",
                  cat.highlight
                    ? "text-orange-500 font-bold"
                    : cat.color
                      ? cat.color
                      : "text-gray-600 dark:text-gray-400",
                  activeId === cat.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                    : "hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                )}
              >
                {cat.icon && <span className="opacity-70">{cat.icon}</span>}
                {cat.label}
                {cat.children?.length > 0 && (
                  <ChevronRight
                    className={cn(
                      "w-3 h-3 transition-transform",
                      activeId === cat.id && "rotate-90",
                    )}
                  />
                )}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Dropdown panel */}
      {active && active.children.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xl z-40 animate-slide-down"
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-[1fr_auto] gap-8">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {active.label}
              </h3>
              <div className="grid grid-cols-3 gap-1">
                {active.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setActiveId(null)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-colors"
                  >
                    <span className="text-lg">{child.icon}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600">
                      {child.label}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
              <Link
                href={active.href}
                onClick={() => setActiveId(null)}
                className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all in {active.label} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {active.featured && (
              <div className="w-52">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Featured
                </p>
                <Link
                  href={active.featured.href}
                  onClick={() => setActiveId(null)}
                  className="block bg-linear-to-br from-blue-50 to-blue-400 dark:from-blue-900/20 dark:to-blue-400/20 rounded-2xl p-4 hover:shadow-md transition-shadow border border-blue-100 dark:border-blue-800/30"
                >
                  <div className="text-5xl mb-3 text-center">
                    {active.featured.img}
                  </div>
                  <span className="inline-block text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full mb-2">
                    {active.featured.badge}
                  </span>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {active.featured.label}
                  </p>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
