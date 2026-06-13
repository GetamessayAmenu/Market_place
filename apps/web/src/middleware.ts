import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js middleware for basic route protection.
 * Checks for an access_token cookie on protected paths.
 * For full auth validation, server components use requireUser().
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
