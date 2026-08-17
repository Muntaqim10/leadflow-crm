import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Conditionally create rate limiters to avoid crashing if env vars are missing
const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

const loginRateLimit = hasUpstash ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: false,
}) : null;

const resetRateLimit = hasUpstash ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: false,
}) : null;

const emailRateLimit = hasUpstash ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: false,
}) : null;

export default async function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const path = request.nextUrl.pathname;

  // 1. Rate Limiting for Auth Routes
  if (path === '/api/auth/login' || path === '/api/auth/signup' || path === '/api/auth/register') {
    if (loginRateLimit) {
      const { success } = await loginRateLimit.limit(`auth_${ip}`);
      if (!success) {
        return NextResponse.json({ error: 'Too many authentication attempts, please try again later.' }, { status: 429 });
      }
    }
  }

  if (path === '/api/auth/forgot-password') {
    if (resetRateLimit) {
      const { success } = await resetRateLimit.limit(`reset_${ip}`);
      if (!success) {
        return NextResponse.json({ error: 'Too many reset attempts, please try again later.' }, { status: 429 });
      }
    }
  }

  // Rate Limiting for Email Routes
  if (path.startsWith('/api/email/')) {
    if (emailRateLimit) {
      const { success } = await emailRateLimit.limit(`email_${ip}`);
      if (!success) {
        return NextResponse.json({ error: 'Too many email requests, please try again later.' }, { status: 429 });
      }
    }
  }

  // 2. Auth Protection for API Routes
  if (path.startsWith('/api/')) {
    // Exclude public auth routes and generic endpoints
    if (path.startsWith('/api/auth/')) {
      // Allow auth routes to proceed
    } else {
      const token = request.cookies.get('auth_token')?.value;

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
  }

  const response = NextResponse.next();

  // 3. Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:;");

  // 4. CORS Configuration - Restrict if needed, usually Next.js handles this by default for same-origin, 
  // but let's ensure it doesn't allow cross-origin unless explicitly requested.
  // Not setting Access-Control-Allow-Origin defaults to same-origin.

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
