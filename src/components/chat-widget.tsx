"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { BUSINESS } from "@/lib/business";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "What is the PKR 1,000 advance?",
  "Help me choose my size",
  "How do I track my order?",
  "Delivery time & charges",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Assalam-o-Alaikum! I'm Noor, the DRESSES assistant. Ask me about sizing, the PKR ${BUSINESS.advanceAmount.toLocaleString()} advance, delivery, or tracking your order.`,
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-8) }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "Sorry, I couldn't answer that right now." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `I'm having trouble connecting. Please WhatsApp us at ${BUSINESS.phoneDisplay}.`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* floating trigger */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with DRESSES assistant"
        className="fixed right-5 bottom-5 z-[80] grid h-14 w-14 place-items-center rounded-full bg-burgundy text-cream shadow-luxe transition-colors hover:bg-wine md:right-8 md:bottom-8"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "x" : "chat"}
            initial={{ rotate: -60, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 60, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-1 -right-1 grid h-5 w-5 animate-pulse place-items-center rounded-full bg-gold text-[10px] font-black text-ink">
            AI
          </span>
        )}
      </motion.button>

      {/* panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed right-4 bottom-24 z-[80] flex h-[540px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-ink/10 bg-cream shadow-luxe md:right-8 md:bottom-28"
          >
            {/* header */}
            <div className="relative overflow-hidden bg-burgundy px-5 py-4 text-cream">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-cream/15">
                  <Sparkles className="h-5 w-5 text-gold-light" />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold">Noor — DRESSES Assistant</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-cream/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online · replies instantly
                  </p>
                </div>
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-burgundy text-cream"
                        : "rounded-bl-sm border border-ink/10 bg-ivory text-ink"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-ink/10 bg-ivory px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-burgundy/60"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: d * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* quick prompts */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="shrink-0 rounded-full border border-burgundy/25 px-3 py-1.5 text-[11px] font-semibold text-burgundy transition-colors hover:bg-burgundy hover:text-cream"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-ink/10 bg-ivory p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about sizing, advance, tracking…"
                className="flex-1 rounded-full border border-ink/15 bg-cream px-4 py-2.5 text-sm outline-none focus:border-burgundy"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-burgundy text-cream transition-all hover:bg-wine disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
