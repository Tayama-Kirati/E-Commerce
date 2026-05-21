"use client";
import { useState } from "react";
import { MOCK_PRODUCTS, useUIStore, useAuthStore } from "@/app/lib/store";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const MUTED    = "var(--color-muted)";

const MOCK_REVIEWS = [
  { id: "r1", product: MOCK_PRODUCTS[0], rating: 5, title: "Absolutely love it!", body: "Great quality, fast delivery. Will buy again.", date: "2025-04-10", status: "published" },
  { id: "r2", product: MOCK_PRODUCTS[1], rating: 4, title: "Good value for money", body: "Works as described. Minor packaging issue.", date: "2025-03-22", status: "published" },
  { id: "r3", product: MOCK_PRODUCTS[2], rating: 3, title: "Decent but not perfect", body: "Color was slightly different from photos.", date: "2025-02-15", status: "pending" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className="w-4 h-4" fill={i <= rating ? GOLD : "none"} viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ))}
    </div>
  );
}

export function MyReviewsPage() {
  const { nav } = useUIStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<"all"|"published"|"pending">("all");

  const filtered = MOCK_REVIEWS.filter(r => filter === "all" || r.status === filter);

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => nav("home")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-surface-warm"
            style={{ border: `1px solid ${BORDER}`, color: MUTED }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black" style={{ color: CHARCOAL }}>My Reviews</h1>
            <p className="text-sm" style={{ color: MUTED }}>{MOCK_REVIEWS.length} reviews written</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all","published","pending"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all"
              style={filter === f
                ? { backgroundColor: GOLD, color: "#fff" }
                : { backgroundColor: IVORY, color: MUTED, border: `1px solid ${BORDER}` }
              }
            >
              {f}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: MUTED }}>
              <div className="text-5xl mb-3">✍️</div>
              <p className="text-lg font-semibold">No reviews yet</p>
              <p className="text-sm mt-1">Share your thoughts on products you&apos;ve purchased.</p>
              <button
                onClick={() => nav("orders")}
                className="mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: GOLD }}
              >
                Go to My Orders
              </button>
            </div>
          ) : filtered.map(review => (
            <div
              key={review.id}
              className="bg-white dark:bg-[#1A1814] rounded-2xl p-5"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: IVORY }}
                >
                  {review.product?.emoji ?? "🛍️"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm truncate" style={{ color: CHARCOAL }}>{review.product?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Stars rating={review.rating} />
                        <span className="text-xs" style={{ color: MUTED }}>{review.date}</span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 capitalize"
                      style={review.status === "published"
                        ? { backgroundColor: "#DCFCE7", color: "#16A34A" }
                        : { backgroundColor: "#FEF9C3", color: "#B45309" }
                      }
                    >
                      {review.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mt-2" style={{ color: CHARCOAL }}>{review.title}</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: MUTED }}>{review.body}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-surface-warm" style={{ color: GOLD, border: `1px solid ${BORDER}` }}>
                  Edit
                </button>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50" style={{ color: "#EF4444", border: "1px solid #FECACA" }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
