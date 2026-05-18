"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Package,
  Heart,
  Star,
  MapPin,
  CreditCard,
  Users,
  Gift,
  Bell,
  LogOut,
  Camera,
  ChevronRight,
  Shield,
  CheckCircle,
  RotateCcw,
  Settings,
  Trophy,
  Zap,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Globe,
  Copy,
  X,
  Save,
  AlertCircle,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/frontend/web/lib/utils";
import { toast } from "react-hot-toast";

const NAV = [
  {
    id: "profile",
    label: "Personal Info",
    icon: <User className="w-4 h-4" />,
    href: "/account/profile",
  },
  {
    id: "orders",
    label: "My Orders",
    icon: <Package className="w-4 h-4" />,
    href: "/account/orders",
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: <Heart className="w-4 h-4" />,
    href: "/account/wishlist",
  },
  {
    id: "reviews",
    label: "My Reviews",
    icon: <Star className="w-4 h-4" />,
    href: "/account/reviews",
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: <MapPin className="w-4 h-4" />,
    href: "/account/addresses",
  },
  {
    id: "rewards",
    label: "Rewards & Points",
    icon: <Gift className="w-4 h-4" />,
    href: "/account/rewards",
  },
  {
    id: "referrals",
    label: "Referrals",
    icon: <Users className="w-4 h-4" />,
    href: "/account/referrals",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-4 h-4" />,
    href: "/account/notifications",
  },
  {
    id: "security",
    label: "Security",
    icon: <Shield className="w-4 h-4" />,
    href: "/account/security",
  },
];

const ProfileSchema = z.object({
  firstName: z.string().min(2, "Min 2 chars").max(50),
  lastName: z.string().min(2, "Min 2 chars").max(50),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Invalid phone")
    .optional()
    .or(z.literal("")),
  language: z.enum(["en", "ne", "hi"]),
  currency: z.enum(["NPR", "USD", "INR"]),
  darkMode: z.boolean(),
});
type ProfileFormData = z.infer<typeof ProfileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!session?.user) {
      router.push("/login?callbackUrl=/account/profile");
      return;
    }
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  const tierColors: Record<string, string> = {
    BRONZE: "from-amber-700 to-amber-500",
    SILVER: "from-slate-500 to-slate-400",
    GOLD: "from-amber-500 to-yellow-400",
    PLATINUM: "from-blue-600 to-blue-400",
  };
  const tierEmojis: Record<string, string> = {
    BRONZE: "🥉",
    SILVER: "🥈",
    GOLD: "🥇",
    PLATINUM: "💎",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Profile card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Banner */}
            <div
              className={cn(
                "h-20 bg-linear-to-r",
                tierColors[profile.loyaltyTier ?? "BRONZE"] ??
                  "from-blue-600 to-blue-400",
              )}
            />
            {/* Avatar + info */}
            <div className="px-5 pb-5 -mt-10">
              <div className="relative w-20 h-20 mb-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-900 bg-linear-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    (profile.firstName?.[0] ?? "U") +
                    (profile.lastName?.[0] ?? "")
                  )}
                </div>
                <label
                  htmlFor="av-upload"
                  className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow"
                  aria-label="Change avatar"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </label>
                <input
                  id="av-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      const res = await fetch("/api/user/avatar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ base64: ev.target?.result }),
                      });
                      const data = await res.json();
                      if (data.avatar) {
                        setProfile((p: any) => ({ ...p, avatar: data.avatar }));
                        toast.success("Photo updated!");
                      }
                    };
                    reader.readAsDataURL(f);
                  }}
                />
              </div>
              <h2 className="font-black text-gray-900 dark:text-white text-lg">
                {profile.name}
              </h2>
              <p className="text-sm text-gray-400 mb-3">{profile.email}</p>
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full text-white bg-linear-to-r",
                    tierColors[profile.loyaltyTier ?? "BRONZE"],
                  )}
                >
                  {tierEmojis[profile.loyaltyTier ?? "BRONZE"]}{" "}
                  {profile.loyaltyTier}
                </span>
                {profile.emailVerified && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-800 divide-x divide-gray-100 dark:divide-gray-800">
              {[
                { label: "Orders", value: profile._count?.orders ?? 0 },
                { label: "Reviews", value: profile._count?.reviews ?? 0 },
                {
                  label: "Wishlist",
                  value: profile._count?.wishlistItems ?? 0,
                },
              ].map((s) => (
                <div key={s.label} className="py-3 text-center">
                  <p className="text-lg font-black text-gray-900 dark:text-white">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty mini card */}
          <div className="bg-linear-to-r from-blue-600 to-blue-400 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-bold">
                  {profile.loyaltyPoints?.toLocaleString()} pts
                </span>
              </div>
              <Link
                href="/account/rewards"
                className="text-xs text-white/80 hover:text-white underline"
              >
                View
              </Link>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: "65%" }}
              />
            </div>
            <p className="text-xs text-white/70 mt-1">1,150 pts to Platinum</p>
          </div>

          {/* Nav */}
          <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0",
                  activeTab === item.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                )}
                onClick={() => setActiveTab(item.id)}
              >
                <span
                  className={
                    activeTab === item.id ? "text-blue-600" : "text-gray-400"
                  }
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                <ChevronRight
                  className={cn(
                    "w-3.5 h-3.5 transition-opacity",
                    activeTab === item.id
                      ? "opacity-100 text-blue-400"
                      : "opacity-30",
                  )}
                />
              </Link>
            ))}
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <div>
          <ProfileInfoTab profile={profile} onUpdate={setProfile} />
        </div>
      </div>
    </div>
  );
}

