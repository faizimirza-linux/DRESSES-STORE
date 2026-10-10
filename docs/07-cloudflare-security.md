# 07 — Cloudflare & Security Blueprint

## DNS + SSL
1. Add the site as a Cloudflare zone; change nameservers at the registrar.
2. `A  dresses.pk          → <origin IP>` — **proxied (orange cloud)**
   `CNAME www               → dresses.pk`  — proxied.
3. SSL/TLS → **Full (Strict)**; enable *Always Use HTTPS*,
   *Automatic HTTPS Rewrites*, TLS min 1.2, HSTS (after validating).
4. Speed: Brotli, Early Hints, HTTP/3; cache rule: `/images/*` edge-cache 1 month.

## WAF / DDoS
- Managed Ruleset (Cloudflare) ON, OWASP core ON, paranoia PL1.
- Bot Fight Mode ON; challenge `HEAD` floods with JS challenge.
- DDoS: L3/4 automatic; sensitivity High (default) under Security → DDoS.

## Rate limiting (edge, complements in-app limits)
| Rule | Match | Action |
|---|---|---|
| Auth guard | `URI Path starts with /api/auth` | 5 requests / 1 min / IP → Block 10 min |
| Payments guard | `URI Path starts with /api/payments` | 5 / 1 min / IP → Managed Challenge |
| Chat budget | `equals /api/chat` | 30 / 10 min / IP → Block 10 min |
| Order creation | `equals /api/orders` | 10 / 10 min / IP → Managed Challenge |

## App-layer security already in code
- scrypt password hashing; hashed single-use OTPs (10 min TTL, 5 attempts).
- httpOnly + SameSite sessions; `secure` flag in production.
- Server-side price recomputation; advance-payment queue guard in two layers.
- Stripe webhook signature verification; JazzCash HMAC-SHA256 verification.
- zod validation on every mutating endpoint; per-route rate limits.
- Ownership checks on orders/payments/reviews; admin-only server actions.
- No secrets in client bundles (only `NEXT_PUBLIC_BASE_URL`).
