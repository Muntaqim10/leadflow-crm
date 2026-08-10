import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ activities: data || [] });
  } catch (error: any) {
    console.error('Failed to fetch lead activities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();
    const body = await request.json();
    const { description, performed_by, activity_type } = body;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('lead_activities')
      .insert([
        {
          id: crypto.randomUUID(),
          lead_id: id,
          activity_type: activity_type || 'note_added',
          description,
          performed_by: performed_by || null
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, activity: data });
  } catch (error: any) {
    console.error('Failed to save lead activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
