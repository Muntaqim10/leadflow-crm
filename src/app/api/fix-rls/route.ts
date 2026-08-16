import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function GET() {
  const supabase = await getSupabaseClient(true);
  
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const muntaqim = users.users.find((u: any) => u.email === 'muntaqim@leadflow.com');
  if (!muntaqim) return NextResponse.json({ error: "Muntaqim not found" }, { status: 404 });
  
  // Update leads
  const { error: e1 } = await supabase.from('leads').update({ user_id: muntaqim.id }).neq('id', 'non-existent');
  
  // Update templates
  const { error: e2 } = await supabase.from('email_templates').update({ user_id: muntaqim.id }).neq('id', 'non-existent');
  
  return NextResponse.json({
    message: "Migrated successfully",
    muntaqimId: muntaqim.id,
    leadsError: e1?.message || null,
    templatesError: e2?.message || null
  });
}
