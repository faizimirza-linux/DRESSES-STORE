"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { BUSINESS } from "@/lib/business";
import { formatPKR } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, hydrated } = useCart();

  const delivery = items.length ? BUSINESS.deliveryFee : 0;
  const total = subtotal + delivery;
  const balance = Math.max(total - BUSINESS.advanceAmount, 0);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-40 pb-24 md:px-8 md:pt-44">
      <p className="eyebrow">Your Selection</p>
      <h1 className="mt-3 font-display text-5xl font-medium text-ink md:text-6xl">
        The <span className="display-italic text-burgundy">fitting room</span>
      </h1>

      {!hydrated ? (
        <p className="mt-16 text-center text-ink-soft">Loading your cart…</p>
      ) : items.length === 0 ? (
        <div className="mt-16 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-ink/20" />
          <p className="mt-4 font-display text-3xl text-ink/60">Your cart is empty.</p>
          <p className="mt-2 text-sm text-ink-soft">Every dress here is waiting for your measurements.</p>
          <Link href="/shop" className="btn-primary mt-8">
            Browse the Collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          {/* items */}
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {items.map((i) => (
                <motion.div
                  key={`${i.productId}:${i.size}`}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="card flex gap-5 p-4"
                >
                  <Link href={`/shop/${i.slug}`} className="w-24 shrink-0 overflow-hidden rounded-xl sm:w-28">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.image} alt={i.name} className="aspect-[3/4] h-auto w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/shop/${i.slug}`} className="font-display text-lg leading-tight font-medium text-ink hover:text-burgundy">
                          {i.name}
                        </Link>
                        <p className="mt-1 text-xs text-ink-soft">
                          Size <b>{i.size}</b>
                          {i.size === "Custom" && i.measurements && Object.values(i.measurements).some(Boolean) && (
                            <span className="ml-1 rounded bg-blush px-1.5 py-0.5 text-[10px] font-bold text-burgundy">
                              measurements added
                            </span>
                          )}
                        </p>
                        {i.stitchingNotes && (
                          <p className="mt-1 line-clamp-1 text-xs text-ink/50 italic">“{i.stitchingNotes}”</p>
                        )}
                      </div>
                      <p className="font-display text-lg font-semibold text-ink">
                        {formatPKR(i.price * i.quantity)}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button onClick={() => updateQuantity(i.productId, i.size, i.quantity - 1)} className="p-2 hover:text-burgundy" aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold">{i.quantity}</span>
                        <button onClick={() => updateQuantity(i.productId, i.size, i.quantity + 1)} className="p-2 hover:text-burgundy" aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(i.productId, i.size)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition-colors hover:text-burgundy"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* summary */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="card sticky top-36 h-fit p-7"
          >
            <h2 className="font-display text-2xl font-medium text-ink">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink">{formatPKR(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>Delivery (nationwide)</dt>
                <dd className="font-semibold text-ink">{formatPKR(delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-bold text-ink">
                <dt>Total</dt>
                <dd>{formatPKR(total)}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-xl bg-burgundy/[0.07] p-4">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-burgundy" />
                <span>
                  Pay only <b className="text-burgundy">{formatPKR(BUSINESS.advanceAmount)} advance</b> now
                  (JazzCash or card). The remaining <b>{formatPKR(balance)}</b> is collected on delivery.
                </span>
              </p>
            </div>

            <Link href="/checkout" className="btn-primary mt-6 w-full">
              Checkout · Pay {formatPKR(BUSINESS.advanceAmount)} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/shop" className="mt-3 block text-center text-xs font-semibold text-ink-soft link-underline hover:text-burgundy">
              Continue shopping
            </Link>
          </motion.aside>
        </div>
      )}
    </div>
  );
}
