/**
 * In-memory rate limiter for API routes.
 *
 * Works correctly for single-process deployments (local dev, single Vercel
 * function instance). For multi-instance production deployments, replace the
 * `store` Map with an Upstash Redis / ioredis backed store.
 *
 * Usage in an API route handler:
 *
 *   import { rateLimit, getClientIp } from "@/lib/rate-limit";
 *
 *   const ip = getClientIp(request.headers);
 *   const result = rateLimit(`api:${ip}`, 100, 60_000); // 100 req/min
 *   if (!result.success) {
 *     return NextResponse.json({ error: "Too many requests" }, {
 *       status: 429,
 *       headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
 *     });
 *   }
 */

interface RateWindow {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateWindow>();

// Prune expired entries every 5 minutes to prevent memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store.entries()) {
      if (win.resetAt < now) store.delete(key);
    }
  }, 5 * 60_000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix ms timestamp when the window resets
}

/**
 * Check and increment the rate limit counter for a given key.
 * @param key      Unique key — e.g. `"api:${ip}"` or `"ai:${agencyId}"`
 * @param limit    Max requests allowed in the window
 * @param windowMs Window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let win = store.get(key);

  if (!win || win.resetAt < now) {
    win = { count: 0, resetAt: now + windowMs };
    store.set(key, win);
  }

  win.count++;

  return {
    success: win.count <= limit,
    limit,
    remaining: Math.max(0, limit - win.count),
    resetAt: win.resetAt,
  };
}

/**
 * Extract the real client IP from Next.js request headers.
 * Falls back through x-forwarded-for → x-real-ip → "unknown".
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

// Preset limiters for convenience
export const LIMITS = {
  /** General API endpoint — 100 req/min */
  api: (ip: string) => rateLimit(`api:${ip}`, 100, 60_000),
  /** AI-heavy endpoints (quote gen, itinerary) — 20 req/min */
  ai: (agencyId: string) => rateLimit(`ai:${agencyId}`, 20, 60_000),
  /** Webhook endpoints — 200 req/min */
  webhook: (ip: string) => rateLimit(`webhook:${ip}`, 200, 60_000),
};
