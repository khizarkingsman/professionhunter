import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withRateLimit } from '@/lib/server-rate-limiter';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  // 1. Server-side rate limiting (auth tier)
  const limited = withRateLimit(req, 'auth');
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

    // 2. Look up user by email, username, or phone
    const usersRef = collection(db, 'users');
    let q = query(usersRef, where('email', '==', ident));
    let snap = await getDocs(q);

    if (snap.empty) {
      q = query(usersRef, where('username', '==', ident));
      snap = await getDocs(q);
    }

    if (snap.empty) {
      q = query(usersRef, where('phone', '==', String(identifier).trim()));
      snap = await getDocs(q);
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
    const resetDocRef = doc(db, 'passwordResets', userId);
    const resetSnap = await getDoc(resetDocRef);

    if (!resetSnap.exists()) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const resetData = resetSnap.data();

    // Check expiry (10 minutes) and code equality
    if (Date.now() > (resetData.expiresAt ?? 0) || resetData.code !== cleanCode) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // 4. If newPassword is provided, hash with bcrypt and update user document
    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await setDoc(
        doc(db, 'users', userId),
        { password: hashedPassword },
        { merge: true }
      );

      // Clean up the used reset token
      await deleteDoc(resetDocRef);

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
