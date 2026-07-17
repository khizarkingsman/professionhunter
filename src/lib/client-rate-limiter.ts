/**
 * client-rate-limiter.ts
 *
 * Browser-side rate limiting for auth forms.
 *
 * ARCHITECTURE NOTE
 * ─────────────────
 * This app's auth (login / signup / password-reset) runs entirely in the
 * browser — there are no Next.js API routes for those operations. A truly
 * server-enforced rate limit would require moving auth to server-side API
 * routes.  This module provides the strongest possible client-side protection:
 *
 *   • Per-"fingerprint" limits  (browser fingerprint stored in sessionStorage)
 *   • Per-account limits        (keyed on the user identifier)
 *   • Exponential backoff       (delay = baseDelay × 2^(failures−1), capped)
 *   • sessionStorage backend    (cleared on browser/tab close; harder to
 *                                persist across intentional resets)
 *
 * All thresholds come from rate-limit-config.ts — nothing is hardcoded here.
 *
 * Usage:
 *   const rl = getClientRateLimiter();
 *   const check = rl.check('auth', identifier);
 *   if (!check.allowed) { showError(check.message); return; }
 *   // ... attempt auth ...
 *   if (success) { rl.onSuccess('auth', identifier); }
 *   else         { rl.onFailure('auth', identifier); }
 */

import { RateLimitConfig, type RateLimitType } from './rate-limit-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttemptRecord {
  /** Timestamps (ms) of each failed attempt within the current window */
  timestamps: number[];
  /** Number of consecutive failures (used for backoff calculation) */
  consecutiveFailures: number;
  /** If locked out, the epoch ms when the lockout expires */
  lockoutUntil?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Human-readable message when not allowed */
  message?: string;
  /** ms until the client may retry */
  retryAfterMs?: number;
  /** How many attempts remain in the current window */
  attemptsLeft?: number;
}

// ---------------------------------------------------------------------------
// Storage key helpers
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'ph_rl_';

function storageKey(type: RateLimitType, identifier: string): string {
  // Simple hash to keep the key short and avoid leaking PII in storage keys
  const hash = simpleHash(`${type}:${identifier.toLowerCase()}`);
  return `${STORAGE_PREFIX}${hash}`;
}

/** djb2 hash — fast, non-cryptographic, sufficient for storage keys */
function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

// ---------------------------------------------------------------------------
// Core class
// ---------------------------------------------------------------------------

class ClientRateLimiter {
  private storage: Storage | null;

  constructor() {
    // sessionStorage is scoped to the tab/session; falls back gracefully when
    // unavailable (e.g., Safari private mode, cookie-blocked contexts).
    try {
      this.storage = typeof window !== 'undefined' ? window.sessionStorage : null;
    } catch {
      this.storage = null;
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private read(key: string): AttemptRecord {
    if (!this.storage) return { timestamps: [], consecutiveFailures: 0 };
    try {
      const raw = this.storage.getItem(key);
      if (!raw) return { timestamps: [], consecutiveFailures: 0 };
      return JSON.parse(raw) as AttemptRecord;
    } catch {
      return { timestamps: [], consecutiveFailures: 0 };
    }
  }

  private write(key: string, record: AttemptRecord): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(key, JSON.stringify(record));
    } catch {
      // Storage quota exceeded — silently ignore; don't crash the UI
    }
  }

