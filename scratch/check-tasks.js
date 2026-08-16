const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if(k) acc[k.trim()] = v?.trim();
  return acc;
}, {});
fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/tasks?select=*', {
  headers: { 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'apikey': env.SUPABASE_SERVICE_ROLE_KEY }
}).then(res => res.json()).then(t => console.log('Tasks keys:', t.length ? Object.keys(t[0]) : 'empty')).catch(console.error);
