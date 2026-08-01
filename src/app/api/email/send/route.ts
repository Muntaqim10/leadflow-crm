import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

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
    console.error('Failed to transmit email:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