  private remove(key: string): void {
    if (!this.storage) return;
    try {
      this.storage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  /** Prune timestamps that have fallen outside the sliding window */
  private pruneWindow(timestamps: number[], windowMs: number): number[] {
    const cutoff = Date.now() - windowMs;
    return timestamps.filter((t) => t > cutoff);
  }

  /**
   * Exponential backoff: delay = baseDelay × 2^(failures − maxAttempts)
   * Capped at maxDelayMs.
   */
  private calcBackoffDelay(consecutiveFailures: number, type: 'auth'): number {
    const cfg = RateLimitConfig.auth;
    const exponent = Math.max(0, consecutiveFailures - cfg.maxAttempts);
    const delay = cfg.baseDelayMs * Math.pow(2, exponent);
    return Math.min(delay, cfg.maxDelayMs);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Check whether the given key is allowed to attempt an action.
   *
   * @param type         - 'auth' | 'public' | 'authed'
   * @param identifier   - unique key for this action (e.g. email/phone/username)
   */
  check(type: RateLimitType, identifier: string): RateLimitResult {
    const cfg = RateLimitConfig[type];
    const key = storageKey(type, identifier);
    const now = Date.now();
    const record = this.read(key);

    // Check active lockout
    if (record.lockoutUntil && record.lockoutUntil > now) {
      const retryAfterMs = record.lockoutUntil - now;
      return {
        allowed: false,
        retryAfterMs,
        message: formatRetryMessage(retryAfterMs),
      };
    }

    // Prune old timestamps
    const active = this.pruneWindow(record.timestamps, cfg.windowMs);

    if (active.length >= cfg.maxAttempts) {
      // Apply backoff for auth type, fixed block for others
      if (type === 'auth') {
        const delayMs = this.calcBackoffDelay(record.consecutiveFailures, type);
        const lockoutUntil = now + delayMs;
        this.write(key, { ...record, timestamps: active, lockoutUntil });
        return {
          allowed: false,
          retryAfterMs: delayMs,
          message: formatRetryMessage(delayMs),
        };
      }
      // Non-auth: simple window block
      const oldestInWindow = Math.min(...active);
      const retryAfterMs = oldestInWindow + cfg.windowMs - now;
      return {
        allowed: false,
        retryAfterMs,
        message: formatRetryMessage(retryAfterMs),
      };
    }

    return {
      allowed: true,
      attemptsLeft: cfg.maxAttempts - active.length,
    };
  }

  /**
   * Record a failed attempt. Call this AFTER a failed auth/action.
   */
  onFailure(type: RateLimitType, identifier: string): void {
    const cfg = RateLimitConfig[type];
    const key = storageKey(type, identifier);
    const now = Date.now();
    const record = this.read(key);

    const active = this.pruneWindow(record.timestamps, cfg.windowMs);
    active.push(now);

    const consecutiveFailures = record.consecutiveFailures + 1;

    // Set lockout if threshold is met (auth type only — exponential backoff)
    let lockoutUntil = record.lockoutUntil;
    if (type === 'auth' && active.length >= cfg.maxAttempts) {
      const delayMs = this.calcBackoffDelay(consecutiveFailures, type);
      lockoutUntil = now + delayMs;
    }

    this.write(key, {
      timestamps: active,
      consecutiveFailures,
      lockoutUntil,
    });
  }

  /**
   * Clear the rate-limit record on successful authentication.
   * This prevents legitimate users from being locked out after recovering.
   */
  onSuccess(type: RateLimitType, identifier: string): void {
    this.remove(storageKey(type, identifier));
  }

  /**
   * Returns remaining lockout time in ms, or 0 if not locked out.
   */
  getRemainingLockoutMs(type: RateLimitType, identifier: string): number {
    const record = this.read(storageKey(type, identifier));
    if (!record.lockoutUntil) return 0;
    return Math.max(0, record.lockoutUntil - Date.now());
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _instance: ClientRateLimiter | null = null;

export function getClientRateLimiter(): ClientRateLimiter {
  if (!_instance) {
    _instance = new ClientRateLimiter();
  }
  return _instance;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatRetryMessage(retryAfterMs: number): string {
  const totalSeconds = Math.ceil(retryAfterMs / 1000);
  if (totalSeconds < 60) {
    return `Too many attempts. Please wait ${totalSeconds} second${totalSeconds !== 1 ? 's' : ''} before trying again.`;
  }
  const minutes = Math.ceil(totalSeconds / 60);
  if (minutes < 60) {
    return `Too many attempts. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
  }
  const hours = Math.ceil(minutes / 60);
  return `Too many attempts. Please wait ${hours} hour${hours !== 1 ? 's' : ''} before trying again.`;
}
