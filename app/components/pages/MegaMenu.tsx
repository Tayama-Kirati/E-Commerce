"use client";

import React, { useState, useRef } from "react";
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
    children: [
      { label: "Furniture", href: "/categories/furniture", icon: "🛋️" },
      { label: "Kitchen & Dining", href: "/categories/kitchen-dining", icon: "🍽️" },
      { label: "Bedding & Bath", href: "/categories/bedding-bath", icon: "🛁" },
      { label: "Lighting", href: "/categories/lighting", icon: "💡" },
      { label: "Home Decor", href: "/categories/home-decor", icon: "🪴" },
      { label: "Appliances", href: "/categories/appliances", icon: "🔌" },
      { label: "Storage & Organisation", href: "/categories/storage", icon: "📦" },
      { label: "Garden & Outdoor", href: "/categories/garden-outdoor", icon: "🌿" },
    ],
    featured: {
      label: "Transform Your Space",
      img: "🛋️",
      badge: "New",
      href: "/categories/home-living",
    },
  },
  {
    id: "beauty",
    label: "Beauty",
    icon: <Heart className="w-4 h-4" />,
    href: "/categories/health-beauty",
    children: [
      { label: "Skincare", href: "/categories/skincare", icon: "🧴" },
      { label: "Makeup", href: "/categories/makeup", icon: "💄" },
      { label: "Hair Care", href: "/categories/hair-care", icon: "💆" },
      { label: "Fragrances", href: "/categories/fragrances", icon: "🌸" },
      { label: "Personal Care", href: "/categories/personal-care", icon: "🪥" },
      { label: "Vitamins & Supplements", href: "/categories/vitamins", icon: "💊" },
      { label: "Men's Grooming", href: "/categories/mens-grooming", icon: "🪒" },
      { label: "Wellness", href: "/categories/wellness", icon: "🧘" },
    ],
    featured: {
      label: "Glow Up This Season",
      img: "💄",
      badge: "Hot",
      href: "/categories/health-beauty",
    },
  },
  {
    id: "sports",
    label: "Sports",
    icon: <Dumbbell className="w-4 h-4" />,
    href: "/categories/sports",
    children: [
      { label: "Gym Equipment", href: "/categories/gym-equipment", icon: "🏋️" },
      { label: "Sportswear", href: "/categories/sportswear", icon: "👟" },
      { label: "Yoga & Pilates", href: "/categories/yoga-pilates", icon: "🧘" },
      { label: "Cycling", href: "/categories/cycling", icon: "🚴" },
      { label: "Swimming", href: "/categories/swimming", icon: "🏊" },
      { label: "Outdoor & Camping", href: "/categories/outdoor-camping", icon: "⛺" },
      { label: "Team Sports", href: "/categories/team-sports", icon: "⚽" },
      { label: "Nutrition & Recovery", href: "/categories/nutrition-recovery", icon: "💪" },
    ],
    featured: {
      label: "Gear Up & Go",
      img: "🏋️",
      badge: "Trending",
      href: "/categories/sports",
    },
  },
  {
    id: "books",
    label: "Books",
    icon: <BookOpen className="w-4 h-4" />,
    href: "/categories/books",
    children: [
      { label: "Fiction", href: "/categories/fiction", icon: "📖" },
      { label: "Non-Fiction", href: "/categories/non-fiction", icon: "📚" },
      { label: "Academic", href: "/categories/academic", icon: "🎓" },
      { label: "Children's Books", href: "/categories/childrens-books", icon: "🧸" },
      { label: "Stationery", href: "/categories/stationery", icon: "✏️" },
      { label: "Art Supplies", href: "/categories/art-supplies", icon: "🎨" },
      { label: "Magazines", href: "/categories/magazines", icon: "📰" },
      { label: "eBooks", href: "/categories/ebooks", icon: "📱" },
    ],
    featured: {
      label: "Read Something New",
      img: "📚",
      badge: "New",
      href: "/categories/books",
    },
  },
  {
    id: "auto",
    label: "Auto",
    icon: <Car className="w-4 h-4" />,
    href: "/categories/automotive",
    children: [
      { label: "Car Accessories", href: "/categories/car-accessories", icon: "🚗" },
      { label: "Bike Accessories", href: "/categories/bike-accessories", icon: "🏍️" },
      { label: "Car Care", href: "/categories/car-care", icon: "🪣" },
      { label: "GPS & Navigation", href: "/categories/gps-navigation", icon: "📍" },
      { label: "Tyres & Wheels", href: "/categories/tyres-wheels", icon: "🛞" },
      { label: "Seat Covers", href: "/categories/seat-covers", icon: "💺" },
      { label: "Tools & Equipment", href: "/categories/auto-tools", icon: "🔧" },
      { label: "Audio & Electronics", href: "/categories/car-audio", icon: "🔊" },
    ],
    featured: {
      label: "Upgrade Your Ride",
      img: "🚗",
      badge: "Hot",
      href: "/categories/automotive",
    },
  },
  {
    id: "kids",
    label: "Kids",
    icon: <Baby className="w-4 h-4" />,
    href: "/categories/kids-baby",
    children: [
      { label: "Toys & Games", href: "/categories/toys-games", icon: "🧸" },
      { label: "Baby Clothing", href: "/categories/baby-clothing", icon: "👶" },
      { label: "Baby Gear", href: "/categories/baby-gear", icon: "🛒" },
      { label: "Educational Toys", href: "/categories/educational-toys", icon: "🎲" },
      { label: "Books & Learning", href: "/categories/kids-books", icon: "📚" },
      { label: "Safety & Health", href: "/categories/kids-safety", icon: "🩺" },
      { label: "Nursery", href: "/categories/nursery", icon: "🛏️" },
      { label: "Feeding & Nursing", href: "/categories/feeding-nursing", icon: "🍼" },
    ],
    featured: {
      label: "Little Ones, Big Joy",
      img: "🧸",
      badge: "New",
      href: "/categories/kids-baby",
    },
  },
  {
    id: "grocery",
    label: "Grocery",
    icon: <ShoppingBag className="w-4 h-4" />,
    href: "/categories/grocery",
    children: [
      { label: "Fresh Produce", href: "/categories/fresh-produce", icon: "🥦" },
      { label: "Dairy & Eggs", href: "/categories/dairy-eggs", icon: "🥛" },
      { label: "Snacks & Munchies", href: "/categories/snacks", icon: "🍿" },
      { label: "Beverages", href: "/categories/beverages", icon: "☕" },
      { label: "Organic & Natural", href: "/categories/organic", icon: "🌿" },
      { label: "Bakery & Breads", href: "/categories/bakery", icon: "🍞" },
      { label: "Condiments & Sauces", href: "/categories/condiments", icon: "🫙" },
      { label: "International Foods", href: "/categories/international-foods", icon: "🌍" },
    ],
    featured: {
      label: "Fresh Picks Daily",
      img: "🥦",
      badge: "Sale",
      href: "/categories/grocery",
    },
  },
  {
    id: "deals",
    label: "Deals",
    icon: <Percent className="w-4 h-4" />,
    href: "/deals",
    color: "text-red-500",
    children: [
      { label: "Flash Deals", href: "/deals/flash", icon: "⚡" },
      { label: "Bundle Offers", href: "/deals/bundles", icon: "🎁" },
      { label: "Clearance Sale", href: "/deals/clearance", icon: "🏷️" },
      { label: "Coupons & Promo", href: "/deals/coupons", icon: "🎫" },
      { label: "Limited Time", href: "/deals/limited-time", icon: "🕐" },
      { label: "Member Exclusives", href: "/deals/member-exclusives", icon: "🏅" },
      { label: "Refer & Earn", href: "/deals/refer-earn", icon: "💰" },
      { label: "Seasonal Deals", href: "/deals/seasonal", icon: "🌟" },
    ],
    featured: {
      label: "Today's Best Deals",
      img: "🏷️",
      badge: "Sale",
      href: "/deals",
    },
  },
  {
    id: "trending",
    label: "Trending",
    icon: <TrendingUp className="w-4 h-4" />,
    href: "/trending",
    color: "text-green-600",
    children: [
      { label: "Most Wished For", href: "/trending/most-wished", icon: "🌟" },
      { label: "New Arrivals", href: "/trending/new-arrivals", icon: "🆕" },
      { label: "Bestsellers", href: "/trending/bestsellers", icon: "📈" },
      { label: "Editor's Pick", href: "/trending/editors-pick", icon: "✨" },
      { label: "Back In Stock", href: "/trending/back-in-stock", icon: "🔄" },
      { label: "Just Dropped", href: "/trending/just-dropped", icon: "🔥" },
      { label: "Viral Products", href: "/trending/viral", icon: "📣" },
      { label: "Staff Picks", href: "/trending/staff-picks", icon: "🎖️" },
    ],
    featured: {
      label: "What Everyone's Buying",
      img: "📈",
      badge: "Trending",
      href: "/trending",
    },
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
                    ? "bg-surface-warm dark:bg-[rgba(198,131,19,0.1)] text-[#C68313]"
                    : "hover:text-[#C68313] hover:bg-gray-50 dark:hover:bg-gray-800/50",
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
          className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xl z-40"
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
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-surface-warm dark:hover:bg-[rgba(198,131,19,0.1)] group transition-colors"
                  >
                    <span className="text-lg">{child.icon}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#C68313]">
                      {child.label}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
              <Link
                href={active.href}
                onClick={() => setActiveId(null)}
                className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#C68313] hover:text-[#9B6210]"
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
                  className="block bg-linear-to-br from-surface-warm to-border dark:from-[rgba(198,131,19,0.1)] dark:to-[rgba(198,131,19,0.2)] rounded-2xl p-4 hover:shadow-md transition-shadow border border-border dark:border-[rgba(198,131,19,0.3)]"
                >
                  <div className="text-5xl mb-3 text-center">
                    {active.featured.img}
                  </div>
                  <span className="inline-block text-xs bg-[#C68313] text-white font-bold px-2 py-0.5 rounded-full mb-2">
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
