"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-16 text-center" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md">
        <h1 className="text-2xl font-black mb-3" style={{ color: "var(--color-heading)" }}>Something went wrong</h1>
        <p className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>
          Sorry — this page hit an unexpected error. Your cart and orders are safe.
        </p>
        {error.digest && <p className="text-xs mb-8 font-mono" style={{ color: "var(--color-muted)" }}>Reference: {error.digest}</p>}
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={reset} className="px-6 py-3 rounded-full text-white text-sm font-bold" style={{ backgroundColor: "#C68313" }}>
            Try again
          </button>
          <Link href="/" className="px-6 py-3 rounded-full text-sm font-bold border" style={{ borderColor: "#E8D5A8", color: "var(--color-heading)" }}>
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
