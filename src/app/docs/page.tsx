import Link from "next/link";
import {
  Download,
  Database,
  FolderTree,
  ShieldCheck,
  CreditCard,
  Bot,
  Cloud,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { BUSINESS } from "@/lib/business";
import { Reveal } from "@/components/motion";

export const metadata = { title: "Technical Deliverables & Docs" };

const SCHEMA_SQL = `CREATE TYPE user_role        AS ENUM ('admin','customer');
CREATE TYPE order_status     AS ENUM ('pending_payment','confirmed','stitching','ready','shipped','completed','cancelled');
CREATE TYPE payment_status   AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE payment_provider AS ENUM ('stripe','jazzcash','sandbox');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         varchar(255) NOT NULL UNIQUE,
  name          varchar(120) NOT NULL,
  password_hash text,
  role          user_role NOT NULL DEFAULT 'customer',
  provider      auth_provider NOT NULL DEFAULT 'email',
  email_verified boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        varchar(180) NOT NULL UNIQUE,
  name        varchar(180) NOT NULL,
  description text NOT NULL,
  fabric      varchar(120) NOT NULL DEFAULT 'Lawn',
  category    varchar(60)  NOT NULL,
  colors      text[] NOT NULL DEFAULT '{}',
  sizes       text[] NOT NULL DEFAULT '{S,M,L,Custom}',
  price       integer NOT NULL,           -- PKR
  images      text[] NOT NULL DEFAULT '{}',
  featured    boolean NOT NULL DEFAULT false,
  active      boolean NOT NULL DEFAULT true,
  rating      integer NOT NULL DEFAULT 50, -- avg x10
  review_count integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number   varchar(24) NOT NULL UNIQUE,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status         order_status NOT NULL DEFAULT 'pending_payment',
  subtotal       integer NOT NULL,
  delivery_fee   integer NOT NULL DEFAULT 0,
  total          integer NOT NULL,
  advance_amount integer NOT NULL,          -- mandatory PKR 1,000
  balance_due    integer NOT NULL,          -- collected on delivery
  advance_paid   boolean NOT NULL DEFAULT false,
  payment_provider payment_provider,
  shipping_name    varchar(120) NOT NULL,
  shipping_phone   varchar(32)  NOT NULL,
  shipping_address text NOT NULL,
  shipping_city    varchar(120) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at    timestamptz
);

CREATE TABLE order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name varchar(180) NOT NULL,
  unit_price  integer NOT NULL,
  quantity    integer NOT NULL DEFAULT 1,
  size        varchar(24) NOT NULL DEFAULT 'Custom',
  measurements jsonb,                        -- bust, waist, hips…
  stitching_notes text
);

CREATE TABLE payments (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider payment_provider NOT NULL,
  amount   integer NOT NULL,                -- the PKR 1,000 advance
  status   payment_status NOT NULL DEFAULT 'pending',
  txn_ref  varchar(120),
  raw      jsonb,
  paid_at  timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE otp_codes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      varchar(255) NOT NULL,
  code_hash  text NOT NULL,                 -- sha256(email:code)
  purpose    otp_purpose NOT NULL,          -- verify | login | reset
  attempts   integer NOT NULL DEFAULT 0,    -- hard cap: 5
  expires_at timestamptz NOT NULL,          -- 10 minutes
  consumed_at timestamptz
);

CREATE TABLE order_events (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status  order_status NOT NULL,
  note    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name varchar(120) NOT NULL,
  rating     integer NOT NULL DEFAULT 5,
  text       text NOT NULL,
  approved   boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);`;

const TREE = `src/
├── app/
│   ├── (auth)/login · register · forgot-password · reset-password
│   ├── account/ · account/orders/[id]          # customer dashboard + tracking
│   ├── admin/                                  # RBAC-guarded owner studio
│   │   ├── page.tsx            # overview: stats, pipeline, stitching queue
│   │   ├── actions.ts          # server actions (product CRUD, order status)
│   │   ├── products/ · products/new · products/[id]
│   │   └── orders/ · orders/[id]
│   ├── api/
│   │   ├── auth/               # register · login · verify-otp · logout
│   │   │                       # forgot/reset-password · me · oauth/[provider]
│   │   ├── orders/             # server-priced order creation (advance rule)
│   │   ├── payments/           # initiate · callback · status · stripe/webhook
│   │   ├── chat/               # AI assistant (OpenAI w/ KB fallback)
│   │   ├── contact/ · reviews/
│   ├── shop/ · shop/[slug] · cart · checkout · payment/[orderId]
│   ├── contact/ · docs/
│   └── layout.tsx · globals.css
├── components/                 # header · footer · chat-widget · product-view
│                               # checkout · payment-flow · auth-form · admin/*
├── db/                         # schema.ts (Drizzle) · seed.ts
└── lib/                        # business · session(JWT) · password(scrypt)
                                # otp · rate-limit · payments(Stripe/JazzCash)
                                # oauth · assistant · utils`;

const SECTIONS = [
  {
    icon: Database,
    id: "schema",
    title: "Database schema",
    body: "PostgreSQL via Drizzle ORM — users, OTP codes, products, orders, order items (with JSONB measurements), payments, order events, reviews and contact messages. The advance rule is structural: every order carries advance_amount and advance_paid, and only flips to the stitching queue after a gateway callback.",
  },
  {
    icon: ShieldCheck,
    id: "auth",
    title: "Authentication & RBAC",
    body: "Email + password (scrypt-hashed) with a mandatory 6-digit OTP second factor, Google & Apple OAuth (activate by setting env keys), OTP password recovery, httpOnly JWT sessions (jose, 7 days), and role-based access: a single seeded admin (admin@dresses.pk / Dresses@Admin1) owns /admin; everyone else is a customer. OTP and auth endpoints are rate-limited per IP + per email, with 5-try attempt caps and 10-minute expiries.",
  },
  {
    icon: CreditCard,
    id: "payments",
    title: "Advance payment flow",
    body: `Every order is created as pending_payment with advance_amount = PKR ${BUSINESS.advanceAmount.toLocaleString()}. It is invisible to the stitching queue until /api/payments/callback (Stripe webhook, JazzCash return URL, or the built-in sandbox gateway) marks the advance paid — which flips status to "Order Confirmed / In Stitching" and appends a timeline event. Balance due = total − advance is collected COD. Stripe Checkout Sessions and JazzCash's HMAC-SHA256 signed form posts are both implemented; without keys the sandbox simulator exercises the identical server path.`,
  },
  {
    icon: Bot,
    id: "assistant",
    title: "AI assistant (Noor)",
    body: "Floating widget on every page, rate-limited, speaking from a business-truth system prompt (advance policy, sizing chart, turnaround, tracking, contact). With OPENAI_API_KEY it answers via GPT-4o-mini; without it, a curated rule-based knowledge base covers the same ground — so support never goes offline.",
  },
  {
    icon: Cloud,
    id: "cloudflare",
    title: "Cloudflare blueprint",
    body: "Point NS to Cloudflare → proxy (orange-cloud) the A record → SSL Full (Strict) → enable WAF managed rules + Bot Fight Mode → rate-limiting rules: 5 req/min on /api/auth/* and /api/payments/*, 30 req/10min on /api/chat → cache static /images/* with edge TTL 1 month → Brotli + HTTP/3 on. Full zone file and page rules ship inside the downloadable pack.",
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-40 pb-24 md:px-8 md:pt-44">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Technical Deliverables</p>
          <h1 className="mt-3 font-display text-5xl font-medium text-ink md:text-6xl">
            Build <span className="display-italic text-burgundy">documentation</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Everything behind this storefront — schema, structure, auth, payments, the AI
            assistant and the security blueprint — documented and packaged for download.
          </p>
        </div>
        <a href="/downloads/dresses-deliverables.zip" download className="btn-dark">
          <Download className="h-4 w-4" /> Download Docs Pack (.zip)
        </a>
      </div>

      {/* quick nav */}
      <div className="mt-8 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip">
            {s.title}
          </a>
        ))}
        <a href="#sql" className="chip">Full SQL</a>
        <a href="#tree" className="chip">Project Tree</a>
      </div>

      <div className="mt-12 space-y-6">
        {SECTIONS.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.04}>
            <section id={s.id} className="card scroll-mt-36 p-8">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-burgundy/10">
                  <s.icon className="h-5 w-5 text-burgundy" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-medium text-ink">{s.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              </div>
            </section>
          </Reveal>
        ))}
      </div>

      {/* schema SQL */}
      <Reveal>
        <section id="sql" className="card mt-6 scroll-mt-36 overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink/10 bg-blush/50 px-6 py-4">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <FileText className="h-4 w-4 text-burgundy" /> schema.sql — core tables
            </p>
            <a href="/downloads/dresses-deliverables.zip" className="inline-flex items-center gap-1 text-xs font-bold text-burgundy link-underline">
              Get full file <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <pre className="thin-scroll max-h-[480px] overflow-auto bg-ink p-6 font-mono text-[12px] leading-relaxed text-cream/85">
            {SCHEMA_SQL}
          </pre>
        </section>
      </Reveal>

      {/* tree */}
      <Reveal>
        <section id="tree" className="card mt-6 scroll-mt-36 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink/10 bg-blush/50 px-6 py-4">
            <FolderTree className="h-4 w-4 text-burgundy" />
            <p className="text-sm font-bold text-ink">Modular Next.js (App Router) structure</p>
          </div>
          <pre className="thin-scroll overflow-auto bg-cream p-6 font-mono text-[12px] leading-relaxed text-ink-soft">
            {TREE}
          </pre>
        </section>
      </Reveal>

      {/* env */}
      <Reveal>
        <section className="card mt-6 p-8">
          <h2 className="font-display text-2xl font-medium text-ink">Environment keys</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Everything works out-of-the-box with the sandbox gateway and KB assistant. Add any of
            these to go fully live — no code changes needed:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET", "Live card payments + instant webhook confirmation"],
              ["JAZZCASH_MERCHANT_ID / JAZZCASH_PASSWORD / JAZZCASH_INTEGRITY_SALT", "JazzCash mobile wallet gateway"],
              ["GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET", "Google OAuth sign-in"],
              ["APPLE_CLIENT_ID / APPLE_CLIENT_SECRET", "Apple OAuth sign-in"],
              ["OPENAI_API_KEY", "GPT-powered assistant answers"],
              ["EMAIL_DELIVERY=live", "Route OTP codes through real email"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-ivory px-4 py-3">
                <p className="font-mono text-[11px] font-bold text-burgundy">{k}</p>
                <p className="mt-1 text-xs text-ink-soft">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-ink/50">
            Seeded admin: <b>admin@dresses.pk</b> / <b>Dresses@Admin1</b> (OTP still applies — in dev the code is surfaced on screen). Questions? Ask <Link href="/contact" className="text-burgundy link-underline">Noor or the contact page</Link>.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
