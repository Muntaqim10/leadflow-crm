import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const supabase = await getSupabaseClient(false);

    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/#type=recovery`,
      });

      if (error) {
        console.warn('Password reset request error:', error.message);
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}
