# 06 — AI Support Assistant ("Noor")

A floating widget (bottom-right, every page): `src/components/chat-widget.tsx`,
backed by `POST /api/chat` and `src/lib/assistant.ts`.

## Training context
The system prompt (`ASSISTANT_CONTEXT`) encodes: business identity & Narowal
address, phone 0314 3372162, hours, the **mandatory PKR 1,000 advance rule**
(and that orders don't enter stitching before payment), COD balance, payment
methods (JazzCash/cards), turnaround (7–10 days, bridal 3–4 weeks), courier
info, order-tracking steps, the full size guide and measurement list, and the
exchange policy. It is instructed to answer warmly, concisely, and never invent
policies or discounts.

## Two modes (auto)
1. **OpenAI** — when `OPENAI_API_KEY` is set: Vercel AI SDK `generateText` with
   `gpt-4o-mini` (configurable via `OPENAI_MODEL`), last-10 message window,
   temperature 0.4, 320 output tokens. Any failure falls through to mode 2.
2. **Rule-based KB** — deterministic answers for advance policy, tracking,
   delivery/turnaround, sizing help, payments, bridal, exchange, contact,
   location, custom designs and pricing — so the widget is useful 24/7 with no
   external dependency (and zero cost).

## UX + abuse control
Quick-prompt chips, typing indicator, spring-animated panel, auto-scroll,
24 messages / 10 min / IP rate limit on the endpoint, zod-validated payloads
(≤1200 chars, user/assistant roles only).
