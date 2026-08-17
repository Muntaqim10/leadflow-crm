export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';
import { getCallerAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(true);
    
    let query = supabase
      .from('tasks')
      .select('*, assignee:users!tasks_assigned_to_fkey (name, role), lead:leads!tasks_lead_id_fkey (name_company)')
      .order('created_at', { ascending: false });

    if (!caller.isAdmin && caller.user) {
      query = query.eq('assigned_to', caller.user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ tasks: data || [] });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to fetch tasks::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(true);
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
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to create task::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
