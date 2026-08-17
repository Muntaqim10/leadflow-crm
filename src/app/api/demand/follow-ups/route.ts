export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { getRows } from '@/lib/db';

export async function GET() {
  try {
    const leads = await getRows('leads');
    // Follow-ups: leads that are not confirmed or lost, ordered by recency
    const followUps = leads
      .filter((lead) => lead.status !== 'confirmed' && lead.status !== 'lost')
      .slice(0, 10);

    return NextResponse.json({ followUps });
  } catch (error: any) {
    console.error('Failed to fetch follow-ups:', error);
    return NextResponse.json({ followUps: [] });
  }
}
