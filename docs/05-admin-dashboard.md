# 05 — Admin Dashboard ("Owner Studio")

Guarded by `requireAdmin()` in `src/app/admin/layout.tsx` — non-admins are
redirected. Login with the seeded admin (see README).

## Overview (/admin)
- KPIs: advance collected, orders awaiting payment, stitching queue size,
  lifetime order value.
- **Order pipeline** bar chart (orders grouped by status, live SQL).
- Recent orders list.
- **Stitching queue** — the paid-and-confirmed work list with per-item sizes
  and compact measurement summaries (exactly what a tailor needs at the table).
- Studio stats: live/total dresses, accounts, reviews, contact messages.

## Dresses (/admin/products)
- Data table: cover, name, fabric, category, price, rating, visibility toggle,
  edit link, two-tap delete.
- **Add/Edit** form (`/admin/products/new`, `/admin/products/[id]`): name,
  slug, description, fabric, price + compare-at (ints, PKR), category chips,
  colour + size checkboxes (incl. `Custom`), gallery manager with quick-pick
  library + URL input, `Live in shop` and `Featured` switches. Saves through a
  zod-validated server action with `revalidatePath` across shop/home.

## Orders (/admin/orders)
- Status filter chips (Pending Payment, Confirmed, In Stitching, …).
- Table: number, customer, city, advance badge, total, status, open link.
- Detail page (`/admin/orders/[id]`): full measurement cards, stitching notes,
  customer contact button, gateway + transaction details, append-only history
  timeline, and the **status control** (status + optional note like courier
  tracking #) — which enforces the advance-paid guard before anything can
  enter or move through the stitching queue.
