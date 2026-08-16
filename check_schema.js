require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: leads, error: e1 } = await supabase.from('leads').select('*').limit(1);
  console.log("Leads columns:", leads ? Object.keys(leads[0]) : e1);

  const { data: templates, error: e2 } = await supabase.from('email_templates').select('*').limit(1);
  console.log("Templates columns:", templates ? Object.keys(templates[0]) : e2);
}
check();
