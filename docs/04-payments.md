# 04 — Checkout & the Mandatory PKR 1,000 Advance

## The rule (business-critical)

> Every order requires a **PKR 1,000 advance** before stitching begins.
> Until a gateway confirms the advance, the order stays in
> **Pending Payment** and is **never** placed in the admin stitching queue.

Enforced in two independent places:
1. `POST /api/payments/callback` (and the Stripe webhook) is the *only* path
   that sets `advance_paid = true` and flips `status → confirmed`.
2. The admin `setOrderStatus` server action refuses to move an unpaid order
   past `pending_payment` (error: "Advance payment not received yet…").

## Flow
1. `POST /api/orders` — validates session + payload (zod), re-fetches every
   product price from the DB (client prices are never trusted), computes
   `subtotal`, `deliveryFee (250)`, `total`, `advanceAmount (1,000)`,
   `balanceDue = total − 1,000`. Inserts order (`pending_payment`) + items +
   payment row + timeline event.
2. Checkout → `POST /api/payments/initiate` returns one of:
   - `{type:'redirect', url}` — live **Stripe Checkout Session**
     (PKR, amount 1000×100, metadata.orderId for webhook reconciliation).
   - `{type:'jazzcash_form', postUrl, fields}` — a signed JazzCash
     merchant-form POST. Hash = `HMAC_SHA256( salt + '&' + sorted(pp_ values) )`
     per the JazzCash spec (sandbox URL by default, flip `JAZZCASH_SANDBOX`).
   - `{type:'sandbox', url}` — when no keys are configured, an on-site test
     gateway (`/payment/[orderId]`) exercises the **identical** callback path.
3. Confirmation:
   - **Stripe**: `checkout.session.completed` webhook (signature-verified with
     `STRIPE_WEBHOOK_SECRET`) marks the payment paid — instant.
   - **JazzCash**: return URL `POST /api/payments/callback?provider=jazzcash`,
     hash re-verified, `pp_ResponseCode === '000'` means success; user is
     303-redirected back to the order page.
   - **Sandbox**: the simulator POSTs the same JSON the callbacks expect.
4. On payment: order → `confirmed` (**Order Confirmed / In Stitching**),
   timeline event with the transaction reference, customer sees the success
   screen and the order appears in the admin stitching queue.
5. Remaining `balance_due` is **COD** on delivery (shown everywhere: cart,
   checkout, order tracking, admin).

All payment endpoints are rate-limited and ownership-checked; the mark-paid
handler is idempotent for gateway retries.
