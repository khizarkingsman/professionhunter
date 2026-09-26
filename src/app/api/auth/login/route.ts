import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { withRateLimit } from '@/lib/server-rate-limiter';
import { getAdminFirestore } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import { type User } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Secure authentication endpoint:
// 1. Enforces server-side rate limiting ('auth' tier: 5 attempts per window)
// 2. Validates credentials server-side (Admin env secret or bcrypt-hashed Firestore user)
// 3. Issues signed 1-hour httpOnly session cookie with activeSessions tracking
// ───────────────────────────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

const ADMIN_USER: User = {
  id: 'admin-001',
  name: 'Admin',
  username: 'admin',
  role: 'admin',
  email: 'admin@professionhunter.com',
  country: 'Saudi Arabia',
  city: 'Riyadh',
  age: 30,
  phone: '+966500000000',
  avatarUrl: 'https://placehold.co/100x100.png?text=A',
  lastSeen: 'online',
};

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
      // Check Firestore database
      try {
        const usersRef = collection(db, 'users');
        // Check by email
        let q = query(usersRef, where('email', '==', ident));
        let snap = await getDocs(q);

        // Check by username if not found by email
        if (snap.empty) {
          q = query(usersRef, where('username', '==', ident));
          snap = await getDocs(q);
        }

        // Check by phone
        if (snap.empty) {
          q = query(usersRef, where('phone', '==', identifier.trim()));
          snap = await getDocs(q);
        }

        if (!snap.empty) {
          const userData = snap.docs[0].data();
          // Detect whether the stored value is already a bcrypt hash
          const BCRYPT_HASH_RE = /^\$2[aby]\$/;
          const storedPassword: string = userData.password ?? '';

          let passwordMatch = false;

          if (BCRYPT_HASH_RE.test(storedPassword)) {
            // New path: compare against bcrypt hash
            passwordMatch = await bcrypt.compare(password, storedPassword);
          } else {
            // Legacy path: stored password is plaintext — direct === comparison
            if (storedPassword !== '' && storedPassword === password) {
              passwordMatch = true;
              // Immediately rehash and update Firestore so next login uses bcrypt
              try {
                const newHash = await bcrypt.hash(password, 12);
                await setDoc(
                  doc(db, 'users', snap.docs[0].id),
                  { password: newHash },
                  { merge: true }
                );
              } catch (rehashErr) {
                // Non-fatal: log but don't block authentication
                console.warn('[api/auth/login] Inline rehash failed:', rehashErr);
              }
            }
          }

          if (passwordMatch) {
            const { password: _p, ...sanitized } = userData;
            authenticatedUser = sanitized as User;
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
