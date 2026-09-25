import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Edge Middleware ─────────────────────────────────────────────────────────
// Intercepts protected routes at the Next.js edge before any client UI renders.
// Enforces role-based access control and eliminates localStorage client spoofing.
// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.JWT_SECRET) {
  throw new Error(
    '[middleware] JWT_SECRET environment variable is not set. ' +
    'Set it in .env.local (dev) or your deployment environment (prod). ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"'
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isWorkerDashboard = pathname.startsWith('/dashboard-worker');
  const isStoreDashboard = pathname.startsWith('/dashboard-store');
  const isUserDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  if (isAdminRoute || isWorkerDashboard || isStoreDashboard || isUserDashboard) {
    const sessionCookie = req.cookies.get('session')?.value;

    if (!sessionCookie) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
      const role = payload.role as string;

      // 1. Admin route requires admin role
      if (isAdminRoute && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // 2. Worker dashboard requires worker or admin role
      if (isWorkerDashboard && role !== 'worker' && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // 3. Store dashboard requires store or admin role
      if (isStoreDashboard && role !== 'store' && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } catch {
      // Invalid or expired token — wipe cookie and force re-login
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard-worker/:path*',
    '/dashboard-store/:path*',
    '/dashboard/:path*',
  ],
};
