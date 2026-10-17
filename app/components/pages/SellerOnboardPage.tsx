"use client";
import { useState } from "react";
import { useUIStore, useAuthStore } from "@/app/lib/store";

import { EmojiIcon, EmojiText } from "@/app/components/ui/EmojiIcon";
const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const BORDER   = "#E8D5A8";
const IVORY    = "var(--color-surface-warm)";
const MUTED    = "var(--color-muted)";

export function SellerOnboardPage() {
  const { nav, showToast } = useUIStore();
  const { user, setUser }  = useAuthStore();

  const [storeName,   setStoreName]   = useState("");
  const [description, setDescription] = useState("");
  const [accepted,    setAccepted]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!storeName.trim() || storeName.trim().length < 3) {
      setError("Store name must be at least 3 characters."); return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError("Description must be at least 10 characters."); return;
    }
    if (!accepted) {
      setError("Please accept the seller terms to continue."); return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/seller/onboarding", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ storeName: storeName.trim(), description: description.trim(), acceptPolicy: true }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Update local user role so the app redirects correctly
      if (user) setUser({ ...user, role: "SELLER" });
      showToast("Seller account created! Welcome to PeaNut Sellers.");
      nav("seller");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4"><EmojiIcon emoji="🔒" /></div>
        <h2 className="text-xl font-black mb-2" style={{ color: CHARCOAL }}>Sign in required</h2>
        <p className="text-sm mb-6" style={{ color: MUTED }}>You need to be signed in to register as a seller.</p>
        <button onClick={() => nav("login")}
          className="px-6 py-3 rounded-2xl text-sm font-black text-white"
          style={{ backgroundColor: GOLD }}>
          Sign In <EmojiIcon emoji="→" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4"><EmojiIcon emoji="🏪" /></div>
        <h1 className="text-3xl font-black mb-2" style={{ color: CHARCOAL, fontFamily: "var(--font-playfair,'Poppins',system-ui,sans-serif)" }}>
          Start Selling on Pea<span style={{ color: GOLD }}>Nut</span>
        </h1>
        <p className="text-sm" style={{ color: MUTED }}>
          Set up your store and start reaching thousands of customers.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-3xl p-8 space-y-5" style={{ border: `1px solid ${BORDER}` }}>

        {/* Store name */}
        <div>
          <label className="block text-xs font-black mb-1.5 uppercase tracking-wide" style={{ color: CHARCOAL }}>
            Store Name <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            placeholder="e.g. Tech Gadgets Nepal"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
            onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(198,131,19,0.1)`; }}
            onBlur={e =>  { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }}
          />
          <p className="text-[11px] mt-1" style={{ color: MUTED }}>This becomes your public store name (min 3 characters)</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-black mb-1.5 uppercase tracking-wide" style={{ color: CHARCOAL }}>
            Store Description <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell customers what you sell and what makes your store special..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
            style={{ border: `1.5px solid ${BORDER}`, color: CHARCOAL }}
            onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(198,131,19,0.1)`; }}
            onBlur={e =>  { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }}
          />
          <p className="text-[11px] mt-1" style={{ color: MUTED }}>{description.length}/1000 characters (min 10)</p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${BORDER}` }} />

        {/* Benefits */}
        <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: IVORY }}>
          <p className="text-xs font-black mb-3" style={{ color: CHARCOAL }}>What you get as a seller:</p>
          {[
            "Your own storefront page visible to all shoppers",
            "Full product management dashboard",
            "Real-time order notifications",
            "Analytics and earnings tracking",
          ].map(b => (
            <div key={b} className="flex items-start gap-2">
              <span className="text-xs font-black mt-0.5" style={{ color: GOLD }}><EmojiIcon emoji="✓" /></span>
              <span className="text-xs" style={{ color: CHARCOAL }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAccepted(p => !p)}>
          <div className="w-5 h-5 rounded-lg shrink-0 mt-0.5 flex items-center justify-center transition-all"
            style={{ backgroundColor: accepted ? GOLD : "white", border: `2px solid ${accepted ? GOLD : BORDER}` }}>
            {accepted && <span className="text-white text-xs font-black"><EmojiIcon emoji="✓" /></span>}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
            I agree to PeaNut's{" "}
            <span className="font-bold" style={{ color: GOLD }}>Seller Terms of Service</span>
            {" "}and{" "}
            <span className="font-bold" style={{ color: GOLD }}>Marketplace Policies</span>.
            I understand that my products are subject to review.
          </p>
        </label>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: GOLD }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "#9B6210"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = GOLD; }}>
          {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          <EmojiText>{loading ? "Creating your store…" : "Create My Store →"}</EmojiText>
        </button>

        <p className="text-center text-xs" style={{ color: MUTED }}>
          Already have a store?{" "}
          <button onClick={() => nav("seller")} className="font-bold hover:underline" style={{ color: GOLD }}>
            Go to Seller Hub
          </button>
        </p>
      </div>
    </div>
  );
}
