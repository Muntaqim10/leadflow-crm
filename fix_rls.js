require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) return console.error(error);
  
  const muntaqim = users.users.find(u => u.email === 'muntaqim@leadflow.com');
  if (!muntaqim) return console.log("Muntaqim not found");
  
  console.log("Muntaqim's new UUID:", muntaqim.id);

  // Update leads
  const { error: e1 } = await supabase.from('leads').update({ user_id: muntaqim.id }).neq('id', 'non-existent');
  console.log("Update leads:", e1 ? e1.message : "Success");

  // Update templates
  const { error: e2 } = await supabase.from('email_templates').update({ user_id: muntaqim.id }).neq('id', 'non-existent');
  console.log("Update templates:", e2 ? e2.message : "Success");
}
fix();
