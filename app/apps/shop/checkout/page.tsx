"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MapPin,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  Truck,
  Zap,
  Shield,
  Tag,
  Gift,
  Lock,
  Info,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn, formatPrice } from "@/app/lib/utils";
import { useCartStore } from "@/app/store/cartStore";
import { toast } from "react-hot-toast";

type Step = "address" | "payment" | "review" | "confirmed";

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "address", label: "Address", icon: <MapPin className="w-4 h-4" /> },
  { id: "payment", label: "Payment", icon: <CreditCard className="w-4 h-4" /> },
  { id: "review", label: "Review", icon: <CheckCircle className="w-4 h-4" /> },
  { id: "confirmed", label: "Done", icon: <CheckCircle className="w-4 h-4" /> },
];

const AddressSchema = z.object({
  label: z.enum(["Home", "Work", "Other"]),
  fullName: z.string().min(2),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  street: z.string().min(5),
  city: z.string().min(2),
  district: z.string().min(2),
  province: z.string().min(2),
  country: z.string().default("Nepal"),
  postalCode: z.string().optional(),
  saveAddress: z.boolean().default(true),
});
type AddressForm = z.input<typeof AddressSchema>;

type PaymentMethod =
  | "KHALTI"
  | "ESEWA"
  | "STRIPE"
  | "CASH_ON_DELIVERY"
  | "WALLET";

const DISTRICTS = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Kavre",
  "Sindhupalchok",
  "Pokhara",
  "Chitwan",
  "Butwal",
  "Biratnagar",
  "Dharan",
];

