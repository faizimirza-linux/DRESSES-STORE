/**
 * Lightweight in-memory fixed-window rate limiter.
 * Suitable for single-instance deployments; front with Cloudflare WAF for
 * distributed edge protection (see /docs).
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically clean expired buckets so the map doesn't grow forever.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfter: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  sweep();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}
