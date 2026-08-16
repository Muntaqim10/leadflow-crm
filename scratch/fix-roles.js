const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if(k) acc[k.trim()] = v?.trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const roles = {
  'arzaan@leadflow.com': 'General Manager',
  'rokeya@leadflow.com': 'Director of Sales',
  'riham@leadflow.com': 'Sales Manager',
  'muntaqim@leadflow.com': 'Front Desk Supervisor'
};

async function fixRoles() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  for (const user of users) {
    const role = roles[user.email];
    if (role) {
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role }
      });
      if (error) {
        console.error(`Failed to update role for ${user.email}:`, error);
      } else {
        console.log(`Successfully updated role for ${user.email} to ${role}`);
      }
    }
  }
}

fixRoles();
