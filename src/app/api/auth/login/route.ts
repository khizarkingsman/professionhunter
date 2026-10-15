import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { withRateLimit } from '@/lib/server-rate-limiter';
import { getAdminFirestore } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import { type User } from '@/lib/data';
import { ADMIN_USER } from '@/lib/admin-user';

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  // 1. Server-side rate limiting
  const limited = await withRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const { identifier, password } = body;

    // Strict credential validation: both identifier and password are required
    if (
      !identifier ||
      !password ||
      typeof identifier !== 'string' ||
      typeof password !== 'string' ||
      !identifier.trim()
    ) {
      return NextResponse.json(
        { error: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    const ident = identifier.trim().toLowerCase();
    let authenticatedUser: User | null = null;

    // Check Admin credentials server-side (secrets never reach the client bundle)
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (
      (ident === 'admin' || ident === 'admin@professionhunter.com' || ident === '+966500000000') &&
      adminPassword &&
      password === adminPassword
    ) {
      authenticatedUser = ADMIN_USER;
    } else {
      // Check database via Admin SDK
      try {
        const adminDb = getAdminFirestore();
        const usersCol = adminDb.collection('users');

        // Check by email
        let snap = await usersCol.where('email', '==', ident).limit(1).get();

        // Check by username if not found by email
        if (snap.empty) {
          snap = await usersCol.where('username', '==', ident).limit(1).get();
        }

        // Check by phone
        if (snap.empty) {
          snap = await usersCol.where('phone', '==', identifier.trim()).limit(1).get();
        }

        if (!snap.empty) {
          const userDoc = snap.docs[0];
          const userData = userDoc.data();

          // Security: Admin accounts cannot be authenticated from Firestore.
          // Reject any Firestore document attempting to claim admin privileges or id admin-001.
          if (
            userData.role === 'admin' ||
            userData.id === 'admin-001' ||
            userDoc.id === 'admin-001'
          ) {
            console.warn('[api/auth/login] Rejected attempt to authenticate admin from Firestore');
            return NextResponse.json(
              { error: 'Invalid identifier or password' },
              { status: 401 }
            );
          }

          // Fetch password hash directly from credentials collection via Admin SDK
          const credDoc = await adminDb.collection('credentials').doc(userDoc.id).get();
          if (credDoc.exists) {
            const passwordHash = credDoc.data()?.passwordHash;
            if (passwordHash && typeof passwordHash === 'string') {
              const passwordMatch = await bcrypt.compare(password, passwordHash);
              if (passwordMatch) {
                const { password: _p, ...sanitized } = userData;
                authenticatedUser = sanitized as User;
              }
            }
          }
        }
      } catch (dbError) {
        console.warn('[api/auth/login] Firestore query failed:', dbError);
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Invalid identifier or password' },
        { status: 401 }
      );
    }

    // Defense-in-depth: Ensure admin role and id can strictly only originate from ADMIN_USER
    if (
      (authenticatedUser.role === 'admin' || authenticatedUser.id === 'admin-001') &&
      authenticatedUser !== ADMIN_USER
    ) {
      console.warn('[api/auth/login] Blocked non-ADMIN_USER claiming admin role or id');
      return NextResponse.json(
        { error: 'Invalid identifier or password' },
        { status: 401 }
      );
    }

    // 2. Mint signed JWT session token (expires in 1 hour) with unique session jti
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      console.error('[api/auth/login] JWT_SECRET environment variable is not configured.');
      return NextResponse.json(
        { error: 'Authentication service configuration error' },
        { status: 500 }
      );
    }

    const jti = crypto.randomUUID();
    const token = await new SignJWT({
      userId: authenticatedUser.id,
      role: authenticatedUser.role,
      name: authenticatedUser.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setJti(jti)
      .setExpirationTime('1h')
      .sign(jwtSecret);

    // Write session to Firestore activeSessions using Admin SDK
    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection('activeSessions').doc(jti).set({
        userId: authenticatedUser.id,
        jti,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 3_600_000,
      });
    } catch (err) {
      console.warn('[api/auth/login] Failed to write activeSessions:', err);
    }

    // 3. Build response with secure httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
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
    console.error('[api/auth/login] Error processing login request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
