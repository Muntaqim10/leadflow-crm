import { NextResponse } from 'next/server';
import { getRows } from '@/lib/db';

export async function GET() {
  try {
    const users = await getRows('users');
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
