import { createClient } from '@supabase/supabase-js';

import { cookies } from 'next/headers';

export async function getSupabaseClient(useServiceRole = false): Promise<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const activeKey = useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

  if (!supabaseUrl || !activeKey || !supabaseUrl.startsWith('http')) {
    throw new Error('Supabase client is not configured properly');
  }

  // If using service role key, we do not append the user bearer token (to avoid auth conflict)
  if (useServiceRole) {
    return createClient(supabaseUrl, activeKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value;
  } catch (e) {
    // If not in a request context, token will be undefined
  }

  if (token) {
    return createClient(supabaseUrl, activeKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  return createClient(supabaseUrl, activeKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

export interface RowData {
  id: string;
  [key: string]: any;
}

const defaultTemplates: RowData[] = [
  { id: 'tpl-1', template_type: 'thank_you', content: 'Dear {{client_name}},\n\nThank you for choosing Leadflow for your upcoming event! We are absolutely thrilled at the prospect of hosting {{company_name}} and ensuring your stay beginning on {{check_in_date}} is nothing short of exceptional.\n\nOur team is currently reviewing your details. In the meantime, please feel free to reach out if you have any immediate questions.\n\nWarm regards,\n{{user_name}}' },
  { id: 'tpl-2', template_type: 'follow_up_reminder', content: 'Dear {{client_name}},\n\nI hope you are having a wonderful week.\n\nI am following up on the proposal we sent over for your event on {{check_in_date}}. We would love to finalize your arrangements and secure your preferred dates in {{event_room}}.\n\nPlease let me know if you have any questions or if you would like to review the details together.\n\nBest regards,\n{{user_name}}' },
  { id: 'tpl-3', template_type: 'gentle_reminder', content: 'Dear {{client_name}},\n\nThis is a gentle reminder regarding the pending contract for your event on {{check_in_date}}.\n\nTo ensure we can accommodate all your needs, please review and sign the contract at your earliest convenience. Let us know if any adjustments are needed!\n\nWe look forward to hosting you soon.\n\nWarm regards,\n{{user_name}}' },
  { id: 'tpl-4', template_type: 'booking_confirmation', content: 'Dear {{client_name}},\n\nWe are thrilled to officially confirm your booking at Leadflow for {{check_in_date}} to {{check_out_date}}!\n\nAttached is your official confirmation. We can\'t wait to deliver an unforgettable experience for you and your guests.\n\nBest,\n{{user_name}}' },
  { id: 'tpl-5', template_type: 'feedback_request', content: 'Dear {{client_name}},\n\nThank you for considering Leadflow. We are always striving to improve our guest experience, and we would deeply appreciate any feedback on how we can better serve your event needs in the future.\n\nThank you for your time,\n{{user_name}}' }
];
async function withTimeout<T = any>(promise: PromiseLike<T>, ms: number = 8000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase request timeout')), ms);
  });
  try {
    const result = await Promise.race([Promise.resolve(promise), timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

export async function getRows(tableName: string): Promise<RowData[]> {
  const supabase = await getSupabaseClient(false);
  const { data, error } = await withTimeout(supabase.from(tableName).select('*'), 8000);
  if (error) throw error;
  return data || [];
}

export async function addRow(
  tableName: string, 
  data: Omit<RowData, 'id'> & Partial<Pick<RowData, 'id'>>
): Promise<RowData> {
  const id = data.id || crypto.randomUUID();
  const created_at = new Date().toISOString();
  const updated_at = created_at;
  const payload = { ...data, id, created_at, updated_at };

  const supabase = await getSupabaseClient(false);
  const { data: insertedData, error } = await withTimeout(
    supabase.from(tableName).insert(payload).select().single(), 
    8000
  );
  if (error) throw error;
  return insertedData;
}

export async function updateRow(
  tableName: string, 
  id: string, 
  data: Partial<RowData>
): Promise<RowData> {
  const updated_at = new Date().toISOString();
  const payload = { ...data, updated_at };

  const supabase = await getSupabaseClient(false);
  const { data: updatedData, error } = await withTimeout(
    supabase.from(tableName).update(payload).eq('id', id).select().single(),
    8000
  );
  if (error) throw error;
  return updatedData;
}

export async function deleteRow(tableName: string, id: string): Promise<void> {
  const supabase = await getSupabaseClient(false);
  const { error } = await withTimeout(
    supabase.from(tableName).delete().eq('id', id),
    8000
  );
  if (error) throw error;
}

export async function initDatabase(): Promise<string[]> {
  const supabase = await getSupabaseClient();
  await withTimeout(supabase.from('users').select('id').limit(1), 8000);
  return [];
}

export async function seedDefaultTemplates(): Promise<void> {
  try {
    const supabase = await getSupabaseClient(true);
    if (!supabase) return;

    for (const tpl of defaultTemplates) {
      // Upsert resolving conflicts on template_type
      const { error } = await supabase.from('email_templates').upsert(tpl, { onConflict: 'template_type' });
      if (error) throw error;
    }
  } catch (err) {
    // Keep silent in production, handled silently
  }
}

export async function seedTestTeam(): Promise<void> {
  // No mock users are seeded. Users are only created when real accounts sign up.
}
