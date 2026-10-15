"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  X,
} from "lucide-react";
import { BUSINESS } from "@/lib/business";
import { formatPKR } from "@/lib/utils";

export type OrderConfirmationDetails = {
  orderId: string;
  orderNumber: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    size: string;
    measurements?: Record<string, string>;
    stitchingNotes?: string;
  }>;
  shipping: {
    name: string;
    phone: string;
    city: string;
    address: string;
    note: string;
  };
};

const wallets = [
  { name: "JazzCash", number: "03060314545", accountName: "Muhammad Ahmed" },
  { name: "EasyPaisa", number: "03143372162", accountName: "Habiba Naveed" },
] as const;

export function OrderSuccessDialog({
  order,
  onClose,
}: {
  order: OrderConfirmationDetails | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!order) return null;

  const message = [
    `New DRESSES order #${order.orderNumber}`,
    "",
    ...order.items.map((item) => {
      const measurements = item.measurements
        ? Object.entries(item.measurements)
            .filter(([, value]) => Boolean(value))
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "";
      return [
        `${item.name} — size ${item.size} × ${item.quantity}`,
        measurements ? `Measurements: ${measurements}` : "",
        item.stitchingNotes ? `Stitching note: ${item.stitchingNotes}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }),
    "",
    `Order total: ${formatPKR(order.total)}`,
    `Advance to pay now: ${formatPKR(BUSINESS.advanceAmount)}`,
    `Customer: ${order.shipping.name}`,
    `Phone: ${order.shipping.phone}`,
    `Delivery: ${order.shipping.address}, ${order.shipping.city}`,
    order.shipping.note ? `Customer note: ${order.shipping.note}` : "",
    "I will attach my payment screenshot here.",
  ]
    .filter(Boolean)
    .join("\n");
  const whatsappUrl = `https://wa.me/923143372162?text=${encodeURIComponent(message)}`;

  async function copyNumber(number: string) {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(number);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="order-success-backdrop"
        className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-ink/65 px-4 py-8 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-success-title"
          className="relative my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-cream shadow-2xl"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 240, damping: 25 }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order confirmation"
            className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-cream/15 text-cream transition hover:bg-cream/25"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="bg-burgundy px-7 py-8 text-cream sm:px-9">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gold text-ink">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="mt-5 text-[10px] font-bold tracking-[0.2em] text-gold-light uppercase">
              Order received · #{order.orderNumber}
            </p>
            <h2 id="order-success-title" className="mt-2 font-display text-3xl font-medium sm:text-4xl">
              Your order is in.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-cream/80">
              To get started on your dress, pay the PKR 1,000 advance using either wallet below. We’ll begin stitching once your payment is received and verified.
            </p>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              {wallets.map((wallet) => (
                <div key={wallet.name} className="rounded-2xl border border-ink/10 bg-white/60 p-4">
                  <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{wallet.name}</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-ink">{wallet.number}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">Account name: {wallet.accountName}</p>
                  <button
                    type="button"
                    onClick={() => copyNumber(wallet.number)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-burgundy hover:underline"
                  >
                    {copied === wallet.number ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === wallet.number ? "Copied" : "Copy number"}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gold/50 bg-gold/10 px-4 py-3.5 text-sm leading-relaxed text-ink">
              <b>After paying:</b> Please send us a screenshot of your payment at <b>03143372162</b> on WhatsApp. Include order <b>#{order.orderNumber}</b> so we can match it.
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              <MessageCircle className="h-4 w-4" /> Send order details & payment screenshot
            </a>
            <p className="-mt-2 text-center text-[11px] leading-relaxed text-ink/55">
              WhatsApp opens with your order number, dress sizes and delivery details ready to send. Attach your payment screenshot in the chat.
            </p>

            <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-4">
              <Link href={`/account/orders/${order.orderId}`} className="btn-ghost flex-1">
                View order <ArrowRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Continue shopping
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
