import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ---------------------------------- enums --------------------------------- */

export const userRoleEnum = pgEnum("user_role", ["admin", "customer"]);

export const authProviderEnum = pgEnum("auth_provider", [
  "email",
  "google",
  "apple",
]);

export const otpPurposeEnum = pgEnum("otp_purpose", [
  "verify", // verify new account
  "login", // login second factor
  "reset", // password reset
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment", // created, waiting for the PKR 1,000 advance
  "confirmed", // advance received -> entered stitching queue
  "stitching", // actively being stitched
  "ready", // finished, ready to dispatch
  "shipped", // handed to courier
  "completed", // delivered + balance collected
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "stripe",
  "jazzcash",
  "sandbox", // local gateway simulator (no live keys configured)
]);

/* --------------------------------- tables --------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("customer"),
    provider: authProviderEnum("provider").notNull().default("email"),
    avatarUrl: text("avatar_url"),
    phone: varchar("phone", { length: 32 }),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    codeHash: text("code_hash").notNull(),
    purpose: otpPurposeEnum("purpose").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("otp_email_purpose_idx").on(t.email, t.purpose)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description").notNull(),
    fabric: varchar("fabric", { length: 120 }).notNull().default("Lawn"),
    category: varchar("category", { length: 60 }).notNull(), // Formal | Bridal | Party | Casual
    colors: text("colors").array().notNull().default([]),
    sizes: text("sizes").array().notNull().default(["S", "M", "L", "Custom"]),
    price: integer("price").notNull(), // PKR
    compareAtPrice: integer("compare_at_price"),
    images: text("images").array().notNull().default([]),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    madeToOrder: boolean("made_to_order").notNull().default(true),
    rating: integer("rating").notNull().default(50), // avg rating x10 (5.0 -> 50)
    reviewCount: integer("review_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_category_idx").on(t.category),
    index("products_active_idx").on(t.active),
  ],
);

export type Measurements = {
  bust?: string;
  waist?: string;
  hips?: string;
  shoulder?: string;
  sleeves?: string;
  length?: string;
  trouser?: string;
  notes?: string;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: varchar("order_number", { length: 24 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending_payment"),
    subtotal: integer("subtotal").notNull(), // PKR
    deliveryFee: integer("delivery_fee").notNull().default(0),
    total: integer("total").notNull(), // subtotal + deliveryFee
    advanceAmount: integer("advance_amount").notNull(), // mandatory PKR 1,000
    balanceDue: integer("balance_due").notNull(), // total - advance
    advancePaid: boolean("advance_paid").notNull().default(false),
    paymentProvider: paymentProviderEnum("payment_provider"),
    shippingName: varchar("shipping_name", { length: 120 }).notNull(),
    shippingPhone: varchar("shipping_phone", { length: 32 }).notNull(),
    shippingAddress: text("shipping_address").notNull(),
    shippingCity: varchar("shipping_city", { length: 120 }).notNull(),
    customerNote: text("customer_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.orderNumber),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 180 }).notNull(),
    productImage: text("product_image"),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull().default(1),
    size: varchar("size", { length: 24 }).notNull().default("Custom"),
    measurements: jsonb("measurements").$type<Measurements>(),
    stitchingNotes: text("stitching_notes"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    amount: integer("amount").notNull(), // advance amount in PKR
    currency: varchar("currency", { length: 8 }).notNull().default("PKR"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    txnRef: varchar("txn_ref", { length: 120 }),
    sessionId: varchar("session_id", { length: 160 }),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    authorName: varchar("author_name", { length: 120 }).notNull(),
    location: varchar("location", { length: 120 }),
    rating: integer("rating").notNull().default(5),
    text: text("text").notNull(),
    approved: boolean("approved").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------------------------------- types --------------------------------- */

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Review = typeof reviews.$inferSelect;
