import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('Supabase login error:', error);
        return NextResponse.json({ error: error.message || 'Invalid email or password' }, { status: 401 });
      }

      if (data?.session) {
        const response = NextResponse.json({ session: data.session });
        response.cookies.set('auth_token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        return response;
      }
    } else {
      console.error('Supabase client failed to initialize during login.');
    }

    return NextResponse.json({ error: 'Invalid email or password. Please verify your credentials.' }, { status: 401 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
