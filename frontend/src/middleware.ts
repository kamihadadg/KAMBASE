import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Clone the response
  const response = NextResponse.next();

  // Get current language and theme from cookies or set defaults
  const language = request.cookies.get('language-storage')?.value || 'fa';
  const theme = request.cookies.get('theme-storage')?.value || 'dark';

  // Ensure cookies are set for SSR consistency
  response.cookies.set('language-storage', language, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Allow client-side access
  });

  response.cookies.set('theme-storage', theme, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Allow client-side access
  });

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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
