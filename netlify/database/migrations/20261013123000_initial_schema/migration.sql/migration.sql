CREATE TYPE "user_role" AS ENUM ('admin', 'customer');
CREATE TYPE "auth_provider" AS ENUM ('email', 'google', 'apple');
CREATE TYPE "otp_purpose" AS ENUM ('verify', 'login', 'reset');
CREATE TYPE "order_status" AS ENUM ('pending_payment', 'confirmed', 'stitching', 'ready', 'shipped', 'completed', 'cancelled');
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE "payment_provider" AS ENUM ('stripe', 'jazzcash', 'sandbox');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "name" varchar(120) NOT NULL,
  "password_hash" text,
  "role" "user_role" DEFAULT 'customer' NOT NULL,
  "provider" "auth_provider" DEFAULT 'email' NOT NULL,
  "avatar_url" text,
  "phone" varchar(32),
  "email_verified" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");

CREATE TABLE "otp_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "code_hash" text NOT NULL,
  "purpose" "otp_purpose" NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "consumed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "otp_email_purpose_idx" ON "otp_codes" ("email", "purpose");

CREATE TABLE "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(180) NOT NULL,
  "name" varchar(180) NOT NULL,
  "description" text NOT NULL,
  "fabric" varchar(120) DEFAULT 'Lawn' NOT NULL,
  "category" varchar(60) NOT NULL,
  "colors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
  "sizes" text[] DEFAULT ARRAY['S','M','L','Custom']::text[] NOT NULL,
  "price" integer NOT NULL,
  "compare_at_price" integer,
  "images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
  "featured" boolean DEFAULT false NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "made_to_order" boolean DEFAULT true NOT NULL,
  "rating" integer DEFAULT 50 NOT NULL,
  "review_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "products_slug_idx" ON "products" ("slug");
CREATE INDEX "products_category_idx" ON "products" ("category");
CREATE INDEX "products_active_idx" ON "products" ("active");

CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_number" varchar(24) NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" "order_status" DEFAULT 'pending_payment' NOT NULL,
  "subtotal" integer NOT NULL,
  "delivery_fee" integer DEFAULT 0 NOT NULL,
  "total" integer NOT NULL,
  "advance_amount" integer NOT NULL,
  "balance_due" integer NOT NULL,
  "advance_paid" boolean DEFAULT false NOT NULL,
  "payment_provider" "payment_provider",
  "shipping_name" varchar(120) NOT NULL,
  "shipping_phone" varchar(32) NOT NULL,
  "shipping_address" text NOT NULL,
  "shipping_city" varchar(120) NOT NULL,
  "customer_note" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "paid_at" timestamptz
);
CREATE UNIQUE INDEX "orders_number_idx" ON "orders" ("order_number");
CREATE INDEX "orders_user_idx" ON "orders" ("user_id");
CREATE INDEX "orders_status_idx" ON "orders" ("status");

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "product_name" varchar(180) NOT NULL,
  "product_image" text,
  "unit_price" integer NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "size" varchar(24) DEFAULT 'Custom' NOT NULL,
  "measurements" jsonb,
  "stitching_notes" text
);
CREATE INDEX "order_items_order_idx" ON "order_items" ("order_id");

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "provider" "payment_provider" NOT NULL,
  "amount" integer NOT NULL,
  "currency" varchar(8) DEFAULT 'PKR' NOT NULL,
  "status" "payment_status" DEFAULT 'pending' NOT NULL,
  "txn_ref" varchar(120),
  "session_id" varchar(160),
  "raw" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "paid_at" timestamptz
);
CREATE INDEX "payments_order_idx" ON "payments" ("order_id");

CREATE TABLE "order_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "status" "order_status" NOT NULL,
  "note" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "order_events_order_idx" ON "order_events" ("order_id");

CREATE TABLE "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "author_name" varchar(120) NOT NULL,
  "location" varchar(120),
  "rating" integer DEFAULT 5 NOT NULL,
  "text" text NOT NULL,
  "approved" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "reviews_product_idx" ON "reviews" ("product_id");

CREATE TABLE "contact_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(120) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(32),
  "message" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
