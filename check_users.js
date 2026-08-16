global.WebSocket = class {};
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error.message);
  } else {
    console.log('=== USERS IN PUBLIC USERS TABLE ===');
    console.log(users);
  }
  
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth users:', authError.message);
  } else {
    console.log('=== AUTH USERS ===');
    console.log(authUsers.users.map(u => ({ id: u.id, email: u.email, name: u.user_metadata?.name })));
  }
}

run();
