import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';
import { getCallerAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await getSupabaseClient(true);
    
    // Join with users table to get assignee names
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:users!tasks_assigned_to_fkey (name, role)')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tasks: data || [] });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to fetch lead tasks::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await getSupabaseClient(true);
    const body = await request.json();
    const { description, assigned_to, due_date } = body;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          id: crypto.randomUUID(),
          lead_id: id,
          description,
          assigned_to: assigned_to || null,
          due_date: due_date || null,
          status: 'pending'
        }
      ])
      .select('*, assignee:users!tasks_assigned_to_fkey (name, role)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, task: data });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to create lead task::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
