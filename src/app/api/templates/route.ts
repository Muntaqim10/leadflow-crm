export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { getRows, addRow, updateRow } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const templates = await getRows('email_templates');
    return NextResponse.json(templates);
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to fetch templates::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { template_type, content } = body;

    if (!template_type || !content) {
      return NextResponse.json({ error: 'Missing template_type or content' }, { status: 400 });
    }

    const templates = await getRows('email_templates');
    const existing = templates.find(t => t.template_type === template_type);

    if (existing) {
      const updated = await updateRow('email_templates', existing.id, { content });
      return NextResponse.json(updated);
    } else {
      const created = await addRow('email_templates', {
        template_type,
        content,
      });
      return NextResponse.json(created, { status: 201 });
    }
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to save template::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
