import { NextResponse } from 'next/server';
import { getRows, getSupabaseClient } from '@/lib/db';

export async function GET() {
  try {
    const supabase = await getSupabaseClient(true);
    let authUsers: any[] = [];
    if (supabase?.auth?.admin) {
      try {
        const { data } = await supabase.auth.admin.listUsers();
        authUsers = data?.users || [];
      } catch (e) {
        console.warn('Could not list auth users:', e);
      }
    }

    const dbUsers = await getRows('users');

    // If we have auth users from Supabase Auth, ONLY display actual accounts registered in Supabase
    if (authUsers.length > 0) {
      const realUsers = authUsers.map(authU => {
        const dbU = dbUsers.find(d => d.id === authU.id || d.email?.toLowerCase() === authU.email?.toLowerCase());
        const role = dbU?.role || authU.user_metadata?.role || 'Sales Agent';
        const name = dbU?.name || authU.user_metadata?.name || authU.user_metadata?.full_name || authU.email?.split('@')[0] || 'User';
        return {
          id: authU.id,
          email: authU.email || '',
          name,
          role,
          created_at: authU.created_at || dbU?.created_at || new Date().toISOString(),
          updated_at: dbU?.updated_at || authU.updated_at || new Date().toISOString()
        };
      });

      return NextResponse.json(realUsers);
    }

    // Fallback: only return users with a valid UUID and authentic non-mock email
    const filteredDbUsers = dbUsers
      .filter(u => u.email && u.email.includes('@') && !u.email.endsWith('@leadflow.com'))
      .map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role || 'Sales Agent',
        created_at: u.created_at,
        updated_at: u.updated_at
      }));

    return NextResponse.json(filteredDbUsers);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, name, role, password } = await request.json();
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and Name are required' }, { status: 400 });
    }

    const supabase = await getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const userPassword = password || 'Welcome' + Math.floor(1000 + Math.random() * 9000) + '!';
    const userRole = role || 'Sales Agent';

    // 1. Create in Supabase Auth
    let userId: string | null = null;
    if (supabase.auth?.admin) {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: userPassword,
        email_confirm: true,
        user_metadata: { name, role: userRole }
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
      userId = createData.user?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // 2. Save in public.users
    await supabase.from('users').upsert({
      id: userId,
      name,
      role: userRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      user: { id: userId, email, name, role: userRole, temporaryPassword: userPassword }
    });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // Delete from public.users
    await supabase.from('users').delete().eq('id', id);

    // Delete from Auth
    if (supabase.auth?.admin) {
      try {
        await supabase.auth.admin.deleteUser(id);
      } catch (authErr) {
        console.warn('Failed to delete auth user:', authErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name, role } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const supabase = await getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Also update auth user metadata
    if (supabase.auth?.admin) {
      try {
        await supabase.auth.admin.updateUserById(id, {
          user_metadata: {
            ...(name ? { name } : {}),
            ...(role ? { role } : {})
          }
        });
      } catch (authErr) {
        console.warn('Failed to update auth metadata:', authErr);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
