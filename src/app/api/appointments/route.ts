import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    
    // Fetch all appointments, joining with leads and users to get names
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        leads ( name_company ),
        users ( name )
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json({ appointments: data });
  } catch (error: any) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { lead_id, agent_id, type, appointment_date, appointment_time } = body;

    // Validate
    if (!lead_id || !type || !appointment_date || !appointment_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([
        { lead_id, agent_id: agent_id || null, type, appointment_date, appointment_time }
      ])
      .select(`
        *,
        leads ( name_company ),
        users ( name )
      `)
      .single();

    if (error) throw error;

    // Log activity in Supabase
    try {
      await supabase.from('lead_activities').insert([
        {
          id: crypto.randomUUID(),
          lead_id,
          activity_type: 'appointment_scheduled',
          description: `Scheduled appointment: ${type} on ${new Date(appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${appointment_time}`
        }
      ]);
    } catch (actErr) {
      console.error('Failed to log appointment activity:', actErr);
    }
    
    return NextResponse.json({ success: true, appointment: data });
  } catch (error: any) {
    console.error('Failed to save appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
