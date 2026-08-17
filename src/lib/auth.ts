import { cookies } from 'next/headers';
import { getSupabaseClient } from '@/lib/db';

export async function getCallerAuth() {
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
