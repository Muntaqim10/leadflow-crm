import { NextResponse } from 'next/server';
import { getRows } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const filterType = searchParams.get('filterType') || 'created_at';
    const leadSource = searchParams.get('leadSource');
    const marketSegment = searchParams.get('marketSegment');

    const [leads, users] = await Promise.all([
      getRows('leads'),
      getRows('users'),
    ]);

    // Create a map of users for dynamic name lookup
    const userMap: Record<string, string> = {};
    users.forEach((user) => {
      if (user.id && user.name) {
        userMap[user.id] = user.name;
      }
    });

    // Apply filters
    const filteredLeads = leads.filter((lead) => {
      // Date filter (by created_at or check_in stay dates)
      const targetDate = filterType === 'check_in'
        ? lead.check_in_date
        : lead.created_at?.split('T')[0];

      if (startDate && (!targetDate || targetDate < startDate)) return false;
      if (endDate && (!targetDate || targetDate > endDate)) return false;

      // Lead Source filter
      if (leadSource && lead.lead_source !== leadSource) return false;

      // Market Segment filter
      if (marketSegment && lead.market_segment !== marketSegment) return false;

      return true;
    });

    // Basic Metrics
    const totalLeads = filteredLeads.length;
    const convertedLeads = filteredLeads.filter((l) => l.status === 'confirmed').length;
    const lostLeads = filteredLeads.filter((l) => l.status === 'lost').length;
    
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    let revenueGenerated = 0; // confirmed revenue
    let potentialRevenue = 0; // sum of all non-lost leads

    filteredLeads.forEach((lead) => {
      const rev = parseFloat(lead.revenue_potential || '0');
      if (lead.status === 'confirmed') {
        revenueGenerated += rev;
      }
      if (lead.status !== 'lost') {
        potentialRevenue += rev;
      }
    });

    // Conversion % per sales agent
    const agentMetrics: Record<string, { id: string; name: string; total: number; confirmed: number }> = {};

    filteredLeads.forEach((lead) => {
      const agentId = lead.assigned_sales_manager_id || 'unassigned';
      if (!agentMetrics[agentId]) {
        agentMetrics[agentId] = {
          id: agentId,
          name: userMap[agentId] || 'Unassigned',
          total: 0,
          confirmed: 0,
        };
      }
      agentMetrics[agentId].total += 1;
      if (lead.status === 'confirmed') {
        agentMetrics[agentId].confirmed += 1;
      }
    });

    const agentConversion = Object.values(agentMetrics).map((agent) => ({
      id: agent.id,
      name: agent.name,
      total: agent.total,
      confirmed: agent.confirmed,
      conversionRate: agent.total > 0 ? (agent.confirmed / agent.total) * 100 : 0,
    }));

    // Group by status for Kanban statistics or general overview
    const statusCounts = {
      new: 0,
      contacted: 0,
      proposal_sent: 0,
      negotiation: 0,
      confirmed: 0,
      lost: 0,
    };

    filteredLeads.forEach((lead) => {
      const status = lead.status as keyof typeof statusCounts;
      if (status in statusCounts) {
        statusCounts[status] += 1;
      }
    });

    // 1. Lost Business Reason counts
    const lostReasons = {
      "Rate Too High": 0,
      "Unavailable Dates": 0,
      "Space Too Small": 0,
      "Competitor": 0,
      "Other": 0,
    };
    filteredLeads.forEach((lead) => {
      if (lead.status === 'lost') {
        const reason = lead.lost_reason || 'Other';
        if (reason in lostReasons) {
          lostReasons[reason as keyof typeof lostReasons] += 1;
        } else {
          lostReasons["Other"] += 1;
        }
      }
    });

    // 2. Lead Source Conversion & ROI
    const sourceMetrics: Record<string, { total: number; confirmed: number; revenue: number }> = {};
    const ALL_SOURCES = ['OTA', 'direct', 'walk-in', 'email', 'sales_call'];
    ALL_SOURCES.forEach(src => {
      sourceMetrics[src] = { total: 0, confirmed: 0, revenue: 0 };
    });

    filteredLeads.forEach((lead) => {
      const src = lead.lead_source || 'email';
      if (!sourceMetrics[src]) {
        sourceMetrics[src] = { total: 0, confirmed: 0, revenue: 0 };
      }
      sourceMetrics[src].total += 1;
      const rev = parseFloat(lead.revenue_potential || '0');
      if (lead.status === 'confirmed') {
        sourceMetrics[src].confirmed += 1;
        sourceMetrics[src].revenue += rev;
      }
    });

    const sourcePerformance = Object.entries(sourceMetrics).map(([source, data]) => ({
      source,
      total: data.total,
      confirmed: data.confirmed,
      conversionRate: data.total > 0 ? (data.confirmed / data.total) * 100 : 0,
      revenue: data.revenue,
    }));

    // 3. Booking Window (Lead Time)
    let totalBookingLeadTimeDays = 0;
    let confirmedCountForLeadTime = 0;
    const segmentLeadTimes: Record<string, { totalDays: number; count: number }> = {
      corporate: { totalDays: 0, count: 0 },
      leisure: { totalDays: 0, count: 0 },
      group: { totalDays: 0, count: 0 },
    };

    filteredLeads.forEach((lead) => {
      if (lead.status === 'confirmed' && lead.check_in_date && lead.created_at) {
        const checkIn = new Date(lead.check_in_date).getTime();
        const created = new Date(lead.created_at).getTime();
        const diffDays = Math.ceil((checkIn - created) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          totalBookingLeadTimeDays += diffDays;
          confirmedCountForLeadTime += 1;

          const seg = (lead.market_segment || 'leisure').toLowerCase();
          if (seg in segmentLeadTimes) {
            segmentLeadTimes[seg].totalDays += diffDays;
            segmentLeadTimes[seg].count += 1;
          }
        }
      }
    });

    const avgBookingLeadTime = confirmedCountForLeadTime > 0 ? totalBookingLeadTimeDays / confirmedCountForLeadTime : 0;
    const bookingLeadTimeBySegment = Object.entries(segmentLeadTimes).reduce((acc, [seg, data]) => {
      acc[seg] = data.count > 0 ? data.totalDays / data.count : 0;
      return acc;
    }, {} as Record<string, number>);

    // 4. Speed-to-Lead Response Time
    let totalResponseHours = 0;
    let contactedCount = 0;
    const agentResponseHours: Record<string, { totalHours: number; count: number }> = {};

    filteredLeads.forEach((lead) => {
      if (lead.first_contacted_at && lead.created_at) {
        const created = new Date(lead.created_at).getTime();
        const contacted = new Date(lead.first_contacted_at).getTime();
        const diffHours = (contacted - created) / (1000 * 60 * 60);
        if (diffHours >= 0) {
          totalResponseHours += diffHours;
          contactedCount += 1;

          const agentId = lead.assigned_sales_manager_id || 'unassigned';
          if (!agentResponseHours[agentId]) {
            agentResponseHours[agentId] = { totalHours: 0, count: 0 };
          }
          agentResponseHours[agentId].totalHours += diffHours;
          agentResponseHours[agentId].count += 1;
        }
      }
    });

    const avgResponseTimeHours = contactedCount > 0 ? totalResponseHours / contactedCount : 0;
    const agentResponseTimes = Object.entries(agentResponseHours).map(([agentId, data]) => ({
      id: agentId,
      name: userMap[agentId] || 'Unassigned',
      avgHours: data.count > 0 ? data.totalHours / data.count : 0,
      count: data.count,
    }));

    // 5. Pipeline Velocity (Days in Stage & Stagnant Leads count)
    const stageVelocity: Record<string, { totalDays: number; count: number }> = {
      new: { totalDays: 0, count: 0 },
      contacted: { totalDays: 0, count: 0 },
      proposal_sent: { totalDays: 0, count: 0 },
      negotiation: { totalDays: 0, count: 0 },
    };
    let stagnantCount = 0;

    const now = new Date().getTime();
    filteredLeads.forEach((lead) => {
      const status = lead.status;
      if (status in stageVelocity && lead.created_at) {
        const created = new Date(lead.created_at).getTime();
        const updated = lead.updated_at ? new Date(lead.updated_at).getTime() : created;
        const contacted = lead.first_contacted_at ? new Date(lead.first_contacted_at).getTime() : null;

        let diffDays = 0;
        if (status === 'new') {
          diffDays = Math.max(0, (now - created) / (1000 * 60 * 60 * 24));
        } else if (status === 'contacted') {
          const start = contacted || updated;
          diffDays = Math.max(0, (now - start) / (1000 * 60 * 60 * 24));
        } else {
          diffDays = Math.max(0, (now - updated) / (1000 * 60 * 60 * 24));
        }

        stageVelocity[status].totalDays += diffDays;
        stageVelocity[status].count += 1;

        if ((status === 'proposal_sent' || status === 'negotiation') && diffDays > 10) {
          stagnantCount += 1;
        }
      }
    });

    const averageDaysInStage = Object.entries(stageVelocity).reduce((acc, [stage, data]) => {
      acc[stage] = data.count > 0 ? Number((data.totalDays / data.count).toFixed(1)) : 0;
      return acc;
    }, {} as Record<string, number>);

    // Market Segment breakdown
    const segmentCounts: Record<string, number> = {
      corporate: 0,
      leisure: 0,
      group: 0,
    };
    filteredLeads.forEach((lead) => {
      const seg = (lead.market_segment || 'leisure').toLowerCase();
      if (seg in segmentCounts) {
        segmentCounts[seg] += 1;
      } else {
        segmentCounts['leisure'] = (segmentCounts['leisure'] || 0) + 1;
      }
    });

    const corporateCount = segmentCounts.corporate || 0;
    const leisureCount = segmentCounts.leisure || 0;
    const groupCount = segmentCounts.group || 0;
    const totalSegmentLeads = totalLeads || 1;
    const corporatePct = (corporateCount / totalSegmentLeads) * 100;
    const leisurePct = (leisureCount / totalSegmentLeads) * 100;
    const groupPct = (groupCount / totalSegmentLeads) * 100;

    // Confirmed Revenue by Segment
    const confirmedRevBySegment: Record<string, number> = {
      corporate: 0,
      leisure: 0,
      group: 0,
    };
    let totalConfirmedRev = 0;

    // Pipeline Value by Stage
    const pipelineValueByStage: Record<string, number> = {
      new: 0,
      contacted: 0,
      proposal_sent: 0,
      negotiation: 0,
      confirmed: 0,
      lost: 0,
    };

    filteredLeads.forEach((lead) => {
      const rev = parseFloat(lead.revenue_potential || '0') || 0;
      const stage = (lead.status || 'new') as keyof typeof pipelineValueByStage;
      if (stage in pipelineValueByStage) {
        pipelineValueByStage[stage] += rev;
      }
      if (lead.status === 'confirmed') {
        const seg = (lead.market_segment || 'leisure').toLowerCase();
        if (seg in confirmedRevBySegment) {
          confirmedRevBySegment[seg] += rev;
        } else {
          confirmedRevBySegment['leisure'] = (confirmedRevBySegment['leisure'] || 0) + rev;
        }
        totalConfirmedRev += rev;
      }
    });

    const totalActivePipelineValue = Object.entries(pipelineValueByStage)
      .filter(([stage]) => stage !== 'lost')
      .reduce((sum, [_, val]) => sum + val, 0);

    return NextResponse.json({
      summary: {
        totalLeads,
        convertedLeads,
        lostLeads,
        conversionRate,
        revenueGenerated,
        potentialRevenue,
      },
      statusCounts,
      segmentCounts,
      corporateCount,
      leisureCount,
      groupCount,
      corporatePct,
      leisurePct,
      groupPct,
      confirmedRevBySegment,
      totalConfirmedRev,
      pipelineValueByStage,
      totalActivePipelineValue,
      agentConversion,
      lostReasons,
      sourcePerformance,
      avgBookingLeadTime,
      bookingLeadTimeBySegment,
      avgResponseTimeHours,
      agentResponseTimes,
      averageDaysInStage,
      stagnantCount,
    });
  } catch (error: any) {
    console.error('Failed to calculate analytics:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
