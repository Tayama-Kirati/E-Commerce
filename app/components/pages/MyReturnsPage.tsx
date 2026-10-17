"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useUIStore, useAuthStore, apiGet } from "@/app/lib/store";

import { EmojiIcon } from "@/app/components/ui/EmojiIcon";
const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const MUTED    = "var(--color-muted)";
const IVORY    = "var(--color-surface-warm)";
const GREEN    = "#16A34A";

// ─── Progress steps ───────────────────────────────────────────────────────────

const RETURN_STEPS = [
  "We have received your return request",
  "Pending Pick Up",
  "Your return package is on its way to our logistics facility",
  "Return Package Received",
  "Refund processing",
  "Your refund has been approved",
];

const CANCEL_STEPS = [
  "Cancellation requested",
  "Seller notified",
  "Cancellation approved",
  "Refund processing",
  "Refund approved",
];

type ReturnItem = {
  id: string;
  type: "return" | "cancellation";
  orderId: string;
  raCode: string;
  returnedOn: string;
  refundMethod: string;
  statusStep: number;
  statusNote: string;
  statusNoteDate: string;
  product: { name: string; image: string | null; price: number; qty: number; reason: string };
};

// ─── Status label helper ──────────────────────────────────────────────────────

function statusLabel(type: string, step: number, steps: string[]) {
  return steps[step] ?? steps[steps.length - 1];
}

// ─── Progress Tracker ─────────────────────────────────────────────────────────

