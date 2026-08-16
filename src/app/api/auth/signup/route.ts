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

    const defaultRole = 'Sales Agent';
    let authData: any = null;
    let authError: any = null;

    // Strategy A: If SUPABASE_SERVICE_ROLE_KEY is present, use Admin API
    const hasServiceRoleKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20);
    if (hasServiceRoleKey) {
      try {
        const adminSupabase = await getSupabaseClient(true);
        if (adminSupabase?.auth?.admin) {
          const res = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              name,
              role: defaultRole,
            }
          });
          authData = res.data;
          authError = res.error;
        }
      } catch (err: any) {
        console.warn('Admin createUser failed, falling back to public signup:', err.message);
      }
    }

    // Strategy B: Fallback to standard client signUp
    if (!authData?.user || authError) {
      const anonSupabase = await getSupabaseClient(false);
      if (!anonSupabase) {
        return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
      }

      const res = await anonSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: defaultRole,
          }
        }
      });

      if (res.error) {
        console.error('Signup error:', res.error);
        return NextResponse.json({ error: res.error.message }, { status: 400 });
      }
      authData = res.data;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
    }

    // 2. Insert/Upsert into our public users table
    const serviceDb = await getSupabaseClient(true);
    if (serviceDb) {
      try {
        await serviceDb.from('users').upsert({
          id: userId,
          email,
          name,
          role: defaultRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (dbErr) {
        console.error('Error inserting user into DB:', dbErr);
      }
    }

    // 3. Log the user in to retrieve an active session
    let session = authData?.session || null;
    if (!session) {
      const anonClient = await getSupabaseClient(false);
      if (anonClient) {
        const { data: loginData } = await anonClient.auth.signInWithPassword({
          email,
          password
        });
        session = loginData?.session || null;
      }
    }

    // Fallback simulated session structure if direct signIn had email verification pending
    if (!session && authData?.user) {
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
