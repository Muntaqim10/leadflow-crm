import { NextResponse } from 'next/server';
import { updateRow, deleteRow, getRows, getSupabaseClient } from '@/lib/db';
import { getCallerAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Fetch current lead state to detect status changes and first contact
    const leads = await getRows('leads');
    const existingLead = leads.find((l) => l.id === id);

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!caller.isAdmin && existingLead.assigned_sales_manager_id !== caller.user?.id) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this lead.' }, { status: 403 });
    }

    const oldStatus = existingLead?.status;
    const oldFirstContacted = existingLead?.first_contacted_at;
    const oldDoc = existingLead?.document_url;

    // Stamp first_contacted_at if transitioning from 'new'
    let first_contacted_at = oldFirstContacted;
    if (oldStatus === 'new' && body.status && body.status !== 'new' && !oldFirstContacted) {
      first_contacted_at = new Date().toISOString();
    }

    const newStatus = body.status;
    const lost_reason = newStatus === 'lost' ? (body.lost_reason || 'Other') : null;

    // Validate assigned manager ID against existing users
    let assignedManagerId = body.assigned_sales_manager_id;
    if (assignedManagerId !== undefined) {
      try {
        const users = await getRows('users');
        const validUser = users.find((u) => u.id === assignedManagerId || (u.email && u.email === assignedManagerId));
        assignedManagerId = validUser ? validUser.id : (existingLead?.assigned_sales_manager_id || null);
      } catch (e) {
        assignedManagerId = null;
      }
    }

    // 2. Perform the database update
    const updatedLead = await updateRow('leads', id, {
      name_company: body.name_company,
      email: body.email,
      phone: body.phone,
      lead_source: body.lead_source,
      check_in_date: body.check_in_date,
      check_out_date: body.check_out_date,
      rooms_or_event_details: body.rooms_or_event_details,
      revenue_potential: body.revenue_potential ? parseFloat(body.revenue_potential).toString() : undefined,
      assigned_sales_manager_id: assignedManagerId,
      status: body.status,
      market_segment: body.market_segment,
      document_url: body.document_url || null,
      document_name: body.document_name || null,
      lost_reason,
      first_contacted_at,
    });

    const statusChanged = oldStatus && newStatus && oldStatus !== newStatus;
    const docUploaded = body.document_url && !oldDoc;

    // Log activities in Supabase
    try {
      const supabase = await getSupabaseClient(true);
      const activitiesToInsert = [];

      if (statusChanged) {
        activitiesToInsert.push({
          id: crypto.randomUUID(),
          lead_id: id,
          activity_type: 'status_change',
          description: `Lead status updated from "${oldStatus}" to "${newStatus}"`
        });
      }

      if (docUploaded) {
        activitiesToInsert.push({
          id: crypto.randomUUID(),
          lead_id: id,
          activity_type: 'document_uploaded',
          description: `Uploaded document: "${body.document_name || 'Unnamed Document'}"`
        });
      }

      if (activitiesToInsert.length > 0) {
        await supabase.from('lead_activities').insert(activitiesToInsert);
      }
    } catch (err) {
      console.error('Failed to log lead activities:', err);
    }

    return NextResponse.json({ ...updatedLead, lead: updatedLead });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to update lead::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leads = await getRows('leads');
    const existingLead = leads.find((l) => l.id === id);

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const caller = await getCallerAuth();
    if (!caller.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!caller.isAdmin && existingLead.assigned_sales_manager_id !== caller.user?.id) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this lead.' }, { status: 403 });
    }

    await deleteRow('leads', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[Error ${correlationId}] Failed to delete lead::`, error);
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }
}
