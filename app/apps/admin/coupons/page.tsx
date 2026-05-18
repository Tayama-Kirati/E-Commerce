"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import cn from "clsx";

const CouponSchema = z.object({
  code: z.string().min(3).max(20),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().positive(),
  minOrderAmount: z.number().optional(),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().int().optional(),
  perUserLimit: z.number().int().default(1),
  startsAt: z.string().min(1),
  expiresAt: z.string().min(1),
  appliesToAll: z.boolean().default(true),
});
type CouponForm = z.infer<typeof CouponSchema>;

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof CouponSchema>, unknown, CouponForm>({
    resolver: zodResolver(CouponSchema),
  });

  const watchType = watch("type");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data.coupons ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const mock = [
    {
      id: "1",
      code: "WELCOME20",
      type: "PERCENTAGE",
      value: 20,
      description: "New user discount",
      usageCount: 234,
      usageLimit: 1000,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
    {
      id: "2",
      code: "FLASH50",
      type: "FIXED",
      value: 500,
      description: "Flash deal",
      usageCount: 891,
      usageLimit: 500,
      isActive: true,
      expiresAt: new Date(Date.now() + 2 * 86400000),
    },
    {
      id: "3",
      code: "FREESHIP",
      type: "FREE_SHIPPING",
      value: 0,
      description: "Free delivery",
      usageCount: 1203,
      usageLimit: null,
      isActive: true,
      expiresAt: new Date(Date.now() + 31 * 86400000),
    },
    {
      id: "4",
      code: "SAVE15",
      type: "PERCENTAGE",
      value: 15,
      description: "Loyalty offer",
      usageCount: 445,
      usageLimit: 200,
      isActive: false,
      expiresAt: new Date(Date.now() - 86400000),
    },
  ];

  const items = coupons.length ? coupons : mock;

  const onSubmit = async (data: CouponForm) => {
    const res = await fetch(
      "/api/admin/coupons" + (editId ? `/${editId}` : ""),
      {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    if (res.ok) {
      toast.success(editId ? "Coupon updated!" : "Coupon created!");
      setShowForm(false);
      setEditId(null);
      reset();
      load();
    } else toast.error("Failed to save coupon");
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    toast.success(isActive ? "Coupon deactivated" : "Coupon activated");
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">
            Coupons
          </h1>
          <p className="text-sm text-gray-400">{items.length} coupons</p>
        </div>
        <button
          onClick={() => {
            reset();
            setEditId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Create Coupon
        </button>
      </div>

      {/* Coupon grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((c) => {
          const isExpired = new Date(c.expiresAt) < new Date();
          const usagePct = c.usageLimit
            ? Math.round((c.usageCount / c.usageLimit) * 100)
            : 0;
          return (
            <div
              key={c.id}
              className={cn(
                "bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden transition-all",
                !c.isActive || isExpired
                  ? "border-gray-100 dark:border-gray-800 opacity-70"
                  : "border-blue-200 dark:border-blue-800 shadow-sm shadow-blue-50 dark:shadow-blue-900/10",
              )}
            >
              {/* Dashed divider decoration */}
              <div className="h-2 bg-linear-to-r from-blue-600 to-blue-400" />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <code className="text-lg font-black text-blue-600 tracking-widest">
                    {c.code}
                  </code>
                  <div className="flex gap-1">
                    {!c.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                        Inactive
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                        Expired
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3 line-clamp-1">
                  {c.description || "No description"}
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 mb-3 text-center">
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {c.type === "PERCENTAGE"
                      ? `${c.value}% OFF`
                      : c.type === "FIXED"
                        ? `रू ${c.value} OFF`
                        : "FREE SHIPPING"}
                  </p>
                </div>

                {c.usageLimit && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{c.usageCount} used</span>
                      <span>{c.usageLimit} limit</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-3">
                  Expires {new Date(c.expiresAt).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(c.id, c.isActive)}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                      c.isActive
                        ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        : "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 text-green-700",
                    )}
                  >
                    {c.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => {
                      toast("Edit coupon form");
                    }}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {editId ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    {...register("code")}
                    className={fin(!!errors.code)}
                    placeholder="WELCOME20"
                    style={{ textTransform: "uppercase" }}
                  />
                  {errors.code && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.code.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Discount Type *
                  </label>
                  <select {...register("type")} className={fin(false)}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (NPR)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
              </div>
              {watchType !== "FREE_SHIPPING" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {watchType === "PERCENTAGE"
                        ? "Discount %"
                        : "Discount Amount (NPR)"}{" "}
                      *
                    </label>
                    <input
                      type="number"
                      {...register("value", { valueAsNumber: true })}
                      className={fin(!!errors.value)}
                      placeholder={watchType === "PERCENTAGE" ? "20" : "500"}
                    />
                  </div>
                  {watchType === "PERCENTAGE" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Max Discount (NPR)
                      </label>
                      <input
                        type="number"
                        {...register("maxDiscount", { valueAsNumber: true })}
                        className={fin(false)}
                        placeholder="2000"
                      />
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <input
                  {...register("description")}
                  className={fin(false)}
                  placeholder="Internal note about this coupon"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Min. Order (NPR)
                  </label>
                  <input
                    type="number"
                    {...register("minOrderAmount", { valueAsNumber: true })}
                    className={fin(false)}
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    {...register("usageLimit", { valueAsNumber: true })}
                    className={fin(false)}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Starts At *
                  </label>
                  <input
                    type="datetime-local"
                    {...register("startsAt")}
                    className={fin(!!errors.startsAt)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Expires At *
                  </label>
                  <input
                    type="datetime-local"
                    {...register("expiresAt")}
                    className={fin(!!errors.expiresAt)}
                  />
                  {errors.expiresAt && (
                    <p className="text-xs text-red-500 mt-1">Required</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {editId ? "Update" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const fin = (hasError: boolean) =>
  cn(
    "w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all",
    "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
    hasError
      ? "border-red-400"
      : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30",
  );
