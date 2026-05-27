"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type State = "loading" | "success" | "failed";

export default function VerifyPaymentPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const gateway = params.get("gateway");
    const orderId = params.get("orderId");
    const pidx = params.get("pidx"); // Khalti appends this on return

    if (!orderId) {
      setMessage("Missing order information.");
      setState("failed");
      return;
    }

    if (gateway === "khalti" && pidx) {
      fetch("/api/payments/khalti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", pidx, orderId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setOrderNumber(data.order?.orderNumber ?? null);
            setState("success");
          } else {
            setMessage(data.error ?? "Payment verification failed.");
            setState("failed");
          }
        })
        .catch(() => {
          setMessage("Network error during verification.");
          setState("failed");
        });
    } else {
      setMessage("Unsupported gateway or missing payment token.");
      setState("failed");
    }
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0] px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        {state === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-[#C68313] border-t-transparent animate-spin" />
            <h1 className="text-xl font-semibold text-[#1A1523]">Verifying your payment…</h1>
            <p className="text-sm text-gray-500 mt-2">Please wait, do not close this page.</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1A1523]">Payment Successful!</h1>
            {orderNumber && (
              <p className="text-sm text-gray-500 mt-2">
                Order <span className="font-semibold text-[#1A1523]">#{orderNumber}</span> confirmed.
              </p>
            )}
            <p className="text-sm text-gray-400 mt-1">You will receive a confirmation email shortly.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-8 w-full py-3 rounded-xl bg-[#C68313] text-white font-semibold hover:bg-[#a56a0f] transition-colors"
            >
              Continue Shopping
            </button>
          </>
        )}

        {state === "failed" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1A1523]">Payment Failed</h1>
            <p className="text-sm text-gray-500 mt-2">{message || "Something went wrong with your payment."}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-8 w-full py-3 rounded-xl bg-[#1A1523] text-white font-semibold hover:bg-[#2d2240] transition-colors"
            >
              Back to Shop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
