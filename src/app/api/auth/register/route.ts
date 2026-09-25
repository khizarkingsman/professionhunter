import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { withRateLimit } from '@/lib/server-rate-limiter';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { type User } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

if (!process.env.JWT_SECRET) {
  throw new Error(
    '[api/auth/register] JWT_SECRET environment variable is not set. ' +
    'Set it in .env.local (dev) or your deployment environment (prod).'
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: NextRequest) {
  // 1. Server-side rate limiting
  const limited = await withRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const body = await req.json();
    const { user, password } = body;

    if (!user || !user.id || !user.email || !password) {
      return NextResponse.json(
        { error: 'User data and password are required' },
        { status: 400 }
      );
    }

    const email = String(user.email).trim().toLowerCase();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // 2. Hash password with bcrypt cost 12
    const hashed = await bcrypt.hash(password, 12);

    const userDocData = {
      ...user,
      password: hashed,
      isPro: user.isPro ?? false,
      isSeekerPro: user.isSeekerPro ?? false,
      lastSeen: 'online',
      phoneVerified: user.phoneVerified ?? false,
    };

    // 3. Write user to Firestore
    await setDoc(doc(db, 'users', user.id), userDocData);

    const { password: _p, ...sanitized } = userDocData;

    // 4. Mint signed JWT session token (expires in 1 hour) with unique session jti
    const jti = crypto.randomUUID();
    const token = await new SignJWT({
      userId: sanitized.id,
      role: sanitized.role,
      name: sanitized.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setJti(jti)
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    // Write session to Firestore activeSessions using Admin SDK
    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection('activeSessions').doc(jti).set({
        userId: sanitized.id,
        jti,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 3_600_000,
      });
    } catch (err) {
      console.warn('[api/auth/register] Failed to write activeSessions:', err);
    }

    // 5. Build response with httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: sanitized,
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    console.error('[api/auth/register] Registration failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
