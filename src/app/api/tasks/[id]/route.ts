import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';
import { getCallerAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient(true);
    
    // Fetch existing task to check ownership
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!caller.isAdmin && existingTask.assigned_to !== caller.user?.id) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this task.' }, { status: 403 });
    }

    const body = await request.json();
    
    // Allow updating status, assignee, description, due date
    const allowedUpdates = ['status', 'assigned_to', 'description', 'due_date'];
    const updateData: any = {};
    
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select('*, assignee:users!tasks_assigned_to_fkey (name, role)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, task: data });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to update task::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient(true);

    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!caller.isAdmin && existingTask.assigned_to !== caller.user?.id) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this task.' }, { status: 403 });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to delete task::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
