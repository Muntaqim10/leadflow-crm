const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if(k) acc[k.trim()] = v?.trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAPI() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'muntaqim@leadflow.com',
    password: 'Password123!'
  });
  
  if (error) {
    console.error('Login failed:', error);
    return;
  }
  
  const token = data.session.access_token;
  console.log('Logged in! Fetching /api/leads...');
  
  const res = await fetch('https://leadflow-sales.vercel.app/api/leads', {
    headers: {
      'Cookie': 'auth_token=' + token
    }
  });
  
  const json = await res.json();
  console.log('API Returned:', typeof json, Array.isArray(json) ? `Array(${json.length})` : json);
  if (Array.isArray(json) && json.length > 0) {
    console.log('First lead:', json[0].name_company);
  }
}

testAPI();
