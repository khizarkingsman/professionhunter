import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withRateLimit } from '@/lib/server-rate-limiter';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  // 1. Server-side rate limiting (auth tier)
  const limited = await withRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const { identifier, code, newPassword } = body;

    if (!identifier || !code) {
      return NextResponse.json(
        { error: 'Identifier and verification code are required' },
        { status: 400 }
      );
    }

    const ident = String(identifier).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const adminDb = getAdminFirestore();
    const usersCol = adminDb.collection('users');

    // 2. Look up user by email, username, or phone via Admin SDK
    let snap = await usersCol.where('email', '==', ident).limit(1).get();

    if (snap.empty) {
      snap = await usersCol.where('username', '==', ident).limit(1).get();
    }

    if (snap.empty) {
      snap = await usersCol.where('phone', '==', String(identifier).trim()).limit(1).get();
    }

    if (snap.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const userDoc = snap.docs[0];
    const userId = userDoc.id;

    // 3. Look up password reset document
    const resetDocRef = adminDb.collection('passwordResets').doc(userId);
    const resetSnap = await resetDocRef.get();

    if (!resetSnap.exists) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const resetData = resetSnap.data() || {};

    // Check expiry (10 minutes) and code equality
    if (Date.now() > (resetData.expiresAt ?? 0) || resetData.code !== cleanCode) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // 4. If newPassword is provided, hash with bcrypt and update credentials collection
    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Write to credentials/{userId} via Admin SDK
      await adminDb.collection('credentials').doc(userId).set({
        passwordHash: hashedPassword,
        updatedAt: Date.now(),
      }, { merge: true });

      // Clean up the used reset token
      await resetDocRef.delete();

      // Revoke all active sessions for this user across devices
      try {
        const sessionsSnap = await adminDb
          .collection('activeSessions')
          .where('userId', '==', userId)
          .get();
        const deletions = sessionsSnap.docs.map((d) => d.ref.delete());
        await Promise.all(deletions);
      } catch (err) {
        console.warn('[verify-password-reset] Failed to revoke active sessions:', err);
      }

      return NextResponse.json({ success: true });
    }

    // If only verifying code (without password update yet)
    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error('[api/auth/verify-password-reset] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