function ProgressTracker({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="overflow-x-auto py-4">
      <div className="flex items-start min-w-max px-2">
        {steps.map((label, i) => {
          const done    = i < currentStep;
          const active  = i === currentStep;
          const dotColor = done ? GREEN : active ? GREEN : "#D1D5DB";
          const lineColor = done ? GREEN : "#D1D5DB";

          return (
            <div key={i} className="flex items-start">
              {/* Step node */}
              <div className="flex flex-col items-center" style={{ width: 100 }}>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor: dotColor,
                    backgroundColor: done ? GREEN : active ? "#fff" : "#fff",
                  }}
                >
                  {done && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
                <p
                  className="text-center mt-2 leading-tight"
                  style={{
                    fontSize: 11,
                    color: done || active ? CHARCOAL : MUTED,
                    fontWeight: active ? 700 : 400,
                    width: 90,
                  }}
                >
                  {label}
                </p>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className="h-0.5 shrink-0 mt-2.5"
                  style={{ width: 48, backgroundColor: lineColor }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Return Detail View ───────────────────────────────────────────────────────

function ReturnDetail({ item, onBack }: { item: ReturnItem; onBack: () => void }) {
  const steps = item.type === "return" ? RETURN_STEPS : CANCEL_STEPS;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold mb-5 transition-colors"
        style={{ color: GOLD }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        {item.type === "return" ? "My Returns" : "My Cancellations"}
      </button>

      <h1 className="text-2xl font-black mb-5" style={{ color: CHARCOAL }}>
        {item.type === "return" ? "Return Details" : "Cancellation Details"}
      </h1>

      <div className="bg-white dark:bg-[#1A1814] rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>

        {/* Meta row */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="space-y-0.5">
            <p className="text-sm" style={{ color: MUTED }}>
              {item.type === "return" ? "Returned on" : "Cancelled on"}{" "}
              <span className="font-semibold" style={{ color: CHARCOAL }}>{item.returnedOn}</span>
            </p>
            <p className="text-sm">
              Order{" "}
              <span className="font-bold" style={{ color: GOLD }}>#{item.orderId}</span>
            </p>
            <p className="text-sm" style={{ color: MUTED }}>
              {item.type === "return" ? "RA Code:" : "Cancellation Code:"}{" "}
              <span style={{ color: CHARCOAL }}>{item.raCode}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                className="px-5 py-2 rounded text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: GOLD }}
              >
                PRINT
              </button>
              <button
                className="px-5 py-2 rounded text-sm font-bold transition-colors"
                style={{ backgroundColor: "#F3F4F6", color: CHARCOAL, border: `1px solid ${BORDER}` }}
              >
                DOWNLOAD
              </button>
            </div>
            <p className="text-xs" style={{ color: MUTED }}>
              Refund via {item.refundMethod.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Progress tracker */}
        <div className="px-6 pt-4 pb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <ProgressTracker steps={steps} currentStep={item.statusStep} />
        </div>

        {/* Status note */}
        <div className="mx-6 my-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "#F9FAFB", border: `1px solid ${BORDER}` }}>
          <span className="font-semibold mr-3" style={{ color: MUTED, fontSize: 12 }}>{item.statusNoteDate}</span>
          <span style={{ color: CHARCOAL }}>{item.statusNote}</span>
        </div>

        {/* Product row */}
        <div className="px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ border: `1px solid ${BORDER}` }}>
              {item.product.image
                ? <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="64px" />
                : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: MUTED }}><EmojiIcon emoji="📦" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-2" style={{ color: CHARCOAL }}>{item.product.name}</p>
              <p className="text-sm font-bold mt-1" style={{ color: GOLD }}>
                रू {item.product.price.toLocaleString()}
              </p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                Reason: <span style={{ color: CHARCOAL }}>{item.product.reason}</span>
              </p>
            </div>
            <div className="shrink-0 text-sm" style={{ color: MUTED }}>
              Qty: <span className="font-bold" style={{ color: CHARCOAL }}>{item.product.qty}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Returns List ─────────────────────────────────────────────────────────────

export function MyReturnsPage() {
  const { nav } = useUIStore();
  const [filter, setFilter]   = useState<"all" | "return" | "cancellation">("all");
  const [detail, setDetail]   = useState<ReturnItem | null>(null);

  if (detail) return <ReturnDetail item={detail} onBack={() => setDetail(null)} />;

  const { user } = useAuthStore();
  const [items, setItems] = useState<ReturnItem[]>([]);
  useEffect(() => {
    if (!user) return;
    apiGet("/api/user/returns", null).then((d: any) => setItems(d?.items ?? []));
  }, [user]);

  const filtered = items.filter(r => filter === "all" || r.type === filter);

  return (
    <div className="min-h-screen py-6" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-4xl mx-auto px-4">

        {/* Back + title */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => nav("profile")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-surface-warm"
            style={{ border: `1px solid ${BORDER}`, color: MUTED }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-2xl font-black" style={{ color: CHARCOAL }}>My Returns</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 border-b" style={{ borderColor: BORDER }}>
          {([
            { key: "all",          label: "All" },
            { key: "return",       label: "My Returns" },
            { key: "cancellation", label: "My Cancellations" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-4 py-2.5 text-sm font-semibold transition-all -mb-px"
              style={{
                color: filter === key ? GOLD : MUTED,
                borderBottom: filter === key ? `2px solid ${GOLD}` : "2px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: MUTED }}>
            <div className="text-5xl mb-3"><EmojiIcon emoji="📦" /></div>
            <p className="text-lg font-semibold">No requests found</p>
            <p className="text-sm mt-1">You have no {filter === "all" ? "return or cancellation" : filter} requests.</p>
            <button
              onClick={() => nav("orders")}
              className="mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: GOLD }}
            >
              View My Orders
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const steps       = item.type === "return" ? RETURN_STEPS : CANCEL_STEPS;
              const currentLabel = statusLabel(item.type, item.statusStep, steps);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#1A1814] rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${BORDER}` }}
                >
                  {/* Card header */}
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: IVORY }}
                  >
                    <div className="flex items-center gap-4 text-sm">
                      <span style={{ color: MUTED }}>
                        {item.type === "return" ? "Returned on" : "Cancelled on"}{" "}
                        <span className="font-semibold" style={{ color: CHARCOAL }}>{item.returnedOn}</span>
                      </span>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                        style={{
                          backgroundColor: item.type === "return" ? "#DBEAFE" : "#FEF9C3",
                          color: item.type === "return" ? "#1D4ED8" : "#B45309",
                        }}
                      >
                        {item.type === "return" ? "Return to Store" : "Cancellation"}
                      </span>
                    </div>
                    <button
                      onClick={() => setDetail(item)}
                      className="text-sm font-bold transition-colors hover:underline"
                      style={{ color: GOLD }}
                    >
                      MORE DETAILS
                    </button>
                  </div>

                  {/* Order ID */}
                  <div className="px-5 pt-3 pb-1">
                    <span className="text-xs" style={{ color: MUTED }}>Order </span>
                    <span className="text-xs font-bold" style={{ color: GOLD }}>#{item.orderId}</span>
                  </div>

                  {/* Product row */}
                  <div className="px-5 pb-4 flex items-center gap-4">
                    <div
                      className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0"
                      style={{ border: `1px solid ${BORDER}` }}
                    >
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: MUTED }}><EmojiIcon emoji="📦" /></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-2" style={{ color: CHARCOAL }}>
                        {item.product.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                        Qty: <span className="font-bold" style={{ color: CHARCOAL }}>{item.product.qty}</span>
                      </p>
                    </div>

                    {/* Status badge */}
                    <div
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full text-center max-w-35"
                      style={{
                        backgroundColor: "#F3F4F6",
                        color: item.statusStep >= steps.length - 1 ? GREEN : CHARCOAL,
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      {currentLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
