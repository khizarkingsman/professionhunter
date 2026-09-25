import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/server-rate-limiter';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  // 1. Server-side rate limiting (auth tier)
  const limited = await withRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      );
    }

    const ident = identifier.trim().toLowerCase();

    // 2. Look up user by email, username, or phone
    const usersRef = collection(db, 'users');
    let q = query(usersRef, where('email', '==', ident));
    let snap = await getDocs(q);

    if (snap.empty) {
      q = query(usersRef, where('username', '==', ident));
      snap = await getDocs(q);
    }

    if (snap.empty) {
      q = query(usersRef, where('phone', '==', identifier.trim()));
      snap = await getDocs(q);
    }

    // 3. If user found: generate 6-digit code and store in Firestore with 10-minute expiry
    if (!snap.empty) {
      const userDoc = snap.docs[0];
      const userData = userDoc.data();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      await setDoc(doc(db, 'passwordResets', userDoc.id), {
        userId: userDoc.id,
        code,
        expiresAt,
        email: userData.email || '',
        updatedAt: Date.now(),
      });

      // Log server-side for development/audit
      console.log(`[api/auth/request-password-reset] Generated OTP for user ${userDoc.id}`);
    }

    // 4. Anti-enumeration: always return { success: true } with 200 without exposing code
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/auth/request-password-reset] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
