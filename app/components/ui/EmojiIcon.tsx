"use client";

import React from "react";
import {
  Apple, Archive, Armchair, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Award, Baby, Backpack, Ban, Banknote, Bath, BatteryFull, Bed,
  Bell, Bike, BookOpen, Book, Bolt, Briefcase, Brush, Building2, Calendar, Camera, Car, Carrot, Cat, ChartBar, Check, CircleCheck,
  CircleHelp, CircleX, Circle, ClipboardList, Clock, Coffee, Coins, CornerDownLeft, CornerDownRight, CreditCard, CupSoda, Dices, Dog,
  Droplet, Droplets, Dumbbell, Earth, Eye, FilePen, Flame, Flower2, Folder, Footprints, Frown, Gamepad2, Gem, Gift, Glasses, Globe,
  GraduationCap, Hammer, HandCoins, Handbag, HardHat, Headphones, Heart, HeartCrack, House, Image, Lamp, Laptop, Leaf, Lightbulb, Lock,
  Mail, Mailbox, MailOpen, MapPin, Medal, Megaphone, MessageCircle, MessageSquare, Milk, Monitor, Motorbike, Mouse, Music, Newspaper,
  Package, Palette, PartyPopper, PawPrint, Pencil, Phone, Pill, Plug, Plus, Popcorn, Puzzle, RefreshCw, Repeat, Rocket, RotateCcw,
  Satellite, Save, Scissors, Search, Settings, Shield, ShieldCheck, Shirt, ShoppingBag, ShoppingCart, Smartphone, Snowflake, Sofa, Sparkles,
  Sprout, Square, Star, Store, Sun, Tag, Target, Tent, Ticket, TrendingUp, TriangleAlert, Trash2, Trophy, Truck, Tv, Undo2, User,
  Users, Utensils, Volleyball, Volume2, Waves, Wheat, Wind, Wrench, X, Zap, BrickWall, Shapes, Hand, Container,
  Hourglass, Watch, Keyboard, LayoutDashboard, ChevronUp, ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

// Emoji → outline icon. Emoji strings are still used as data (category.icon,
// product.emoji, status maps), so this keeps them rendering as outline icons.
const MAP: Record<string, LucideIcon> = {
  "🛍": ShoppingBag, "📦": Package, "✅": CircleCheck, "🚚": Truck, "🎉": PartyPopper, "✓": Check, "✔": Check,
  "🏪": Store, "★": Star, "⭐": Star, "🌟": Star, "📱": Smartphone, "📲": Smartphone, "⚡": Zap, "🛒": ShoppingCart,
  "📍": MapPin, "✕": X, "✖": X, "❌": CircleX, "⚠": TriangleAlert, "💳": CreditCard, "💰": Coins, "🏠": House,
  "🔌": Plug, "💄": Sparkles, "👥": Users, "🏷": Tag, "🎧": Headphones, "🌿": Leaf, "↩": Undo2, "🧸": Baby,
  "🔒": Lock, "🔄": RefreshCw, "💻": Laptop, "👗": Shirt, "🎮": Gamepad2, "♡": Heart, "♥": Heart, "❤": Heart,
  "↑": ArrowUp, "↓": ArrowDown, "←": ArrowLeft, "→": ArrowRight, "🚫": Ban, "📺": Tv, "📞": Phone,
  "📈": TrendingUp, "👟": Footprints, "⚽": Volleyball, "🥇": Medal, "🥈": Medal, "🥉": Medal, "🏅": Medal,
  "🎖": Award, "🟣": Circle, "🟢": Circle, "🛵": Motorbike, "🏍": Motorbike, "🛡": ShieldCheck, "🔧": Wrench,
  "🔔": Bell, "🔍": Search, "📷": Camera, "📸": Camera, "📭": MailOpen, "📝": FilePen, "✎": Pencil, "✏": Pencil,
  "✍": Pencil, "📚": BookOpen, "📖": Book, "📊": ChartBar, "💵": Banknote, "💸": HandCoins, "💬": MessageCircle,
  "💭": MessageSquare, "💎": Gem, "💍": Gem, "👶": Baby, "🍼": Milk, "🚼": Baby, "👔": Shirt, "👕": Shirt,
  "👖": Shirt, "🧥": Shirt, "👘": Shirt, "🧣": Shirt, "🏢": Building2, "🏋": Dumbbell, "💪": Dumbbell, "🎁": Gift,
  "☐": Square, "🧴": Droplet, "🧘": User, "🥦": Carrot, "🛋": Sofa, "🔋": BatteryFull, "💾": Save, "💡": Lightbulb,
  "💊": Pill, "👜": Handbag, "👛": Handbag, "🌐": Globe, "🌍": Earth, "✨": Sparkles, "⚙": Settings, "🧹": Brush,
  "🚗": Car, "🗑": Trash2, "🖼": Image, "🖥": Monitor, "🔥": Flame, "📮": Mailbox, "📋": ClipboardList, "🎵": Music,
  "🎲": Dices, "🎟": Ticket, "🎫": Ticket, "🎒": Backpack, "🍵": Coffee, "☕": Coffee, "➕": Plus, "❓": CircleHelp,
  "⛑": HardHat, "🦺": HardHat, "↵": CornerDownLeft, "↳": CornerDownRight, "↺": RotateCcw, "🔁": Repeat,
  "🫧": Droplets, "💦": Droplets, "🫙": Container, "🪴": Sprout, "🌱": Sprout, "🪥": Brush, "🪣": Container,
  "🪒": Scissors, "🪑": Armchair, "💺": Armchair, "🩺": ShieldCheck, "🧱": BrickWall, "🧩": Puzzle, "🧒": Baby,
  "🧊": Snowflake, "❄": Snowflake, "🥣": Utensils, "🍽": Utensils, "🍳": Utensils, "🥛": Milk, "🛞": Car,
  "🛏": Bed, "🛁": Bath, "🚴": Bike, "🚲": Bike, "🚀": Rocket, "😕": Frown, "🗃": Archive, "🖱": Mouse,
  "🕶": Glasses, "🕐": Clock, "🔩": Bolt, "🔨": Hammer, "🔊": Volume2, "📰": Newspaper, "📧": Mail, "✉": Mail,
  "📣": Megaphone, "📡": Satellite, "📟": Smartphone, "📅": Calendar, "📁": Folder, "💨": Wind, "💔": HeartCrack,
  "💆": Sparkles, "👤": User, "👢": Footprints, "👡": Footprints, "👞": Footprints, "👋": Hand, "👁": Eye,
  "🐾": PawPrint, "🐱": Cat, "🐕": Dog, "🏸": Volleyball, "🏊": Waves, "🏆": Trophy, "🎯": Target, "🎨": Palette,
  "🎓": GraduationCap, "🍿": Popcorn, "🍞": Wheat, "🌾": Wheat, "🌸": Flower2, "⛺": Tent, "☀": Sun, "🍎": Apple,
  "🔺": Shapes, "🏗": HardHat, "🛟": Shield,
  "⏳": Hourglass, "⌛": Hourglass, "⌚": Watch, "⌨": Keyboard, "⊹": LayoutDashboard, "▦": Package, "⊙": MapPin,
  "◷": Clock, "⊘": Ban, "▲": ChevronUp, "▼": ChevronDown,
};

export function iconFor(emoji?: string | null): LucideIcon | null {
  if (!emoji) return null;
  const key = emoji.trim().replace(/[️‍]/g, "");
  return MAP[key] ?? MAP[Array.from(key)[0]] ?? null;
}

interface EmojiIconProps {
  emoji?: React.ReactNode;
  className?: string;
  strokeWidth?: number;
  fallback?: LucideIcon;
}

/**
 * Renders an emoji as its outline icon. Sized in `em`, so existing text-* classes keep working.
 * Non-string values (e.g. an already-rendered lucide icon) pass through untouched.
 */
export function EmojiIcon({ emoji, className, strokeWidth = 1.75, fallback = ShoppingBag }: EmojiIconProps) {
  if (emoji != null && typeof emoji !== "string") return <>{emoji}</>;
  // createElement (not <Icon />) because the component is looked up per render from a static map
  return React.createElement(iconFor(emoji) ?? fallback, {
    "aria-hidden": true,
    className: cn("inline-block w-[1em] h-[1em] shrink-0 align-[-0.125em]", className),
    strokeWidth,
  });
}

const EMOJI_RE = /((?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2190}-\u{21FF}\u{231A}\u{231B}\u{2328}\u{23F3}\u{2299}\u{2298}\u{22B9}\u{25A6}\u{25B2}\u{25BC}\u{25F7}])\uFE0F?)/u;

/** Renders text with any emoji inside it swapped for outline icons. Non-string children pass through. */
export function EmojiText({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (typeof children !== "string") return <>{children}</>;
  const parts = children.split(EMOJI_RE);
  if (parts.length === 1) return <>{children}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 && iconFor(part)
          ? <EmojiIcon key={i} emoji={part} className={className} />
          : part.replace(/^\s{2,}/, " "))}
    </>
  );
}
