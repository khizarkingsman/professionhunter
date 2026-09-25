import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { withRateLimit } from '@/lib/server-rate-limiter';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

// ─── POST /api/auth/verify-phone-otp ────────────────────────────────────────
// Validates 6-digit WhatsApp OTP against Firestore, sets phoneVerified: true,
// and deletes the stored OTP record upon successful verification.
// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.JWT_SECRET) {
  throw new Error('[verify-phone-otp] JWT_SECRET not set.');
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: NextRequest) {
  // 1. Rate limiting (auth tier)
  const limited = await withRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const code = body?.code ? String(body.code).trim() : '';
    let userId: string | null = null;

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required.' },
        { status: 400 }
      );
    }

    // 2. Identify user from session cookie or request body
    const sessionCookie = req.cookies.get('session')?.value;
    if (sessionCookie && JWT_SECRET) {
      try {
        const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
        if (payload?.userId) {
          userId = String(payload.userId);
        }
      } catch {
        // Fall back to body userId
      }
    }

    if (!userId && body?.userId) {
      userId = String(body.userId).trim();
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User identification is required to verify code.' },
        { status: 401 }
      );
    }

    // 3. Retrieve stored OTP document from Firestore
    const otpDocRef = doc(db, 'phoneOtps', userId);
    let otpSnap;
    try {
      otpSnap = await getDoc(otpDocRef);
    } catch (fsErr) {
      console.error('[verify-phone-otp] Failed to fetch OTP document:', fsErr);
      return NextResponse.json(
        { error: 'Failed to access verification system. Please try again.' },
        { status: 500 }
      );
    }

    if (!otpSnap.exists()) {
      return NextResponse.json(
        { error: 'No pending verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    const otpData = otpSnap.data();

    // 4. Check expiration (10-minute expiry)
    const expiresAtMs = new Date(otpData.expiresAt).getTime();
    if (Date.now() > expiresAtMs) {
      // Clean up expired record
      await deleteDoc(otpDocRef).catch(e => console.warn('[verify-phone-otp] Error deleting expired OTP:', e));
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // 5. Check code matching
    if (String(otpData.code).trim() !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    // 6. Verification successful:
    // Update user document in Firestore: phoneVerified = true
    try {
      await setDoc(doc(db, 'users', userId), { phoneVerified: true }, { merge: true });
    } catch (updateErr) {
      console.error('[verify-phone-otp] Failed to update user status in Firestore:', updateErr);
      return NextResponse.json(
        { error: 'Failed to update verification status. Please try again.' },
        { status: 500 }
      );
    }

    // Delete stored OTP
    try {
      await deleteDoc(otpDocRef);
    } catch (delErr) {
      console.warn('[verify-phone-otp] Could not delete verified OTP record:', delErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully.',
      phoneVerified: true,
    });
  } catch (error) {
    console.error('[verify-phone-otp] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}