function ProfileInfoTab({
  profile,
  onUpdate,
}: {
  profile: any;
  onUpdate: (p: any) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      language: profile.language ?? "en",
      currency: profile.currency ?? "NPR",
      darkMode: profile.darkMode ?? false,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) {
      onUpdate((prev: any) => ({ ...prev, ...json.user }));
      toast.success("Profile saved!");
    } else toast.error(json.error ?? "Save failed");
  };

  return (
    <div className="space-y-5">
      {/* Personal info card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="font-black text-gray-900 dark:text-white">
            Personal Information
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "First Name *",
                name: "firstName",
                type: "text",
                placeholder: "Arun",
              },
              {
                label: "Last Name *",
                name: "lastName",
                type: "text",
                placeholder: "Kumar",
              },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  {...register(f.name as keyof ProfileFormData)}
                  className={fi(!!(errors as any)[f.name])}
                />
                {(errors as any)[f.name] && (
                  <p className="mt-1 text-xs text-red-500">
                    {(errors as any)[f.name]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Contact support to change your email address.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="tel"
                placeholder="+977 9800000000"
                {...register("phone")}
                className={cn("pl-10", fi(!!errors.phone))}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Language
              </label>
              <select {...register("language")} className={fi(false)}>
                <option value="en">🇬🇧 English</option>
                <option value="ne">🇳🇵 नेपाली</option>
                <option value="hi">🇮🇳 हिन्दी</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Currency
              </label>
              <select {...register("currency")} className={fi(false)}>
                <option value="NPR">🇳🇵 NPR (रू)</option>
                <option value="USD">🇺🇸 USD ($)</option>
                <option value="INR">🇮🇳 INR (₹)</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              {...register("darkMode")}
              className="w-4 h-4 accent-blue-600"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Dark Mode
              </p>
              <p className="text-xs text-gray-400">
                Enable dark theme across NexMart
              </p>
            </div>
          </label>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Account health */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="font-black text-gray-900 dark:text-white">
            Account Health
          </h2>
        </div>
        <div className="space-y-3">
          {[
            {
              label: "Email Verified",
              done: !!profile.emailVerified,
              action: !profile.emailVerified ? "Verify Now" : undefined,
            },
            {
              label: "Phone Added",
              done: !!profile.phone,
              action: !profile.phone ? "Add Phone" : undefined,
            },
            {
              label: "Profile Complete",
              done: !!(profile.firstName && profile.lastName),
              action: undefined,
            },
            { label: "Address Added", done: false, action: "Add Address" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center",
                    item.done
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-gray-100 dark:bg-gray-800",
                  )}
                >
                  {item.done ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-300" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    item.done
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-400",
                  )}
                >
                  {item.label}
                </span>
              </div>
              {item.action && (
                <button className="text-xs font-semibold text-blue-600 hover:underline">
                  {item.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-4">
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

const fi = (err: boolean) =>
  cn(
    "w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all",
    "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
    err
      ? "border-red-400 focus:border-red-500"
      : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30",
  );
