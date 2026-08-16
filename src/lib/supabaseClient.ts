import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

export const getBrowserSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
};
