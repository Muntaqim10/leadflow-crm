import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:users!tasks_assigned_to_fkey (name, role), lead:leads!tasks_lead_id_fkey (name_company)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tasks: data || [] });
  } catch (error: any) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const body = await request.json();
    const { description, assigned_to, due_date, lead_id } = body;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          id: crypto.randomUUID(),
          lead_id: lead_id || null,
          description,
          assigned_to: assigned_to || null,
          due_date: due_date || null,
          status: 'pending'
        }
      ])
      .select('*, assignee:users!tasks_assigned_to_fkey (name, role), lead:leads!tasks_lead_id_fkey (name_company)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, task: data });
  } catch (error: any) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
