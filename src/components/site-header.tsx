"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ShoppingBag, User, Sparkles, ShieldCheck } from "lucide-react";
import { useCart } from "./cart-provider";
import { Marquee } from "./motion";
import { BUSINESS } from "@/lib/business";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=Bridal", label: "Bridal" },
  { href: "/#atelier", label: "Atelier" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
  { href: "/docs", label: "Docs" },
];

type Me = { name: string; email: string; role: "admin" | "customer" } | null;

export function SiteHeader() {
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d?.user ?? null))
      .catch(() => setMe(null));
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* announcement marquee */}
      <div className="bg-burgundy py-1.5 text-cream">
        <Marquee slow>
          {[
            "PKR 1,000 advance confirms every order",
            "Hand-stitched in Narowal, Pakistan",
            `Standard delivery in ${BUSINESS.turnaround}`,
            "Remaining balance on delivery (COD)",
            "Custom measurements on every design",
          ].map((t) => (
            <span
              key={t}
              className="mx-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] whitespace-nowrap"
            >
              <Sparkles className="h-3 w-3 text-gold-light" /> {t}
            </span>
          ))}
        </Marquee>
      </div>

      {/* nav bar */}
      <div
        className={`transition-all duration-500 ${
          scrolled
            ? "bg-ivory/85 shadow-[0_10px_40px_-20px_rgb(29_22_16/0.4)] backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="group flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-semibold tracking-[0.18em] text-ink transition-colors group-hover:text-burgundy md:text-[27px]">
              DRESSES
            </span>
            <span className="mb-1 inline-block h-2 w-2 rounded-full bg-gold transition-transform duration-300 group-hover:scale-150" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="link-underline text-[13px] font-semibold tracking-[0.14em] text-ink/80 uppercase hover:text-burgundy"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {me?.role === "admin" && (
              <Link
                href="/admin"
                className="hidden items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-[11px] font-bold tracking-wider text-gold uppercase transition-colors hover:bg-gold hover:text-ink md:inline-flex"
                title="Admin dashboard"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <Link
              href={me ? "/account" : "/login"}
              aria-label="Account"
              className="relative rounded-full border border-ink/15 p-2.5 text-ink transition-all hover:border-burgundy hover:text-burgundy"
            >
              <User className="h-[18px] w-[18px]" />
              {me && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-600 ring-2 ring-ivory" />
              )}
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative rounded-full border border-ink/15 p-2.5 text-ink transition-all hover:border-burgundy hover:text-burgundy"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-burgundy px-1 text-[10px] font-bold text-cream"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              className="rounded-full border border-ink/15 p-2.5 lg:hidden"
            >
              {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-4 rounded-2xl border border-ink/10 bg-cream/95 p-4 shadow-luxe backdrop-blur-xl lg:hidden"
          >
            {NAV.map((n, i) => (
              <motion.div
                key={n.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link
                  href={n.href}
                  className="block rounded-xl px-4 py-3 font-display text-xl tracking-wide text-ink transition-colors hover:bg-blush hover:text-burgundy"
                >
                  {n.label}
                </Link>
              </motion.div>
            ))}
            {me?.role === "admin" && (
              <Link
                href="/admin"
                className="mt-2 flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-gold"
              >
                <ShieldCheck className="h-4 w-4" /> Admin Dashboard
              </Link>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
