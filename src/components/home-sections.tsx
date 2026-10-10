"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Star,
  Scissors,
  Ruler,
  CreditCard,
  Truck,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  Quote,
  BadgeCheck,
} from "lucide-react";
import { useRef } from "react";
import { BUSINESS } from "@/lib/business";
import { formatPKR } from "@/lib/utils";
import { Marquee, Reveal, StaggerGroup, StaggerItem } from "./motion";
import { ProductCard } from "./product-card";
import type { Product, Review } from "@/db/schema";

/* ---------------------------------- hero ---------------------------------- */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-40 pb-16 md:pt-48 md:pb-24">
      {/* ambient washes */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-40 h-[520px] w-[520px] rounded-full bg-burgundy/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-[1.15fr_1fr]">
        <motion.div style={{ y: textY }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-cream/60 px-4 py-2 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span className="text-[11px] font-bold tracking-[0.24em] text-ink-soft uppercase">
              Home atelier · {BUSINESS.city}, Pakistan
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-display text-[13.5vw] leading-[0.94] font-medium tracking-tight text-ink sm:text-6xl md:text-7xl xl:text-[86px]"
          >
            Stitched to
            <br />
            <span className="display-italic text-burgundy">your silhouette,</span>
            <br />
            not a size chart.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink-soft md:text-base"
          >
            Bridal, formal and everyday wear — cut and sewn by hand in our Narowal
            atelier from your exact measurements. Confirm with a {formatPKR(BUSINESS.advanceAmount)}{" "}
            advance, pay the rest when it arrives at your door.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link href="/shop" className="btn-primary group">
              Explore the Collection
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a href={BUSINESS.whatsapp} target="_blank" rel="noreferrer" className="btn-ghost">
              <MessageCircle className="h-4 w-4" /> {BUSINESS.phoneDisplay}
            </a>
          </motion.div>

          {/* stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="mt-12 flex divide-x divide-ink/10"
          >
            {[
              ["500+", "dresses stitched"],
              ["4.9", "avg. rating"],
              [`${formatPKR(BUSINESS.advanceAmount)}`, "advance only"],
            ].map(([v, l]) => (
              <div key={l} className="pr-7 pl-7 first:pl-0">
                <p className="font-display text-3xl font-semibold text-burgundy md:text-4xl">{v}</p>
                <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] text-ink-soft uppercase">{l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* hero visual */}
        <motion.div style={{ y: imgY }} className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-t-[999px] rounded-b-[28px] shadow-luxe"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero.jpg" alt="Bride in a red DRESSES bridal lehenga" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-wine/35 via-transparent to-transparent" />
          </motion.div>

          {/* floating advance badge */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-1/4 -left-3 card flex items-center gap-3 px-4 py-3 md:-left-10"
          >
            <ShieldCheck className="h-8 w-8 text-burgundy" />
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-ink-soft uppercase">Advance only</p>
              <p className="font-display text-lg leading-none font-semibold text-burgundy">
                {formatPKR(BUSINESS.advanceAmount)}
              </p>
            </div>
          </motion.div>

          {/* floating review */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -right-2 bottom-10 card max-w-[220px] px-4 py-3 md:-right-8"
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-gold text-gold" />
              ))}
            </div>
            <p className="mt-1.5 text-xs leading-snug text-ink-soft">
              “Fit like it was poured onto me.”
            </p>
            <p className="mt-1 text-[10px] font-bold tracking-wider text-burgundy uppercase">Ayesha · Lahore</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------- marquee --------------------------------- */

function WordMarquee() {
  return (
    <div className="border-y border-ink/10 bg-cream py-5">
      <Marquee>
        {["Bridal", "Formal", "Party Wear", "Casual Lawn", "Custom Fit", "Zardozi", "Made in Narowal"].map(
          (w) => (
            <span key={w} className="mx-8 flex items-center gap-8 whitespace-nowrap">
              <span className="font-display text-3xl tracking-wide text-ink/85 md:text-4xl">{w}</span>
              <span className="h-2 w-2 rotate-45 bg-gold" />
            </span>
          ),
        )}
      </Marquee>
    </div>
  );
}

/* ------------------------------- collections ------------------------------- */

function Collections() {
  const cols = [
    { name: "Bridal", img: "/images/products/p11.jpg", note: "Lehengas & trousseau", from: "PKR 54,500" },
    { name: "Formal", img: "/images/products/p06.jpg", note: "Velvets & raw silks", from: "PKR 10,900" },
    { name: "Party", img: "/images/products/p08.jpg", note: "Anarkalis & gowns", from: "PKR 11,200" },
    { name: "Casual", img: "/images/products/p05.jpg", note: "Lawn & cambric", from: "PKR 5,800" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Reveal>
          <p className="eyebrow">Collections</p>
          <h2 className="mt-3 font-display text-4xl font-medium text-ink md:text-5xl">
            Four moods, <span className="display-italic text-burgundy">one needle</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Link href="/shop" className="btn-ghost">
            View everything <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>

      <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cols.map((c) => (
          <StaggerItem key={c.name}>
            <Link href={`/shop?category=${c.name}`} className="group block">
              <div className="img-zoom relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-cream">
                  <p className="text-[10px] font-bold tracking-[0.22em] text-gold-light uppercase">{c.note}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-display text-2xl font-medium">{c.name}</p>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-cream/15 backdrop-blur transition-transform duration-500 group-hover:rotate-45">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-cream/75">from {c.from}</p>
                </div>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

/* -------------------------------- featured -------------------------------- */

function Featured({ products }: { products: Product[] }) {
  return (
    <section className="bg-blush/60 py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="eyebrow">Most Loved</p>
            <h2 className="mt-3 font-display text-4xl font-medium text-ink md:text-5xl">
              The <span className="display-italic text-burgundy">signature</span> rack
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-xs text-sm text-ink-soft">
              Bestsellers re-stitched on demand — pick a standard size or go fully custom.
            </p>
          </Reveal>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {products.slice(0, 8).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- atelier --------------------------------- */

function Atelier() {
  return (
    <section id="atelier" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-24 md:px-8">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        {/* collage */}
        <div className="relative">
          <Reveal className="relative z-10 aspect-[4/5] w-[78%] overflow-hidden rounded-2xl shadow-luxe">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/atelier/atelier-1.jpg" alt="Seamstress stitching fabric" className="h-full w-full object-cover" />
          </Reveal>
          <Reveal
            delay={0.15}
            className="absolute right-0 -bottom-10 z-20 aspect-square w-[52%] overflow-hidden rounded-2xl border-8 border-ivory shadow-luxe md:-bottom-14"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/atelier/atelier-3.jpg" alt="Hands at a sewing machine" className="h-full w-full object-cover" />
          </Reveal>
          <Reveal
            delay={0.25}
            className="absolute -top-8 right-6 z-0 aspect-[4/3] w-[46%] overflow-hidden rounded-2xl shadow-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/atelier/atelier-2.jpg" alt="Cutting fabric" className="h-full w-full object-cover" />
          </Reveal>
        </div>

        {/* copy */}
        <div className="pt-10 lg:pt-0">
          <Reveal>
            <p className="eyebrow">The Atelier</p>
            <h2 className="mt-3 font-display text-4xl leading-tight font-medium text-ink md:text-5xl">
              A home workshop in Narowal,
              <span className="display-italic text-burgundy"> a standard you can feel</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">
              DRESSES began at a single sewing table and grew one delighted customer at a
              time. Every piece is still measured twice, cut by hand, and finished with
              the kind of inside-seams that boutiques photograph. No factory lines — just
              fabric, thread, and stubborn attention.
            </p>
          </Reveal>
          <div className="mt-8 space-y-3">
            {BUSINESS.policies.slice(0, 4).map((p, i) => (
              <Reveal key={i} delay={0.12 + i * 0.05}>
                <div className="flex items-start gap-3 rounded-xl border border-ink/10 bg-cream/70 px-4 py-3">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-burgundy" />
                  <p className="text-sm text-ink-soft">{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- process --------------------------------- */

function Process() {
  const steps = [
    {
      icon: Scissors,
      title: "Pick & personalize",
      text: "Choose a design, then a standard size or full custom measurements — bust, waist, sleeves, length, all of it.",
    },
    {
      icon: CreditCard,
      title: `Pay ${formatPKR(BUSINESS.advanceAmount)} advance`,
      text: "A small mandatory advance by JazzCash or card confirms your order and moves it into the stitching queue.",
      highlight: true,
    },
    {
      icon: Ruler,
      title: "We cut & stitch",
      text: `Standard orders ship in ${BUSINESS.turnaround}; bridal takes ${BUSINESS.bridalTurnaround}. Watch every status live in your account.`,
    },
    {
      icon: Truck,
      title: "Delivered to your door",
      text: `Nationwide courier with the remaining balance collected on delivery (COD). ${BUSINESS.courierNote.split(".")[0]}.`,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-wine py-24 text-cream">
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{ backgroundImage: "url(/images/silk-texture.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold tracking-[0.28em] text-gold-light uppercase">How it works</p>
          <h2 className="mt-3 font-display text-4xl font-medium md:text-5xl">
            From reference photo to
            <span className="display-italic text-gold-light"> your doorstep</span>
          </h2>
        </Reveal>

        <StaggerGroup className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((s, i) => (
            <StaggerItem key={s.title}>
              <div
                className={`relative h-full rounded-2xl border p-6 backdrop-blur transition-transform duration-500 hover:-translate-y-1.5 ${
                  s.highlight
                    ? "border-gold/60 bg-gold/10"
                    : "border-cream/15 bg-cream/[0.06]"
                }`}
              >
                <span className="absolute top-5 right-5 font-display text-5xl font-semibold text-cream/10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className={`grid h-12 w-12 place-items-center rounded-full ${
                    s.highlight ? "bg-gold text-ink" : "bg-cream/10 text-gold-light"
                  }`}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/70">{s.text}</p>
                {s.highlight && (
                  <p className="mt-3 inline-block rounded-full bg-gold px-3 py-1 text-[10px] font-black tracking-widest text-ink uppercase">
                    Mandatory for every order
                  </p>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

/* --------------------------------- reviews --------------------------------- */

function ReviewCard({ r }: { r: Review }) {
  return (
    <div className="card mx-3 w-[320px] shrink-0 p-6 md:w-[380px]">
      <Quote className="h-6 w-6 text-gold" />
      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink-soft">{r.text}</p>
      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-ink">{r.authorName}</p>
          <p className="text-xs text-ink/50">{r.location ?? "Pakistan"}</p>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-ink/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Reviews({ reviews }: { reviews: Review[] }) {
  const half = Math.ceil(reviews.length / 2);
  const rowA = reviews.slice(0, half);
  const rowB = reviews.slice(half);
  return (
    <section id="reviews" className="scroll-mt-32 overflow-hidden py-24">
      <Reveal className="mx-auto max-w-2xl px-5 text-center">
        <p className="eyebrow">Word of Mouth</p>
        <h2 className="mt-3 font-display text-4xl font-medium text-ink md:text-5xl">
          Stitched into <span className="display-italic text-burgundy">their stories</span>
        </h2>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-cream px-4 py-2">
          <Star className="h-4 w-4 fill-gold text-gold" />
          <span className="text-sm font-bold text-ink">4.9 / 5</span>
          <span className="text-xs text-ink-soft">from 120+ happy customers</span>
        </div>
      </Reveal>

      <div className="mt-12 space-y-5">
        <Marquee slow>
          {rowA.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </Marquee>
        <Marquee slow reverse>
          {rowB.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ----------------------------------- CTA ----------------------------------- */

function Cta() {
  return (
    <section className="px-5 pb-24 md:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-burgundy px-6 py-20 text-center text-cream shadow-luxe md:py-28">
        <div
          className="absolute inset-0 opacity-25"
          style={{ backgroundImage: "url(/images/silk-texture.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/25 blur-3xl" />
        <Reveal className="relative">
          <p className="text-[11px] font-bold tracking-[0.3em] text-gold-light uppercase">
            Only {formatPKR(BUSINESS.advanceAmount)} to begin
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight font-medium md:text-6xl">
            Your dream dress is
            <span className="display-italic text-gold-light"> one advance away</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cream/75 md:text-base">
            Send your measurements, pay the {formatPKR(BUSINESS.advanceAmount)} advance by
            JazzCash or card, and we start cutting. The balance waits until the parcel is in your hands.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/shop" className="btn-gold">
              Start an Order <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={BUSINESS.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-7 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-cream/10"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- exporter -------------------------------- */

export function HomeSections({ featured, reviews }: { featured: Product[]; reviews: Review[] }) {
  return (
    <>
      <Hero />
      <WordMarquee />
      <Collections />
      <Featured products={featured} />
      <Atelier />
      <Process />
      <Reviews reviews={reviews} />
      <Cta />
    </>
  );
}