const PROVINCES = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, summary, itemCount, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>("address");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<any>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("KHALTI");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [placing, setPlacing] = useState(false);

  const subtotal = summary.subtotal;
  const shipping = subtotal >= 1000 ? 0 : 150;
  const pointDiscount = redeemPoints
    ? Math.min(loyaltyPoints / 10, subtotal * 0.1)
    : 0;
  const grandTotal = Math.max(
    0,
    subtotal + shipping - couponDiscount - pointDiscount,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddressForm>({
    resolver: zodResolver(AddressSchema),
    defaultValues: { label: "Home", country: "Nepal", saveAddress: true },
  });

  useEffect(() => {
    if (!session?.user) {
      router.push("/login?callbackUrl=/checkout");
      return;
    }
    if (itemCount() === 0) {
      router.push("/cart");
      return;
    }

    // Load saved addresses & loyalty points
    Promise.all([
      fetch("/api/user/addresses").then((r) => r.json()),
      fetch("/api/user/loyalty").then((r) => r.json()),
    ]).then(([addrData, loyaltyData]) => {
      setSavedAddresses(addrData.addresses ?? []);
      setLoyaltyPoints(loyaltyData.points ?? 0);
      const defaultAddr =
        addrData.addresses?.find((a: any) => a.isDefault) ??
        addrData.addresses?.[0];
      if (defaultAddr) setSelectedAddr(defaultAddr);
      else setAddingNew(true);
    });
  }, [session]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, orderAmount: subtotal }),
    });
    const data = await res.json();
    if (res.ok) {
      setCouponDiscount(data.discount);
      setCouponApplied(true);
      toast.success(`Coupon applied! Saved ${formatPrice(data.discount)}`);
    } else {
      toast.error(data.error ?? "Invalid coupon");
    }
  };

  const saveNewAddress = async (data: AddressForm) => {
    const { saveAddress, ...rest } = data;
    let addr: any = rest;
    if (saveAddress) {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      addr = (await res.json()).address;
      setSavedAddresses((prev) => [...prev, addr]);
    }
    setSelectedAddr(addr);
    setAddingNew(false);
    setStep("payment");
  };

  const placeOrder = async () => {
    if (!selectedAddr) {
      toast.error("Please select a delivery address");
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddr.id,
          paymentMethod,
          couponCode: couponApplied ? couponCode : undefined,
          pointsToRedeem: redeemPoints ? Math.floor(loyaltyPoints * 0.1) : 0,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Order failed.");
        setPlacing(false);
        return;
      }

      setOrderId(data.order.id);
      setOrderNumber(data.order.orderNumber);

      // For digital payments, redirect to gateway
      if (paymentMethod !== "CASH_ON_DELIVERY" && data.requiresPayment) {
        const gateway =
          paymentMethod === "KHALTI"
            ? "khalti"
            : paymentMethod === "ESEWA"
              ? "esewa"
              : "stripe";
        const payRes = await fetch(`/api/payments/${gateway}/initiate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.order.id }),
        });
        const payData = await payRes.json();
        if (payData.paymentUrl) {
          window.location.href = payData.paymentUrl;
          return;
        }
      }

      clearCart();
      setStep("confirmed");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const progressPct = (stepIndex / (STEPS.length - 1)) * 100;

  if (items.length === 0 && step !== "confirmed") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors mt-4"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Progress bar */}
      {step !== "confirmed" && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.slice(0, 3).map((s, i) => (
              <React.Fragment key={s.id}>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    i <= stepIndex ? "text-blue-600" : "text-gray-400",
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                      i < stepIndex
                        ? "bg-blue-600 text-white"
                        : i === stepIndex
                          ? "bg-blue-600 text-white ring-4 ring-blue-100"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400",
                    )}
                  >
                    {i < stepIndex ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold hidden sm:block",
                      i === stepIndex ? "text-blue-600" : "",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className="flex-1 mx-3 h-0.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <div
                      className={cn(
                        "h-full bg-blue-600 transition-all duration-500 rounded-full",
                        i < stepIndex ? "w-full" : "w-0",
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* ── Left panel ── */}
        <div>
          {/* STEP 1: Address */}
          {step === "address" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" /> Delivery Address
              </h2>

              {/* Saved addresses */}
              {savedAddresses.length > 0 && !addingNew && (
                <div className="space-y-3 mb-5">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={cn(
                        "flex gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all",
                        selectedAddr?.id === addr.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300",
                      )}
                    >
                      <input
                        type="radio"
                        name="addr"
                        checked={selectedAddr?.id === addr.id}
                        onChange={() => setSelectedAddr(addr)}
                        className="mt-1 accent-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 px-2 py-0.5 rounded-full">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-xs text-gray-400">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {addr.fullName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {addr.street}, {addr.city}, {addr.district}
                        </p>
                        <p className="text-sm text-gray-500">
                          {addr.province}, {addr.country}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          📞 {addr.phone}
                        </p>
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => setAddingNew(true)}
                    className="flex items-center gap-2 w-full p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add New Address
                  </button>
                </div>
              )}

              {/* New address form */}
              {(addingNew || savedAddresses.length === 0) && (
                <form
                  onSubmit={handleSubmit(saveNewAddress)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {(["Home", "Work", "Other"] as const).map((label) => (
                      <label
                        key={label}
                        className={cn(
                          "flex items-center justify-center gap-1.5 p-2.5 border-2 rounded-xl cursor-pointer text-sm font-semibold transition-all",
                          "border-gray-200 dark:border-gray-700 hover:border-blue-400",
                        )}
                      >
                        <input
                          type="radio"
                          value={label}
                          {...register("label")}
                          className="sr-only"
                        />
                        {label === "Home"
                          ? "🏠"
                          : label === "Work"
                            ? "🏢"
                            : "📍"}{" "}
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        {...register("fullName")}
                        className={inputCls(!!errors.fullName)}
                        placeholder="Arun Kumar"
                      />
                      {errors.fullName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Phone *
                      </label>
                      <input
                        {...register("phone")}
                        className={inputCls(!!errors.phone)}
                        placeholder="+977 9800000000"
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Street Address *
                    </label>
                    <input
                      {...register("street")}
                      className={inputCls(!!errors.street)}
                      placeholder="Ward No., Locality, Street"
                    />
                    {errors.street && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.street.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        City *
                      </label>
                      <input
                        {...register("city")}
                        className={inputCls(!!errors.city)}
                        placeholder="Kathmandu"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        District *
                      </label>
                      <select
                        {...register("district")}
                        className={inputCls(!!errors.district)}
                      >
                        <option value="">Select district</option>
                        {DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Province *
                      </label>
                      <select
                        {...register("province")}
                        className={inputCls(!!errors.province)}
                      >
                        <option value="">Select province</option>
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Postal Code
                      </label>
                      <input
                        {...register("postalCode")}
                        className={inputCls(false)}
                        placeholder="44600"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("saveAddress")}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Save this address for future orders
                    </span>
                  </label>

                  <div className="flex gap-3 pt-2">
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingNew(false);
                          reset();
                        }}
                        className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : null}
                      Save & Continue
                    </button>
                  </div>
                </form>
              )}

              {/* Continue from saved address */}
              {selectedAddr && !addingNew && (
                <button
                  onClick={() => setStep("payment")}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors mt-4"
                >
                  Continue to Payment <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === "payment" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> Payment
                Method
              </h2>

              <div className="space-y-3 mb-6">
                {[
                  {
                    id: "KHALTI" as PaymentMethod,
                    name: "Khalti",
                    desc: "Pay securely with Khalti digital wallet",
                    logo: "🟣",
                    badge: "Recommended",
                    color:
                      "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                  },
                  {
                    id: "ESEWA" as PaymentMethod,
                    name: "eSewa",
                    desc: "Pay with Nepal's most popular digital wallet",
                    logo: "🟢",
                    badge: null,
                    color: "border-green-500 bg-green-50 dark:bg-green-900/20",
                  },
                  {
                    id: "STRIPE" as PaymentMethod,
                    name: "Card (Visa / Mastercard)",
                    desc: "Debit or credit card — secured by Stripe",
                    logo: "💳",
                    badge: null,
                    color: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                  },
                  {
                    id: "CASH_ON_DELIVERY" as PaymentMethod,
                    name: "Cash on Delivery",
                    desc: "Pay when your order arrives at your door",
                    logo: "💵",
                    badge: null,
                    color: "border-amber-500 bg-amber-50 dark:bg-amber-900/20",
                  },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={cn(
                      "flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all",
                      paymentMethod === method.id
                        ? method.color
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                      {method.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {method.name}
                        </span>
                        {method.badge && (
                          <span className="text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {method.desc}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        paymentMethod === method.id
                          ? "border-blue-600"
                          : "border-gray-300",
                      )}
                    >
                      {paymentMethod === method.id && (
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Coupon */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" /> Coupon Code
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    disabled={couponApplied}
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-60"
                  />
                  {couponApplied ? (
                    <button
                      onClick={() => {
                        setCouponApplied(false);
                        setCouponCode("");
                        setCouponDiscount(0);
                      }}
                      className="px-4 py-2.5 bg-red-100 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {couponApplied && (
                  <p className="text-xs text-green-600 font-semibold mt-2">
                    ✅ Saved {formatPrice(couponDiscount)}!
                  </p>
                )}
              </div>

              {/* Loyalty points */}
              {loyaltyPoints > 0 && (
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-6">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Use Loyalty Points
                        </p>
                        <p className="text-xs text-gray-400">
                          You have {loyaltyPoints} pts · worth{" "}
                          {formatPrice(loyaltyPoints / 10)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {redeemPoints && (
                        <span className="text-xs font-bold text-green-600">
                          -{formatPrice(pointDiscount)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setRedeemPoints((v) => !v)}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative",
                          redeemPoints
                            ? "bg-blue-600"
                            : "bg-gray-200 dark:bg-gray-700",
                        )}
                        role="switch"
                        aria-checked={redeemPoints}
                      >
                        <div
                          className={cn(
                            "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                            redeemPoints ? "translate-x-5" : "translate-x-0.5",
                          )}
                        />
                      </button>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("address")}
                  className="flex items-center gap-1 px-5 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep("review")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Review Order <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === "review" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" /> Review Your
                Order
              </h2>

              {/* Delivery address summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Delivering to
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedAddr?.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedAddr?.street}, {selectedAddr?.city},{" "}
                      {selectedAddr?.district}
                    </p>
                    <p className="text-sm text-gray-500">
                      📞 {selectedAddr?.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("address")}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Payment method summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Payment
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {paymentMethod === "KHALTI"
                        ? "🟣 Khalti"
                        : paymentMethod === "ESEWA"
                          ? "🟢 eSewa"
                          : paymentMethod === "STRIPE"
                            ? "💳 Card"
                            : "💵 Cash on Delivery"}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("payment")}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Order Items ({itemCount()})
                </h3>
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex gap-3"
                  >
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="object-cover"
                        />
                      ) : (
                        "🛍️"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-blue-600 shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Estimated delivery */}
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-5">
                <Truck className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Estimated Delivery in 2-3 days
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    {new Date(Date.now() + 3 * 86400000).toLocaleDateString(
                      "en-NP",
                      { weekday: "long", month: "long", day: "numeric" },
                    )}
                  </p>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex gap-4 mb-6 flex-wrap text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-green-500" />
                  Buyer Protection
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-500" />
                  Secure Checkout
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Fast Delivery
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("payment")}
                  className="flex items-center gap-1 px-5 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 active:scale-[0.98] transition-all"
                >
                  {placing ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {placing
                    ? "Placing Order..."
                    : `Place Order · ${formatPrice(grandTotal)}`}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                <Info className="w-3.5 h-3.5" />
                By placing your order you agree to our Terms of Service
              </p>
            </div>
          )}

          {/* STEP 4: Confirmed */}
          {step === "confirmed" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Order Confirmed! 🎉
              </h2>
              <p className="text-gray-500 mb-2">
                Your order has been placed successfully.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 mb-6 inline-block">
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="text-2xl font-black text-blue-600 tracking-wider">
                  {orderNumber}
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                We&apos;ll send a confirmation to your email with tracking
                details.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  href={`/track?order=${orderId}`}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Track Order
                </Link>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Order Summary (right) ── */}
        {step !== "confirmed" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h3>
              {/* Items compact */}
              <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex items-center gap-2"
                  >
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0 text-lg overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        "🛍️"
                      )}
                    </div>
                    <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white  shrink-0">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span
                    className={
                      shipping === 0
                        ? "text-green-600 font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }
                  >
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({couponCode})</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                {pointDiscount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Loyalty Points</span>
                    <span>-{formatPrice(pointDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-blue-600">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>
              {/* Trust */}
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 space-y-2">
                {[
                  { icon: "🔒", text: "256-bit SSL Encrypted" },
                  { icon: "↩️", text: "7-Day Easy Returns" },
                  { icon: "🛡️", text: "100% Buyer Protection" },
                ].map((t) => (
                  <div
                    key={t.text}
                    className="flex items-center gap-2 text-xs text-gray-400"
                  >
                    <span>{t.icon}</span>
                    {t.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  cn(
    "w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30",
  );
