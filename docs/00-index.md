# DRESSES — Technical Deliverables Pack

Custom-stitched dresses e-commerce platform for a home-based atelier in **Narowal, Pakistan**.
Contact: **0314 3372162** (call & WhatsApp).

This pack documents the complete build that ships in this repository:

| File | Contents |
|---|---|
| `01-database-schema.md` + `schema.sql` | Full PostgreSQL schema (Drizzle ORM + raw SQL) |
| `02-folder-structure.md` | Modular Next.js App Router layout |
| `03-authentication.md` | Google / Apple OAuth + Email-Password-OTP, RBAC, recovery |
| `04-payments.md` | Mandatory PKR 1,000 advance flow, Stripe, JazzCash, webhooks |
| `05-admin-dashboard.md` | Owner studio: catalog, orders, stitching queue |
| `06-ai-assistant.md` | Floating AI support widget architecture |
| `07-cloudflare-security.md` | DNS, SSL, WAF, DDoS & rate-limits blueprint |

## Quick start

```bash
npm install
npx drizzle-kit push          # create tables
npx tsx src/db/seed.ts        # products, reviews + admin user
npm run dev
```

Seeded admin login: **admin@dresses.pk** / **Dresses@Admin1**
(Email OTP still applies — in dev mode the code is displayed on screen.)

All env keys are optional for local demo: without gateway keys, orders use the
built-in sandbox gateway (same server callback path as the real providers).
See `.env.example`.
