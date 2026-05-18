"use client";

import { useState } from "react";
import { toast } from "sonner";
import cn from "clsx";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "NexMart",
    siteTagline: "Nepal's AI-Powered Marketplace",
    supportEmail: "support@nexmart.com",
    commissionRate: 8,
    minWithdrawal: 500,
    maxWithdrawal: 500000,
    payoutCycle: 15,
    freeShippingThreshold: 1000,
    maintenanceMode: false,
    newSellerAuto: false,
    reviewModeration: true,
    loyaltyEnabled: true,
    affiliateEnabled: true,
    flashSaleEnabled: true,
  });

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved successfully!");
  };

  const toggle = (key: keyof typeof settings) =>
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof settings],
    }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="text-sm text-gray-400">
          Configure global platform behavior
        </p>
      </div>

      {[
        {
          title: "General",
          fields: [
            { label: "Site Name", key: "siteName", type: "text" },
            { label: "Tagline", key: "siteTagline", type: "text" },
            { label: "Support Email", key: "supportEmail", type: "email" },
          ],
        },
        {
          title: "Commerce",
          fields: [
            {
              label: "Platform Commission (%)",
              key: "commissionRate",
              type: "number",
            },
            {
              label: "Free Shipping Threshold (NPR)",
              key: "freeShippingThreshold",
              type: "number",
            },
            {
              label: "Min Withdrawal (NPR)",
              key: "minWithdrawal",
              type: "number",
            },
            {
              label: "Max Withdrawal (NPR)",
              key: "maxWithdrawal",
              type: "number",
            },
            {
              label: "Payout Cycle (days)",
              key: "payoutCycle",
              type: "number",
            },
          ],
        },
      ].map((section) => (
        <div
          key={section.title}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
        >
          <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            {section.title}
          </h2>
          <div className="space-y-4">
            {section.fields.map((f) => (
              <div
                key={f.key}
                className="grid grid-cols-[160px_1fr] gap-4 items-center"
              >
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  value={
                    settings[f.key as keyof typeof settings] as string | number
                  }
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      [f.key]:
                        f.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                    }))
                  }
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 max-w-xs"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Feature toggles */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          Feature Toggles
        </h2>
        <div className="space-y-3">
          {[
            {
              key: "maintenanceMode",
              label: "Maintenance Mode",
              desc: "Take the site offline for maintenance",
              danger: true,
            },
            {
              key: "newSellerAuto",
              label: "Auto-Approve Sellers",
              desc: "Skip manual review for new sellers",
            },
            {
              key: "reviewModeration",
              label: "Moderate Reviews",
              desc: "Require admin approval before publishing",
            },
            {
              key: "loyaltyEnabled",
              label: "Loyalty Program",
              desc: "Enable points & rewards system",
            },
            {
              key: "affiliateEnabled",
              label: "Affiliate System",
              desc: "Enable referral links and commissions",
            },
            {
              key: "flashSaleEnabled",
              label: "Flash Sales",
              desc: "Allow sellers to create flash sales",
            },
          ].map((f) => (
            <div key={f.key} className="flex items-center justify-between py-2">
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    f.danger ? "text-red-600" : "text-gray-900 dark:text-white",
                  )}
                >
                  {f.label}
                </p>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
              <button
                onClick={() => toggle(f.key as keyof typeof settings)}
                role="switch"
                aria-checked={
                  settings[f.key as keyof typeof settings] as boolean
                }
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative  shrink-0",
                  settings[f.key as keyof typeof settings]
                    ? f.danger
                      ? "bg-red-500"
                      : "bg-blue-600"
                    : "bg-gray-200 dark:bg-gray-700",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    settings[f.key as keyof typeof settings]
                      ? "translate-x-6"
                      : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : null}
        {saving ? "Saving..." : "Save All Settings"}
      </button>
    </div>
  );
}
