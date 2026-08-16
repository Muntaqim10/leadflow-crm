import { Lead, ParsedRoomDetails, BookingTypeInfo } from '@/types/crm';

// Date Helpers
export const getPastWeekStartDate = (): string => {
  const today = new Date();
  const pastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return pastWeek.toISOString().split('T')[0];
};

export const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getCurrentMonthStartDate = (): string => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
};

export const getCurrentMonthEndDate = (): string => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
};

export const getDefaultStartDate = (): string => getPastWeekStartDate();
export const getDefaultEndDate = (): string => getTodayDate();

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Lead Scoring Formula
export const calculateLeadScore = (lead: Lead): number => {
  if (lead.status === 'confirmed') return 100;
  if (lead.status === 'lost') return 0;

  let score = 30; // base score

  // 1. Status progression
  if (lead.status === 'proposal_sent') score += 20;
  if (lead.status === 'negotiation') score += 35;
  if (lead.status === 'contacted') score += 10;

  // 2. High-value revenue tier
  const rev = parseFloat(lead.revenue_potential || '0');
  if (rev > 15000) score += 15;
  else if (rev > 5000) score += 10;
  else if (rev > 2000) score += 5;

  // 3. Lead source historical conversion weighting
  const src = lead.lead_source?.toLowerCase() || '';
  if (src === 'sales_call' || src === 'walk-in') score += 15;
  else if (src === 'email' || src === 'direct') score += 10;
  else if (src === 'ota') score += 5;

  // 4. Market segment weighting
  const seg = lead.market_segment?.toLowerCase() || '';
  if (seg === 'corporate') score += 10;
  else if (seg === 'group') score += 8;

  // 5. Speed to lead bonus
  if (lead.first_contacted_at && lead.created_at) {
    const diffHours = (new Date(lead.first_contacted_at).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);
    if (diffHours < 2) score += 10;
    else if (diffHours < 24) score += 5;
  }

  // Bound the score between 5% and 95% for open leads
  return Math.max(5, Math.min(95, score));
};

// Room & Event Parsing
export const parseRoomDetails = (jsonStr: string | null | undefined): ParsedRoomDetails => {
  if (!jsonStr) {
    return { eventRoom: '', eventRoomRate: '500', guestRooms: [], accessories: [], eventDetails: '' };
  }
  try {
    const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    return {
      eventRoom: parsed.eventRoom || '',
      eventRoomRate: parsed.eventRoomRate || '500',
      guestRooms: Array.isArray(parsed.guestRooms) ? parsed.guestRooms : [],
      accessories: Array.isArray(parsed.accessories) ? parsed.accessories : [],
      eventDetails: parsed.eventDetails || ''
    };
  } catch (e) {
    return { eventRoom: typeof jsonStr === 'string' ? jsonStr : '', eventRoomRate: '500', guestRooms: [], accessories: [], eventDetails: '' };
  }
};

// Format room details string for cards and modals
export const formatRoomDetailsDisplay = (detailsJson: string | null | undefined): string => {
  const parsed = parseRoomDetails(detailsJson);
  const parts: string[] = [];
  if (parsed.eventRoom) {
    parts.push(`Event: ${parsed.eventRoom} ($${parsed.eventRoomRate || '500'})`);
  }
  if (parsed.guestRooms && parsed.guestRooms.length > 0) {
    const roomSummaries = parsed.guestRooms
      .filter((r: any) => r.type && r.count)
      .map((r: any) => `${r.count}x ${r.type} ($${r.rate}/nt)`);
    if (roomSummaries.length > 0) {
      parts.push(`Rooms: ${roomSummaries.join(', ')}`);
    }
  }
  if (parsed.accessories && parsed.accessories.length > 0) {
    const accSummaries = parsed.accessories
      .filter((a: any) => a.name)
      .map((a: any) => `${a.name} ($${a.price})`);
    if (accSummaries.length > 0) {
      parts.push(`Add-ons: ${accSummaries.join(', ')}`);
    }
  }
  if (parsed.eventDetails) {
    parts.push(`Notes: ${parsed.eventDetails}`);
  }
  return parts.length > 0 ? parts.join(' | ') : 'Standard Booking';
};

// Booking Type Classification
export const getLeadBookingType = (roomsJson: string | null | undefined): BookingTypeInfo => {
  const parsed = parseRoomDetails(roomsJson);
  const hasEvent = !!parsed.eventRoom;
  const hasRooms = parsed.guestRooms && parsed.guestRooms.length > 0;

  if (hasEvent && hasRooms) {
    return {
      type: 'both',
      shortLabel: 'Both',
      label: 'Event & Rooms',
      icon: '🏛️🏨',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
    };
  }
  if (hasEvent) {
    return {
      type: 'event',
      shortLabel: 'Event',
      label: 'Event Only',
      icon: '🏛️',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
  }
  if (hasRooms) {
    return {
      type: 'stay_block',
      shortLabel: 'Stay',
      label: 'Room Block',
      icon: '🏨',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200'
    };
  }
  return {
    type: 'general',
    shortLabel: 'General',
    label: 'General Inquiry',
    icon: '📋',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200'
  };
};
