import Link from "next/link";
import {
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowUpRight,
} from "lucide-react";
import { BUSINESS } from "@/lib/business";

export function SiteFooter() {
  return (
    <footer className="relative mt-0 overflow-hidden bg-wine text-cream">
      {/* oversized wordmark */}
      <div className="pointer-events-none absolute inset-x-0 -top-6 select-none">
        <p className="text-center font-display text-[22vw] leading-none font-bold tracking-tight whitespace-nowrap text-cream/[0.045]">
          DRESSES
        </p>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pt-24 pb-10 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
          {/* brand */}
          <div>
            <p className="font-display text-3xl tracking-[0.14em]">
              DRESSES<span className="text-gold">.</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
              {BUSINESS.description}
            </p>
            <a href={BUSINESS.whatsapp} target="_blank" rel="noreferrer" className="btn-gold mt-6">
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>

          {/* explore */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.28em] text-gold-light uppercase">
              Explore
            </p>
            <ul className="mt-5 space-y-3 text-sm text-cream/75">
              {[
                ["Shop All", "/shop"],
                ["Bridal Collection", "/shop?category=Bridal"],
                ["Formal Wear", "/shop?category=Formal"],
                ["Party Wear", "/shop?category=Party"],
                ["Casual & Lawn", "/shop?category=Casual"],
                ["Customer Reviews", "/#reviews"],
                ["Track Your Order", "/account"],
                ["Developer Docs", "/docs"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="link-underline transition-colors hover:text-gold-light">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* contact */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.28em] text-gold-light uppercase">
              Contact
            </p>
            <ul className="mt-5 space-y-4 text-sm text-cream/75">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
                <span>
                  <a href={`tel:${BUSINESS.phoneIntl}`} className="link-underline hover:text-gold-light">
                    {BUSINESS.phoneDisplay}
                  </a>
                  <span className="block text-xs text-cream/50">Call & WhatsApp</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
                <span>
                  {BUSINESS.address}
                  <span className="block text-xs text-cream/50">Home-based atelier — online orders only</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
                <span>{BUSINESS.hours}</span>
              </li>
            </ul>

            <div className="mt-6 space-y-2 text-xs text-cream/60">
              <p className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-gold-light" /> Debit / Credit cards via Stripe
              </p>
              <p className="flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-gold-light" /> JazzCash mobile wallet
              </p>
              <p className="flex items-center gap-2">
                <Banknote className="h-3.5 w-3.5 text-gold-light" /> Balance on delivery (COD)
              </p>
            </div>
          </div>

          {/* map */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.28em] text-gold-light uppercase">
              Find Us in Narowal
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-cream/15 shadow-luxe">
              <iframe
                title="DRESSES — Narowal, Pakistan"
                src={BUSINESS.mapEmbed}
                className="h-56 w-full grayscale-[35%] invert-[0.9] hue-rotate-180 contrast-[0.95] md:h-64"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Narowal,+Punjab,+Pakistan"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold-light link-underline"
            >
              Open in Google Maps <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-[11px] tracking-[0.18em] text-cream/45 uppercase md:flex-row">
          <p>© {new Date().getFullYear()} {BUSINESS.name} · Narowal, Pakistan</p>
          <p>PKR 1,000 advance · COD balance · Made with patience</p>
          <Link href="/admin" className="link-underline hover:text-gold-light">
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
