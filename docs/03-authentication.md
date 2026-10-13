# 03 — Authentication & RBAC

## Flows shipped

1. **Email + Password + OTP (registration)** — `POST /api/auth/register`
   hashes the password with scrypt, creates an unverified user and issues a
   6-digit OTP (`verify`). `POST /api/auth/verify-otp` marks the email verified
   and starts a session.
2. **Email + Password + OTP (login)** — `POST /api/auth/login` verifies the
   password, then issues a `login` OTP. Verify → session. (Second factor every
   login as required.)
3. **Password reset via OTP** — `POST /api/auth/forgot-password` issues a
   `reset` OTP → verify → short-lived signed reset token (15 min) →
   `POST /api/auth/reset-password` rotates the password.
4. **Google OAuth** — `GET /api/auth/oauth/google` (state-cookie protected
   authorization code flow) → `/callback` exchanges the code, upserts a verified
   user, starts a session. Activate with `GOOGLE_CLIENT_ID/SECRET`.
5. **Apple OAuth** — identical under `/api/auth/oauth/apple` (handles Apple's
   form_post callback). Activate with `APPLE_CLIENT_ID/SECRET` (ES256 client
   secret JWT generated from your Apple private key).

## Google OAuth production setup

The live callback URI is `https://dressespk.vercel.app/api/auth/oauth/google/callback`.
Register that exact URI in the Google OAuth client, then set non-empty
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the Vercel project's Production
environment. `NEXT_PUBLIC_BASE_URL` must remain `https://dressespk.vercel.app` so
the callback stays stable across deployments.

## Session
`jose` HS256 JWT in an **httpOnly, SameSite=Lax** cookie (`dresses_session`,
7 days). `getSessionUser()` (React-cache memoized), `requireUser()`,
`requireAdmin()` guards used across pages, API routes and server actions.

## RBAC
- **admin** (single seeded owner): `/admin/*` pages + all admin server actions
  (product CRUD, visibility, order status, stitching queue).
- **customer**: browse, cart, checkout, pay advance, track orders, review,
  contact. Every customer API checks ownership (`order.userId === session.sub`).

## Hardening
- scrypt + timing-safe compare for passwords; only OTP hashes touch the DB.
- Rate limits: register 10/hr/IP, login 15/15min/IP, OTP 45s burst + 5/hr/email,
  verify-otp 30/15min/IP, forgot 8/hr/IP, reviews 8/hr/user, contact 5/hr/IP,
  chat 24/10min/IP.
- OTP: 6 digits, 10-minute TTL, max 5 attempts, single-use.
- Generic "invalid credentials" messaging; forgot-password never leaks account
  existence.
- OAuth protected against CSRF with an httpOnly state cookie; `next` redirect
  targets are allow-listed to same-origin paths.
