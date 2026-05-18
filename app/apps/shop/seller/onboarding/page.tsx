// Multi-step seller onboarding flow
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Store,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Building,
  CreditCard,
  MapPin,
  FileText,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Users,
  Package,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { toast } from "react-hot-toast";


const Step1Schema = z.object({
  storeName: z.string().min(3, "At least 3 characters").max(100),
  storeDescription: z.string().min(20, "At least 20 characters").max(1000),
  category: z.string().min(1, "Select a primary category"),
  city: z.string().min(2),
  district: z.string().min(2),
  province: z.string().min(2),
});

const Step2Schema = z.object({
  businessName: z.string().min(2),
  businessRegNo: z.string().optional(),
  panNumber: z.string().optional(),
});

const Step3Schema = z.object({
  bankName: z.string().min(2),
  bankAccount: z.string().min(8, "Enter valid account number"),
  bankBranch: z.string().optional(),
});

const Step4Schema = z.object({
  acceptPolicy: z.literal(true, {
    error: () => ({ message: "You must accept the policy" }),
  }),
});

type Step1 = z.infer<typeof Step1Schema>;
type Step2 = z.infer<typeof Step2Schema>;
type Step3 = z.infer<typeof Step3Schema>;
type Step4 = z.infer<typeof Step4Schema>;

const STEPS = [
  { id: 1, label: "Store Info", icon: <Store className="w-4 h-4" /> },
  { id: 2, label: "Business", icon: <Building className="w-4 h-4" /> },
  { id: 3, label: "Bank Details", icon: <CreditCard className="w-4 h-4" /> },
  { id: 4, label: "Agreement", icon: <FileText className="w-4 h-4" /> },
];

