import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAdminFirestore } from '@/lib/firebase-admin';

// ─── GET /api/auth/session ────────────────────────────────────────────────────
// Reads the httpOnly session cookie, verifies the JWT signature, and checks
// against activeSessions in Firestore (session revocation).
// Returns the decoded payload (userId, role, name). Returns 401 if revoked/invalid.
// ───────────────────────────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      console.warn('[api/auth/session] JWT_SECRET is not configured.');
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verify and decode the JWT
    const { payload } = await jwtVerify(sessionCookie.value, jwtSecret);

    // If jti claim is present, check against Firestore activeSessions
    const jti = payload.jti as string | undefined;
    if (jti) {
      try {
        const adminDb = getAdminFirestore();
        const sessionDoc = await adminDb.collection('activeSessions').doc(jti).get();
        if (!sessionDoc.exists) {
          // Session was revoked (logout or password reset)
          const resp = NextResponse.json({ user: null }, { status: 401 });
          resp.cookies.set('session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
          });
          return resp;
        }
      } catch (err) {
        // Fail open: log warning but permit request if Admin SDK / Firestore is temporarily unreachable
        console.warn('[api/auth/session] Could not check session revocation, failing open:', err);
      }
    }

    return NextResponse.json({
      user: {
        userId: payload.userId,
        role: payload.role,
        name: payload.name,
      },
    });
  } catch (error) {
    // Token is expired or tampered with
    console.warn('[api/auth/session] Invalid session token:', (error as Error).message);

    // Clear the invalid cookie
    const response = NextResponse.json({ user: null }, { status: 401 });
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  }
}
