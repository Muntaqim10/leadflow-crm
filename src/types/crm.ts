export type LeadStatus = 'new' | 'contacted' | 'proposal_sent' | 'negotiation' | 'confirmed' | 'lost';

export interface Lead {
  id: string;
  name_company: string;
  email: string;
  phone?: string;
  lead_source: string;
  check_in_date: string;
  check_out_date: string;
  rooms_or_event_details: string;
  revenue_potential: string;
  assigned_sales_manager_id: string;
  status: LeadStatus;
  market_segment: string;
  created_at?: string;
  updated_at?: string;
  document_url?: string | null;
  document_name?: string | null;
  lost_reason?: string | null;
  first_contacted_at?: string | null;
}

export interface User {
  id: string;
  name: string;
  role: string;
  permission_tier?: 'admin' | 'sales' | 'read_only';
  email?: string;
  leadsCount?: number;
  lastSignIn?: string | null;
  confirmed?: boolean;
  hasAuthAccount?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: string;
  lead_id: string;
  agent_id: string;
  type: string;
  appointment_date: string;
  appointment_time: string;
  created_at?: string;
  updated_at?: string;
  client_name?: string;
  agent_name?: string;
}

export interface Task {
  id: string;
  lead_id?: string;
  assigned_to: string;
  description: string;
  due_date: string;
  status: 'pending' | 'completed';
  created_at?: string;
  updated_at?: string;
  lead_name?: string;
  assignee_name?: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  date: string;
  notes: string;
  status: 'pending' | 'completed';
}

export interface Activity {
  id: string;
  lead_id: string;
  activity_type: string;
  description: string;
  performed_by: string;
  created_at: string;
}

export interface Template {
  id: string;
  template_type: string;
  content: string;
}

export interface Analytics {
  summary: {
    totalLeads: number;
    convertedLeads: number;
    lostLeads: number;
    conversionRate: number;
    revenueGenerated: number;
    potentialRevenue: number;
  };
  statusCounts: {
    new: number;
    contacted: number;
    proposal_sent: number;
    negotiation: number;
    confirmed: number;
    lost: number;
  };
  segmentCounts: {
    corporate: number;
    leisure: number;
    group: number;
  };
  corporateCount: number;
  leisureCount: number;
  groupCount: number;
  corporatePct: number;
  leisurePct: number;
  groupPct: number;
  confirmedRevBySegment: Record<string, number>;
  totalConfirmedRev: number;
  pipelineValueByStage: Record<string, number>;
  totalActivePipelineValue: number;
  agentConversion: {
    id: string;
    name: string;
    total: number;
    confirmed: number;
    conversionRate: number;
  }[];
  lostReasons: Record<string, number>;
  sourcePerformance: {
    source: string;
    total: number;
    confirmed: number;
    conversionRate: number;
    revenue: number;
  }[];
  avgBookingLeadTime: number;
  bookingLeadTimeBySegment: Record<string, number>;
  avgResponseTimeHours: number;
  agentResponseTimes: {
    id: string;
    name: string;
    avgHours: number;
    count: number;
  }[];
  averageDaysInStage: Record<string, number>;
  stagnantCount: number;
  // Optional / backward compatibility
  totalLeads?: number;
  totalPipelineValue?: number;
  conversionRate?: number;
  avgLeadTimeDays?: number;
  leadsByStatus?: { status: string; count: number }[];
  leadsBySource?: { source: string; count: number; value: number }[];
  leadsBySegment?: { segment: string; count: number; value: number; avgLeadTime: number }[];
  speedToLeadMinutes?: number;
}

export interface HeatmapData {
  days: {
    date: string;
    rooms: number;
    revenue: number;
    color: string;
  }[];
  peakDays: string[];
  totalProjectedRevenue: number;
}

export interface ParsedRoomDetails {
  eventRoom: string;
  eventRoomRate: string;
  guestRooms: { type: string; count: string; rate: string }[];
  accessories: { name: string; price: string }[];
  eventDetails: string;
}

export interface BookingTypeInfo {
  type?: string;
  shortLabel?: string;
  label: string;
  icon: string;
  badgeClass: string;
}
