"use client";

// Last-resort boundary for errors in the root layout itself (it replaces <html>)
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF6F0", color: "#1A1523", textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>PeaNut is having trouble</h1>
          <p style={{ color: "#6B6878", marginBottom: 24 }}>Please try again in a moment.{error.digest ? ` (Ref ${error.digest})` : ""}</p>
          <button onClick={reset} style={{ padding: "12px 24px", borderRadius: 999, border: 0, background: "#C68313", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
