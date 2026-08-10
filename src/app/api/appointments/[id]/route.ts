import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    // Fetch the appointment first to know its details for the activity log
    const { data: aptData } = await supabase
      .from('appointments')
      .select('lead_id, type, appointment_date')
      .eq('id', id)
      .single();
    
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
    console.error('Failed to delete appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();
    const body = await request.json();
    const { appointment_date, appointment_time, type, agent_id } = body;

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
    console.error('Failed to update appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
