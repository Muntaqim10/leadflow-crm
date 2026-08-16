import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect /api routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Exclude public auth routes
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
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
