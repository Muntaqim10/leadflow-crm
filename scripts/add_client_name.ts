import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_name TEXT;'
  });

  if (error) {
    console.error('Error adding column:', error);
  } else {
    console.log('Column added successfully:', data);
  }
}
run();
