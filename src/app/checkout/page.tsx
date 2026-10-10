"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CreditCard,
  Smartphone,
  Loader2,
  Lock,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { BUSINESS } from "@/lib/business";
import { formatPKR } from "@/lib/utils";

type Me = { name: string; email: string; phone?: string } | null;
type Provider = "jazzcash" | "stripe";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, hydrated, clear } = useCart();
  const [me, setMe] = useState<Me>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [provider, setProvider] = useState<Provider>("jazzcash");
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const u = d?.user ?? null;
        setMe(u);
        if (u) setForm((f) => ({ ...f, name: u.name ?? f.name, phone: u.phone ?? f.phone }));
      })
      .finally(() => setMeLoaded(true));
  }, []);

  const delivery = items.length ? BUSINESS.deliveryFee : 0;
  const total = subtotal + delivery;
  const balance = Math.max(total - BUSINESS.advanceAmount, 0);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!me) {
      router.push(`/login?next=/checkout`);
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setBusy(true);
    try {
      // 1) create the order (server recomputes prices + enforces the advance rule)
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
            measurements: i.measurements,
            stitchingNotes: i.stitchingNotes,
          })),
          shipping: {
            name: form.name,
            phone: form.phone,
            city: form.city,
            address: form.address,
            note: form.note,
          },
          provider,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error ?? "Could not create order");

      // 2) initiate the PKR 1,000 advance payment
      const payRes = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: orderData.orderId, provider }),
      });
      const pay = await payRes.json();
      if (!payRes.ok) throw new Error(pay.error ?? "Could not start payment");

      clear();

      if (pay.type === "jazzcash_form") {
        // auto-submit the signed JazzCash form
        const f = document.createElement("form");
        f.method = "POST";
        f.action = pay.postUrl;
        Object.entries(pay.fields as Record<string, string>).forEach(([k, v]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = v;
          f.appendChild(input);
        });
        document.body.appendChild(f);
        f.submit();
        return;
      }
      router.push(pay.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (!meLoaded || !hydrated) {
    return (
      <div className="grid min-h-[60vh] place-items-center pt-32">
        <Loader2 className="h-6 w-6 animate-spin text-burgundy" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-48 pb-32 text-center">
        <Lock className="mx-auto h-10 w-10 text-burgundy" />
        <h1 className="mt-5 font-display text-4xl font-medium text-ink">Sign in to checkout</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Orders, payments and stitching updates live in your account — sign in or create one in
          under a minute.
        </p>
        <Link href="/login?next=/checkout" className="btn-primary mt-8">
          Sign In / Create Account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pt-40 pb-24 md:px-8 md:pt-44">
      <Link href="/cart" className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-burgundy">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to cart
      </Link>
      <h1 className="mt-3 font-display text-5xl font-medium text-ink md:text-6xl">
        Secure <span className="display-italic text-burgundy">checkout</span>
      </h1>

      <form onSubmit={placeOrder} className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {/* shipping */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="card p-7"
          >
            <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-burgundy text-xs font-bold text-cream">1</span>
              Delivery details
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="co-name">Full name</label>
                <input id="co-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="co-phone">Phone / WhatsApp</label>
                <input id="co-phone" required pattern="[0-9+\-\s]{10,15}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03xx xxxxxxx" className="field" />
              </div>
              <div>
                <label className="label" htmlFor="co-city">City</label>
                <input id="co-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="co-address">Street address</label>
                <input id="co-address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="co-note">Note for the tailor (optional)</label>
                <textarea id="co-note" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="field resize-none" placeholder="Rush delivery, gift packing, fitting call…" />
              </div>
            </div>
          </motion.section>

          {/* payment method */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="card p-7"
          >
            <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-burgundy text-xs font-bold text-cream">2</span>
              Advance payment method
            </h2>
            <p className="mt-2 text-xs text-ink-soft">
              The {formatPKR(BUSINESS.advanceAmount)} advance confirms your order and starts stitching.
              Balance {formatPKR(balance)} on delivery.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(
                [
                  { key: "jazzcash", icon: Smartphone, title: "JazzCash", note: "Mobile wallet / card" },
                  { key: "stripe", icon: CreditCard, title: "Debit / Credit Card", note: "Visa · Mastercard via Stripe" },
                ] as const
              ).map((m) => (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setProvider(m.key)}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                    provider === m.key
                      ? "border-burgundy bg-burgundy/[0.06] shadow-card"
                      : "border-ink/10 hover:border-burgundy/40"
                  }`}
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-full ${provider === m.key ? "bg-burgundy text-cream" : "bg-blush text-ink"}`}>
                    <m.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink">{m.title}</span>
                    <span className="block text-xs text-ink-soft">{m.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.section>
        </div>

        {/* summary */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="card sticky top-36 h-fit p-7"
        >
          <h2 className="font-display text-2xl font-medium text-ink">Your order</h2>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={`${i.productId}:${i.size}`} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.image} alt="" className="h-12 w-10 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{i.name}</p>
                  <p className="text-xs text-ink-soft">Size {i.size} × {i.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatPKR(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>Subtotal</dt>
              <dd className="font-semibold text-ink">{formatPKR(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-soft">
              <dt>Delivery</dt>
              <dd className="font-semibold text-ink">{formatPKR(delivery)}</dd>
            </div>
            <div className="flex justify-between font-bold text-ink">
              <dt>Total</dt>
              <dd>{formatPKR(total)}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-burgundy/[0.07] px-3 py-2 text-burgundy">
              <dt className="font-bold">Due now (advance)</dt>
              <dd className="font-black">{formatPKR(BUSINESS.advanceAmount)}</dd>
            </div>
            <div className="flex justify-between text-ink-soft">
              <dt>Due on delivery</dt>
              <dd className="font-semibold text-ink">{formatPKR(balance)}</dd>
            </div>
          </dl>

          {error && <p className="mt-4 rounded-lg bg-burgundy/10 px-3 py-2 text-xs font-semibold text-burgundy">{error}</p>}

          <button type="submit" disabled={busy || items.length === 0} className="btn-primary mt-6 w-full">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Pay {formatPKR(BUSINESS.advanceAmount)} & Place Order
              </>
            )}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink/45">
            <Lock className="h-3 w-3" /> 256-bit encrypted · order confirmed only after payment
          </p>
        </motion.aside>
      </form>
    </div>
  );
}
