import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

// Called daily by Vercel Cron (see vercel.json) so the free-tier Supabase
// project never sits idle long enough to be auto-paused.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await getSupabaseClient(true);
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Supabase ping failed' }, { status: 503 });
  }
}
