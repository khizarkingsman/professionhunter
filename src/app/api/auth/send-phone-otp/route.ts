import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { withRateLimit } from '@/lib/server-rate-limiter';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { users as mockUsers } from '@/lib/data';
import { sendWhatsAppOtp } from '@/lib/whatsapp';

// ─── POST /api/auth/send-phone-otp ──────────────────────────────────────────
// Generates a 6-digit random code, stores it in Firestore (phoneOtps collection)
// with a 10-minute expiry, and dispatches via WhatsApp Cloud API.
// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.JWT_SECRET) {
  throw new Error('[send-phone-otp] JWT_SECRET not set.');
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: NextRequest) {
  // 1. Rate limiting (auth tier)
  const limited = await withRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    let userId: string | null = null;

    // 2. Identify user from session cookie if present
    const sessionCookie = req.cookies.get('session')?.value;
    if (sessionCookie && JWT_SECRET) {
      try {
        const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
        if (payload?.userId) {
          userId = String(payload.userId);
        }
      } catch {
        // Session token expired or invalid; fall back to body userId
      }
    }

    // Fallback to userId passed in request body
    if (!userId && body?.userId) {
      userId = String(body.userId).trim();
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User identification is required to send verification code.' },
        { status: 401 }
      );
    }

    // 3. Retrieve user document to obtain registered phone number
    let phoneNumber: string | null = null;

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const u = userDoc.data();
        phoneNumber = u.phone || null;
      }
    } catch (fsErr) {
      console.warn('[send-phone-otp] Firestore read error, checking local fallback:', fsErr);
    }

    // Fallback to mock users if Firestore is not populated or offline
    if (!phoneNumber) {
      const mock = mockUsers.find(u => u.id === userId);
      if (mock?.phone) {
        phoneNumber = mock.phone;
      }
    }

    // If still no phone found, check if provided in body
    if (!phoneNumber && body?.phone) {
      phoneNumber = String(body.phone).trim();
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'No phone number registered for this account. Please update your profile.' },
        { status: 400 }
      );
    }

    // 4. Generate 6-digit random code & 10-minute expiry
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 5. Store OTP record in Firestore
    try {
      await setDoc(doc(db, 'phoneOtps', userId), {
        userId,
        code,
        phone: phoneNumber,
        expiresAt,
        createdAt: new Date().toISOString(),
      });
    } catch (writeErr) {
      console.error('[send-phone-otp] Failed to save OTP to Firestore:', writeErr);
      return NextResponse.json(
        { error: 'Failed to initiate verification record. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Dispatch WhatsApp message via Meta Cloud API
    const dispatchResult = await sendWhatsAppOtp({
      phone: phoneNumber,
      code,
    });

    if (!dispatchResult.success) {
      console.error('[send-phone-otp] WhatsApp dispatch failed:', dispatchResult.error);
      return NextResponse.json(
        {
          error: dispatchResult.error || 'Failed to dispatch verification code via WhatsApp.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully via WhatsApp.',
      expiresAt,
    });
  } catch (error) {
    console.error('[send-phone-otp] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while sending the verification code.' },
      { status: 500 }
    );
  }
}
