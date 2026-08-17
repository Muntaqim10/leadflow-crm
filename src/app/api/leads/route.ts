export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { getRows, addRow, getSupabaseClient } from '@/lib/db';
import { getCallerAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(true);
    let query = supabase.from('leads').select('*');
    if (!caller.isAdmin && caller.user) {
      query = query.eq('assigned_sales_manager_id', caller.user.id);
    }
    
    const { data: leads, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(leads || []);
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to fetch leads::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name_company', 'email', 'lead_source', 'check_in_date', 'check_out_date', 'status'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate assigned manager ID against existing users to prevent foreign key constraint violations
    let assignedManagerId = body.assigned_sales_manager_id;
    try {
      const users = await getRows('users');
      const validUser = users.find((u) => u.id === assignedManagerId || (u.email && u.email === assignedManagerId));
      assignedManagerId = validUser ? validUser.id : null;
    } catch (e) {
      assignedManagerId = null;
    }

    const newLead = await addRow('leads', {
      name_company: body.name_company,
      email: body.email,
      phone: body.phone || '',
      lead_source: body.lead_source,
      check_in_date: body.check_in_date,
      check_out_date: body.check_out_date,
      rooms_or_event_details: body.rooms_or_event_details || '',
      revenue_potential: body.revenue_potential ? parseFloat(body.revenue_potential).toString() : '0',
      assigned_sales_manager_id: assignedManagerId,
      status: body.status || 'new',
      market_segment: body.market_segment || 'leisure',
      document_url: body.document_url || null,
      document_name: body.document_name || null,
    });

    return NextResponse.json({ ...newLead, lead: newLead }, { status: 201 });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to create lead::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
