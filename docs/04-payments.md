# 04 — Checkout & the Mandatory PKR 1,000 Advance

## The rule (business-critical)

> Every order requires a **PKR 1,000 advance** before stitching begins.
> Until the owner verifies the customer's mobile-wallet payment, the order stays
> in **Pending Payment** and is **never** placed in the admin stitching queue.

Enforced in two independent places:
1. A verified gateway callback or the admin-only manual advance verification
   action is the only path that sets `advance_paid = true` and flips
   `status → confirmed`.
2. The admin `setOrderStatus` server action refuses to move an unpaid order
   past `pending_payment` (error: "Advance payment not received yet…").

## Current customer flow (manual wallet transfer)
1. `POST /api/orders` creates a `pending_payment` order; the server re-fetches
   product prices and records the fixed PKR 1,000 advance due.
2. The success popup shows JazzCash `03060314545` (Muhammad Ahmed) and EasyPaisa
   `03143372162` (Habiba Naveed), and asks the customer to send a payment
   screenshot to WhatsApp `03143372162`.
3. The WhatsApp link is prefilled with the order number, dress names, sizes,
   quantities, measurements, customer and delivery details. The customer must
   attach the payment screenshot and tap Send.
4. The owner checks the payment, then uses the admin order page to record the
   wallet and optional transaction reference. Only then does the order enter
   the stitching queue.

## Gateway flow (legacy/optional)
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
