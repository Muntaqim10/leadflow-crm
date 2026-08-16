import { NextResponse } from 'next/server';
import { initDatabase, seedDefaultTemplates, seedTestTeam } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { seed } = await request.json().catch(() => ({ seed: false }));

    const created = await initDatabase();
    let seeded = false;

    if (seed) {
      await seedDefaultTemplates();
      await seedTestTeam();
      seeded = true;
    }

    return NextResponse.json({
      success: true,
      initialized: true,
      createdSheets: created,
      seeded,
    });
  } catch (error: any) {
    console.error('Failed to initialize database:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
