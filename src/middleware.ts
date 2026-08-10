import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect /api routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Exclude auth routes
    if (
      request.nextUrl.pathname.startsWith('/api/auth/login') ||
      request.nextUrl.pathname.startsWith('/api/auth/logout')
    ) {
      return NextResponse.next();
    }

    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
