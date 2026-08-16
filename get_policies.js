global.WebSocket = class {};
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const { data: policies, error } = await supabase.rpc('inspect_policies');
  if (error) {
    // If inspect_policies RPC doesn't exist, query pg_policies via a generic query if possible,
    // or just fetch policy details using custom sql if allowed, or we can check via simple query.
    console.log('inspect_policies RPC failed, trying raw query...');
    
    // Let's query pg_policies using a raw SQL command if RPC is not available.
    // In Supabase, we can query via postgrest if there is a helper, but raw SQL is not directly exposed on postgrest.
    // Let's try to query public schemas or try calling pg_policies.
    const { data, error: err2 } = await supabase.from('pg_policies').select('*').catch(() => ({ error: 'Not readable via PostgREST' }));
    console.log('pg_policies read:', data, err2);
  } else {
    console.log('=== POLICIES ===');
    console.log(policies);
  }
}

run();
