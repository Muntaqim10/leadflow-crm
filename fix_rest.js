require('dotenv').config({ path: '.env.local' });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fix() {
  // 1. Get users
  const res = await fetch(`${SUPABASE_URL}/auth/v1/users`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY
    }
  });
  const users = await res.json();
  const muntaqim = users.users.find(u => u.email === 'muntaqim@leadflow.com');
  console.log("Muntaqim UUID:", muntaqim?.id);

  if (!muntaqim) return;

  // 2. Update leads
  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ user_id: muntaqim.id })
  });
  console.log("Leads update status:", updateRes.status);

  // 3. Update templates
  const templateRes = await fetch(`${SUPABASE_URL}/rest/v1/email_templates`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ user_id: muntaqim.id })
  });
  console.log("Templates update status:", templateRes.status);
}
fix();
