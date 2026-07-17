/**
 * rate-limit-config.ts
 *
 * Single source of truth for all rate-limiting thresholds.
 * Every value is read from an environment variable so they can be
 * tuned per-environment without touching source code.
 *
 * Env vars (all optional – safe defaults shown):
 *
 *   NEXT_PUBLIC_RATE_LIMIT_AUTH_MAX          = 5    (attempts before backoff kicks in)
 *   NEXT_PUBLIC_RATE_LIMIT_AUTH_WINDOW_MS    = 900000 (15 min sliding window)
 *   NEXT_PUBLIC_RATE_LIMIT_AUTH_BASE_DELAY_MS= 30000  (30 s base backoff delay)
 *   NEXT_PUBLIC_RATE_LIMIT_AUTH_MAX_DELAY_MS = 3600000 (1 h maximum backoff)
 *
 *   NEXT_PUBLIC_RATE_LIMIT_PUBLIC_MAX        = 30
 *   NEXT_PUBLIC_RATE_LIMIT_PUBLIC_WINDOW_MS  = 60000 (1 min)
 *
 *   NEXT_PUBLIC_RATE_LIMIT_AUTHED_MAX        = 60
 *   NEXT_PUBLIC_RATE_LIMIT_AUTHED_WINDOW_MS  = 60000 (1 min)
 *
 * NOTE: NEXT_PUBLIC_ prefix is required so these are available in the
 * browser bundle.  They are thresholds only — not secrets.
 */

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const RateLimitConfig = {
  /** Strict limits for auth routes: login, signup, password-reset */
  auth: {
    /** Maximum failed attempts before exponential backoff starts */
    maxAttempts: envInt('NEXT_PUBLIC_RATE_LIMIT_AUTH_MAX', 5),
    /** Sliding window length in ms (default: 15 minutes) */
    windowMs: envInt('NEXT_PUBLIC_RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
    /** Base delay for first lockout tier in ms (default: 30 seconds) */
    baseDelayMs: envInt('NEXT_PUBLIC_RATE_LIMIT_AUTH_BASE_DELAY_MS', 30 * 1000),
    /** Maximum backoff delay in ms (default: 1 hour) */
    maxDelayMs: envInt('NEXT_PUBLIC_RATE_LIMIT_AUTH_MAX_DELAY_MS', 60 * 60 * 1000),
  },

  /** Moderate limits for public (unauthenticated) API endpoints */
  public: {
    maxAttempts: envInt('NEXT_PUBLIC_RATE_LIMIT_PUBLIC_MAX', 30),
    windowMs: envInt('NEXT_PUBLIC_RATE_LIMIT_PUBLIC_WINDOW_MS', 60 * 1000),
  },

  /** Looser limits for authenticated user actions */
  authed: {
    maxAttempts: envInt('NEXT_PUBLIC_RATE_LIMIT_AUTHED_MAX', 60),
    windowMs: envInt('NEXT_PUBLIC_RATE_LIMIT_AUTHED_WINDOW_MS', 60 * 1000),
  },
} as const;

export type RateLimitType = keyof typeof RateLimitConfig;