const DISTRICTS = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Kavre",
  "Pokhara",
  "Chitwan",
  "Butwal",
  "Biratnagar",
  "Dharan",
  "Birgunj",
  "Janakpur",
  "Dhangadhi",
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
const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Health & Beauty",
  "Sports",
  "Books",
  "Automotive",
  "Kids & Baby",
  "Grocery",
  "Handmade & Crafts",
];
const BANKS = [
  "NIC Asia Bank",
  "Himalayan Bank",
  "Nepal Investment Bank",
  "Nabil Bank",
  "Standard Chartered",
  "Kumari Bank",
  "Laxmi Bank",
  "Siddhartha Bank",
  "Global IME Bank",
  "Sanima Bank",
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [submitting, setSub] = useState(false);
  const [formData, setFormData] = useState<
    Partial<Step1 & Step2 & Step3 & Step4>
  >({});

  const step1 = useForm<Step1>({
    resolver: zodResolver(Step1Schema),
    defaultValues: formData,
  });
  const step2 = useForm<Step2>({
    resolver: zodResolver(Step2Schema),
    defaultValues: formData,
  });
  const step3 = useForm<Step3>({
    resolver: zodResolver(Step3Schema),
    defaultValues: formData,
  });
  const step4 = useForm<Step4>({ resolver: zodResolver(Step4Schema) });

  const next = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((s) => s + 1);
  };

  const submit = async (data: Step4) => {
    const payload = { ...formData, ...data };
    setSub(true);
    try {
      const res = await fetch("/api/seller/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Submission failed");
        return;
      }
      setDone(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSub(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen  bg-linear-to-br from-blue-50 via-white to-blue-400 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
            Application Submitted! 🎉
          </h1>
          <p className="text-gray-500 mb-2 text-lg">
            Welcome to the NexMart seller community!
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Our team will review your application within{" "}
            <strong>24–48 hours</strong>. You'll receive an email and
            notification once approved.
          </p>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-6 text-left space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white">
              What happens next?
            </h3>
            {[
              "Our team verifies your business documents",
              "Account gets approved (24–48 hrs)",
              "You gain access to the Seller Dashboard",
              "List your first product and start selling!",
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400"
              >
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs shrink-0 mt-0.5">
                  {i + 1}
                </div>
                {s}
              </div>
            ))}
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-linear-to-br from-blue-50 via-white to-blue-400 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9  bg-linear-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white font-black">
              N
            </div>
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              Nex<span className="text-blue-600">Mart</span>
            </span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            Start Selling on NexMart
          </h1>
          <p className="text-gray-500">
            Join 85,000+ sellers reaching millions of customers across Nepal
          </p>

          {/* Benefits */}
          <div className="flex gap-6 justify-center mt-6 flex-wrap">
            {[
              {
                icon: <TrendingUp className="w-4 h-4" />,
                label: "0% commission first 3 months",
              },
              {
                icon: <Users className="w-4 h-4" />,
                label: "3M+ active buyers",
              },
              {
                icon: <Package className="w-4 h-4" />,
                label: "Free logistics support",
              },
              {
                icon: <ShieldCheck className="w-4 h-4" />,
                label: "Guaranteed payments",
              },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2"
              >
                <span className="text-blue-600">{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                    step > s.id
                      ? "bg-blue-600 text-white"
                      : step === s.id
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30 scale-110"
                        : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400",
                  )}
                >
                  {step > s.id ? <CheckCircle className="w-5 h-5" /> : s.icon}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    step === s.id ? "text-blue-600" : "text-gray-400",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mb-4 sm:mb-0 rounded-full transition-colors duration-300",
                    step > s.id
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700",
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-blue-100/30 dark:shadow-none overflow-hidden">
          {/* Step 1 — Store Info */}
          {step === 1 && (
            <form onSubmit={step1.handleSubmit(next)} className="p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" /> Store Information
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Tell customers about your store.
              </p>
              <div className="space-y-5">
                <FormRow>
                  <Field
                    label="Store Name *"
                    error={step1.formState.errors.storeName?.message}
                  >
                    <input
                      {...step1.register("storeName")}
                      className={fld(!!step1.formState.errors.storeName)}
                      placeholder="e.g. TechStore Nepal"
                    />
                  </Field>
                  <Field
                    label="Primary Category *"
                    error={step1.formState.errors.category?.message}
                  >
                    <select
                      {...step1.register("category")}
                      className={fld(!!step1.formState.errors.category)}
                    >
                      <option value="">Choose main category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                </FormRow>
                <Field
                  label="Store Description *"
                  error={step1.formState.errors.storeDescription?.message}
                >
                  <textarea
                    {...step1.register("storeDescription")}
                    rows={4}
                    placeholder="Describe what you sell, your speciality, return policy..."
                    className={
                      fld(!!step1.formState.errors.storeDescription) +
                      " resize-none"
                    }
                  />
                </Field>
                <FormRow>
                  <Field
                    label="City *"
                    error={step1.formState.errors.city?.message}
                  >
                    <input
                      {...step1.register("city")}
                      className={fld(!!step1.formState.errors.city)}
                      placeholder="Kathmandu"
                    />
                  </Field>
                  <Field
                    label="District *"
                    error={step1.formState.errors.district?.message}
                  >
                    <select
                      {...step1.register("district")}
                      className={fld(!!step1.formState.errors.district)}
                    >
                      <option value="">Select district</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Province *"
                    error={step1.formState.errors.province?.message}
                  >
                    <select
                      {...step1.register("province")}
                      className={fld(!!step1.formState.errors.province)}
                    >
                      <option value="">Select province</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Field>
                </FormRow>
              </div>
              <StepFooter showBack={false} submitting={false} />
            </form>
          )}

          {/* Step 2 — Business Info */}
          {step === 2 && (
            <form onSubmit={step2.handleSubmit(next)} className="p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" /> Business
                Details
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Help us verify your identity. Optional fields can be filled
                later.
              </p>
              <div className="space-y-5">
                <Field
                  label="Business / Registered Name *"
                  error={step2.formState.errors.businessName?.message}
                >
                  <input
                    {...step2.register("businessName")}
                    className={fld(!!step2.formState.errors.businessName)}
                    placeholder="Your legal business name"
                  />
                </Field>
                <FormRow>
                  <Field
                    label="Business Registration No."
                    error={step2.formState.errors.businessRegNo?.message}
                  >
                    <input
                      {...step2.register("businessRegNo")}
                      className={fld(false)}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field
                    label="PAN / VAT Number"
                    error={step2.formState.errors.panNumber?.message}
                  >
                    <input
                      {...step2.register("panNumber")}
                      className={fld(false)}
                      placeholder="Optional but recommended"
                    />
                  </Field>
                </FormRow>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    💡 Sellers with PAN/VAT numbers get higher trust badges and
                    are prioritized in search results.
                  </p>
                </div>
              </div>
              <StepFooter onBack={() => setStep(1)} submitting={false} />
            </form>
          )}

          {/* Step 3 — Bank Details */}
          {step === 3 && (
            <form onSubmit={step3.handleSubmit(next)} className="p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> Bank Account
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Earnings will be sent to this account every 15 days.
              </p>
              <div className="space-y-5">
                <FormRow>
                  <Field
                    label="Bank Name *"
                    error={step3.formState.errors.bankName?.message}
                  >
                    <select
                      {...step3.register("bankName")}
                      className={fld(!!step3.formState.errors.bankName)}
                    >
                      <option value="">Select bank</option>
                      {BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Account Number *"
                    error={step3.formState.errors.bankAccount?.message}
                  >
                    <input
                      {...step3.register("bankAccount")}
                      className={fld(!!step3.formState.errors.bankAccount)}
                      placeholder="Your account number"
                    />
                  </Field>
                </FormRow>
                <Field label="Branch Name / Location">
                  <input
                    {...step3.register("bankBranch")}
                    className={fld(false)}
                    placeholder="e.g. Kathmandu - New Road"
                  />
                </Field>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    🔒 Your bank details are encrypted and only used for
                    payouts. We never charge without your permission.
                  </p>
                </div>
              </div>
              <StepFooter onBack={() => setStep(2)} submitting={false} />
            </form>
          )}

          {/* Step 4 — Agreement */}
          {step === 4 && (
            <form onSubmit={step4.handleSubmit(submit)} className="p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Seller
                Agreement
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Review and accept our seller terms before submitting.
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 h-52 overflow-y-auto mb-5 text-sm text-gray-600 dark:text-gray-300 space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  NexMart Seller Agreement
                </h3>
                <p>
                  By registering as a seller on NexMart, you agree to the
                  following terms:
                </p>
                <p>
                  <strong>1. Product Authenticity</strong> — You warrant that
                  all products listed are genuine, accurately described, and
                  lawfully owned/distributed by you.
                </p>
                <p>
                  <strong>2. Order Fulfillment</strong> — You agree to ship
                  orders within 48 hours of confirmation and maintain an on-time
                  delivery rate of at least 90%.
                </p>
                <p>
                  <strong>3. Returns & Refunds</strong> — You accept NexMart's
                  7-day return policy and will process approved refunds within 3
                  business days.
                </p>
                <p>
                  <strong>4. Commission & Fees</strong> — NexMart charges an 8%
                  commission on completed sales. Payouts are processed every 15
                  days.
                </p>
                <p>
                  <strong>5. Prohibited Items</strong> — Counterfeit goods,
                  illegal items, weapons, and adult content are strictly
                  prohibited.
                </p>
                <p>
                  <strong>6. Account Suspension</strong> — NexMart reserves the
                  right to suspend accounts for policy violations, fraudulent
                  activity, or persistent low ratings.
                </p>
                <p>
                  <strong>7. Data Use</strong> — Seller performance data may be
                  used to improve platform recommendations and search rankings.
                </p>
                <p>Last updated: January 2025</p>
              </div>

              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...step4.register("acceptPolicy")}
                    className="w-5 h-5 mt-0.5 accent-blue-600 shrink-0"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    I have read and agree to the{" "}
                    <Link
                      href="/seller/terms"
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Seller Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    . I confirm that all information provided is accurate.
                  </span>
                </label>
                {step4.formState.errors.acceptPolicy && (
                  <p className="text-xs text-red-500 mt-2">
                    {step4.formState.errors.acceptPolicy.message}
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
                  Application Summary
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: "Store", value: formData.storeName },
                    { label: "Category", value: formData.category },
                    {
                      label: "Location",
                      value: `${formData.city}, ${formData.district}`,
                    },
                    { label: "Bank", value: formData.bankName },
                  ].map((r) => (
                    <div key={r.label}>
                      <span className="text-gray-400 text-xs">{r.label}</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {r.value ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <StepFooter
                onBack={() => setStep(3)}
                submitting={submitting}
                submitLabel="Submit Application"
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared form components ────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-4 flex-col sm:flex-row">{children}</div>;
}

function StepFooter({
  onBack,
  submitting,
  submitLabel = "Continue",
  showBack = true,
}: {
  onBack?: () => void;
  submitting: boolean;
  submitLabel?: string;
  showBack?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-8">
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98] transition-all"
      >
        {submitting ? (
          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : null}
        {submitLabel} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

const fld = (hasError: boolean) =>
  cn(
    "w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all",
    "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30",
  );
