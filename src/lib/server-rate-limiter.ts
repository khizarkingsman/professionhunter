/**
 * server-rate-limiter.ts
 *
 * Firestore-backed sliding-window rate limiter for Next.js API Route Handlers.
 * Uses Firebase Admin SDK to bypass Firestore security rules (custom JWT auth
 * leaves request.auth null on server routes, triggering default-deny fallback).
 *
 * Survives Vercel serverless cold starts and multi-instance deployments.
 * Reads all thresholds from rate-limit-config.ts — nothing hardcoded.
 *
 * Usage (in a route.ts):
 *
 *   import { withRateLimit } from '@/lib/server-rate-limiter';
 *   import { NextRequest, NextResponse } from 'next/server';
 *
 *   export async function POST(req: NextRequest) {
 *     const limited = await withRateLimit(req, 'auth');
 *     if (limited) return limited;          // 429 response
 *     return NextResponse.json({ ok: true });
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimitConfig, type RateLimitType } from './rate-limit-config';
import { getAdminFirestore } from '@/lib/firebase-admin';

/**
 * Check the rate limit for the incoming request using Firestore.
 *
 * Returns a 429 NextResponse if the limit is exceeded, or null if the
 * request is within limits.
 *
 * @param req  - The incoming Next.js request
 * @param type - The limit tier to apply ('auth' | 'public' | 'authed')
 */
export async function withRateLimit(
  req: NextRequest,
  type: RateLimitType,
): Promise<NextResponse | null> {
  const cfg = RateLimitConfig[type];
  const ip = extractIp(req);
  const sanitizedIp = ip.replace(/[.:]/g, '_');
  const docId = `${type}:${sanitizedIp}`;
  const now = Date.now();

  try {
    const adminDb = getAdminFirestore();
    const ref = adminDb.collection('rateLimits').doc(docId);
    const snap = await ref.get();

    const existingTimestamps: number[] =
      snap.exists && Array.isArray(snap.data()?.timestamps)
        ? (snap.data()?.timestamps as number[])
        : [];

    // Prune timestamps outside the sliding window
    const active = existingTimestamps.filter((t) => t > now - cfg.windowMs);

    if (active.length >= cfg.maxAttempts) {
      // Find oldest timestamp in window to compute retry timings
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

    // Record this attempt in Firestore
    await ref.set(
      {
        timestamps: [...active, now],
        updatedAt: now,
      },
      { merge: true },
    );

    return null; // allowed
  } catch (err) {
    // Fail open on error so transient database/network issues don't block users
    console.warn('[server-rate-limiter] Error checking rate limits, failing open:', err);
    return null;
  }
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
