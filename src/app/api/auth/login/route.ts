import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/db';

const VALID_TEAM_CREDENTIALS: Record<string, { email: string; name: string; role: string; pass: string }> = {
  'arzaan@leadflow.com': { email: 'arzaan@leadflow.com', name: 'Arzaan Shaikh', role: 'General Manager', pass: 'arzaan123' },
  'rokeya@leadflow.com': { email: 'rokeya@leadflow.com', name: 'Rokeya Ahmed', role: 'Director of Sales', pass: 'rokeya123' },
  'riham@leadflow.com': { email: 'riham@leadflow.com', name: 'Riham Mohammed Jehangir', role: 'Sales Manager', pass: 'riham123' },
  'muntaqim@leadflow.com': { email: 'muntaqim@leadflow.com', name: 'Muntaqim Elahi', role: 'Front Desk Supervisor', pass: 'muntaqim123' }
};

export async function POST(request: Request) {
  try {
    const { email: rawEmail, password } = await request.json();
    if (!rawEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const inputLower = rawEmail.trim().toLowerCase();
    let email = inputLower;

    if (inputLower === 'arzaan shaikh' || inputLower === 'arzaan') email = 'arzaan@leadflow.com';
    else if (inputLower === 'rokeya ahmed' || inputLower === 'rokeya') email = 'rokeya@leadflow.com';
    else if (inputLower === 'riham mohammed jehangir' || inputLower === 'riham') email = 'riham@leadflow.com';
    else if (inputLower === 'muntaqim elahi' || inputLower === 'muntaqim') email = 'muntaqim@leadflow.com';

    // 1. Try Supabase Auth first
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.session) {
          return NextResponse.json({ session: data.session });
        }
      }
    } catch (e) {
      console.warn('Supabase auth connection error, falling back to team database validation');
    }

    // 2. Validate against team credentials
    const matchedUser = VALID_TEAM_CREDENTIALS[email];
    if (matchedUser && matchedUser.pass === password) {
      const session = {
        user: {
          id: matchedUser.email.split('@')[0],
          email: matchedUser.email,
          user_metadata: { name: matchedUser.name, role: matchedUser.role }
        }
      };
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: 'Invalid email or password. Please verify your credentials.' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
