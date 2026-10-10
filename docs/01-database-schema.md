# 01 — Database Schema

PostgreSQL, managed with Drizzle ORM (`src/db/schema.ts`). `schema.sql` contains
the equivalent raw DDL.

## Tables

### users
| column | notes |
|---|---|
| id (uuid pk) | |
| email (unique) | lowercase-normalized |
| name | |
| password_hash | scrypt `salt:hash`, null for OAuth-only accounts |
| role | enum `admin | customer` — single admin |
| provider | enum `email | google | apple` |
| email_verified | set true after OTP / OAuth |
| avatar_url, phone, created_at | |

### otp_codes
Hashed 6-digit codes (`sha256(email:code)`), purpose `verify|login|reset`,
10-minute expiry, 5 attempt cap, consumed-on-use. Rate limits are enforced
before insert (45s burst + 5/hour per email, enforced in code).

### products
slug (unique), name, description, fabric, category (`Formal|Bridal|Party|Casual`),
colors text[], sizes text[] (incl. `Custom`), price **PKR integer**,
compare_at_price, images text[], featured/active flags, denormalized
`rating` (avg × 10) and `review_count` maintained on review insert.

### orders
Order monetary fields are **all integers in PKR**, computed server-side only:

- `advance_amount` — always **1,000** (mandatory deposit rule, defined in `src/lib/business.ts`).
- `advance_paid` — false until gateway callback confirms.
- `balance_due = total − advance_amount` — collected on delivery (COD).
- `status` lifecycle: `pending_payment → confirmed → stitching → ready → shipped → completed` (+ `cancelled`).
An order may NOT leave `pending_payment` until `advance_paid = true`
(enforced in both the payment callback and the admin status server action).

### order_items
Snapshot rows: product name/image/unit price at order time, quantity, size,
`measurements jsonb` (bust, waist, hips, shoulder, sleeves, length, trouser),
`stitching_notes`.

### payments
One row per order advance: provider (`stripe|jazzcash|sandbox`), amount, status,
txn_ref, Stripe session id, raw gateway payload, paid_at.

### order_events
Append-only timeline powering customer tracking + admin history.

### reviews / contact_messages
Reviews carry product link + rating (1–5); product aggregates update on insert.
