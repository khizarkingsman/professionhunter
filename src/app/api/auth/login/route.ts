import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { withRateLimit } from '@/lib/server-rate-limiter';
import bcrypt from 'bcryptjs';
import { type User } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Secure authentication endpoint:
// 1. Enforces server-side rate limiting ('auth' tier: 5 attempts per window)
// 2. Validates credentials server-side (Admin env secret, Firestore, or mock users)
// 3. Issues signed 7-day httpOnly session cookie
// ───────────────────────────────────────────────────────────────────────────────

if (!process.env.JWT_SECRET) {
  throw new Error(
    '[api/auth/login] JWT_SECRET environment variable is not set. ' +
    'Set it in .env.local (dev) or your deployment environment (prod).'
  );
}

if (!process.env.ADMIN_PASSWORD) {
  throw new Error(
    '[api/auth/login] ADMIN_PASSWORD environment variable is not set. ' +
    'Set a strong password in .env.local (dev) or your deployment environment (prod).'
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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
  const limited = withRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const body = await req.json();
    const { identifier, password, userId, role, name } = body;

    let authenticatedUser: User | null = null;

    // A. Identifier + Password verification flow
    if (identifier && password) {
      const ident = String(identifier).trim().toLowerCase();

      // Check Admin credentials server-side (secrets never reach the client bundle)
      if (
        (ident === 'admin' || ident === 'admin@professionhunter.com' || ident === '+966500000000') &&
        password === ADMIN_PASSWORD
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
    }
    // B. Internal signup session initialization (verifies user doc exists in DB)
    else if (userId && role) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role === role) {
            const { password: _p, ...sanitized } = data;
            authenticatedUser = sanitized as User;
          }
        }
      } catch (err) {
        console.warn('[api/auth/login] User lookup failed during signup session init:', err);
      }

      if (!authenticatedUser) {
        return NextResponse.json(
          { error: 'Invalid user verification' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    // 2. Mint signed JWT session token (expires in 7 days)
    const token = await new SignJWT({
      userId: authenticatedUser.id,
      role: authenticatedUser.role,
      name: authenticatedUser.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
