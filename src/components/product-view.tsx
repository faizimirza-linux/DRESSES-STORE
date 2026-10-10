"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Star,
  Ruler,
  ShieldCheck,
  Truck,
  ChevronDown,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  MessageCircle,
  BadgeCheck,
} from "lucide-react";
import { BUSINESS } from "@/lib/business";
import { formatPKR, ratingToStars } from "@/lib/utils";
import { useCart } from "./cart-provider";
import { ProductCard } from "./product-card";
import type { Product, Review } from "@/db/schema";

function Accordion({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-ink/10 bg-cream/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <span className="flex items-center gap-2.5 text-sm font-bold text-ink">
          <Icon className="h-4 w-4 text-burgundy" /> {title}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-4 w-4 text-ink/50" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProductView({
  product,
  reviews,
  related,
}: {
  product: Product;
  reviews: Review[];
  related: Product[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [image, setImage] = useState(0);
  const [size, setSize] = useState("Custom");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);

  const isCustom = size === "Custom";
  const gallery = product.images.length ? product.images : ["/images/hero.jpg"];

  function addToCart(goCheckout: boolean) {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: gallery[0],
      size,
      quantity: qty,
      measurements: isCustom ? measurements : undefined,
      stitchingNotes: notes || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2600);
    if (goCheckout) router.push("/checkout");
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewBusy(true);
    setReviewMsg(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id, rating: reviewRating, text: reviewText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewMsg(data.error ?? "Please sign in to leave a review.");
        return;
      }
      setLocalReviews((r) => [data.review, ...r]);
      setReviewText("");
      setReviewMsg("Thank you! Your review is live.");
    } catch {
      setReviewMsg("Something went wrong. Please try again.");
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pt-36 pb-24 md:px-8 md:pt-44">
      {/* breadcrumb */}
      <p className="text-[11px] font-semibold tracking-[0.2em] text-ink/45 uppercase">
        <Link href="/shop" className="hover:text-burgundy">Shop</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?category=${product.category}`} className="hover:text-burgundy">
          {product.category}
        </Link>
        <span className="mx-2">/</span> {product.name}
      </p>

      <div className="mt-6 grid gap-12 lg:grid-cols-[1.05fr_1fr]">
        {/* gallery */}
        <div>
          <motion.div
            key={image}
            initial={{ opacity: 0.4, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="img-zoom relative aspect-[3/4] overflow-hidden rounded-[28px] bg-sand shadow-luxe"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gallery[image]} alt={product.name} className="h-full w-full object-cover" />
            <span className="absolute top-4 left-4 rounded-full bg-burgundy px-4 py-1.5 text-[10px] font-bold tracking-[0.18em] text-cream uppercase">
              Made to order
            </span>
          </motion.div>
          {gallery.length > 1 && (
            <div className="mt-4 flex gap-3">
              {gallery.map((g, i) => (
                <button
                  key={g + i}
                  onClick={() => setImage(i)}
                  className={`aspect-[3/4] w-20 overflow-hidden rounded-xl border-2 transition-all ${
                    i === image ? "border-burgundy shadow-card" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* details */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">{product.category} · {product.fabric}</p>
            <h1 className="mt-3 font-display text-4xl leading-tight font-medium text-ink md:text-5xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(ratingToStars(product.rating)) ? "fill-gold text-gold" : "text-ink/20"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-ink-soft">
                {ratingToStars(product.rating).toFixed(1)} · {localReviews.length} review{localReviews.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <p className="font-display text-4xl font-semibold text-burgundy">{formatPKR(product.price)}</p>
              {product.compareAtPrice && (
                <p className="text-lg text-ink/40 line-through">{formatPKR(product.compareAtPrice)}</p>
              )}
            </div>
            <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-soft">
              <ShieldCheck className="h-4 w-4 text-burgundy" />
              Only {formatPKR(BUSINESS.advanceAmount)} due online — balance on delivery
            </p>

            <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">{product.description}</p>

            {/* colors */}
            <div className="mt-6 flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <span key={c} className="rounded-full bg-blush px-3.5 py-1.5 text-xs font-semibold text-ink">
                  {c}
                </span>
              ))}
            </div>

            {/* size */}
            <div className="mt-7">
              <p className="label">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-11 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition-all ${
                      size === s
                        ? "border-burgundy bg-burgundy text-cream shadow-card"
                        : "border-ink/15 bg-cream hover:border-burgundy/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* custom measurements */}
            <AnimatePresence initial={false}>
              {isCustom && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 rounded-2xl border border-gold/40 bg-blush/50 p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-ink">
                      <Ruler className="h-4 w-4 text-burgundy" /> Your measurements
                      <span className="text-xs font-medium text-ink-soft">(inches — optional but recommended)</span>
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {BUSINESS.measurementFields.map((f) => (
                        <div key={f.key}>
                          <label className="mb-1 block text-[11px] font-semibold text-ink-soft">{f.label}</label>
                          <div className="relative">
                            <input
                              inputMode="decimal"
                              value={measurements[f.key] ?? ""}
                              onChange={(e) =>
                                setMeasurements((m) => ({ ...m, [f.key]: e.target.value }))
                              }
                              placeholder="—"
                              className="field py-2 pr-9"
                            />
                            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold text-ink/35">IN</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* stitching notes */}
            <div className="mt-5">
              <label className="label" htmlFor="stitch-notes">Stitching instructions (optional)</label>
              <textarea
                id="stitch-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Loose fit preferred, add lace on daman, full sleeves with cuffs…"
                className="field resize-none"
              />
            </div>

            {/* qty + CTA */}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-ink/15 bg-cream">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:text-burgundy" aria-label="Decrease">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:text-burgundy" aria-label="Increase">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button onClick={() => addToCart(false)} className="btn-ghost flex-1 sm:flex-none">
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </button>
              <button onClick={() => addToCart(true)} className="btn-primary group flex-1 sm:flex-none">
                <AnimatePresence mode="wait" initial={false}>
                  {added ? (
                    <motion.span key="ok" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2">
                      <Check className="h-4 w-4" /> In your cart
                    </motion.span>
                  ) : (
                    <motion.span key="buy" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2">
                      Order Now · {formatPKR(BUSINESS.advanceAmount)} advance
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* accordions */}
            <div className="mt-8 space-y-3">
              <Accordion title="Size guide (inches)" icon={Ruler}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-ink/10 text-ink-soft">
                        <th className="py-2 pr-4">Size</th>
                        <th className="py-2 pr-4">Bust</th>
                        <th className="py-2 pr-4">Waist</th>
                        <th className="py-2 pr-4">Hips</th>
                        <th className="py-2">Shoulder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BUSINESS.sizeGuide.map((s) => (
                        <tr key={s.size} className="border-b border-ink/5">
                          <td className="py-2 pr-4 font-bold">{s.size}</td>
                          <td className="py-2 pr-4">{s.bust}</td>
                          <td className="py-2 pr-4">{s.waist}</td>
                          <td className="py-2 pr-4">{s.hips}</td>
                          <td className="py-2">{s.shoulder}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs text-ink-soft">
                    Between sizes? Choose <b>Custom</b> and enter your measurements for a made-for-you fit.
                  </p>
                </div>
              </Accordion>
              <Accordion title="Advance payment & delivery" icon={Truck}>
                <ul className="space-y-2 text-sm text-ink-soft">
                  <li className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-burgundy" />
                    {formatPKR(BUSINESS.advanceAmount)} advance (JazzCash / card) confirms your order and places it in the stitching queue.
                  </li>
                  <li className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-burgundy" />
                    Remaining {formatPKR(product.price - BUSINESS.advanceAmount)} (per piece) collected on delivery.
                  </li>
                  <li className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-burgundy" />
                    Turnaround: {product.category === "Bridal" ? BUSINESS.bridalTurnaround : BUSINESS.turnaround} · {BUSINESS.courierNote}
                  </li>
                </ul>
              </Accordion>
              <Accordion title="Need help deciding?" icon={MessageCircle}>
                <p className="text-sm text-ink-soft">
                  Message us on WhatsApp at <b>{BUSINESS.phoneDisplay}</b> with a reference photo — or ask Noor,
                  the AI assistant in the bottom-right corner, any sizing question.
                </p>
              </Accordion>
            </div>
          </motion.div>
        </div>
      </div>

      {/* reviews */}
      <section className="mt-24 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-3 font-display text-4xl font-medium text-ink">
            What wearers <span className="display-italic text-burgundy">say</span>
          </h2>
          <form onSubmit={submitReview} className="card mt-8 space-y-4 p-6">
            <p className="text-sm font-bold text-ink">Share your experience</p>
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setReviewRating(i + 1)}
                  aria-label={`Rate ${i + 1}`}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${i < reviewRating ? "fill-gold text-gold" : "text-ink/20 hover:text-gold"}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              required
              minLength={8}
              placeholder="How was the fit, fabric and finish?"
              className="field resize-none"
            />
            {reviewMsg && <p className="text-xs font-semibold text-burgundy">{reviewMsg}</p>}
            <button disabled={reviewBusy} className="btn-primary w-full">
              {reviewBusy ? "Posting…" : "Post Review"}
            </button>
            <p className="text-center text-[11px] text-ink/45">You need to be signed in to review.</p>
          </form>
        </div>

        <div className="space-y-4">
          {localReviews.length === 0 && (
            <p className="rounded-2xl border border-dashed border-ink/20 p-8 text-center text-sm text-ink-soft">
              No reviews yet for this design — be the first to wear it.
            </p>
          )}
          {localReviews.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="card p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">{r.authorName}</p>
                  <p className="text-xs text-ink/50">{r.location ?? "Pakistan"}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-ink/20"}`} />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{r.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl font-medium text-ink md:text-4xl">
            More from <span className="display-italic text-burgundy">{product.category.toLowerCase()}</span>
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
