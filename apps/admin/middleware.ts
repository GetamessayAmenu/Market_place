import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/admin/forbidden']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow Next.js internals, static assets, and proxy API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  // Allow explicitly public paths
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next()
  }

  // Check if user has access_token cookie
  if (!request.cookies.has('access_token')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Verify user has admin role by calling /auth/me endpoint
  try {
    const apiResponse = await fetch(`${request.nextUrl.origin}/api/v1/auth/me`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      },
      cache: 'no-store'
    })

    if (!apiResponse.ok) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    const userData = await apiResponse.json()
    const userRole = userData.data?.user?.role
    
    // Only allow access if user has admin role
    const adminRoles = ['admin', 'super_admin', 'moderator', 'support']
    if (!userRole || !adminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/admin/forbidden', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: '/:path*',
}
