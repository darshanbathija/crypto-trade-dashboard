import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth/login'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Allow static files and API routes (except auth routes)
  const isStaticFile = pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico');

  if (isStaticFile) {
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access protected route
  if (!authToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (authToken && pathname === '/login') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
