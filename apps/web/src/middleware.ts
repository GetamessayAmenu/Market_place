import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js middleware for route protection.
 * Checks for an access_token cookie on protected paths.
 * Preserves ?redirect= param through the auth flow chain.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Protected paths that require authentication
  const protectedPaths = ['/dashboard'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token =
      request.cookies.get('access_token')?.value ??
      request.cookies.get('Authentication')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth pages redirect to dashboard if already authenticated
  const authPaths = ['/login', '/register'];
  const isAuthPage = authPaths.some((p) => pathname === p);

  if (isAuthPage) {
    const token =
      request.cookies.get('access_token')?.value ??
      request.cookies.get('Authentication')?.value;

    if (token) {
      const redirect = searchParams.get('redirect');
      const target = redirect ?? '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
