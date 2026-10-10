-- ═══════════════════════════════════════════════════════════════════════════
-- DRESSES — custom stitching e-commerce · PostgreSQL schema
-- Mirrors src/db/schema.ts (Drizzle ORM). Apply with: psql $DATABASE_URL -f schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role        AS ENUM ('admin', 'customer');
CREATE TYPE auth_provider    AS ENUM ('email', 'google', 'apple');
CREATE TYPE otp_purpose      AS ENUM ('verify', 'login', 'reset');
CREATE TYPE order_status     AS ENUM ('pending_payment', 'confirmed', 'stitching', 'ready', 'shipped', 'completed', 'cancelled');
CREATE TYPE payment_status   AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_provider AS ENUM ('stripe', 'jazzcash', 'sandbox');

-- ── Users & RBAC ────────────────────────────────────────────────────────────
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          varchar(255) NOT NULL,
  name           varchar(120) NOT NULL,
  password_hash  text,                          -- scrypt salt:hash (null for OAuth-only)
  role           user_role NOT NULL DEFAULT 'customer',
  provider       auth_provider NOT NULL DEFAULT 'email',
  avatar_url     text,
  phone          varchar(32),
  email_verified boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_idx ON users (email);

-- ── One-time passwords (hashed, expiring, attempt-capped) ──────────────────
CREATE TABLE otp_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       varchar(255) NOT NULL,
  code_hash   text NOT NULL,                    -- sha256(email:code)
  purpose     otp_purpose NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,       -- hard cap at 5 (app-enforced)
  expires_at  timestamptz NOT NULL,             -- 10 minutes
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_email_purpose_idx ON otp_codes (email, purpose);

-- ── Catalogue ───────────────────────────────────────────────────────────────
CREATE TABLE products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             varchar(180) NOT NULL,
  name             varchar(180) NOT NULL,
  description      text NOT NULL,
  fabric           varchar(120) NOT NULL DEFAULT 'Lawn',
  category         varchar(60)  NOT NULL,       -- Formal | Bridal | Party | Casual
  colors           text[] NOT NULL DEFAULT '{}',
  sizes            text[] NOT NULL DEFAULT '{S,M,L,Custom}',
  price            integer NOT NULL,            -- PKR
  compare_at_price integer,
  images           text[] NOT NULL DEFAULT '{}',
  featured         boolean NOT NULL DEFAULT false,
  active           boolean NOT NULL DEFAULT true,
  made_to_order    boolean NOT NULL DEFAULT true,
  rating           integer NOT NULL DEFAULT 50, -- average × 10 (50 = 5.0★)
  review_count     integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX products_slug_idx ON products (slug);
CREATE INDEX products_category_idx ON products (category);
CREATE INDEX products_active_idx   ON products (active);

-- ── Orders (advance-payment gated) ─────────────────────────────────────────
CREATE TABLE orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     varchar(24) NOT NULL,
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           order_status NOT NULL DEFAULT 'pending_payment',
  subtotal         integer NOT NULL,
  delivery_fee     integer NOT NULL DEFAULT 0,
  total            integer NOT NULL,
  advance_amount   integer NOT NULL,            -- mandatory PKR 1,000
  balance_due      integer NOT NULL,            -- total − advance → COD
  advance_paid     boolean NOT NULL DEFAULT false,
  payment_provider payment_provider,
  shipping_name    varchar(120) NOT NULL,
  shipping_phone   varchar(32)  NOT NULL,
  shipping_address text NOT NULL,
  shipping_city    varchar(120) NOT NULL,
  customer_note    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  paid_at          timestamptz
);
CREATE UNIQUE INDEX orders_number_idx ON orders (order_number);
CREATE INDEX orders_user_idx   ON orders (user_id);
CREATE INDEX orders_status_idx ON orders (status);

CREATE TABLE order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name    varchar(180) NOT NULL,
  product_image   text,
  unit_price      integer NOT NULL,
  quantity        integer NOT NULL DEFAULT 1,
  size            varchar(24) NOT NULL DEFAULT 'Custom',
  measurements    jsonb,                        -- {bust, waist, hips, shoulder, sleeves, length, trouser}
  stitching_notes text
);
CREATE INDEX order_items_order_idx ON order_items (order_id);

-- ── Payments (advance deposit) ──────────────────────────────────────────────
CREATE TABLE payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider   payment_provider NOT NULL,
  amount     integer NOT NULL,                  -- the PKR 1,000 advance
  currency   varchar(8) NOT NULL DEFAULT 'PKR',
  status     payment_status NOT NULL DEFAULT 'pending',
  txn_ref    varchar(120),
  session_id varchar(160),                      -- Stripe checkout session id
  raw        jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at    timestamptz
);
CREATE INDEX payments_order_idx ON payments (order_id);

-- ── Order timeline (tracking) ───────────────────────────────────────────────
CREATE TABLE order_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     order_status NOT NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON order_events (order_id);

-- ── Reviews ─────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name varchar(120) NOT NULL,
  location    varchar(120),
  rating      integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  text        text NOT NULL,
  approved    boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_product_idx ON reviews (product_id);

-- ── Contact inbox ───────────────────────────────────────────────────────────
CREATE TABLE contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(120) NOT NULL,
  email      varchar(255) NOT NULL,
  phone      varchar(32),
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
