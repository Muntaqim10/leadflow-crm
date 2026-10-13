import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';
import { verifyTwilioSignature, toE164, isStopKeyword, isStartKeyword } from '@/lib/sms';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/** Twilio treats any 2xx as delivered and will not retry, which is what we want. */
const ACK = new NextResponse('<Response></Response>', {
  status: 200,
  headers: { 'Content-Type': 'text/xml' },
});

/**
 * Inbound SMS from Twilio.
 *
 * This route is exempt from the session-cookie check in src/proxy.ts because Twilio
 * cannot carry a cookie, so the X-Twilio-Signature check below is the only thing
 * authenticating the caller. It must stay.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const params: Record<string, string> = {};
    form.forEach((value, key) => {
      if (typeof value === 'string') params[key] = value;
    });

    // Twilio signs the exact URL it was configured with. Behind Vercel the inbound
    // request reports an internal host, so the forwarded headers are what reproduce
    // it. A signature failure here usually means the URL in the Twilio console does
    // not match the deployment's public hostname.
    const requestUrl = new URL(request.url);
    const host = request.headers.get('x-forwarded-host') || requestUrl.host;
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const signedUrl = `${proto}://${host}${requestUrl.pathname}`;

    if (!verifyTwilioSignature(signedUrl, params, request.headers.get('x-twilio-signature'))) {
      console.error('Rejected inbound SMS: signature did not verify for', signedUrl);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const from = params.From || '';
    const body = params.Body || '';
    const normalizedFrom = toE164(from);

    const supabase = await getSupabaseClient(true);

    // leads.phone is free text, so the match has to happen after normalizing both
    // sides rather than in the query.
    // ponytail: scans leads that have a phone number. Add a normalized phone column
    // with an index if this table ever gets large enough to notice.
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, phone')
      .not('phone', 'is', null);

    if (leadsError) throw leadsError;

    const lead = (leads || []).find(
      (l: { id: string; phone: string | null }) => toE164(l.phone) === normalizedFrom
    );

    if (!lead) {
      // Nothing to attach the message to (messages.lead_id is required). Retrying
      // would not help, so acknowledge and leave a trace in the logs.
      console.warn('Inbound SMS from a number with no matching lead; dropping it.');
      return ACK;
    }

    if (isStopKeyword(body) || isStartKeyword(body)) {
      const optOut = isStopKeyword(body);
      const { error: optOutError } = await supabase
        .from('leads')
        .update({ sms_opt_out: optOut, updated_at: new Date().toISOString() })
        .eq('id', lead.id);
      if (optOutError) console.error('Failed to record SMS opt-out change:', optOutError);
    }

    const { error: insertError } = await supabase.from('messages').insert({
      id: crypto.randomUUID(),
      lead_id: lead.id,
      direction: 'in',
      body,
      from_number: normalizedFrom || from,
      to_number: params.To || '',
      provider_sid: params.MessageSid || null,
      status: params.SmsStatus || 'received',
    });

    if (insertError) console.error('Failed to store inbound SMS:', insertError);

    return ACK;
  } catch (error) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Inbound SMS webhook failed::`, error);
    // A 500 makes Twilio retry, which is the right outcome for a transient fault.
    return NextResponse.json({ error: 'Webhook processing failed', correlationId }, { status: 500 });
  }
}
