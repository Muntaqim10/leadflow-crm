export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { logId, leadId, action, finalContent, wasEdited } = body;

    const supabase = await getSupabaseClient(true);
    if (logId) {
      await supabase.from('email_logs').update({
        action: action || 'sent',
        final_content: finalContent,
        was_edited: !!wasEdited,
        updated_at: new Date().toISOString()
      }).eq('id', logId);
    }

    if (leadId) {
      await supabase.from('lead_activities').insert([
        {
          id: crypto.randomUUID(),
          lead_id: leadId,
          activity_type: 'email_sent',
          description: `AI email template copied/sent: "${(action || 'generated').replace(/_/g, ' ')}"`
        }
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email log error:', error);
    return NextResponse.json({ success: false }, { status: 200 }); // Graceful response
  }
}
