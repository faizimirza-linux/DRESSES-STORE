# 02 — Project Folder Structure

```
src/
├── app/
│   ├── (auth)/                     # route group
│   │   ├── login/ register/ forgot-password/ reset-password/
│   ├── account/                    # customer dashboard (orders)
│   │   └── orders/[id]/            # live tracking timeline
│   ├── admin/                      # RBAC-guarded owner studio
│   │   ├── layout.tsx              # session role check + shell
│   │   ├── page.tsx                # stats, pipeline, stitching queue
│   │   ├── actions.ts              # server actions: product CRUD, order status
│   │   ├── products/ | products/new | products/[id]
│   │   └── orders/   | orders/[id]
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/ login/ verify-otp/ logout/
│   │   │   ├── forgot-password/ reset-password/ me/
│   │   │   └── oauth/[provider]/ + callback/   # google & apple
│   │   ├── orders/                 # server-priced create, advance rule
│   │   ├── payments/
│   │   │   ├── initiate/           # stripe checkout | jazzcash form | sandbox
│   │   │   ├── callback/           # sandbox + jazzcash return URL
│   │   │   ├── status/             # polling for gateway redirects
│   │   │   └── stripe/webhook/     # signature-verified
│   │   ├── chat/ contact/ reviews/ health/
│   ├── shop/ shop/[slug]/ cart/ checkout/ payment/[orderId]/
│   ├── contact/ docs/
│   ├── layout.tsx globals.css icon.svg not-found.tsx
├── components/
│   ├── site-header · site-footer · chat-widget · cart-provider
│   ├── home-sections · shop-browser · product-card · product-view
│   ├── auth-form · payment-flow · motion (Reveal/Marquee)
│   ├── logout-button
│   └── admin/ (product-form, product-row-controls, order-status-control)
├── db/
│   ├── index.ts    # pg Pool + drizzle client (DATABASE_URL)
│   ├── schema.ts   # all tables + enums
│   └── seed.ts     # admin + 12 products + 10 reviews
└── lib/
    ├── business.ts     # brand constants, PKR 1,000 advance, size guide
    ├── session.ts      # jose JWT cookie sessions, requireUser/Admin
    ├── password.ts     # scrypt hashing
    ├── otp.ts          # issue/verify w/ rate limits + attempt caps
    ├── rate-limit.ts   # in-memory fixed window
    ├── payments.ts     # Stripe checkout, JazzCash HMAC-SHA256, sandbox
    ├── oauth.ts        # google/apple URL build + code exchange
    ├── assistant.ts    # OpenAI w/ rule-based KB fallback
    ├── mailer.ts       # dev outbox / live hook
    └── utils.ts
```
