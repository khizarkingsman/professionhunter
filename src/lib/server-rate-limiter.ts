/**
 * server-rate-limiter.ts
 *
 * In-memory sliding-window rate limiter for Next.js API Route Handlers.
 * Reads all thresholds from rate-limit-config.ts — nothing hardcoded.
 *
 * Usage (in a route.ts):
 *
 *   import { withRateLimit } from '@/lib/server-rate-limiter';
 *   import { NextRequest, NextResponse } from 'next/server';
 *
 *   export async function GET(req: NextRequest) {
 *     const limited = withRateLimit(req, 'public');
 *     if (limited) return limited;          // 429 response
 *     return NextResponse.json({ ok: true });
 *   }
 *
 * NOTES
 * ─────
 * - This uses an in-process Map, which resets on cold starts.
 *   For multi-instance deployments, replace the `store` Map with a Redis-backed
 *   solution (e.g., @upstash/ratelimit) — the API surface is identical.
 * - IP is extracted from x-forwarded-for → x-real-ip → 'unknown'.
 *   On Vercel, x-forwarded-for is always set by the edge network.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimitConfig, type RateLimitType } from './rate-limit-config';

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

interface WindowRecord {
  /** Timestamps (ms) of requests within the current window */
  timestamps: number[];
}

// Keyed by "<type>:<ip>"
const store = new Map<string, WindowRecord>();

// Periodically prune stale entries to avoid unbounded memory growth.
// Only runs on the server — safe to call at module load time.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const maxWindow = Math.max(
      RateLimitConfig.auth.windowMs,
      RateLimitConfig.public.windowMs,
      RateLimitConfig.authed.windowMs,
    );
    const cutoff = Date.now() - maxWindow;
    for (const [key, record] of store.entries()) {
      const active = record.timestamps.filter((t) => t > cutoff);
      if (active.length === 0) {
        store.delete(key);
      } else {
        store.set(key, { timestamps: active });
      }
    }
  }, 60_000); // prune every 60 s
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Check the rate limit for the incoming request.
 *
 * Returns a 429 NextResponse if the limit is exceeded, or null if the
 * request is within limits.
 *
 * @param req  - The incoming Next.js request
 * @param type - The limit tier to apply ('auth' | 'public' | 'authed')
 */
export function withRateLimit(
  req: NextRequest,
  type: RateLimitType,
): NextResponse | null {
  const cfg = RateLimitConfig[type];
  const ip = extractIp(req);
  const key = `${type}:${ip}`;
  const now = Date.now();

  // Retrieve or create the record
  const existing = store.get(key) ?? { timestamps: [] };

  // Prune timestamps outside the sliding window
  const active = existing.timestamps.filter((t) => t > now - cfg.windowMs);

  if (active.length >= cfg.maxAttempts) {
    // Find the oldest timestamp to compute Retry-After
    const oldestInWindow = Math.min(...active);
    const retryAfterSec = Math.ceil((oldestInWindow + cfg.windowMs - now) / 1000);

    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests. Please slow down and try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, retryAfterSec)),
          'X-RateLimit-Limit': String(cfg.maxAttempts),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil((oldestInWindow + cfg.windowMs) / 1000)),
        },
      },
    );
  }

  // Request is within limits — record it and allow
  active.push(now);
  store.set(key, { timestamps: active });

  return null; // allowed
}

// ---------------------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------------------

function extractIp(req: NextRequest): string {
  // Vercel / standard reverse proxies set x-forwarded-for
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first (client) IP
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // Fallback — rate-limit all requests together; better than crashing
  return 'unknown';
}
