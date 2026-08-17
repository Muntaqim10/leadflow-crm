import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';
import { getCallerAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient(true);

    // Fetch the appointment first to know its details for the activity log and auth check
    const { data: aptData, error: fetchError } = await supabase
      .from('appointments')
      .select('lead_id, type, appointment_date, agent_id')
      .eq('id', id)
      .single();

    if (fetchError || !aptData) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!caller.isAdmin && aptData.agent_id !== caller.user?.id) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this appointment.' }, { status: 403 });
    }
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (aptData) {
      try {
        await supabase.from('lead_activities').insert([
          {
            id: crypto.randomUUID(),
            lead_id: aptData.lead_id,
            activity_type: 'appointment_cancelled',
            description: `Cancelled appointment: ${aptData.type} on ${new Date(aptData.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          }
        ]);
      } catch (actErr) {
        console.error('Failed to log appointment cancellation:', actErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to delete appointment::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient(true);
    const body = await request.json();
    const { appointment_date, appointment_time, type, agent_id } = body;

    const { data: aptData, error: fetchError } = await supabase
      .from('appointments')
      .select('agent_id')
      .eq('id', id)
      .single();

    if (fetchError || !aptData) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!caller.isAdmin && aptData.agent_id !== caller.user?.id) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this appointment.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        appointment_date,
        appointment_time,
        type,
        agent_id: agent_id || null
      })
      .eq('id', id)
      .select(`
        *,
        leads ( name_company ),
        users ( name )
      `)
      .single();

    if (error) throw error;

    // Log the reschedule activity
    if (data) {
      try {
        await supabase.from('lead_activities').insert([
          {
            id: crypto.randomUUID(),
            lead_id: data.lead_id,
            activity_type: 'appointment_scheduled',
            description: `Rescheduled appointment: ${type} to ${new Date(appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${appointment_time}`
          }
        ]);
      } catch (actErr) {
        console.error('Failed to log appointment rescheduling:', actErr);
      }
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to update appointment::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
