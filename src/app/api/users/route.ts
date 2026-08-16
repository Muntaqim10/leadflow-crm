import { NextResponse } from 'next/server';
import { getRows, getSupabaseClient } from '@/lib/db';

export async function GET() {
  try {
    const users = await getRows('users');
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name, role } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const supabase = await getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
