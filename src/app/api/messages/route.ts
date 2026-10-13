import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';
import { sendSms, toE164, SmsConfigError, isSmsConfigured } from '@/lib/sms';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * The message thread for one lead.
 *
 * `messages` has RLS enabled with no policies, like email_log and lead_activities,
 * so reads and writes go through the service role. src/proxy.ts is the auth
 * boundary: it rejects any request here without a valid session cookie.
 */
export async function GET(request: Request) {
  try {
    const leadId = new URL(request.url).searchParams.get('leadId');
    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });
    }

    const supabase = await getSupabaseClient(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ messages: data || [], smsConfigured: isSmsConfigured() });
  } catch (error) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to load messages::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}

/** Sends a text to a lead and records it in the thread. */
export async function POST(request: Request) {
  try {
    const { leadId, body } = await request.json();

    if (!leadId || !body?.trim()) {
      return NextResponse.json({ error: 'Missing leadId or message body' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const isAllowed = await rateLimit(`sms_send_${ip}`, 10, 60); // 10 texts per minute
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too many messages. Please try again in a minute.' }, { status: 429 });
    }

    const supabase = await getSupabaseClient(true);
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, phone, sms_opt_out')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Texting someone who replied STOP is a legal problem, not just a rude one.
    if (lead.sms_opt_out) {
      return NextResponse.json(
        { error: 'This lead replied STOP and cannot be texted. They must text START to opt back in.' },
        { status: 409 }
      );
    }

    const to = toE164(lead.phone);
    if (!to) {
      return NextResponse.json(
        { error: `No usable mobile number on this lead (stored: "${lead.phone || 'empty'}"). Add one in E.164 form, e.g. +15551234567.` },
        { status: 400 }
      );
    }

    const sent = await sendSms(to, body.trim());

    const { data: inserted, error: insertError } = await supabase
      .from('messages')
      .insert({
        id: crypto.randomUUID(),
        lead_id: leadId,
        direction: 'out',
        body: body.trim(),
        from_number: sent.from,
        to_number: sent.to,
        provider_sid: sent.sid,
        status: sent.status,
      })
      .select()
      .single();

    // The text has already left; failing the request now would tell the user it
    // did not send and invite a duplicate. Report the send and note the gap.
    if (insertError) {
      console.error('Sent SMS but failed to record it:', insertError);
      return NextResponse.json({
        message: { lead_id: leadId, direction: 'out', body: body.trim(), provider_sid: sent.sid, status: sent.status },
        warning: 'Message sent but not saved to the thread.',
      });
    }

    return NextResponse.json({ message: inserted });
  } catch (error) {
    // Missing env vars are a deployment gap, not a leak risk — say so plainly.
    if (error instanceof SmsConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to send SMS::`, error);
    // Twilio's own rejection reason (unregistered campaign, unverified number, bad
    // destination) is the actionable part and contains no account secrets.
    const message = error instanceof Error ? error.message : '';
    if (/^Twilio returned status/.test(message)) {
      return NextResponse.json({ error: message, correlationId }, { status: 502 });
    }
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
