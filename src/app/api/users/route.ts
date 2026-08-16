import { NextResponse } from 'next/server';
import { getRows, getSupabaseClient } from '@/lib/db';
import { cookies } from 'next/headers';

// Helper to authenticate caller and determine admin rights
async function getCallerAuth() {
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value;
  } catch (e) {}

  if (!token) {
    return { isAuthenticated: false, isAdmin: false, user: null };
  }

  const supabase = await getSupabaseClient(true);
  if (!supabase?.auth?.admin) {
    return { isAuthenticated: false, isAdmin: false, user: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { isAuthenticated: false, isAdmin: false, user: null };
  }

  const metaTier = user.user_metadata?.permission_tier;
  const role = (user.user_metadata?.role || '').toLowerCase();
  const email = (user.email || '').toLowerCase();

  const isSuperAdminEmail = email === 'muntaqim@leadflow.com' || email === 'muntaquime@gmail.com';
  const isAdmin =
    metaTier === 'admin' ||
    role.includes('admin') ||
    role.includes('general manager') ||
    role.includes('supervisor') ||
    role.includes('director') ||
    isSuperAdminEmail;

  return {
    isAuthenticated: true,
    isAdmin,
    user
  };
}

export async function GET() {
  try {
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const leads = await getRows('leads');

    // Merge auth users and db users
    const allUserMap = new Map<string, any>();

    // Helper to determine permission tier from role string or metadata
    const getPermissionTier = (roleStr: string, metaTier?: string): 'admin' | 'sales' | 'read_only' => {
      if (metaTier === 'admin' || metaTier === 'sales' || metaTier === 'read_only') return metaTier;
      const lower = (roleStr || '').toLowerCase();
      if (lower.includes('general manager') || lower.includes('admin') || lower.includes('supervisor') || lower.includes('director')) {
        return 'admin';
      }
      if (lower.includes('read') || lower.includes('viewer') || lower.includes('guest')) {
        return 'read_only';
      }
      return 'sales';
    };

    // 1. Process Auth Users (active accounts with Supabase Auth credentials)
    authUsers.forEach(authU => {
      const dbU = dbUsers.find(d => d.id === authU.id || (d.email && d.email.toLowerCase() === authU.email?.toLowerCase()));
      const role = dbU?.role || authU.user_metadata?.role || 'Sales Agent';
      const name = dbU?.name || authU.user_metadata?.name || authU.user_metadata?.full_name || authU.email?.split('@')[0] || 'User';
      const permission_tier = getPermissionTier(role, authU.user_metadata?.permission_tier);
      const userLeads = leads.filter(l => 
        l.assigned_sales_manager_id === authU.id || 
        l.user_id === authU.id || 
        l.manager_id === authU.id || 
        (dbU && (l.assigned_sales_manager_id === dbU.id || l.user_id === dbU.id || l.manager_id === dbU.id))
      );

      allUserMap.set(authU.id, {
        id: authU.id,
        email: authU.email || '',
        name,
        role,
        permission_tier,
        hasAuthAccount: true,
        leadsCount: userLeads.length,
        lastSignIn: authU.last_sign_in_at || null,
        confirmed: !!authU.email_confirmed_at,
        created_at: authU.created_at || dbU?.created_at || new Date().toISOString(),
        updated_at: dbU?.updated_at || authU.updated_at || new Date().toISOString()
      });
    });

    // 2. Process database users that might not be in auth list yet
    dbUsers.forEach(dbU => {
      const exists = Array.from(allUserMap.values()).some(
        u => u.id === dbU.id || (u.email && dbU.email && u.email.toLowerCase() === dbU.email.toLowerCase())
      );
      if (!exists) {
        const userLeads = leads.filter(l => 
          l.assigned_sales_manager_id === dbU.id || 
          l.user_id === dbU.id || 
          l.manager_id === dbU.id
        );
        const permission_tier = getPermissionTier(dbU.role || 'Sales Agent');
        allUserMap.set(dbU.id, {
          id: dbU.id,
          email: dbU.email || '',
          name: dbU.name,
          role: dbU.role || 'Sales Agent',
          permission_tier,
          hasAuthAccount: false,
          leadsCount: userLeads.length,
          confirmed: false,
          created_at: dbU.created_at || new Date().toISOString(),
          updated_at: dbU.updated_at || new Date().toISOString()
        });
      }
    });

    const userList = Array.from(allUserMap.values());
    return NextResponse.json(userList);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!caller.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Administrator privileges required to create accounts' }, { status: 403 });
    }

    const { email, name, role, permission_tier, password } = await request.json();
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and Name are required' }, { status: 400 });
    }

    const supabase = await getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const userPassword = password || 'Leadflow' + Math.floor(1000 + Math.random() * 9000) + '!';
    const userRole = role || 'Sales Agent';
    const userTier = permission_tier || 'sales';

    // 1. Create in Supabase Auth
    let userId: string | null = null;
    if (supabase.auth?.admin) {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password: userPassword,
        email_confirm: true,
        user_metadata: { name: name.trim(), role: userRole, permission_tier: userTier }
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
      name: name.trim(),
      role: userRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.trim(),
        name: name.trim(),
        role: userRole,
        permission_tier: userTier,
        temporaryPassword: userPassword
      }
    });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!caller.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Administrator privileges required to delete accounts' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reassignTo = searchParams.get('reassignTo');
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent deleting own account
    if (caller.user?.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own active account' }, { status: 400 });
    }

    const supabase = await getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // 1. Reassign leads/appointments/tasks if requested
    if (reassignTo && reassignTo !== id) {
      try {
        await supabase.from('leads').update({ assigned_sales_manager_id: reassignTo }).eq('assigned_sales_manager_id', id);
        await supabase.from('appointments').update({ agent_id: reassignTo }).eq('agent_id', id);
        await supabase.from('tasks').update({ assigned_to: reassignTo }).eq('assigned_to', id);
      } catch (reassignErr) {
        console.warn('Failed to reassign user records:', reassignErr);
      }
    }

    // 2. Delete from public.users
    await supabase.from('users').delete().eq('id', id);

    // 3. Delete from Supabase Auth
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
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, role, permission_tier } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Changing role or permission tier or modifying another user requires admin privileges
    const isSelfUpdate = caller.user?.id === id;
    const isRoleOrTierChange = role !== undefined || permission_tier !== undefined;

    if ((!isSelfUpdate || isRoleOrTierChange) && !caller.isAdmin) {
      return NextResponse.json({
        error: 'Forbidden: Only administrators can modify user roles or permission tiers'
      }, { status: 403 });
    }

    const supabase = await getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (role !== undefined && caller.isAdmin) updates.role = role;

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
        const metadataUpdates: any = {};
        if (name !== undefined) metadataUpdates.name = name;
        if (role !== undefined && caller.isAdmin) metadataUpdates.role = role;
        if (permission_tier !== undefined && caller.isAdmin) metadataUpdates.permission_tier = permission_tier;

        if (Object.keys(metadataUpdates).length > 0) {
          await supabase.auth.admin.updateUserById(id, {
            user_metadata: metadataUpdates
          });
        }
      } catch (authErr) {
        console.warn('Failed to update auth metadata:', authErr);
      }
    }

    return NextResponse.json({ ...data, permission_tier: permission_tier || data?.permission_tier });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

