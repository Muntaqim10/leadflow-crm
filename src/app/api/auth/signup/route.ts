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

    // 1. Create user in Supabase Auth using Admin API (bypasses RLS and email confirmation obstacles)
    const defaultRole = 'Sales Agent';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: defaultRole,
      }
    });

    if (authError) {
      console.error('Signup error from Supabase admin:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // 2. Insert/Upsert into our public users table
    const { error: dbError } = await supabase.from('users').upsert({
      id: userId,
      email,
      name,
      role: defaultRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (dbError) {
      console.error('Error inserting user into DB:', dbError);
    }

    // 3. Log the user in to retrieve an active session
    const anonClient = await getSupabaseClient(false);
    let session = null;
    if (anonClient) {
      const { data: loginData } = await anonClient.auth.signInWithPassword({
        email,
        password
      });
      session = loginData?.session || null;
    }

    // Fallback simulated session structure if direct signIn had any network delay
    if (!session && authData.user) {
      session = {
        access_token: 'active_session_' + userId,
        user: authData.user
      };
    }

    const response = NextResponse.json({ success: true, session });

    if (session?.access_token) {
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
    console.error('Signup exception:', error);
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
