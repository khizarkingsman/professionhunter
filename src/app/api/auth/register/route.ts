import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { withRateLimit } from '@/lib/server-rate-limiter';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { type User } from '@/lib/data';

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

const ALLOWED_ROLES = ['worker', 'seeker', 'store'] as const;
const RESERVED_IDENTIFIERS = ['admin', 'admin@professionhunter.com', '+966500000000'];

export async function POST(req: NextRequest) {
  // 1. Server-side rate limiting
  const limited = await withRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const { user, password } = body;

    if (!user || typeof user !== 'object' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'User data and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Role allowlist validation
    const rawRole = String(user.role || '').trim().toLowerCase();
    if (!ALLOWED_ROLES.includes(rawRole as any)) {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 400 }
      );
    }
    const role = rawRole as 'worker' | 'seeker' | 'store';

    const rawEmail = String(user.email || '').trim().toLowerCase();
    const rawUsername = user.username ? String(user.username).trim().toLowerCase() : '';
    const rawPhone = user.phone ? String(user.phone).trim() : '';

    if (!rawEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Reject reserved admin identifiers
    if (
      RESERVED_IDENTIFIERS.includes(rawEmail) ||
      RESERVED_IDENTIFIERS.includes(rawUsername) ||
      RESERVED_IDENTIFIERS.includes(rawPhone) ||
      rawUsername === 'admin'
    ) {
      return NextResponse.json(
        { error: 'Reserved identifier cannot be registered' },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    const usersCol = adminDb.collection('users');

    // Email uniqueness check
    const emailSnap = await usersCol.where('email', '==', rawEmail).limit(1).get();
    if (!emailSnap.empty) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Username uniqueness check (if provided)
    if (rawUsername) {
      const usernameSnap = await usersCol.where('username', '==', rawUsername).limit(1).get();
      if (!usernameSnap.empty) {
        return NextResponse.json(
          { error: 'A user with this username already exists' },
          { status: 409 }
        );
      }
    }

    // Phone uniqueness check (if provided)
    if (rawPhone) {
      const phoneSnap = await usersCol.where('phone', '==', rawPhone).limit(1).get();
      if (!phoneSnap.empty) {
        return NextResponse.json(
          { error: 'A user with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Generate secure server-side UUID
    const userId = crypto.randomUUID();

    // Copy ONLY allowlisted profile fields
    const userDocData: User = {
      id: userId,
      role,
      name: String(user.name || '').trim() || (role === 'worker' ? 'Worker' : 'User'),
      email: rawEmail,
      username: rawUsername || rawEmail.split('@')[0],
      phone: rawPhone,
      country: user.country ? String(user.country).trim() : 'Saudi Arabia',
      city: user.city ? String(user.city).trim() : 'Riyadh',
      neighborhood: user.neighborhood ? String(user.neighborhood).trim() : undefined,
      bio: user.bio ? String(user.bio).trim() : undefined,
      profession: user.profession ? String(user.profession).trim() : undefined,
      experience: typeof user.experience === 'number' ? user.experience : undefined,
      avatarUrl: user.avatarUrl ? String(user.avatarUrl).trim() : `https://placehold.co/100x100.png?text=${encodeURIComponent((user.name || 'U').charAt(0))}`,
      age: typeof user.age === 'number' ? user.age : 25,
      // Server-enforced defaults
      isPro: false,
      isSeekerPro: false,
      phoneVerified: false,
      iqamaStatus: 'none',
      isVerified: false,
      avgRating: 0,
      createdAt: new Date().toISOString(),
      lastSeen: 'online',
    };

    // 2. Hash password with bcrypt cost 12
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Write directly to credentials/{userId} via Admin SDK
    await adminDb.collection('credentials').doc(userId).set({
      passwordHash: hashedPassword,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 4. Create user profile in users/{userId} (create-never-overwrite, zero password field)
    await usersCol.doc(userId).create(userDocData);

    // 5. Mint signed JWT session token (expires in 1 hour) with unique session jti
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      console.error('[api/auth/register] JWT_SECRET environment variable is not configured.');
      return NextResponse.json(
        { error: 'Authentication service configuration error' },
        { status: 500 }
      );
    }

    const jti = crypto.randomUUID();
    const token = await new SignJWT({
      userId: userDocData.id,
      role: userDocData.role,
      name: userDocData.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setJti(jti)
      .setExpirationTime('1h')
      .sign(jwtSecret);

    // Write session to activeSessions using Admin SDK
    try {
      await adminDb.collection('activeSessions').doc(jti).set({
        userId: userDocData.id,
        jti,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 3_600_000,
      });
    } catch (err) {
      console.warn('[api/auth/register] Failed to write activeSessions:', err);
    }

    // 6. Build response with httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: userDocData,
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
