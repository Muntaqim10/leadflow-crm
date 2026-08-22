import { NextResponse } from 'next/server';
import { generateAiEmail } from '@/lib/email';
import { getSupabaseClient } from '@/lib/db';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { leadId, templateType } = await request.json();

    if (!leadId) {
      return NextResponse.json({ error: 'Missing required fields for email generation' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const isAllowed = await rateLimit(`email_gen_${ip}`, 10, 60); // 10 attempts per minute
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too many generation requests. Please try again later.' }, { status: 429 });
    }

    let senderName = 'Sales Team';
    try {
      const supabase = await getSupabaseClient(false);
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.name) {
          senderName = user.user_metadata.name;
        }
      }
    } catch (e) {
      console.warn('Could not retrieve active user session details, falling back to default name:', e);
    }

    const result = await generateAiEmail(leadId, templateType, senderName);

    return NextResponse.json(result);
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to generate AI email::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
