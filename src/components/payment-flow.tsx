"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Smartphone,
  CreditCard,
  ArrowRight,
  Package,
  Scissors,
} from "lucide-react";
import { BUSINESS } from "@/lib/business";
import { formatPKR } from "@/lib/utils";

type Status = "pending" | "processing" | "confirming" | "paid" | "failed" | "cancelled";

export type PaymentOrder = {
  id: string;
  orderNumber: string;
  total: number;
  advanceAmount: number;
  balanceDue: number;
  status: string;
  advancePaid: boolean;
  provider: string;
  txnRef: string | null;
};

export function PaymentFlow({
  order,
  stripeReturn,
}: {
  order: PaymentOrder;
  stripeReturn: string | null;
}) {
  const [status, setStatus] = useState<Status>(
    order.advancePaid ? "paid" : stripeReturn === "success" ? "confirming" : stripeReturn === "cancelled" ? "cancelled" : "pending",
  );
  const [txn, setTxn] = useState(order.txnRef);
  const [error, setError] = useState<string | null>(null);

  // Poll while a real gateway (Stripe) confirms the payment via webhook.
  useEffect(() => {
    if (status !== "confirming") return;
    let tries = 0;
    const t = setInterval(async () => {
      tries += 1;
      try {
        const res = await fetch(`/api/payments/status?orderId=${order.id}`, { cache: "no-store" });
        const data = await res.json();
        if (data.advancePaid) {
          setStatus("paid");
          setTxn(data.txnRef ?? null);
          clearInterval(t);
        } else if (tries > 16) {
          clearInterval(t);
          setError("Payment is taking longer than usual to confirm. It will appear in your account shortly.");
          setStatus("pending");
        }
      } catch {
        /* keep polling */
      }
    }, 2500);
    return () => clearInterval(t);
  }, [status, order.id]);

  async function simulate(result: "paid" | "failed") {
    setStatus("processing");
    setError(null);
    // small dramatized delay so the "gateway" feels real
    await new Promise((r) => setTimeout(r, 1400));
    try {
      const res = await fetch("/api/payments/callback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "sandbox",
          orderId: order.id,
          status: result,
          txnRef: `SIM-${Date.now().toString(36).toUpperCase()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gateway error");
      setStatus(result === "paid" ? "paid" : "failed");
      if (result === "paid") setTxn(data.txnRef ?? null);
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  }

  const isSandbox = order.provider === "sandbox";

  return (
    <div className="mx-auto max-w-2xl px-5 pt-40 pb-24 md:pt-44">
      <AnimatePresence mode="wait">
        {/* ------------------------------- pending ------------------------------ */}
        {(status === "pending" || status === "failed" || status === "cancelled") && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow text-center">{isSandbox ? "Sandbox Gateway" : "Payment Gateway"}</p>
            <h1 className="mt-3 text-center font-display text-4xl font-medium text-ink md:text-5xl">
              Confirm your <span className="display-italic text-burgundy">advance</span>
            </h1>

            <div className="card mt-8 overflow-hidden">
              <div className="flex items-center justify-between bg-burgundy px-6 py-4 text-cream">
                <div className="flex items-center gap-2.5">
                  {order.provider === "jazzcash" ? (
                    <Smartphone className="h-5 w-5 text-gold-light" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-gold-light" />
                  )}
                  <p className="text-sm font-bold">
                    {order.provider === "jazzcash"
                      ? "JazzCash Secure Checkout"
                      : order.provider === "stripe"
                        ? "Stripe Secure Checkout"
                        : "DRESSES Pay — Test Mode"}
                  </p>
                </div>
                <ShieldCheck className="h-5 w-5 text-gold-light" />
              </div>

              <div className="p-6 md:p-8">
                {isSandbox && (
                  <div className="mb-5 rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-ink-soft">
                    <b>Test mode:</b> no live gateway keys are configured, so this built-in
                    simulator stands in for Stripe/JazzCash. Approving triggers the same
                    server-side callback a real gateway would.
                  </div>
                )}

                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Order</dt>
                    <dd className="font-bold text-ink">#{order.orderNumber}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Order total</dt>
                    <dd className="font-semibold text-ink">{formatPKR(order.total)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Balance on delivery</dt>
                    <dd className="font-semibold text-ink">{formatPKR(order.balanceDue)}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-burgundy/[0.06] px-4 py-3">
                    <dt className="font-bold text-burgundy">Advance due now</dt>
                    <dd className="font-display text-2xl font-bold text-burgundy">
                      {formatPKR(order.advanceAmount)}
                    </dd>
                  </div>
                </dl>

                {(status === "failed" || status === "cancelled" || error) && (
                  <div className="mt-5 flex items-start gap-2 rounded-xl bg-burgundy/10 px-4 py-3 text-xs font-semibold text-burgundy">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error ??
                      (status === "cancelled"
                        ? "Payment was cancelled. Your order is saved — retry whenever you're ready."
                        : "Payment was declined by the gateway. No amount was charged — please retry.")}
                  </div>
                )}

                {isSandbox ? (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button onClick={() => simulate("paid")} className="btn-primary w-full">
                      <CheckCircle2 className="h-4 w-4" /> Approve Payment
                    </button>
                    <button onClick={() => simulate("failed")} className="btn-ghost w-full">
                      <XCircle className="h-4 w-4" /> Simulate Decline
                    </button>
                  </div>
                ) : (
                  <Link href="/checkout" className="btn-primary mt-6 w-full">
                    Return to checkout <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                <p className="mt-4 text-center text-[11px] text-ink/45">
                  Order stays <b>Pending Payment</b> and is <b>not</b> sent to stitching until
                  this advance clears.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ----------------------------- processing ---------------------------- */}
        {(status === "processing" || status === "confirming") && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="card mt-10 flex flex-col items-center p-16 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
            >
              <Loader2 className="h-12 w-12 text-burgundy" />
            </motion.div>
            <p className="mt-6 font-display text-2xl font-medium text-ink">
              {status === "processing" ? "Talking to the gateway…" : "Confirming your payment…"}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Encrypting and verifying transaction #{order.orderNumber}
            </p>
          </motion.div>
        )}

        {/* -------------------------------- paid -------------------------------- */}
        {status === "paid" && (
          <motion.div
            key="paid"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="card mt-10 overflow-hidden"
          >
            <div className="bg-burgundy px-8 py-10 text-center text-cream">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold"
              >
                <CheckCircle2 className="h-10 w-10 text-ink" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-5 font-display text-4xl font-medium"
              >
                Order Confirmed
              </motion.h1>
              <p className="mt-2 text-sm text-cream/80">
                Advance received — your dress has entered the stitching queue.
              </p>
            </div>

            <div className="p-8">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-ivory p-4">
                  <dt className="text-xs text-ink-soft">Order number</dt>
                  <dd className="font-bold text-ink">#{order.orderNumber}</dd>
                </div>
                <div className="rounded-xl bg-ivory p-4">
                  <dt className="text-xs text-ink-soft">Advance paid</dt>
                  <dd className="font-bold text-burgundy">{formatPKR(order.advanceAmount)}</dd>
                </div>
                <div className="rounded-xl bg-ivory p-4">
                  <dt className="text-xs text-ink-soft">Transaction ref</dt>
                  <dd className="font-bold text-ink">{txn ?? "—"}</dd>
                </div>
                <div className="rounded-xl bg-ivory p-4">
                  <dt className="text-xs text-ink-soft">Balance on delivery</dt>
                  <dd className="font-bold text-ink">{formatPKR(order.balanceDue)}</dd>
                </div>
              </dl>

              <div className="mt-6 space-y-3">
                {[
                  { icon: ShieldCheck, text: "Payment confirmed via gateway callback" },
                  { icon: Scissors, text: `Stitching begins — ready in ${BUSINESS.turnaround}` },
                  { icon: Package, text: "Track every stage from Account → Orders" },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.12 }}
                    className="flex items-center gap-3 rounded-xl border border-ink/10 px-4 py-3 text-sm text-ink-soft"
                  >
                    <s.icon className="h-4 w-4 shrink-0 text-burgundy" /> {s.text}
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/account/orders/${order.id}`} className="btn-primary flex-1">
                  Track Order <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/shop" className="btn-ghost flex-1">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
