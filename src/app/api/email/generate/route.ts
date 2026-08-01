import { NextResponse } from 'next/server';
import { generateAiEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { leadId, templateType } = await request.json();

    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });
    }

    const result = await generateAiEmail(leadId, templateType);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to generate AI email:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
