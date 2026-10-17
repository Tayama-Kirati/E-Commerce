"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { cn, useUIStore } from "@/app/lib/store";

const GOLD = "#C68313";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content: "Hi! I'm Pea, PeaNut's assistant. Ask me about products, your orders, delivery or returns.",
};

const SUGGESTIONS = ["Where is my order?", "What's your return policy?", "Recommend wireless earbuds under रू 5000"];

/** Renders /products/<slug> mentions in assistant replies as in-app links. */
function ReplyText({ text }: { text: string }) {
  const { nav } = useUIStore();
  const parts = text.split(/(\/products\/[a-z0-9-]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        const slug = /^\/products\/([a-z0-9-]+)$/.exec(part)?.[1];
        return slug ? (
          <button key={i} onClick={() => nav("product", slug)} className="underline font-semibold" style={{ color: GOLD }}>
            view product
          </button>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      // The greeting is UI-only; the API expects the conversation to start with the customer
      const history = next.filter((m) => m !== GREETING).slice(-20);
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? data.error ?? "Sorry, something went wrong." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't connect. Please check your internet and try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[min(560px,calc(100vh-8rem))] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-[#1A1814]"
          style={{ border: "1px solid #E8D5A8" }}
          role="dialog"
          aria-label="PeaNut assistant"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: GOLD }}>
            <div>
              <p className="font-black text-sm">Pea · PeaNut assistant</p>
              <p className="text-[11px] opacity-80">Usually replies in a few seconds</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-1 rounded-lg hover:bg-white/20">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user" ? "text-white rounded-br-md" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md",
                  )}
                  style={m.role === "user" ? { backgroundColor: GOLD } : undefined}
                >
                  {m.role === "assistant" ? <ReplyText text={m.content} /> : m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex gap-1 px-3 py-3 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800" aria-label="Assistant is typing">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </div>
            )}
            {messages.length === 1 && !busy && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border hover:bg-amber-50 dark:hover:bg-gray-800"
                    style={{ borderColor: "#E8D5A8", color: GOLD }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 p-3 border-t border-gray-100 dark:border-gray-800">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              placeholder="Type your question…"
              className="flex-1 px-3.5 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none focus:border-amber-500 text-gray-900 dark:text-white"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="p-2.5 rounded-xl text-white disabled:opacity-50" style={{ backgroundColor: GOLD }}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with us"}
        className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-105"
        style={{ backgroundColor: GOLD }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
