const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if(k) acc[k.trim()] = v?.trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function test() {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, leads ( name_company ), users ( name )`);
    
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS');
  }
}
test();
