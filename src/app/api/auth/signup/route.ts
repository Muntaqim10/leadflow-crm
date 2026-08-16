import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const supabase = await getSupabaseClient(true); // Need service role to bypass RLS for inserting user

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // 1. Sign up user in Supabase Auth
    // By default, if email_confirm is enabled in Supabase, this will send an email.
    // If not, it will immediately create the user.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || 'Sales Manager',
        }
      }
    });

    if (authError) {
      console.error('Signup error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert into our public users table
    if (authData?.user?.id) {
      const { error: dbError } = await supabase.from('users').upsert({
        id: authData.user.id,
        email,
        name,
        role: role || 'Sales Manager',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (dbError) {
        console.error('Error inserting user into DB:', dbError);
        // We do not fail the request completely since auth was successful,
        // but we should probably log it.
      }
    }

    // If auto-confirm is enabled, session will be returned.
    const session = authData?.session;
    const response = NextResponse.json({ success: true, session });

    if (session) {
      response.cookies.set('auth_token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
    }

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
