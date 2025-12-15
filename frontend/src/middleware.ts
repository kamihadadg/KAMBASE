import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Clone the response
  const response = NextResponse.next();

  // Check if this is a critical page that needs cookie access even without consent
  const isCriticalPage = request.nextUrl.pathname.includes('/verify-email') ||
                        request.nextUrl.pathname.includes('/reset-password') ||
                        request.nextUrl.pathname.includes('/forgot-password') ||
                        request.nextUrl.pathname.includes('/login') ||
                        request.nextUrl.pathname.includes('/register');

  // Add a header to indicate if this is a critical page
  response.headers.set('x-is-critical-page', isCriticalPage.toString());

  // Only set default cookies if they don't exist and not on critical pages
  // Zustand stores manage these cookies with JSON, so don't override them
  if (!request.cookies.has('language-storage')) {
    response.cookies.set('language-storage', '{"state":{"language":"fa"},"version":0}', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Allow client-side access
    });
  }

  if (!request.cookies.has('theme-storage')) {
    response.cookies.set('theme-storage', '{"state":{"theme":"dark"},"version":0}', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Allow client-side access
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Critical pages that need SSR without cookie consent checks
     */
    '/((?!api|_next/static|_next/image|favicon.ico|verify-email|reset-password|forgot-password).*)',
  ],
};
