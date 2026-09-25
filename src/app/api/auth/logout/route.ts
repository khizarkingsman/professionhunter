import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { getAdminFirestore } from '@/lib/firebase-admin';

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Revokes the active session document in Firestore (by jti) and clears the
// httpOnly session cookie.
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get('session')?.value;

  if (sessionCookie) {
    try {
      const { jti } = decodeJwt(sessionCookie);
      if (jti && typeof jti === 'string') {
        const adminDb = getAdminFirestore();
        await adminDb.collection('activeSessions').doc(jti).delete();
      }
    } catch (err) {
      console.warn('[api/auth/logout] Failed to revoke session in activeSessions:', err);
    }
  }

  const response = NextResponse.json({ success: true });

  // Delete the session cookie by setting maxAge to 0
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Immediately expires the cookie
  });

  return response;
}
