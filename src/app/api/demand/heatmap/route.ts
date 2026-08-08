import { NextResponse } from 'next/server';
import { getRows } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start'); // e.g. YYYY-MM-DD
    const end = searchParams.get('end'); // e.g. YYYY-MM-DD

    const leads = await getRows('leads');

    // Filter out lost leads for demand calculations
    const activeLeads = leads.filter((lead) => lead.status !== 'lost' && lead.check_in_date && lead.check_out_date);

    const dateHeatmap: Record<string, { count: number; revenue: number; leads: any[] }> = {};

    activeLeads.forEach((lead) => {
      const checkIn = new Date(lead.check_in_date);
      const checkOut = new Date(lead.check_out_date);
      const revenue = parseFloat(lead.revenue_potential || '0');

      // Calculate number of nights
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const revenuePerNight = revenue / nights;

      // Loop through each night of the stay
      const current = new Date(checkIn);
      while (current < checkOut) {
        const dateStr = current.toISOString().split('T')[0];

        // Apply date range filters if provided
        let inRange = true;
        if (start && dateStr < start) inRange = false;
        if (end && dateStr > end) inRange = false;

        if (inRange) {
          if (!dateHeatmap[dateStr]) {
            dateHeatmap[dateStr] = { count: 0, revenue: 0, leads: [] };
          }
          dateHeatmap[dateStr].count += 1;
          dateHeatmap[dateStr].revenue += revenuePerNight;
          dateHeatmap[dateStr].leads.push({
            id: lead.id,
            name_company: lead.name_company,
            status: lead.status,
            revenue: lead.revenue_potential,
            rooms_or_event_details: lead.rooms_or_event_details,
            check_in_date: lead.check_in_date,
            check_out_date: lead.check_out_date,
            market_segment: lead.market_segment,
            lead_source: lead.lead_source,
            assigned_sales_manager_id: lead.assigned_sales_manager_id,
            email: lead.email,
            phone: lead.phone,
          });
        }
        // Move to next day
        current.setDate(current.getDate() + 1);
      }
    });

    return NextResponse.json(dateHeatmap);
  } catch (error: any) {
    console.error('Failed to generate demand heatmap:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
