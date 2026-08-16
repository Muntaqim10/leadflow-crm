export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { getRows, addRow } from '@/lib/db';

export async function GET() {
  try {
    const leads = await getRows('leads');
    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('Failed to fetch leads:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name_company', 'email', 'lead_source', 'check_in_date', 'check_out_date', 'status'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
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
      assigned_sales_manager_id: body.assigned_sales_manager_id || '1', // default to first manager
      status: body.status,
      market_segment: body.market_segment || 'leisure',
      document_url: body.document_url || null,
      document_name: body.document_name || null,
    });

    return NextResponse.json(newLead, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create lead:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
