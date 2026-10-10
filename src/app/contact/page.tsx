"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { BUSINESS } from "@/lib/business";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send message");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    { icon: Phone, label: "Call or WhatsApp", value: BUSINESS.phoneDisplay, href: `tel:${BUSINESS.phoneIntl}` },
    { icon: MapPin, label: "Studio", value: BUSINESS.address, href: "https://www.google.com/maps/search/?api=1&query=Narowal,+Punjab,+Pakistan" },
    { icon: Clock, label: "Hours", value: BUSINESS.hours },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 pt-40 pb-24 md:px-8 md:pt-44">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight font-medium text-ink md:text-6xl">
        Let's talk about <span className="display-italic text-burgundy">your dress</span>
      </h1>

      {/* info cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="card p-6"
          >
            <c.icon className="h-5 w-5 text-burgundy" />
            <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-ink-soft uppercase">{c.label}</p>
            {c.href ? (
              <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="mt-1 block font-display text-xl font-medium text-ink link-underline hover:text-burgundy">
                {c.value}
              </a>
            ) : (
              <p className="mt-1 font-display text-xl font-medium text-ink">{c.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="card h-fit p-8"
        >
          {done ? (
            <div className="flex flex-col items-center py-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 15 }}>
                <CheckCircle2 className="h-14 w-14 text-burgundy" />
              </motion.div>
              <p className="mt-4 font-display text-2xl font-medium text-ink">Message received!</p>
              <p className="mt-2 max-w-xs text-sm text-ink-soft">
                We usually reply within a few hours during studio time. For anything urgent,
                WhatsApp {BUSINESS.phoneDisplay}.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="font-display text-2xl font-medium text-ink">Send a message</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="field" />
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="field" />
              </div>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone / WhatsApp (optional)" className="field" />
              <textarea required minLength={10} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your occasion, timeline, or idea…" className="field resize-none" />
              {error && <p className="text-xs font-semibold text-burgundy">{error}</p>}
              <button disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Message
              </button>
              <a href={BUSINESS.whatsapp} target="_blank" rel="noreferrer" className="btn-ghost w-full">
                <MessageCircle className="h-4 w-4" /> Or WhatsApp instantly
              </a>
            </form>
          )}
        </motion.div>

        {/* map */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[28px] border border-ink/10 shadow-luxe"
        >
          <iframe
            title={`${BUSINESS.name} — ${BUSINESS.address}`}
            src={BUSINESS.mapEmbed}
            className="h-full min-h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </div>
    </div>
  );
}
