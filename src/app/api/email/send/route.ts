import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { logId, content, wasEditedByHuman } = await request.json();

    if (!logId || !content) {
      return NextResponse.json({ error: 'Missing logId or content' }, { status: 400 });
    }

    const result = await sendEmail(logId, content, !!wasEditedByHuman);

    return NextResponse.json({ 
      success: true, 
      log: result.log,
      message: result.message
    });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to transmit email::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
