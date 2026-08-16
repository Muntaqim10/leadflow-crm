'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { useReactToPrint } from 'react-to-print';
import {
  Briefcase,
  ChevronRight,
  Calendar,
  BarChart3,
  Mail,
  Settings,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  CalendarDays,
  Download,
  Hotel,
  LogOut,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Interfaces matching backend models
interface Lead {
  id: string;
  name_company: string;
  email: string;
  phone: string;
  lead_source: string;
  check_in_date: string;
  check_out_date: string;
  rooms_or_event_details: string;
  revenue_potential: string;
  assigned_sales_manager_id: string;
  status: string;
  market_segment: string;
  created_at: string;
  updated_at: string;
  document_url?: string;
  document_name?: string;
  lost_reason?: string;
  first_contacted_at?: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface FollowUp {
  id: string;
  lead_id: string;
  follow_up_date: string;
  notes: string;
  completed: string;
  created_at: string;
}

interface Analytics {
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
  agentConversion: Array<{
    id: string;
    name: string;
    total: number;
    confirmed: number;
    conversionRate: number;
  }>;
  lostReasons?: {
    "Rate Too High": number;
    "Unavailable Dates": number;
    "Space Too Small": number;
    "Competitor": number;
    "Other": number;
  };
  sourcePerformance?: Array<{
    source: string;
    total: number;
    confirmed: number;
    conversionRate: number;
    revenue: number;
  }>;
  avgBookingLeadTime?: number;
  bookingLeadTimeBySegment?: {
    corporate: number;
    leisure: number;
    group: number;
  };
  avgResponseTimeHours?: number;
  agentResponseTimes?: Array<{
    id: string;
    name: string;
    avgHours: number;
    count: number;
  }>;
  averageDaysInStage?: {
    new: number;
    contacted: number;
    proposal_sent: number;
    negotiation: number;
  };
  stagnantCount?: number;
}

interface HeatmapData {
  [date: string]: {
    count: number;
    revenue: number;
    leads: Array<{
      id: string;
      name_company: string;
      status: string;
      revenue: string;
    }>;
  };
}

interface Template {
  id: string;
  template_type: string;
  content: string;
}

const parseRoomDetails = (raw: string | undefined | null) => {
  if (!raw) return { eventRoom: '', eventRoomRate: '500', guestRooms: [] as { type: string, count: string, rate: string }[], accessories: [] as { name: string, price: string }[], eventDetails: '' };
  try {
    if (raw.trim().startsWith('{')) {
      const parsed = JSON.parse(raw);
      let guestRooms = parsed.guestRooms || [];
      // Migrate old data on the fly
      if (parsed.guestRoomType && !guestRooms.length) {
        guestRooms = [{ type: parsed.guestRoomType, count: parsed.guestRoomCount, rate: parsed.guestRoomRate || '189' }];
      }

      guestRooms = guestRooms.map((r: any) => ({
        type: r.type || '',
        count: r.count || '',
        rate: r.rate || '189'
      }));

      const accessories = (parsed.accessories || []).map((a: any) => ({
        name: a.name || '',
        price: a.price || ''
      }));

      return {
        eventRoom: parsed.eventRoom || '',
        eventRoomRate: parsed.eventRoomRate || '500',
        guestRooms,
        accessories,
        eventDetails: parsed.eventDetails || ''
      };
    }
  } catch (e) { }

  const validEventRooms = ['Lincoln', 'Alexander', 'Alexander 1', 'Alexander 2'];
  if (validEventRooms.includes(raw)) {
    return { eventRoom: raw, eventRoomRate: '500', guestRooms: [], accessories: [], eventDetails: '' };
  }
  return { eventRoom: '', eventRoomRate: '500', guestRooms: [], accessories: [], eventDetails: raw };
};

const getLeadBookingType = (rawDetails: string | undefined | null) => {
  const parsed = parseRoomDetails(rawDetails) || { eventRoom: '', eventDetails: '', guestRooms: [] };
  const hasEvent = Boolean(parsed.eventRoom || (parsed.eventDetails && parsed.eventDetails.trim()));
  const hasRooms = Boolean(
    parsed.guestRooms && 
    parsed.guestRooms.length > 0 && 
    parsed.guestRooms.some((r: any) => (r.type && r.type.trim()) || (r.count && String(r.count).trim() !== '' && String(r.count).trim() !== '0'))
  );

  if (hasEvent && hasRooms) {
    return {
      type: 'both',
      label: 'Event & Stay Block',
      shortLabel: 'Event & Stay Block',
      icon: '✨',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      pillClass: 'bg-purple-600 text-white',
    };
  } else if (hasEvent) {
    return {
      type: 'event',
      label: 'Event Only',
      shortLabel: 'Event Only',
      icon: '🏢',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      pillClass: 'bg-amber-600 text-white',
    };
  } else if (hasRooms) {
    return {
      type: 'stay_block',
      label: 'Stay Block Only',
      shortLabel: 'Stay Block Only',
      icon: '🛏️',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      pillClass: 'bg-blue-600 text-white',
    };
  } else {
    return {
      type: 'general',
      label: 'General Inquiry',
      shortLabel: 'General',
      icon: '📋',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      pillClass: 'bg-slate-600 text-white',
    };
  }
};

const formatRoomDetailsDisplay = (raw: string | undefined | null) => {
  if (!raw) return 'Not assigned';
  const parsed = parseRoomDetails(raw);

  const parts = [];
  if (parsed.eventRoom) parts.push(`📍 ${parsed.eventRoom} ($${parsed.eventRoomRate})`);

  if (parsed.guestRooms && parsed.guestRooms.length > 0) {
    const roomsStr = parsed.guestRooms
      .filter((r: any) => r.type)
      .map((r: any) => `${r.count ? r.count + ' ' : ''}${r.type} @ $${r.rate}`)
      .join(', ');
    if (roomsStr) {
      parts.push(`🛏️ ${roomsStr}`);
    }
  }

  if (parsed.accessories && parsed.accessories.length > 0) {
    const accsStr = parsed.accessories
      .filter((a: any) => a.name)
      .map((a: any) => `${a.name} ($${a.price})`)
      .join(', ');
    if (accsStr) {
      parts.push(`✨ ${accsStr}`);
    }
  }

  let result = parts.length > 0 ? parts.join(' | ') : '';
  if (parsed.eventDetails) {
    if (result) result += ` - ${parsed.eventDetails}`;
    else result = parsed.eventDetails;
  }

  return result || 'Not assigned';
};

const calculateLeadScore = (lead: Lead) => {
  if (lead.status === 'confirmed') return 100;
  if (lead.status === 'lost') return 0;

  let score = 0;

  // 1. Status Weight (Base Score)
  if (lead.status === 'new') score += 15;
  else if (lead.status === 'contacted') score += 35;
  else if (lead.status === 'proposal_sent') score += 60;
  else if (lead.status === 'negotiation') score += 80;

  // 2. Lead Source Modifiers
  if (lead.lead_source === 'direct') score += 10;
  else if (lead.lead_source === 'sales_call') score += 5;
  else if (lead.lead_source === 'OTA') score -= 5;

  // 3. Completeness of Details
  const hasEventRoom = !!lead.rooms_or_event_details && (
    lead.rooms_or_event_details.includes('Lincoln') ||
    lead.rooms_or_event_details.includes('Alexander')
  );
  const hasRoomBlock = !!lead.rooms_or_event_details && lead.rooms_or_event_details.includes('Rooms:');
  if (hasEventRoom) score += 5;
  if (hasRoomBlock) score += 5;

  // 4. Time Proximity Modifiers (Days to Arrival)
  if (lead.check_in_date) {
    const today = new Date();
    const arrival = new Date(lead.check_in_date);
    const diffTime = arrival.getTime() - today.getTime();
    const daysToArrival = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysToArrival > 0) {
      if (daysToArrival < 7 && (lead.status === 'new' || lead.status === 'contacted')) {
        score -= 20; // Urgent penalty if still early stage close to check-in
      } else if (daysToArrival < 30 && (lead.status === 'proposal_sent' || lead.status === 'negotiation')) {
        score += 10; // Positive urgency if proposal is out
      }
    }
  }

  // Bound the score between 5% and 95% for open leads
  return Math.max(5, Math.min(95, score));
};

const getDefaultStartDate = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
};

const getDefaultEndDate = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};



export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kanban' | 'analytics' | 'heatmap' | 'templates'>('dashboard');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [calendarViewMode, setCalendarViewMode] = useState<'demand' | 'appointments'>('demand');

  // Auth states
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot_password' | 'reset_password'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Sales Agent');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState('1');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [showTrendsModal, setShowTrendsModal] = useState(false);

  useEffect(() => {
    let active = true;

    // Check if recovery link was opened in URL
    if (typeof window !== 'undefined') {
      if (window.location.hash.includes('type=recovery') || window.location.href.includes('reset=true')) {
        setAuthMode('reset_password');
      }
    }

    // Check saved local session if Supabase is offline
    const savedLocalSession = typeof window !== 'undefined' ? localStorage.getItem('leadflow_demo_session') : null;
    if (savedLocalSession) {
      try {
        setSession(JSON.parse(savedLocalSession));
      } catch (e) { }
    }

    // Safety timeout: max 1200ms to end auth loading state regardless of network/Supabase errors
    const timer = setTimeout(() => {
      if (active) setAuthLoading(false);
    }, 1200);

    // Attempt Supabase getSession
    supabase.auth.getSession()
      .then(({ data: { session: supaSession } }) => {
        if (active) {
          if (supaSession) setSession(supaSession);
          setAuthLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Supabase auth connection skipped/failed:', err);
        if (active) setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, supaSession) => {
      if (active) {
        if (event === 'PASSWORD_RECOVERY') {
          setAuthMode('reset_password');
        }
        if (supaSession) setSession(supaSession);
        setAuthLoading(false);
      }
    });

    return () => {
      active = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  // Data state
  const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Could not connect to database.');
    return res.json();
  });

  const { data: leadsData, error: leadsError, mutate: mutateLeads } = useSWR(session ? '/api/leads' : null, fetcher, { fallbackData: [] });
  const { data: templatesData } = useSWR(session ? '/api/templates' : null, fetcher, { fallbackData: [] });
  const { data: appData } = useSWR(session ? '/api/appointments' : null, fetcher, { fallbackData: { appointments: [] } });

  const leads: Lead[] = Array.isArray(leadsData) ? leadsData : [];
  const setLeads = (newLeads: any) => mutateLeads(newLeads, false); // For optimistic UI support

  const templates: Template[] = Array.isArray(templatesData) ? templatesData : [];
  const liveAppointments: any[] = appData?.appointments || [];

  const { data: usersData } = useSWR(session ? '/api/users' : null, fetcher, { fallbackData: [] });

  const users: User[] = Array.isArray(usersData) && usersData.length > 0 ? usersData : [
    { id: '1', name: 'Arzaan Shaikh', role: 'General Manager', email: 'arzaan@leadflow.com' },
    { id: '2', name: 'Rokeya Ahmed', role: 'Director of Sales', email: 'rokeya@leadflow.com' },
    { id: '3', name: 'Riham Mohammed Jehangir', role: 'Sales Manager', email: 'riham@leadflow.com' },
    { id: '4', name: 'Muntaqim Elahi', role: 'Front Desk Supervisor', email: 'muntaqim@leadflow.com' }
  ];
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  // Page level states
  const isLoading = session ? (!leadsData && !leadsError) : true;
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedDayLeads, setSelectedDayLeads] = useState<any[]>([]);
  const [isDayLeadsModalOpen, setIsDayLeadsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'global' | 'users' | 'hotel'>('profile');

  // Authorization Helpers
  const currentUserEmail = session?.user?.email || '';
  const currentUserObj = users.find(u => u.email?.toLowerCase() === currentUserEmail.toLowerCase() || u.id === session?.user?.id);
  const isMuntaqim = currentUserEmail.toLowerCase() === 'muntaqim@leadflow.com' || currentUserEmail.toLowerCase() === 'muntaquime@gmail.com';
  const isArzaan = currentUserEmail.toLowerCase() === 'arzaan@leadflow.com';
  const currentUserRole = currentUserObj?.role || (isMuntaqim ? 'Front Desk Supervisor' : isArzaan ? 'General Manager' : session?.user?.user_metadata?.role || 'Sales Agent');
  const currentUserName = currentUserObj?.name || session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || (isMuntaqim ? 'Muntaqim Elahi' : 'User');
  const isGeneralManager = currentUserRole.toLowerCase().includes('general manager') || isArzaan;
  const isFrontDeskSupervisor = currentUserRole.toLowerCase().includes('front desk supervisor') || isMuntaqim;
  const canDeleteLeads = currentUserEmail !== 'rokeya@leadflow.com' && currentUserEmail !== 'riham@leadflow.com';
  const canManageUsers = isGeneralManager || isFrontDeskSupervisor || isMuntaqim || isArzaan;
  const canManageHotelDetails = isGeneralManager || isFrontDeskSupervisor || isMuntaqim;

  // Settings State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [globalTaxRate, setGlobalTaxRate] = useState('6.0');
  const [globalGratuity, setGlobalGratuity] = useState('20.0');

  const [hotelName, setHotelName] = useState('Hotel Flow Grand');
  const [hotelPhone, setHotelPhone] = useState('+1 (555) 123-4567');
  const [hotelAddress, setHotelAddress] = useState('123 Luxury Ave, New York, NY 10001');

  // User Management State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Sales Agent');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('');

  // Settings Handlers
  const handleSaveProfile = () => setSuccessMsg('Profile updated successfully!');
  const handleSaveGlobalVars = () => setSuccessMsg('Global variables updated successfully!');
  const handleSaveHotelDetails = () => setSuccessMsg('Hotel details updated successfully!');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setErrorMsg('Name and Email are required.');
      return;
    }
    setIsSubmittingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          password: newUserPassword.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      mutate('/api/users');
      setIsAddUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('Sales Agent');
      setSuccessMsg(`User created in Supabase! Temporary password: ${data.user?.temporaryPassword || 'Configured'}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add user');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.email?.toLowerCase() === currentUserEmail.toLowerCase() || user.id === session?.user?.id) {
      setErrorMsg('You cannot delete your own active account.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${user.name} (${user.email || user.role}) from the workspace?`)) return;
    try {
      const res = await fetch(`/api/users?id=${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove user');
      }
      mutate('/api/users');
      setSuccessMsg(`User ${user.name} removed successfully.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUserName(user.name);
    setEditUserRole(user.role);
    setIsEditUserModalOpen(true);
  };

  const handleSaveEditUser = async () => {
    if (!editUserName.trim() || !editUserRole.trim() || !editingUserId) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUserId, name: editUserName, role: editUserRole })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }
      mutate('/api/users');
      setIsEditUserModalOpen(false);
      setSuccessMsg('User role updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user');
    }
  };
  const [leadDetailsTab, setLeadDetailsTab] = useState<'details' | 'timeline' | 'tasks'>('details');
  const [leadActivities, setLeadActivities] = useState<any[]>([]);
  const [leadTasks, setLeadTasks] = useState<any[]>([]);
  const [isFetchingTasks, setIsFetchingTasks] = useState(false);
  const [tasksFilter, setTasksFilter] = useState<'mine' | 'all'>('mine');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskLeadId, setNewTaskLeadId] = useState('');
  const [taskLeadSearchTerm, setTaskLeadSearchTerm] = useState('');
  const [isTaskLeadSearchOpen, setIsTaskLeadSearchOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [activitySaving, setActivitySaving] = useState(false);

  // Proposal and Contract states
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalHtml, setProposalHtml] = useState('');
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [isProposalSigned, setIsProposalSigned] = useState(false);

  // Appointment scheduling states
  const [isSchedulingAppointment, setIsSchedulingAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('Site Tour');
  const [appointmentSaving, setAppointmentSaving] = useState(false);

  // Interactive calendar states
  const [activeAppointment, setActiveAppointment] = useState<any | null>(null);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editApptDate, setEditApptDate] = useState('');
  const [editApptTime, setEditApptTime] = useState('');
  const [editApptType, setEditApptType] = useState('Site Tour');
  const [editApptAgentId, setEditApptAgentId] = useState('1');
  const [apptSaving, setApptSaving] = useState(false);

  // Quick book calendar states
  const [quickBookDate, setQuickBookDate] = useState('');
  const [quickBookClientName, setQuickBookClientName] = useState('');
  const [quickBookTime, setQuickBookTime] = useState('10:00 AM');
  const [quickBookType, setQuickBookType] = useState('Site Tour');
  const [quickBookAgentId, setQuickBookAgentId] = useState('1');
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);

  // AI draft states
  const [aiTemplateType, setAiTemplateType] = useState<string>('thank_you');
  const [aiDraft, setAiDraft] = useState<string>('');
  const [aiDraftLogId, setAiDraftLogId] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailWasEdited, setEmailWasEdited] = useState(false);


  // Form states for new/edit lead
  const [formClientName, setFormClientName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLeadSource, setFormLeadSource] = useState('email');
  const [formCheckIn, setFormCheckIn] = useState('');
  const [formCheckOut, setFormCheckOut] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formEventRoomRate, setFormEventRoomRate] = useState('500');
  const [formGuestRooms, setFormGuestRooms] = useState<{ type: string, count: string, rate: string }[]>([]);
  const [formAccessories, setFormAccessories] = useState<{ name: string, price: string }[]>([]);
  const [formEventDetails, setFormEventDetails] = useState('');
  const [formRevenue, setFormRevenue] = useState('0');
  const [formManager, setFormManager] = useState('1');
  const [formStatus, setFormStatus] = useState('new');
  const [formSegment, setFormSegment] = useState('leisure');
  const [formDocumentUrl, setFormDocumentUrl] = useState('');
  const [formDocumentName, setFormDocumentName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [dateFilterType, setDateFilterType] = useState<'created_at' | 'check_in'>('created_at');
  const [formLostReason, setFormLostReason] = useState('');


  // Follow-up sub-form
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [newFollowUpNotes, setNewFollowUpNotes] = useState('');

  const fetchAnalyticsData = async () => {
    if (!session) return;
    try {
      let analUrl = '/api/analytics';
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (dateFilterType) params.push(`filterType=${dateFilterType}`);
      if (params.length) analUrl += `?${params.join('&')}`;

      const analRes = await fetch(analUrl);
      if (analRes.ok) {
        const analData = await analRes.json();
        setAnalytics(analData);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchHeatmapData = async () => {
    if (!session) return;
    try {
      let heatUrl = '/api/demand/heatmap';
      const params = [];
      if (startDate) {
        params.push(`start=${startDate}`);
      }
      if (endDate) {
        params.push(`end=${endDate}`);
      }
      if (params.length) heatUrl += `?${params.join('&')}`;

      const heatRes = await fetch(heatUrl);
      if (heatRes.ok) {
        const heatData = await heatRes.json();
        setHeatmap(heatData);
      }
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    }
  };

  // Auto-calculate revenue potential in real-time
  useEffect(() => {
    let subtotal = 0;
    let roomRevenue = 0;

    // 1. Calculate guest rooms revenue
    if (formCheckIn && formCheckOut && formGuestRooms.length > 0) {
      const start = new Date(formCheckIn);
      const end = new Date(formCheckOut);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      formGuestRooms.forEach((r) => {
        const count = parseInt(r.count) || 0;
        const rate = parseFloat(r.rate) || 0;
        roomRevenue += count * rate * nights;
      });
    }

    // Add guest rooms revenue plus 15% tax
    subtotal += roomRevenue * 1.15;

    // 2. Add event rental
    if (formDetails) {
      const eventRate = parseFloat(formEventRoomRate) || 0;
      subtotal += eventRate * 1.26; // Includes 6% tax + 20% gratuity
    }

    // 3. Add accessories
    formAccessories.forEach((a) => {
      const price = parseFloat(a.price) || 0;
      subtotal += price;
    });

    setFormRevenue(subtotal.toFixed(2));
  }, [formGuestRooms, formEventRoomRate, formAccessories, formCheckIn, formCheckOut, formDetails]);

  useEffect(() => {
    if (session) {
      fetchAnalyticsData();
      fetchHeatmapData();
    }
  }, [startDate, endDate, dateFilterType, session]);

  useEffect(() => {
    if (activeTab === 'heatmap' && endDate === todayStr) {
      setEndDate(getDefaultEndDate());
    }
  }, [activeTab]);

  // Auto-scroll calendar to current month
  useEffect(() => {
    if (activeTab === 'heatmap' && !isLoading) {
      setTimeout(() => {
        const el = document.getElementById('heatmap-current-month');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 250); // slight delay to ensure DOM is ready
    }
  }, [activeTab, calendarViewMode, isLoading]);

  // Fetch all initial data
  const fetchData = async () => {
    if (!session) return;
    setErrorMsg('');
    try {
      mutate('/api/leads');
      mutate('/api/templates');
      mutate('/api/appointments');
      fetchTasks();
      // Heatmap and analytics are handled separately
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Database connection offline. Please check configuration or contact your system administrator.');
    }
  };

  const fetchLeadActivities = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setLeadActivities(data.activities || []);
      }
    } catch (e) {
      console.error('Failed to fetch lead activities:', e);
    }
  };

  const fetchTasks = async () => {
    setIsFetchingTasks(true);
    try {
      const res = await fetch(`/api/tasks`);
      if (res.ok) {
        const data = await res.json();
        setLeadTasks(data.tasks || []);
      }
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    } finally {
      setIsFetchingTasks(false);
    }
  };

  useEffect(() => {
    if (!newTaskDescription) {
      setNewTaskDueDate('');
      return;
    }

    const desc = newTaskDescription.toLowerCase();
    let hoursToAdd = 0;

    if (desc.includes('approval') || desc.includes('discount')) {
      hoursToAdd = 4;
    } else if (desc.includes('proposal') || desc.includes('contract')) {
      hoursToAdd = 24;
    } else if (desc.includes('follow up') || desc.includes('follow-up') || desc.includes('followup')) {
      hoursToAdd = 48;
    }

    if (hoursToAdd > 0 && !newTaskDueDate) {
      const date = new Date();
      date.setHours(date.getHours() + hoursToAdd);
      const localStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setNewTaskDueDate(localStr);
    }
  }, [newTaskDescription]); // Only re-run when description changes, note we check !newTaskDueDate to avoid overwriting user edits



  useEffect(() => {
    if (selectedLead) {
      fetchLeadActivities(selectedLead.id);
      setLeadDetailsTab('details'); // Reset tab when selected lead changes
    } else if (!selectedLead) {
      setLeadActivities([]);
    }
  }, [selectedLead]);

  const handleSaveActivityNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNoteText.trim()) return;

    setActivitySaving(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newNoteText.trim(),
          performed_by: session?.user?.email || 'Sales Manager',
          activity_type: 'note_added'
        })
      });

      if (!res.ok) throw new Error('Failed to save note');

      const data = await res.json();
      if (data.activity) {
        setLeadActivities(prev => [data.activity, ...prev]);
        setNewNoteText('');
        setSuccessMsg('Note added successfully.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving note.');
    } finally {
      setActivitySaving(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;

    try {
      const res = await fetch(`/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newTaskDescription.trim(),
          assigned_to: newTaskAssignee || null,
          due_date: newTaskDueDate || null,
          lead_id: newTaskLeadId || null
        })
      });

      if (!res.ok) throw new Error('Failed to create task');

      const data = await res.json();
      setLeadTasks(prev => [data.task, ...prev]);
      setNewTaskDescription('');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
      setNewTaskLeadId('');
      setTaskLeadSearchTerm('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to create task: ' + err.message);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      // Optimistic update
      setLeadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update task');
    } catch (err: any) {
      console.error(err);
      // Revert on failure (simplified)
      setLeadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Optimistic update
      setLeadTasks(prev => prev.filter(t => t.id !== taskId));

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err: any) {
      console.error(err);
      // Note: Revert would require keeping the task around, but for simplicity we rely on optimistic update
      fetchTasks(); // Refresh to ensure sync
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || params.get('admin') === '1') {
        setIsAdmin(true);
      }
    }
    
    // Initialize profile fields if session is available
    if (session) {
      setProfileName(prev => prev || session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || '');
      setProfileEmail(prev => prev || session?.user?.email || '');
    }
  }, [session]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setSession(data.session);
      if (typeof window !== 'undefined') {
        localStorage.setItem('leadflow_demo_session', JSON.stringify(data.session));
      }
      setSuccessMsg('Signed in successfully!');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      let sessionData: any = null;

      // 1. Attempt server-side registration
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword, name: authName })
        });
        const data = await res.json();
        if (res.ok && data.session) {
          sessionData = data.session;
        } else if (!res.ok) {
          throw new Error(data.error || 'Server signup failed');
        }
      } catch (serverErr: any) {
        console.warn('Server signup failed, attempting direct Supabase client registration:', serverErr);
        // 2. Direct client-side Supabase registration fallback
        const { data: supaAuthData, error: supaAuthErr } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              name: authName,
              role: 'Sales Agent'
            }
          }
        });
        if (supaAuthErr) throw supaAuthErr;
        sessionData = supaAuthData.session || {
          access_token: 'client_session_' + (supaAuthData.user?.id || Date.now()),
          user: supaAuthData.user
        };
      }

      setSuccessMsg('Account created successfully! You are now signed in.');
      setSession(sessionData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('leadflow_demo_session', JSON.stringify(sessionData));
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: redirectUrl
      });
      if (error) throw error;
      setSuccessMsg('Password reset link sent! Check your email inbox.');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: authPassword });
      if (error) throw error;
      setSuccessMsg('Password successfully updated! You can now log in.');
      setAuthPassword('');
      setAuthMode('signin');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to update password.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { console.error('Logout API error', e); }
    try {
      await supabase.auth.signOut();
    } catch (e) { }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leadflow_demo_session');
    }
    setSession(null);
    setAnalytics(null);
    setHeatmap(null);
  };




  // Auto-hide success and error notification banners
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (selectedLead) {
      const rawName = selectedLead.name_company || '';
      const parts = rawName.split(' / ');
      setFormClientName(parts[0] || '');
      setFormCompanyName(parts[1] || '');
      setFormEmail(selectedLead.email || '');
      setFormPhone(selectedLead.phone || '');
      setFormLeadSource(selectedLead.lead_source || 'email');
      setFormCheckIn(selectedLead.check_in_date || '');
      setFormCheckOut(selectedLead.check_out_date || '');
      const parsedRooms = parseRoomDetails(selectedLead.rooms_or_event_details);
      setFormDetails(parsedRooms.eventRoom);
      setFormEventRoomRate(parsedRooms.eventRoomRate || '500');
      setFormGuestRooms(parsedRooms.guestRooms || []);
      setFormAccessories(parsedRooms.accessories || []);
      setFormEventDetails(parsedRooms.eventDetails);
      setFormRevenue(selectedLead.revenue_potential || '0');
      setFormManager(selectedLead.assigned_sales_manager_id || '1');
      setFormStatus(selectedLead.status || 'new');
      setFormSegment(selectedLead.market_segment || 'leisure');
      setFormDocumentUrl(selectedLead.document_url || '');
      setFormDocumentName(selectedLead.document_name || '');
      setFormLostReason(selectedLead.lost_reason || '');

      // Auto-recommend template based on status
      const status = selectedLead.status;
      if (status === 'new') setAiTemplateType('thank_you');
      else if (status === 'proposal_sent') setAiTemplateType('follow_up_reminder');
      else if (status === 'negotiation') setAiTemplateType('gentle_reminder');
      else if (status === 'confirmed') setAiTemplateType('booking_confirmation');
      else if (status === 'lost') setAiTemplateType('feedback_request');
      else setAiTemplateType('thank_you');
    }
  }, [selectedLead]);

  // Lead CRUD Actions
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const combinedName = formClientName.trim() + (formCompanyName.trim() ? ` / ${formCompanyName.trim()}` : '');
    const leadPayload = {
      name_company: combinedName || 'Unnamed Lead',
      email: formEmail,
      phone: formPhone,
      lead_source: formLeadSource,
      check_in_date: formCheckIn,
      check_out_date: formCheckOut,
      rooms_or_event_details: JSON.stringify({
        eventRoom: formDetails,
        eventRoomRate: formEventRoomRate,
        guestRooms: formGuestRooms,
        accessories: formAccessories,
        eventDetails: formEventDetails
      }),
      revenue_potential: formRevenue,
      assigned_sales_manager_id: formManager,
      status: formStatus,
      market_segment: formSegment,
      document_url: formDocumentUrl || null,
      document_name: formDocumentName || null,
      lost_reason: formStatus === 'lost' ? (formLostReason || 'Other') : null,
    };

    try {
      if (selectedLead && isEditing) {
        // Update
        const res = await fetch(`/api/leads/${selectedLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload),
        });
        if (!res.ok) throw new Error('Failed to update lead');
        const updated = await res.json();
        setSuccessMsg('Lead updated successfully!');
        setSelectedLead(updated);
        setIsEditing(false);
      } else {
        // Create
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload),
        });
        if (!res.ok) throw new Error('Failed to create lead');
        setSuccessMsg('New lead created successfully!');
        setIsNewLeadModalOpen(false);
      }

      // Reset form
      resetLeadForm();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save lead record.');
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    setErrorMsg('');
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    // Optimistic Update
    const prevLeads = [...leads];
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetLead, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      fetchData();
    } catch (err) {
      setLeads(prevLeads);
      setErrorMsg('Failed to update lead status. Reverted changes.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!canDeleteLeads) {
      setErrorMsg('You do not have permission to delete leads.');
      return;
    }
    if (!confirm('Are you sure you want to delete this lead?')) return;
    setErrorMsg('');
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lead');
      setSuccessMsg('Lead deleted successfully');
      setSelectedLead(null);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not delete lead.');
    }
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setAppointmentSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          agent_id: selectedLead.assigned_sales_manager_id,
          type: appointmentType,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime
        })
      });

      if (!res.ok) throw new Error('Failed to save appointment');

      setSuccessMsg('Appointment scheduled successfully!');
      setIsSchedulingAppointment(false);
      setAppointmentDate('');
      setAppointmentTime('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving appointment');
    } finally {
      setAppointmentSaving(false);
    }
  };

  const handleSaveQuickAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookClientName) {
      setErrorMsg('Please enter a client name for the appointment.');
      return;
    }

    setApptSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: quickBookClientName,
          agent_id: '1', // default agent
          type: quickBookType,
          appointment_date: quickBookDate,
          appointment_time: quickBookTime
        })
      });

      if (!res.ok) throw new Error('Failed to save appointment');

      setSuccessMsg('Appointment scheduled successfully!');
      setIsQuickBookingOpen(false);
      setQuickBookClientName('');
      setQuickBookTime('10:00 AM');
      setQuickBookType('Site Tour');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving appointment');
    } finally {
      setApptSaving(false);
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment) return;

    setApptSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/appointments/${activeAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_date: editApptDate,
          appointment_time: editApptTime,
          type: editApptType,
          agent_id: editApptAgentId
        })
      });

      if (!res.ok) throw new Error('Failed to update appointment');

      setSuccessMsg('Appointment rescheduled successfully!');
      setActiveAppointment(null);
      setIsEditingAppointment(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating appointment');
    } finally {
      setApptSaving(false);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setErrorMsg('');
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete appointment');
      setSuccessMsg('Appointment cancelled successfully.');
      setActiveAppointment(null);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not cancel appointment.');
    }
  };

  const handleGenerateProposalContract = () => {
    if (!selectedLead) return;
    setIsGeneratingProposal(true);
    setIsProposalSigned(selectedLead.status === 'confirmed');

    setTimeout(() => {
      const parsed = parseRoomDetails(selectedLead.rooms_or_event_details);

      const checkInDate = new Date(selectedLead.check_in_date);
      const checkOutDate = new Date(selectedLead.check_out_date);
      const nights = Math.ceil(Math.abs(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

      // 1. Guest Rooms block subtotal
      let guestRoomsHtml = '';
      let totalRoomsRev = 0;
      if (parsed.guestRooms && parsed.guestRooms.length > 0) {
        parsed.guestRooms.forEach((r: any) => {
          const count = parseInt(r.count) || 0;
          const rate = parseFloat(r.rate) || 0;
          const rev = count * rate * nights;
          totalRoomsRev += rev;
          guestRoomsHtml += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${r.type} Block</td>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${count} Rooms</td>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">
                $${rate.toFixed(2)}<br>
                <span style="font-size: 11px; color: #64748B;">+$${(rate * 0.15).toFixed(2)} tax (15%)</span>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold;">$${rev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          `;
        });
      } else {
        guestRoomsHtml = `<tr><td colspan="4" style="padding: 15px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #64748B;">No guest room blocks requested.</td></tr>`;
      }

      // 2. Event Rental subtotal
      let eventHtml = '';
      let eventRate = 0;
      if (parsed.eventRoom) {
        eventRate = parseFloat(parsed.eventRoomRate) || 0;
        eventHtml = `
          <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 30px;">2. EVENT SPACE & FUNCTION SETUP</h3>
          <p style="font-size: 13px; margin-bottom: 10px;">The following meeting / function space is reserved for the Group's exclusive use:</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
                <th style="padding: 10px; font-weight: bold;">Function Space / Room</th>
                <th style="padding: 10px; font-weight: bold;">Function Setup Details</th>
                <th style="padding: 10px; font-weight: bold; text-align: right;">Rental Charge</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold;">📍 ${parsed.eventRoom}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${parsed.eventDetails || 'Meeting / Setup Details'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">$${eventRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        `;
      }

      // 3. Accessories subtotal
      let accessoriesHtml = '';
      let totalAccessories = 0;
      if (parsed.accessories && parsed.accessories.length > 0) {
        let rows = '';
        parsed.accessories.forEach((a: any) => {
          const price = parseFloat(a.price) || 0;
          totalAccessories += price;
          rows += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">✨ ${a.name}</td>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          `;
        });
        accessoriesHtml = `
          <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 30px;">3. ACCESSORIES & SERVICE CHARGES</h3>
          <p style="font-size: 13px; margin-bottom: 10px;">The following catering, AV, or support packages are added to the Group order:</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
                <th style="padding: 10px; font-weight: bold;">Service / Equipment Name</th>
                <th style="padding: 10px; font-weight: bold; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        `;
      }

      const guestRoomsTax = totalRoomsRev * 0.15;
      const eventTax = eventRate * 0.06;
      const eventGratuity = eventRate * 0.20;
      const grandTotal = totalRoomsRev + guestRoomsTax + eventRate + eventTax + eventGratuity + totalAccessories;

      const html = `
        <div style="font-family: 'Inter', sans-serif; color: #1E293B; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #1E3A8A; margin: 0; font-size: 24px;">LEADFLOW SALES GROUP</h1>
            <p style="color: #64748B; margin: 5px 0 0 0; font-size: 14px;">Group Rooms & Event Agreement</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px;">
            <div>
              <strong style="color: #0F172A; display: block; margin-bottom: 5px;">ORGANIZATION / GROUP DETAILS:</strong>
              <strong>Group Name:</strong> ${selectedLead.name_company}<br>
              <strong>Contact Email:</strong> ${selectedLead.email}<br>
              <strong>Contact Phone:</strong> ${selectedLead.phone || 'N/A'}<br>
            </div>
            <div style="text-align: right;">
              <strong style="color: #0F172A; display: block; margin-bottom: 5px;">AGREEMENT DETAILS:</strong>
              <strong>Check-In Date:</strong> ${selectedLead.check_in_date}<br>
              <strong>Check-Out Date:</strong> ${selectedLead.check_out_date}<br>
              <strong>Stay Length:</strong> ${nights} Nights<br>
            </div>
          </div>

          <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 30px;">1. ROOM BLOCK & REVENUE TERMS</h3>
          <p style="font-size: 13px;">The Hotel agrees to block the following guest rooms for the Group during the Stay Dates:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
                <th style="padding: 10px; font-weight: bold;">Room Type</th>
                <th style="padding: 10px; font-weight: bold;">Daily Rooms</th>
                <th style="padding: 10px; font-weight: bold;">Agreed Daily Rate</th>
                <th style="padding: 10px; font-weight: bold;">Est. Total Room Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${guestRoomsHtml}
            </tbody>
          </table>

          ${eventHtml}

          ${accessoriesHtml}

          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 18px; border-radius: 8px; margin-top: 30px; page-break-inside: avoid; break-inside: avoid;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; line-height: 1.8;">
              <tr>
                <td style="color: #475569;">Guest Rooms Subtotal:</td>
                <td style="text-align: right; font-weight: bold; color: #1E293B;">$${totalRoomsRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="color: #475569;">Guest Room Taxes (15%):</td>
                <td style="text-align: right; font-weight: bold; color: #E11D48;">$${guestRoomsTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              ${parsed.eventRoom ? `
              <tr>
                <td style="color: #475569;">Event Space Rental:</td>
                <td style="text-align: right; font-weight: bold; color: #1E293B;">$${eventRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="color: #475569;">Event Space Tax (6%):</td>
                <td style="text-align: right; font-weight: bold; color: #E11D48;">$${eventTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="color: #475569;">Event Space Gratuity (20%):</td>
                <td style="text-align: right; font-weight: bold; color: #E11D48;">$${eventGratuity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>` : ''}
              ${parsed.accessories && parsed.accessories.length > 0 ? `
              <tr>
                <td style="color: #475569;">Accessories & Services:</td>
                <td style="text-align: right; font-weight: bold; color: #1E293B;">$${totalAccessories.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>` : ''}
              <tr style="border-top: 2px solid #E2E8F0;">
                <td style="padding-top: 10px; font-size: 14px; font-weight: bold; color: #1E3A8A;">ESTIMATED TOTAL CONTRACT VALUE:</td>
                <td style="padding-top: 10px; text-align: right; font-size: 18px; font-weight: 900; color: #10B981;">$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>

          <div style="page-break-before: always; break-before: page; margin-top: 35px;">
            <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">4. CANCELLATION & ATTRITION POLICY</h3>
            <p style="font-size: 12px; color: #475569; margin-bottom: 30px;">
              Group agrees to check-in on the scheduled arrival date. Any cancellations made less than 30 days prior to arrival will result in a charge equal to 100% of the estimated contract revenue.
              A minimum of 80% guest room occupancy is required under the agreed attrition terms.
            </p>

            <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">5. ACCEPTANCE SIGNATURES</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; font-size: 13px;">
              <div>
                <div style="border-bottom: 1px solid #94A3B8; height: 40px; margin-bottom: 5px; position: relative;">
                </div>
                <strong>Authorized Client Signature (Guest)</strong>
                <div style="font-size: 11px; color: #64748B;">Date: ________________________</div>
              </div>
              <div>
                <div style="border-bottom: 1px solid #94A3B8; height: 40px; margin-bottom: 5px; position: relative;">
                  <span style="font-family: 'Dancing Script', cursive; font-size: 24px; color: #0F172A; position: absolute; bottom: 2px; font-style: italic; white-space: nowrap;">
                    ${(() => {
          const fullName = session?.user?.user_metadata?.full_name;
          const assignedUser = users.find((u: any) => u.id === selectedLead.assigned_sales_manager_id);
          if (fullName) return fullName;
          if (assignedUser) return assignedUser.name;
          const emailName = session?.user?.email?.split('@')[0] || 'Sales Agent';
          return emailName.charAt(0).toUpperCase() + emailName.slice(1);
        })()}
                  </span>
                </div>
                <strong>Hotel Representative Signature</strong>
                <div style="font-size: 11px; color: #64748B;">Date: ${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      `;
      setProposalHtml(html);
      setIsGeneratingProposal(false);
    }, 800);
  };

  const handleSignProposalContract = async () => {
    if (!selectedLead) return;
    setApptSaving(true);

    try {
      // 1. Update lead status to confirmed
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedLead,
          status: 'confirmed'
        })
      });

      if (!res.ok) throw new Error('Failed to confirm agreement status');

      // 2. Log activity
      await fetch(`/api/leads/${selectedLead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Group Agreement officially signed by Client! Status moved to Confirmed.`,
          activity_type: 'status_change',
          performed_by: 'Authorized Client'
        })
      });

      setSuccessMsg('Agreement signed successfully! Deal Confirmed.');
      setIsProposalSigned(true);
      setIsProposalModalOpen(false);
      setSelectedLead(null); // Close details modal too
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing contract.');
    } finally {
      setApptSaving(false);
    }
  };

  const resetLeadForm = () => {
    setFormClientName('');
    setFormCompanyName('');
    setFormEmail('');
    setFormPhone('');
    setFormLeadSource('email');
    setFormCheckIn('');
    setFormCheckOut('');
    setFormDetails('');
    setFormGuestRooms([]);
    setFormEventDetails('');
    setFormRevenue('0');
    setFormManager('1');
    setFormStatus('new');
    setFormSegment('leisure');
    setFormDocumentUrl('');
    setFormDocumentName('');
    setFormLostReason('');
    setIsUploading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload document');
      }

      const data = await res.json();
      setFormDocumentUrl(data.url);
      setFormDocumentName(data.name);
      setSuccessMsg('Document uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFile = async (url: string | undefined | null, filename: string | undefined | null) => {
    if (!url) return;
    const downloadUrl = `${window.location.origin}/api/leads/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename || 'document')}`;
    window.location.href = downloadUrl;
  };

  // AI Email Flow
  const handleGenerateAiEmail = async () => {
    if (!selectedLead) return;
    setIsGeneratingAi(true);
    setAiDraft('');
    setErrorMsg('');
    setEmailWasEdited(false);

    try {
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          templateType: aiTemplateType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to call Groq AI service');
      setAiDraft(data.content);
      setAiDraftLogId(data.logId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate email template.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyEmail = async () => {
    if (!aiDraftLogId) return;
    setIsSendingEmail(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Copy text to clipboard
      await navigator.clipboard.writeText(aiDraft);

      let subject = "Holiday Springfield Follow-Up";
      if (aiDraft.startsWith("Subject:")) {
        const parts = aiDraft.split('\n');
        subject = parts[0].replace('Subject:', '').trim();
      }

      // 2. Log to CRM database
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logId: aiDraftLogId,
          content: aiDraft,
          wasEditedByHuman: emailWasEdited,
        }),
      });
      if (!res.ok) throw new Error('Failed to log email as sent');

      // 3. Log to lead activities
      if (selectedLead) {
        try {
          await fetch(`/api/leads/${selectedLead.id}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: `Copied AI generated email: "${subject}" (${emailWasEdited ? 'Edited by human' : 'Copied unmodified'})`,
              activity_type: 'email_generated'
            })
          });
        } catch (actErr) {
          console.error('Failed to log email activity:', actErr);
        }
      }

      setSuccessMsg('Email draft copied to clipboard and logged to lead activity!');
      setIsAiModalOpen(false);
      setSelectedLead(null);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to copy email to clipboard.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Kanban Columns
  const PIPELINE_STATUSES = [
    { key: 'new', label: 'New Inquiry', color: 'bg-blue-50 text-blue-600 border-blue-200', solidColor: 'bg-blue-500' },
    { key: 'contacted', label: 'Contacted', color: 'bg-purple-50 text-purple-600 border-purple-200', solidColor: 'bg-purple-500' },
    { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', solidColor: 'bg-indigo-500' },
    { key: 'negotiation', label: 'Negotiation', color: 'bg-pink-50 text-pink-600 border-pink-200', solidColor: 'bg-pink-500' },
    { key: 'confirmed', label: 'Confirmed', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', solidColor: 'bg-emerald-500' },
    { key: 'lost', label: 'Lost', color: 'bg-rose-50 text-rose-600 border-rose-200', solidColor: 'bg-rose-500' },
  ];

  // Helper to get initials
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  // Drag and Drop helpers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      handleUpdateLeadStatus(id, status);
    }
  };

  const handleGenerateInsights = async () => {
    if (!analytics) return;
    setIsGeneratingInsights(true);
    setAiInsights(null);
    try {
      const stats = {
        totalPipelineValue: analytics.summary.potentialRevenue,
        wonRevenue: analytics.summary.revenueGenerated,
        totalLeads: analytics.summary.totalLeads,
        wonLeads: analytics.summary.convertedLeads,
        conversionRate: `${analytics.summary.conversionRate}%`,
        managerPerformance: analytics.agentConversion,
        sourcePerformance: analytics.sourcePerformance
      };

      const res = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate insights');

      setAiInsights(data.insights);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating insights from Groq.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const handleDownloadCSV = useReactToPrint({
    contentRef,
    documentTitle: 'Leadflow_Analytics_Report',
    pageStyle: `
      @page { size: auto; margin: 8mm; }
      @media print {
        html, body {
          height: initial !important;
          overflow: initial !important;
          -webkit-print-color-adjust: exact;
        }
        html {
          font-size: 55% !important;
        }
      }
    `
  });

  // Global client-side lead filter by creation or stay dates
  const filteredLeads = leads.filter((lead) => {
    if (!startDate && !endDate) return true;

    const targetDateStr = dateFilterType === 'created_at'
      ? lead.created_at?.split('T')[0]
      : lead.check_in_date;

    if (!targetDateStr) return false;

    if (startDate && targetDateStr < startDate) return false;
    if (endDate && targetDateStr > endDate) return false;

    return true;
  });

  const activeLeads = useMemo(() => {
    return filteredLeads.filter(l => l.status !== 'confirmed' && l.status !== 'lost');
  }, [filteredLeads]);

  const allActiveLeadsForSearch = useMemo(() => {
    return leads.filter(l => l.status !== 'confirmed' && l.status !== 'lost');
  }, [leads]);

  const loggedInUserId = useMemo(() => {
    if (!session?.user?.email) return null;
    const user = users.find(u => u.email === session.user?.email);
    return user ? user.id : null;
  }, [session, users]);

  const filteredTeamTasks = useMemo(() => {
    let filtered = leadTasks;
    if (tasksFilter === 'mine' && loggedInUserId) {
      filtered = filtered.filter(t => t.assigned_to === loggedInUserId);
    }
    if (!showCompletedTasks) {
      filtered = filtered.filter(t => t.status !== 'completed');
    }
    return filtered;
  }, [leadTasks, tasksFilter, showCompletedTasks, loggedInUserId]);

  // Calculate Market Segment shares based on filtered leads
  const segmentCounts = filteredLeads.reduce((acc, lead) => {
    const s = lead.market_segment || 'leisure';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalLeads = filteredLeads.length || 1;
  const corporateCount = segmentCounts['corporate'] || 0;
  const leisureCount = segmentCounts['leisure'] || 0;
  const groupCount = segmentCounts['group'] || 0;

  const corporatePct = (corporateCount / totalLeads) * 100;
  const leisurePct = (leisureCount / totalLeads) * 100;
  const groupPct = (groupCount / totalLeads) * 100;

  // CSS conic-gradient background for pie chart
  const pieConicGradient = `conic-gradient(
    #3B82F6 0% ${corporatePct}%, 
    #10B981 ${corporatePct}% ${corporatePct + leisurePct}%, 
    #6366F1 ${corporatePct + leisurePct}% 100%
  )`;

  // Confirmed Revenue by Segment
  const confirmedLeadsList = filteredLeads.filter(l => l.status === 'confirmed');
  const confirmedRevBySegment = confirmedLeadsList.reduce((acc, lead) => {
    const s = lead.market_segment || 'leisure';
    const rev = parseFloat(lead.revenue_potential as any) || 0;
    acc[s] = (acc[s] || 0) + rev;
    return acc;
  }, {} as Record<string, number>);
  const totalConfirmedRev = Object.values(confirmedRevBySegment).reduce((a, b) => a + b, 0);

  // Total Lead Value by Stage (Pipeline Distribution)
  const pipelineValueByStage = filteredLeads.reduce((acc, lead) => {
    const stage = lead.status || 'new';
    const rev = parseFloat(lead.revenue_potential as any) || 0;
    acc[stage] = (acc[stage] || 0) + rev;
    return acc;
  }, {} as Record<string, number>);
  const totalActivePipelineValue = Object.entries(pipelineValueByStage)
    .filter(([stage]) => stage !== 'lost')
    .reduce((sum, [_, val]) => sum + val, 0);


  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#1F3A60] text-white font-sans">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium tracking-wide">Authenticating...</p>
      </div>
    );
  }

  if (!session || authMode === 'reset_password') {
    return (
      <div className="flex min-h-screen w-screen bg-white font-sans antialiased overflow-hidden">

        {/* Left Side: Login Form */}
        <div className="w-full md:w-1/2 flex flex-col p-8 lg:p-12 xl:p-16 relative z-10">
          <div className="mb-auto">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">Leadflow</span>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto my-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {authMode === 'signin' && 'Welcome Back'}
              {authMode === 'signup' && 'Create Account'}
              {authMode === 'forgot_password' && 'Reset Password'}
              {authMode === 'reset_password' && 'Set New Password'}
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              {authMode === 'signin' && 'Sign in to your sales workspace to continue.'}
              {authMode === 'signup' && 'Register a new account to join the workspace.'}
              {authMode === 'forgot_password' && "Enter your email address and we'll send you a password reset link."}
              {authMode === 'reset_password' && 'Enter your new password below to secure your account.'}
            </p>

            <form
              onSubmit={
                authMode === 'signin'
                  ? handleSignIn
                  : authMode === 'signup'
                  ? handleSignUp
                  : authMode === 'forgot_password'
                  ? handleForgotPassword
                  : handleResetPassword
              }
              className="space-y-5"
            >
              {authError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>
              )}

              {authMode !== 'reset_password' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                    placeholder="name@company.com"
                  />
                </div>
              )}

              {authMode !== 'forgot_password' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {authMode === 'reset_password' ? 'New Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'signin' && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-slate-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot_password');
                      setAuthError('');
                      setSuccessMsg('');
                    }}
                    className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4"
              >
                {authSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>
                    {authMode === 'signin' && 'Log in'}
                    {authMode === 'signup' && 'Create Account'}
                    {authMode === 'forgot_password' && 'Send Reset Link'}
                    {authMode === 'reset_password' && 'Update Password'}
                  </span>
                )}
              </button>
              
              <div className="text-center mt-6">
                {authMode === 'signin' && (
                  <p className="text-sm text-slate-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError('');
                        setSuccessMsg('');
                      }}
                      className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                    >
                      Sign up
                    </button>
                  </p>
                )}
                {authMode === 'signup' && (
                  <p className="text-sm text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setAuthError('');
                        setSuccessMsg('');
                      }}
                      className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                    >
                      Log in
                    </button>
                  </p>
                )}
                {(authMode === 'forgot_password' || authMode === 'reset_password') && (
                  <p className="text-sm text-slate-500">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setAuthError('');
                        setSuccessMsg('');
                      }}
                      className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                    >
                      Back to Log in
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>

          <div className="mt-auto pt-8 text-xs text-slate-400 flex items-center justify-between">
            <span>© 2026 Leadflow</span>
            <div className="space-x-4">
              <button type="button" onClick={() => setShowLegalModal('privacy')} className="hover:text-slate-600 transition-colors cursor-pointer">Privacy Policy</button>
              <button type="button" onClick={() => setShowLegalModal('terms')} className="hover:text-slate-600 transition-colors cursor-pointer">Terms of Service</button>
            </div>
          </div>
        </div>

        {/* Right Side: Marketing / Value Prop */}
        <div className="hidden md:flex w-1/2 bg-[#F0F7FF] flex-col justify-center items-center p-12 relative overflow-hidden">
          {/* Decorative Dot Pattern Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

          <div className="relative z-10 max-w-lg text-center">
            <h2 className="text-[2.5rem] font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight font-serif">
              Close More Deals with Intelligent Lead Tracking
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
              Manage your pipeline, automate follow-ups, and convert prospects into loyal customers with our AI-driven sales platform.
            </p>

            {/* Visual element representing a report or UI */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 transform rotate-[2deg] hover:rotate-0 transition-transform duration-500 max-w-sm mx-auto">
              <div className="flex items-center gap-3 mb-4 border-b border-slate-50 pb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-800 text-sm">Lead Conversion Projected</div>
                  <div className="text-[10px] text-emerald-600 font-bold">+24% Increase this month</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 bg-blue-50 rounded-full w-full"></div>
                <div className="h-2 bg-blue-100 rounded-full w-5/6"></div>
                <div className="h-2 bg-blue-200 rounded-full w-4/6"></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTrendsModal(true)}
              className="mt-12 px-6 py-3 bg-white hover:bg-blue-50 text-blue-600 font-semibold rounded-full shadow hover:shadow-md transition-all text-sm cursor-pointer inline-flex items-center gap-2"
            >
              <span>Explore the 2026 Sales Trends Report</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Legal Modal (Privacy Policy & Terms of Service) */}
        {showLegalModal && (
          <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setShowLegalModal('privacy')}
                    className={`px-3 py-1.5 rounded-md transition-all ${showLegalModal === 'privacy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => setShowLegalModal('terms')}
                    className={`px-3 py-1.5 rounded-md transition-all ${showLegalModal === 'terms' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Terms of Service
                  </button>
                </div>
                <button
                  onClick={() => setShowLegalModal(null)}
                  className="text-slate-400 hover:text-slate-700 h-8 w-8 rounded-full flex items-center justify-center text-lg font-bold hover:bg-slate-200/50 transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto text-xs text-slate-600 space-y-5 leading-relaxed">
                {showLegalModal === 'privacy' ? (
                  <>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">Privacy Policy</h3>
                      <p className="text-[11px] text-slate-400">Last updated: August 2026</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">1. Information We Collect</h4>
                      <p>When you register for and use Leadflow, we collect account details (such as your full name, work email address, and encrypted credentials), as well as sales inquiries, booking details, and interaction logs you enter into your sales workspace.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">2. Use of Information</h4>
                      <p>Your information is used strictly to power your sales pipeline, track lead progression, automate personalized follow-up correspondence, generate deal insights, and manage team permissions. We do not sell or lease your business data to any third parties.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">3. Data Security & Isolation</h4>
                      <p>All database records are protected with industry-standard encryption in transit (HTTPS/TLS) and at rest. Strict Row Level Security (RLS) policies and role-based permissions ensure that access to your workspace data is restricted exclusively to authenticated users within your organization.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">4. Data Ownership & Retention</h4>
                      <p>You retain 100% intellectual property and operational ownership over all customer lists, revenue targets, and contract terms stored in Leadflow. You can export or request permanent deletion of your organization's records at any time.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">5. Contact Information</h4>
                      <p>If you have any questions regarding data protection or compliance, please reach out to our privacy team at <span className="font-semibold text-blue-600">privacy@leadflow.app</span>.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">Terms of Service</h3>
                      <p className="text-[11px] text-slate-400">Last updated: August 2026</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">1. Agreement to Terms</h4>
                      <p>By accessing or using the Leadflow sales platform, you agree to be bound by these Terms of Service. If you are using Leadflow on behalf of a hotel, property, or business entity, you represent that you have the authority to bind that organization.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">2. User Accounts & Responsibilities</h4>
                      <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Roles and permissions (such as General Manager, Front Desk Supervisor, and Sales Agent) must be assigned in compliance with your organization's internal controls.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">3. Acceptable Use</h4>
                      <p>You agree to use Leadflow solely for legitimate sales pipeline tracking, group booking management, client communications, and hospitality operations. You may not attempt to disrupt service availability or access data belonging to other organizations.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">4. AI-Assisted Tools & Automation</h4>
                      <p>Leadflow provides AI-assisted draft generation and demand analysis as productivity tools. Users remain responsible for reviewing all generated proposals, contracts, and email correspondences prior to sending them to prospective clients.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">5. Limitation of Liability</h4>
                      <p>Leadflow is provided on an "as-is" and "as-available" basis. In no event shall Leadflow be liable for indirect, incidental, or consequential damages arising from the use of the platform.</p>
                    </div>
                  </>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setShowLegalModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2026 Sales Trends Report Modal */}
        {showTrendsModal && (
          <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight">2026 Sales & Pipeline Velocity Report</h3>
                    <p className="text-[11px] text-blue-100">Key industry benchmarks & revenue drivers for high-performance teams</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTrendsModal(false)}
                  className="text-white/80 hover:text-white h-8 w-8 rounded-full flex items-center justify-center text-lg font-bold hover:bg-white/10 transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto text-xs text-slate-600 space-y-6 leading-relaxed">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
                    <div className="text-2xl font-extrabold text-blue-600 mb-1">+42%</div>
                    <div className="font-bold text-slate-800 text-xs mb-0.5">Response Velocity</div>
                    <div className="text-[11px] text-slate-500">Inquiries answered in &lt;15 mins yield 2.4x conversion.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                    <div className="text-2xl font-extrabold text-emerald-600 mb-1">+24%</div>
                    <div className="font-bold text-slate-800 text-xs mb-0.5">Close Rate Lift</div>
                    <div className="text-[11px] text-slate-500">Achieved via automated cadence and personalized proposals.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
                    <div className="text-2xl font-extrabold text-purple-600 mb-1">3.8x</div>
                    <div className="font-bold text-slate-800 text-xs mb-0.5">Touchpoint ROI</div>
                    <div className="text-[11px] text-slate-500">Multichannel follow-ups (Email + Calls) close 80% of volume.</div>
                  </div>
                </div>

                {/* Insight 1 */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    1. Automated AI Proposal Turnaround
                  </h4>
                  <p>
                    Traditional group booking contracts take an average of 18 hours to draft and send. With Leadflow's instant AI proposal compiler, sales managers generate accurate, customized room block agreements in under 2 minutes, capturing booking commitments while prospect intent is highest.
                  </p>
                </div>

                {/* Insight 2 */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                    2. Stage Velocity Tracking
                  </h4>
                  <p>
                    Tracking "Days in Stage" allows revenue directors to identify bottlenecks before leads turn cold. The 2026 data shows that inquiries remaining in "Proposal Sent" for longer than 7 days have an 85% drop in win probability unless a scheduled follow-up task is triggered.
                  </p>
                </div>

                {/* Insight 3 */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                    3. Multi-Segment Revenue Balancing
                  </h4>
                  <p>
                    Balancing corporate group bookings with weddings and social blocks generates 19% higher RevPAR during shoulder seasons. Leadflow's demand heatmap provides instant visual indicators of upcoming high-density booking dates.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Source: Leadflow 2026 Sales & Hospitality Index</span>
                <button
                  onClick={() => setShowTrendsModal(false)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-[#1F3A60] border-r border-[#1F3A60] flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-20 px-6 flex items-center gap-3.5 border-b border-white/10 bg-[#1F3A60]">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl shadow-md border border-white/10 shrink-0">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white tracking-wide leading-none">Leadflow</h1>
              <span className="text-[10px] text-blue-200/80 font-bold uppercase tracking-widest block mt-1.5">Sales Platform</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard'
                  ? 'bg-blue-600/10 text-sky-400 border border-blue-500/20'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
              <ChevronRight className={`h-3 w-3 opacity-60 ${activeTab === 'dashboard' ? 'block' : 'hidden'}`} />
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'kanban'
                  ? 'bg-blue-600/10 text-sky-400 border border-blue-500/20'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4" />
                <span>Leads</span>
              </div>
              <ChevronRight className={`h-3 w-3 opacity-60 ${activeTab === 'kanban' ? 'block' : 'hidden'}`} />
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics'
                  ? 'bg-blue-600/10 text-sky-400 border border-blue-500/20'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </div>
              <ChevronRight className={`h-3 w-3 opacity-60 ${activeTab === 'analytics' ? 'block' : 'hidden'}`} />
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'heatmap'
                  ? 'bg-blue-600/10 text-sky-400 border border-blue-500/20'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </div>
              <ChevronRight className={`h-3 w-3 opacity-60 ${activeTab === 'heatmap' ? 'block' : 'hidden'}`} />
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'templates'
                  ? 'bg-blue-600/10 text-sky-400 border border-blue-500/20'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                <span>Email Templates</span>
              </div>
              <ChevronRight className={`h-3 w-3 opacity-60 ${activeTab === 'templates' ? 'block' : 'hidden'}`} />
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 bg-[#162945] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUserName ? currentUserName.split(' ').map((n: string) => n[0]).join('') : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{currentUserName}</div>
              <div className="text-[10px] text-blue-200/70 truncate">{currentUserRole || 'Front Desk Supervisor'}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC] relative">
        {/* Top Header */}
        <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 capitalize">
              {activeTab === 'kanban'
                ? 'Leads View'
                : activeTab === 'heatmap'
                  ? 'Calendar View'
                  : `${activeTab} view`}
            </h2>
            <button
              onClick={fetchData}
              className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh database data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Global Date Filter Controls for Dashboard, Leads (Kanban), and Analytics */}
          {(activeTab === 'dashboard' || activeTab === 'kanban' || activeTab === 'analytics') && (
            <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 shadow-sm">
              <select
                value={dateFilterType}
                onChange={(e) => {
                  const newType = e.target.value as 'created_at' | 'check_in';
                  setDateFilterType(newType);
                  if (newType === 'created_at') {
                    if (endDate > todayStr) setEndDate(todayStr);
                    if (startDate > todayStr) setStartDate(getDefaultStartDate());
                  } else {
                    if (endDate === todayStr) setEndDate(getDefaultEndDate());
                  }
                }}
                className="bg-transparent font-bold text-[10px] uppercase text-slate-500 px-2 outline-none border-r border-slate-200 cursor-pointer"
              >
                <option value="created_at">Created Date</option>
                <option value="check_in">Stay Dates</option>
              </select>
              <input
                type="date"
                value={startDate}
                max={dateFilterType === 'created_at' ? todayStr : undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent px-2 py-0.5 outline-none text-slate-800 focus:text-blue-600 font-medium"
              />
              <span className="text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={endDate}
                max={dateFilterType === 'created_at' ? todayStr : undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent px-2 py-0.5 outline-none text-slate-800 focus:text-blue-600 font-medium"
              />
              {(startDate !== getDefaultStartDate() || (dateFilterType === 'created_at' ? endDate !== todayStr : endDate !== getDefaultEndDate())) && (
                <button
                  onClick={() => {
                    setStartDate(getDefaultStartDate());
                    setEndDate(dateFilterType === 'created_at' ? todayStr : getDefaultEndDate());
                  }}
                  className="text-slate-400 hover:text-slate-600 font-bold px-2 cursor-pointer text-sm"
                  title="Clear date filter"
                >
                  &times;
                </button>
              )}
            </div>
          )}


          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                resetLeadForm();
                setIsEditing(false);
                setIsNewLeadModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Lead</span>
            </button>
          </div>
        </header>

        {/* Notifications Banners */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-700 px-8 py-3 text-sm flex items-center gap-3 shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-700 px-8 py-3 text-sm flex items-center gap-3 shrink-0">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* View Inner Panel */}
        <div className={`flex-1 flex flex-col min-h-0 bg-[#F8FAFC] ${activeTab === 'heatmap' ? 'overflow-hidden p-8' : 'overflow-y-auto p-8'}`}>
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm font-medium">Loading database records...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Dashboard */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                          {(startDate || endDate) ? 'Filtered Leads' : 'Total Leads'}
                        </span>
                        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/10 shrink-0">
                          <Users className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{analytics?.summary.totalLeads || filteredLeads.length}</h3>
                      <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                        <span className="text-emerald-600 font-bold">Live</span> database connection
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Conversion Rate</span>
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/10 shrink-0">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                        {analytics?.summary.conversionRate ? `${analytics.summary.conversionRate.toFixed(1)}%` : '0%'}
                      </h3>
                      <div className="text-[11px] text-slate-500 mt-2">
                        Confirmed / Total leads
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Confirmed Revenue</span>
                        <div className="p-2.5 bg-blue-500/10 rounded-lg text-sky-500 border border-blue-500/10 shrink-0">
                          <DollarSign className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                        ${analytics?.summary.revenueGenerated.toLocaleString() || '0'}
                      </h3>
                      <div className="text-[11px] text-emerald-600 font-medium mt-2">
                        Converted bookings
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Potential Revenue</span>
                        <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600 border border-sky-100 shrink-0">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                        ${analytics?.summary.potentialRevenue.toLocaleString() || '0'}
                      </h3>
                      <div className="text-[11px] text-sky-600 font-medium mt-2">
                        Excludes Lost leads
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Team Tasks (Left Column) */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[700px]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <h3 className="font-bold text-slate-800 text-base">Team Tasks</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                              onClick={() => setTasksFilter('mine')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${tasksFilter === 'mine' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              My Tasks
                            </button>
                            <button
                              onClick={() => setTasksFilter('all')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${tasksFilter === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              Team Tasks
                            </button>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-slate-700">
                            <input
                              type="checkbox"
                              checked={showCompletedTasks}
                              onChange={(e) => setShowCompletedTasks(e.target.checked)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Show Completed
                          </label>
                        </div>
                      </div>

                      <form onSubmit={handleCreateTask} className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 space-y-2.5">
                        <div>
                          <input
                            type="text"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            placeholder="New task description..."
                            className="w-full bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-blue-500 text-xs text-slate-800"
                            required
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={newTaskAssignee}
                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                            className="flex-1 min-w-[120px] bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-blue-500 text-xs text-slate-700"
                          >
                            <option value="">Assign To</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                          <div className="flex-1 min-w-[130px]">
                            <input
                              list="leads-list"
                              type="text"
                              value={taskLeadSearchTerm || (newTaskLeadId ? allActiveLeadsForSearch.find(l => l.id === newTaskLeadId)?.name_company || '' : '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTaskLeadSearchTerm(val);
                                const matchedLead = allActiveLeadsForSearch.find(l => l.name_company === val);
                                if (matchedLead) {
                                  setNewTaskLeadId(matchedLead.id);
                                } else {
                                  setNewTaskLeadId('');
                                }
                              }}
                              placeholder="Link Lead (Search...)"
                              className="w-full bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-blue-500 text-xs text-slate-700"
                            />
                            <datalist id="leads-list">
                              {allActiveLeadsForSearch
                                .filter(l => !taskLeadSearchTerm || l.name_company.toLowerCase().includes(taskLeadSearchTerm.toLowerCase()))
                                .slice(0, 10)
                                .map(l => (
                                  <option key={l.id} value={l.name_company} />
                                ))}
                            </datalist>
                          </div>
                          <input
                            type="datetime-local"
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className="flex-1 min-w-[170px] bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-blue-500 text-xs text-slate-700"
                          />
                          <button
                            type="submit"
                            disabled={!newTaskDescription.trim()}
                            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-md text-xs transition-colors disabled:opacity-50 shadow-xs"
                          >
                            + Add Task
                          </button>
                        </div>
                      </form>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                        {isFetchingTasks ? (
                          <div className="text-center py-4 text-slate-400 text-xs">Loading tasks...</div>
                        ) : filteredTeamTasks.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            No tasks found in this view.
                          </div>
                        ) : (
                          filteredTeamTasks.map((task) => (
                            <div key={task.id} className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${task.status === 'completed' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/50 hover:shadow-md cursor-pointer'}`}>
                              <button
                                onClick={() => handleToggleTaskStatus(task.id, task.status)}
                                className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300 hover:border-emerald-500'}`}
                              >
                                {task.status === 'completed' && <span className="text-xs leading-none">✓</span>}
                              </button>
                              <div className="flex-1 min-w-0" onClick={(e) => {
                                // If they click the row and it has a lead, select it. But prevent if they clicked the checkbox.
                                if ((e.target as HTMLElement).tagName !== 'BUTTON' && task.lead_id) {
                                  const lead = leads.find(l => l.id === task.lead_id);
                                  if (lead) setSelectedLead(lead);
                                }
                              }}>
                                <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                  {task.description}
                                </p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-slate-500 font-medium">
                                  {task.assignee?.name && (
                                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                      👤 {task.assignee.name}
                                    </span>
                                  )}
                                  {task.lead?.name_company && (
                                    <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                      🏢 {task.lead.name_company}
                                    </span>
                                  )}
                                  {task.due_date && (
                                    <span className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-100'} px-1.5 py-0.5 rounded`}>
                                      📅 Due: {new Date(task.due_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="shrink-0 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete task"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Follow-ups and Alerts (Right Sidebar) */}
                    <div className="lg:col-span-1 flex flex-col gap-8 h-[700px]">
                      {/* Urgency Widget: Today's Follow-Ups */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-800 text-base">Follow-Ups</h3>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">Due</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                          {activeLeads.slice(0, 5).map(lead => (
                            <div
                              key={lead.id}
                              className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-500/30 transition-all cursor-pointer flex items-center justify-between group"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <div className="space-y-1">
                                <h4 className="font-bold text-sm text-slate-800 group-hover:text-[#2563EB] transition-colors">{lead.name_company}</h4>
                                <div className="flex flex-col gap-1 mt-1 text-[10px]">
                                  <span className="text-slate-500 line-clamp-1">{formatRoomDetailsDisplay(lead.rooms_or_event_details)}</span>
                                  <span className="text-sky-600 font-bold">${parseFloat(lead.revenue_potential || '0').toLocaleString()}</span>
                                </div>
                              </div>

                              <button className="p-1.5 bg-blue-600/10 hover:bg-blue-600 text-sky-400 hover:text-white rounded-lg transition-all group-hover:translate-x-1">
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            </div>
                          ))}

                          {activeLeads.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                              <CheckCircle2 className="h-8 w-8 text-slate-600" />
                              <p className="text-sm">Caught up!</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* High-Demand Dates alerts */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-5 w-5 text-sky-400" />
                          <h3 className="font-bold text-slate-800 text-base">Demand Alerts</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                          <div className="space-y-2">
                            {heatmap && Object.entries(heatmap)
                              .sort((a, b) => b[1].count - a[1].count)
                              .slice(0, 4)
                              .map(([date, info]) => (
                                <div key={date} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-rose-500/10 rounded text-rose-400 border border-rose-500/10 font-bold text-[9px]">HOT</div>
                                    <div>
                                      <div className="text-sm font-semibold text-slate-800 leading-none">{date}</div>
                                      <div className="text-[10px] text-slate-500 mt-1">{info.count} inquiries</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-semibold text-emerald-400">${Math.round(info.revenue).toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}

                            {(!heatmap || Object.keys(heatmap).length === 0) && (
                              <div className="h-24 flex flex-col items-center justify-center text-slate-600 text-xs text-center">
                                No demand data.<br />Populate stays first.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Appointments Section */}
                  <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                      <h3 className="font-bold text-slate-800 text-base">Upcoming Appointments</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                      {(() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const upcoming = liveAppointments.filter(apt => apt.appointment_date >= todayStr).slice(0, 5);

                        if (upcoming.length === 0) {
                          return (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 min-h-[150px]">
                              <CalendarDays className="h-8 w-8 text-slate-300" />
                              <p className="text-sm">No upcoming appointments scheduled.</p>
                            </div>
                          );
                        }

                        return upcoming.map(apt => (
                          <div
                            key={apt.id}
                            onClick={() => setActiveAppointment(apt)}
                            className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between"
                            title="Click to view details, reschedule, or cancel appointment"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${apt.type === 'Site Tour' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                  apt.type === 'Zoom Meeting' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                    'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                {apt.type === 'Site Tour' ? '📍' : apt.type === 'Zoom Meeting' ? '💻' : '📞'}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-800">{apt.leads?.name_company || 'Unknown Lead'}</h4>
                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                  <span className="font-semibold">{new Date(apt.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700">{apt.appointment_time}</span>
                                  <span>•</span>
                                  <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold border border-slate-200 text-slate-700">{apt.type}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Host</div>
                              <div className="flex items-center gap-2 justify-end">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold uppercase text-slate-600 border border-slate-200">
                                  {apt.users?.name ? apt.users.name.substring(0, 2) : '??'}
                                </div>
                                <div className="text-xs font-semibold text-slate-700">{apt.users?.name || 'Unassigned'}</div>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Leads Pipeline (Kanban) */}
              {activeTab === 'kanban' && (
                <div className="h-full flex flex-col overflow-hidden animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
                    <p className="text-xs sm:text-sm text-slate-500">
                      {viewMode === 'board'
                        ? 'Drag and drop cards or click columns to move. Updates are synced live to database.'
                        : 'Manage, search, and edit your leads in a clean list format.'}
                    </p>

                    {/* View mode toggle */}
                    <div className="flex w-full sm:w-auto bg-white p-1 rounded-lg border border-slate-200 text-xs shrink-0 justify-between sm:justify-start">
                      <button
                        onClick={() => setViewMode('board')}
                        className={`w-1/2 sm:w-auto px-3 py-1.5 rounded-md font-medium transition-all ${viewMode === 'board'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        Board View
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`w-1/2 sm:w-auto px-3 py-1.5 rounded-md font-medium transition-all ${viewMode === 'list'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        List View
                      </button>
                    </div>
                  </div>

                  {/* View Switching */}
                  {viewMode === 'board' ? (
                    /* Kanban Grid */
                    <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4 items-stretch select-none">
                      {PIPELINE_STATUSES.map((col) => {
                        const colLeads = filteredLeads.filter(l => l.status === col.key);
                        return (
                          <div
                            key={col.key}
                            className="w-80 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-full"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.key)}
                          >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4 shrink-0 pb-2 border-b border-[#1D2030]">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${col.color}`}>
                                  {col.label}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-500">{colLeads.length}</span>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin min-h-[300px]">
                              {colLeads.map((lead) => (
                                <div
                                  key={lead.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, lead.id)}
                                  onClick={() => setSelectedLead(lead)}
                                  className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-500/40 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg group"
                                >
                                  {(() => {
                                    const score = calculateLeadScore(lead);
                                    return (
                                      <div className="flex justify-between items-start gap-2 mb-1">
                                        <h4 className="font-bold text-sm text-slate-800 group-hover:text-[#2563EB] transition-colors line-clamp-1">
                                          {lead.name_company}
                                        </h4>
                                        {lead.status !== 'confirmed' && lead.status !== 'lost' && (
                                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                              score >= 40 ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                                'bg-rose-50 text-rose-700 border-rose-200'
                                            }`} title="Win Probability">
                                            🎯 {score}%
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                                    <span className="font-medium text-slate-700">{formatRoomDetailsDisplay(lead.rooms_or_event_details)}</span>
                                  </p>

                                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <span className="text-slate-600 font-semibold truncate">
                                        Stay: {lead.check_in_date} to {lead.check_out_date}
                                      </span>
                                      <div className="flex gap-1.5 mt-1 flex-wrap">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold capitalize border border-slate-200">
                                          {lead.lead_source.replace(/_/g, ' ')}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-[#1F3A60]/10 text-[#1F3A60] text-[9px] font-semibold capitalize border border-[#1F3A60]/20">
                                          {lead.market_segment.replace(/_/g, ' ')}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="font-bold text-emerald-600 text-xs shrink-0 self-end ml-2">
                                      ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {colLeads.length === 0 && (
                                <div className="h-32 border-2 border-dashed border-[#1E2235] rounded-lg flex items-center justify-center text-slate-600 text-xs">
                                  Drop leads here
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Spreadsheet-style List View */
                    <div className="flex-1 overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm shadow-lg">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                            <th className="py-4 px-6">Client / Company</th>
                            <th className="py-4 px-6">Description</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6">Win Prob.</th>
                            <th className="py-4 px-6">Revenue</th>
                            <th className="py-4 px-6">Stay Dates</th>
                            <th className="py-4 px-6">Source</th>
                            <th className="py-4 px-6">Segment</th>
                            <th className="py-4 px-6 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredLeads.map((lead) => {
                            const statusColor = PIPELINE_STATUSES.find(s => s.key === lead.status)?.color || '';
                            const score = calculateLeadScore(lead);
                            return (
                              <tr
                                key={lead.id}
                                className="hover:bg-slate-50/50 transition-colors group"
                              >
                                <td className="py-4 px-6">
                                  <div className="font-bold text-slate-800 group-hover:text-[#2563EB] transition-colors">
                                    {lead.name_company}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">{lead.email}</div>
                                </td>
                                <td className="py-4 px-6">
                                  {lead.rooms_or_event_details ? (
                                    <span className="font-medium text-slate-700 text-xs">
                                      {formatRoomDetailsDisplay(lead.rooms_or_event_details)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${statusColor}`}>
                                    {lead.status.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-4 px-6">
                                  {lead.status === 'confirmed' ? (
                                    <span className="text-emerald-600 font-bold text-xs">🏆 100%</span>
                                  ) : lead.status === 'lost' ? (
                                    <span className="text-slate-400 font-medium text-xs">0%</span>
                                  ) : (
                                    <span className={`font-bold text-xs ${score >= 70 ? 'text-emerald-600' :
                                        score >= 40 ? 'text-sky-500' :
                                          'text-rose-500'
                                      }`}>
                                      🎯 {score}%
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-6 font-bold text-emerald-600">
                                  ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                                </td>
                                <td className="py-4 px-6">
                                  {lead.check_in_date} <span className="text-slate-500">to</span> {lead.check_out_date}
                                </td>
                                <td className="py-4 px-6">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold capitalize border border-slate-200">
                                    {lead.lead_source.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold capitalize border border-slate-200">
                                    {lead.market_segment.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedLead(lead);
                                    }}
                                    className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600 text-sky-400 hover:text-white rounded border border-blue-500/20 text-[10px] font-semibold transition-all"
                                  >
                                    View / Edit
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {filteredLeads.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                                No leads found. Add a lead above to get started.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Analytics */}
              {activeTab === 'analytics' && (
                <div className="space-y-8 print:space-y-4 animate-fadeIn" ref={contentRef}>

                  {/* Print-only Header */}
                  <div className="hidden print:block mb-8 pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-600 rounded-lg p-2">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-3xl font-black text-slate-800 tracking-tight">Leadflow</h1>
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mt-4">Pipeline & Analytics Report</h2>
                    <p className="text-slate-500 font-medium mt-1">Generated on {new Date().toLocaleDateString()}</p>
                  </div>

                  {/* AI Executive Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm relative overflow-hidden print:hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Sparkles className="w-24 h-24 text-blue-600" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-blue-100 rounded-xl">
                            <Sparkles className="h-5 w-5 text-sky-400" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-slate-800">AI Executive Summary</h2>
                            <p className="text-xs text-slate-500">Groq-powered pipeline analysis</p>
                          </div>
                        </div>
                        <button
                          onClick={handleGenerateInsights}
                          disabled={isGeneratingInsights || !analytics}
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer print:hidden"
                        >
                          {isGeneratingInsights ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              <span>Generate Weekly Insights</span>
                            </>
                          )}
                        </button>
                      </div>

                      {isGeneratingInsights && !aiInsights && (
                        <div className="py-8 text-center animate-pulse">
                          <p className="text-blue-600 font-medium text-sm">Groq Llama 3.1 analyzing pipeline data...</p>
                        </div>
                      )}

                      {aiInsights && (
                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-5 border border-white mt-4 shadow-sm">
                          <ul className="space-y-4">
                            {aiInsights.split(/\n|\*(?=\s)/).filter(line => line.trim().length > 0).map((line, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-blue-500 mr-3 mt-1 text-lg leading-none">•</span>
                                <span className="text-slate-700 text-sm font-medium leading-relaxed">{line.replace(/^\*\s*|^-\s*/, '').replace(/\*/g, '').trim()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!isGeneratingInsights && !aiInsights && (
                        <p className="text-slate-500 text-sm mt-2">Click generate to analyze your current pipeline health, top performers, and areas of opportunity.</p>
                      )}
                    </div>
                  </div>

                  {/* Reporting Header & CSV Export */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 print:hidden">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">Pipeline Analytics & Reports</h3>
                      <p className="text-xs text-slate-500 mt-1">Export lead records and inspect performance metrics.</p>
                    </div>

                    <button
                      onClick={handleDownloadCSV}
                      className="flex items-center gap-2 bg-[#1E2030] hover:bg-[#272B40] text-[#E2E8F0] font-semibold text-xs px-4 py-2.5 rounded-lg border border-[#253149] transition-all active:scale-95 shadow-sm cursor-pointer shrink-0 print:hidden"
                    >
                      <Download className="h-4 w-4 text-sky-400" />
                      <span>Download Analytics Report</span>
                    </button>
                  </div>

                  {/* Analytics Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-8 print:gap-4">
                    {/* Status count charts - CSS Bar Chart */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="font-bold text-slate-800 text-base mb-6">Leads Count by Status</h3>
                      <div className="space-y-4">
                        {PIPELINE_STATUSES.map((status) => {
                          const count = analytics?.statusCounts[status.key as keyof typeof analytics.statusCounts] || 0;
                          const maxCount = Math.max(...Object.values(analytics?.statusCounts || { new: 1 }));
                          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          return (
                            <div key={status.key} className="space-y-2">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                  <span className={`w-2.5 h-2.5 rounded-full ${status.solidColor}`}></span>
                                  <span className="capitalize">{status.label}</span>
                                </span>
                                <span className="text-slate-800 font-bold">{count}</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${status.solidColor}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Market Segment Pie Chart */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base mb-2">Market Segment Share</h3>
                        <p className="text-[11px] text-slate-500 mb-4">Distribution of leads across target markets</p>
                      </div>

                      <div className="flex justify-center items-center py-4">
                        <div
                          className="w-36 h-36 rounded-full flex items-center justify-center relative shadow-lg"
                          style={{ background: pieConicGradient }}
                        >
                          {/* Inner cutout for donut effect */}
                          <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Leads</span>
                            <span className="text-2xl font-extrabold text-slate-800 mt-0.5">{filteredLeads.length}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 text-center border-t border-slate-200 pt-4">
                        <div>
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-sky-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Corp</span>
                          </div>
                          <span className="text-xs font-bold text-slate-800 mt-1 block">{corporateCount} ({corporatePct.toFixed(0)}%)</span>
                        </div>

                        <div>
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Leisure</span>
                          </div>
                          <span className="text-xs font-bold text-slate-800 mt-1 block">{leisureCount} ({leisurePct.toFixed(0)}%)</span>
                        </div>

                        <div>
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span>Group</span>
                          </div>
                          <span className="text-xs font-bold text-slate-800 mt-1 block">{groupCount} ({groupPct.toFixed(0)}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Sales agent performance */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="font-bold text-slate-800 text-base mb-6">Sales Agent Conversions</h3>
                      <div className="space-y-4">
                        {analytics?.agentConversion.map((agent) => (
                          <div key={agent.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1F3A60]/10 text-[#1F3A60] flex items-center justify-center font-bold text-xs">
                                {getInitials(agent.name)}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-800">{agent.name}</h4>
                                <span className="text-xs text-slate-600 font-medium">{agent.total} leads managed</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-sm font-extrabold text-emerald-600">{agent.conversionRate.toFixed(1)}%</span>
                              <div className="text-xs text-slate-500 mt-0.5">{agent.confirmed} closed bookings</div>
                            </div>
                          </div>
                        ))}

                        {(!analytics?.agentConversion || analytics.agentConversion.length === 0) && (
                          <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                            No agent performance records found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* New Analytics Row: Lost Reason Analysis & Lead Source Conversion */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4">
                    {/* Lost Reasons chart */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="font-bold text-slate-800 text-base mb-2">Lost Business Analysis</h3>
                      <p className="text-[11px] text-slate-500 mb-6">Why leads were lost (reasons captured on status change)</p>

                      <div className="space-y-4">
                        {Object.entries(analytics?.lostReasons || {
                          "Rate Too High": 0,
                          "Unavailable Dates": 0,
                          "Space Too Small": 0,
                          "Competitor": 0,
                          "Other": 0,
                        }).map(([reason, count]) => {
                          const totalLost = Object.values(analytics?.lostReasons || {}).reduce((a, b) => a + b, 0) || 1;
                          const percentage = (count / totalLost) * 100;
                          return (
                            <div key={reason} className="space-y-2">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-slate-600 font-semibold">{reason}</span>
                                <span className="text-slate-800 font-bold">{count} deals ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lead Source Performance Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base mb-2">Lead Source Conversion & ROI</h3>
                        <p className="text-[11px] text-slate-500 mb-4">Compare performance metrics across lead generation sources</p>
                      </div>

                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-2.5">Source</th>
                              <th className="py-2.5 text-center">Total Leads</th>
                              <th className="py-2.5 text-center">Conversion</th>
                              <th className="py-2.5 text-right">Confirmed Rev</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(analytics?.sourcePerformance || []).map((item) => (
                              <tr key={item.source} className="hover:bg-slate-50">
                                <td className="py-2.5 font-bold text-slate-700 capitalize">{item.source.replace(/_/g, ' ')}</td>
                                <td className="py-2.5 text-center text-slate-600">{item.total}</td>
                                <td className="py-2.5 text-center font-extrabold text-emerald-600">{item.conversionRate.toFixed(1)}%</td>
                                <td className="py-2.5 text-right font-extrabold text-slate-800">${item.revenue.toLocaleString()}</td>
                              </tr>
                            ))}
                            {(!analytics?.sourcePerformance || analytics.sourcePerformance.length === 0) && (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-slate-400 italic">No source data available for this period.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Pipeline Value Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4 my-8 print:my-4">
                    {/* Card 1: Confirmed Revenue by Segment */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-slate-800 text-base mb-1">Confirmed Revenue by Segment</h3>
                            <p className="text-[11px] text-slate-500">Actual converted bookings revenue contribution</p>
                          </div>
                          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 font-extrabold text-sm">
                            ${totalConfirmedRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="space-y-4 mt-6">
                          {[
                            { key: 'corporate', label: 'Corporate', color: 'from-blue-600 to-blue-500', icon: '💼' },
                            { key: 'leisure', label: 'Leisure', color: 'from-emerald-500 to-emerald-400', icon: '⛱️' },
                            { key: 'group', label: 'Group / Events', color: 'from-indigo-600 to-indigo-500', icon: '👥' }
                          ].map(seg => {
                            const val = confirmedRevBySegment[seg.key] || 0;
                            const pct = totalConfirmedRev > 0 ? (val / totalConfirmedRev) * 100 : 0;
                            return (
                              <div key={seg.key} className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-600 flex items-center gap-1.5">
                                    <span>{seg.icon}</span>
                                    <span>{seg.label}</span>
                                  </span>
                                  <span className="text-slate-800 font-bold">
                                    ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(0)}%)
                                  </span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full bg-gradient-to-r ${seg.color} rounded-full transition-all duration-500`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Total Pipeline Lead Value */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-slate-800 text-base mb-1">Pipeline Total Lead Value</h3>
                            <p className="text-[11px] text-slate-500">Value of active leads in pipeline stages (excluding Lost)</p>
                          </div>
                          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100 font-extrabold text-sm">
                            ${totalActivePipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="space-y-4 mt-6">
                          {PIPELINE_STATUSES.filter(s => s.key !== 'lost').map(status => {
                            const val = pipelineValueByStage[status.key] || 0;
                            const pct = totalActivePipelineValue > 0 ? (val / totalActivePipelineValue) * 100 : 0;
                            return (
                              <div key={status.key} className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-600 flex items-center gap-1.5">
                                    <span className={`w-2.5 h-2.5 rounded-full ${status.solidColor}`}></span>
                                    <span className="capitalize">{status.label}</span>
                                  </span>
                                  <span className="text-slate-800 font-bold">
                                    ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(0)}%)
                                  </span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${status.solidColor}`}
                                    style={{
                                      width: `${pct}%`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Third Row: Operational Performance KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-8 print:gap-4">
                    {/* Speed-to-lead */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">Speed-to-Lead Response</h3>
                        <p className="text-xs text-slate-600 font-medium">Average response hours (lead creation to first contact)</p>
                      </div>

                      <div className="my-4 text-center">
                        <span className="text-3xl font-extrabold text-slate-800">
                          {analytics?.avgResponseTimeHours ? `${analytics.avgResponseTimeHours.toFixed(1)}h` : 'N/A'}
                        </span>
                        <div className="mt-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {analytics?.avgResponseTimeHours && analytics.avgResponseTimeHours < 24 ? (
                            <span className="text-emerald-600 font-bold">● Meets SLA (&lt; 24h)</span>
                          ) : analytics?.avgResponseTimeHours ? (
                            <span className="text-rose-500 font-bold">▲ Exceeds SLA</span>
                          ) : (
                            <span>No contacts recorded</span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase">Agent Avg Hours</h4>
                        {(analytics?.agentResponseTimes || []).map(agent => (
                          <div key={agent.id} className="flex justify-between text-xs">
                            <span className="text-slate-600 font-medium">{agent.name}</span>
                            <span className="font-bold text-slate-800">{agent.avgHours.toFixed(1)}h</span>
                          </div>
                        ))}
                        {(!analytics?.agentResponseTimes || analytics.agentResponseTimes.length === 0) && (
                          <div className="text-slate-500 text-xs italic">No logs recorded</div>
                        )}
                      </div>
                    </div>

                    {/* Booking Window */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">Booking Window (Lead Time)</h3>
                        <p className="text-xs text-slate-600 font-medium">Average days between booking and check-in date</p>
                      </div>

                      <div className="my-4 text-center">
                        <span className="text-3xl font-extrabold text-slate-800">
                          {analytics?.avgBookingLeadTime ? `${Math.round(analytics.avgBookingLeadTime)} days` : 'N/A'}
                        </span>
                        <div className="text-xs text-slate-500 mt-1 font-medium">Average across all closed bookings</div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-medium">Corporate</span>
                          <span className="font-bold text-slate-800">{Math.round(analytics?.bookingLeadTimeBySegment?.corporate || 0)} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-medium">Leisure</span>
                          <span className="font-bold text-slate-800">{Math.round(analytics?.bookingLeadTimeBySegment?.leisure || 0)} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-medium">Group Business</span>
                          <span className="font-bold text-slate-800">{Math.round(analytics?.bookingLeadTimeBySegment?.group || 0)} days</span>
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Velocity & Stagnant Leads warnings */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">Stagnant Leads Warning</h3>
                        <p className="text-xs text-slate-600 font-medium">Leads in proposal/negotiation for over 10 days</p>
                      </div>

                      <div className="my-4 text-center">
                        <span className={`text-4xl font-black ${analytics?.stagnantCount && analytics.stagnantCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
                          {analytics?.stagnantCount || 0}
                        </span>
                        <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Stale Leads in Pipeline</div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                        <h4 className="text-xs font-bold text-slate-500 uppercase">Avg Days in Stage</h4>
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-medium">New Stage</span>
                          <span className="font-bold text-slate-800">{Math.round(analytics?.averageDaysInStage?.new || 0)} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-medium">Proposal Sent</span>
                          <span className="font-bold text-slate-800">{Math.round(analytics?.averageDaysInStage?.proposal_sent || 0)} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-medium">Negotiation</span>
                          <span className="font-bold text-slate-800">{Math.round(analytics?.averageDaysInStage?.negotiation || 0)} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Calendar */}
              {activeTab === 'heatmap' && (
                <div className="h-full flex flex-col animate-fadeIn overflow-hidden">
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarDays className="h-5 w-5 text-sky-400" />
                          <h3 className="font-bold text-slate-800 text-base">
                            {calendarViewMode === 'demand' ? 'Lead Demand Heatmap' : 'Sales Appointments Calendar'}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500">
                          {calendarViewMode === 'demand'
                            ? 'Color-shaded calendar showing inquiry volume. Hover over days to see requested leads and potential revenue metrics.'
                            : 'Scheduled client tours, phone calls, and virtual meetings. Hover over days to view and edit appointment logs.'}
                        </p>
                      </div>

                      {/* Future Appointments Toggle */}
                      {/* Future Appointments Toggle */}
                      <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-xs shrink-0">
                        <button
                          onClick={() => setCalendarViewMode('demand')}
                          className={`px-3 py-1.5 rounded-md font-medium transition-all ${calendarViewMode === 'demand' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Demand Heatmap
                        </button>
                        <button
                          onClick={() => setCalendarViewMode('appointments')}
                          className={`px-3 py-1.5 rounded-md font-medium transition-all ${calendarViewMode === 'appointments' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Appointments
                        </button>
                      </div>
                    </div>

                    {/* Dynamic calendar grid matching global date filter */}
                    {(() => {
                      const getCalendarDays = () => {
                        const start = new Date();
                        start.setMonth(0); // Jan 1st of current year
                        start.setDate(1);
                        
                        const end = new Date();
                        end.setMonth(11); // Dec 31st of current year
                        end.setDate(31);

                        const dates: Date[] = [];
                        const curr = new Date(start);
                        while (curr <= end) {
                          dates.push(new Date(curr));
                          curr.setDate(curr.getDate() + 1);
                        }
                        return dates;
                      };

                      const calendarDays = getCalendarDays();

                      if (calendarDays.length === 0) {
                        return (
                          <div className="py-8 text-center text-slate-500 text-xs">
                            Please select a valid date range to view calendar data.
                          </div>
                        );
                      }

                      return (
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                            {calendarDays.map((targetDate, idx) => {
                              const dateStr = targetDate.toISOString().split('T')[0];
                              const dayLabel = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              const weekdayLabel = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
                              const isFirstOfCurrentMonth = targetDate.getMonth() === new Date().getMonth() && targetDate.getDate() === 1;

                              if (calendarViewMode === 'demand') {
                                const dayData = heatmap?.[dateStr];
                                const count = dayData?.count || 0;
                                const revenue = dayData?.revenue || 0;

                                // Shade color based on count
                                let shadeClass = 'bg-white border-slate-200 text-slate-500 hover:border-slate-300';
                                if (count > 0 && count <= 1) shadeClass = 'bg-blue-50/50 border-blue-100 text-blue-700 font-semibold';
                                else if (count > 1 && count <= 3) shadeClass = 'bg-blue-100/50 border-blue-200 text-blue-800 font-semibold';
                                else if (count > 3) shadeClass = 'bg-indigo-100/50 border-indigo-200 text-indigo-800 font-semibold';

                                return (
                                  <div
                                    key={idx}
                                    id={isFirstOfCurrentMonth ? 'heatmap-current-month' : undefined}
                                    onClick={() => {
                                      if (dayData && dayData.leads && dayData.leads.length > 0) {
                                        if (dayData.leads.length === 1) {
                                          const fullLead = leads.find((l) => l.id === dayData.leads[0].id);
                                          if (fullLead) {
                                            setSelectedLead(fullLead);
                                          } else {
                                            setSelectedDayLeads(dayData.leads);
                                            setSelectedCalendarDate(dateStr);
                                            setIsDayLeadsModalOpen(true);
                                          }
                                        } else {
                                          setSelectedDayLeads(dayData.leads);
                                          setSelectedCalendarDate(dateStr);
                                          setIsDayLeadsModalOpen(true);
                                        }
                                      } else if (dateStr >= todayStr) {
                                        resetLeadForm();
                                        setFormCheckIn(dateStr);
                                        setIsNewLeadModalOpen(true);
                                      }
                                    }}
                                    className={`group relative p-3 rounded-lg border text-sm min-h-[95px] flex flex-col justify-between transition-all shadow-sm ${
                                      (dayData && dayData.leads && dayData.leads.length > 0) || dateStr >= todayStr 
                                        ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' 
                                        : 'cursor-not-allowed opacity-75'
                                    } ${shadeClass}`}
                                  >
                                    <div className="flex justify-between items-center opacity-75">
                                      <span className="font-bold text-[11px]">{dayLabel}</span>
                                      <span className="text-[9px] font-medium tracking-wide uppercase">{weekdayLabel}</span>
                                    </div>

                                    {count > 0 ? (
                                      <div className="text-left mt-2 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-bold block text-slate-800">{count} Lead{count > 1 ? 's' : ''}</span>
                                          <span className="text-[9px] font-semibold text-emerald-600">${Math.round(revenue).toLocaleString()}</span>
                                        </div>

                                        {/* Booking Type Badges on Card */}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {(() => {
                                            const dayLeadsList = dayData?.leads || [];
                                            const types = dayLeadsList.map((l: any) => getLeadBookingType(l.rooms_or_event_details));
                                            const hasBoth = types.some((t: any) => t.type === 'both');
                                            const hasEvent = types.some((t: any) => t.type === 'event' || t.type === 'both');
                                            const hasStay = types.some((t: any) => t.type === 'stay_block' || t.type === 'both');

                                            return (
                                              <>
                                                {hasBoth ? (
                                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                                    ✨ Both
                                                  </span>
                                                ) : (
                                                  <>
                                                    {hasEvent && (
                                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                                        🏢 Event
                                                      </span>
                                                    )}
                                                    {hasStay && (
                                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                                        🛏️ Stay Block
                                                      </span>
                                                    )}
                                                  </>
                                                )}
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] text-slate-400 self-start mt-2 hover:text-blue-600 transition-colors">+ Add lead</span>
                                    )}

                                    {/* Hover Popover Tooltip */}
                                    {count > 0 && (
                                      <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-900 text-white rounded-xl p-3 shadow-2xl z-50 pointer-events-none text-xs border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="font-bold border-b border-slate-700 pb-1.5 mb-2 flex justify-between items-center text-slate-200">
                                          <span>{dayLabel} Leads</span>
                                          <span className="text-emerald-400 text-[11px]">${Math.round(revenue).toLocaleString()}</span>
                                        </div>
                                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                          {(dayData?.leads || []).map((lead: any, lIdx: number) => {
                                            const bType = getLeadBookingType(lead.rooms_or_event_details);
                                            return (
                                              <div key={lIdx} className="bg-slate-800/90 p-2 rounded-lg text-[10px] space-y-1 border border-slate-700">
                                                <div className="flex justify-between items-center">
                                                  <span className="font-bold text-white truncate max-w-[120px]">{lead.name_company}</span>
                                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${bType.badgeClass}`}>
                                                    {bType.icon} {bType.shortLabel}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between text-slate-400">
                                                  <span className="capitalize">{lead.status.replace('_', ' ')}</span>
                                                  <span className="font-semibold text-emerald-400">${parseFloat(lead.revenue || '0').toLocaleString()}</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        <div className="text-[9px] text-sky-400 font-medium text-center mt-2 border-t border-slate-800 pt-1">
                                          Click to view lead details
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              } else {
                                // Appointments View (Grid Mode)
                                const dayAppointments = liveAppointments.filter(apt => apt.appointment_date === dateStr);
                                const hasAppointments = dayAppointments.length > 0;
                                const shadeClass = hasAppointments ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200';

                                return (
                                  <div
                                    key={idx}
                                    id={isFirstOfCurrentMonth ? 'heatmap-current-month' : undefined}
                                    onClick={() => {
                                      if (dateStr >= todayStr) {
                                        setQuickBookDate(dateStr);
                                        setIsQuickBookingOpen(true);
                                      }
                                    }}
                                    className={`p-3 rounded-lg border text-sm min-h-[85px] flex flex-col transition-all shadow-sm ${dateStr >= todayStr ? 'cursor-pointer hover:border-blue-300 hover:shadow-md ' + shadeClass : 'cursor-not-allowed opacity-60 bg-slate-50'}`}
                                  >
                                    <div className={`flex justify-between items-center mb-2 ${hasAppointments ? 'text-blue-700 font-bold' : 'text-slate-400'}`}>
                                      <span className="font-bold text-[11px]">{dayLabel}</span>
                                      <span className="text-[9px] font-medium tracking-wide uppercase">{weekdayLabel}</span>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-2">
                                      {hasAppointments ? (
                                        dayAppointments.map(apt => (
                                          <div
                                            key={apt.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveAppointment(apt);
                                              setEditApptDate(apt.appointment_date);
                                              setEditApptTime(apt.appointment_time);
                                              setEditApptType(apt.type);
                                              setEditApptAgentId(apt.agent_id || '1');
                                              setIsEditingAppointment(false);
                                            }}
                                            className="bg-white rounded border border-blue-100 p-2 text-[10px] shadow-sm cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all text-left"
                                          >
                                            <div className="flex items-center gap-1.5 font-bold text-blue-800 mb-0.5">
                                              <span>{apt.type === 'Site Tour' ? '📍' : apt.type === 'Zoom Meeting' ? '💻' : '📞'}</span>
                                              <span>{apt.appointment_time}</span>
                                            </div>
                                            <div className="text-slate-700 font-medium truncate">{apt.leads?.name_company || 'Unknown Lead'}</div>
                                            <div className="text-slate-500 truncate mt-0.5">Host: {apt.users?.name || 'Unassigned'}</div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-[9px] text-slate-400 mt-1">No appointments</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Tab 5: Email Templates */}
              {activeTab === 'templates' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 text-base mb-6">AI Email Template Library</h3>
                    <p className="text-xs text-slate-500 mb-6">
                      Customize template contents used by the AI engine. Wrap variables like <code>{"{guest_name}"}</code>, <code>{"{check_in}"}</code>, <code>{"{check_out}"}</code>, or <code>{"{details}"}</code> in brackets to auto-fill them.
                    </p>

                    <div className="space-y-6">
                      {['thank_you', 'follow_up_reminder', 'gentle_reminder'].map((type) => {
                        const template = templates.find(t => t.template_type === type);
                        return (
                          <div key={type} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-sky-400 capitalize">{type.replace(/_/g, ' ')}</span>
                            </div>
                            <textarea
                              className="w-full h-32 bg-[#0B0F19] border border-slate-700 rounded-lg p-3 text-xs text-[#E2E8F0] font-mono leading-relaxed focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] outline-none"
                              defaultValue={template?.content || ''}
                              onBlur={async (e) => {
                                try {
                                  await fetch('/api/templates', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      template_type: type,
                                      content: e.target.value,
                                    }),
                                  });
                                  setSuccessMsg('Template saved successfully!');
                                  fetchData();
                                } catch (err) {
                                  setErrorMsg('Failed to update template');
                                }
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden flex items-center justify-around bg-white border-t border-slate-200 p-2 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'}`}>
            <TrendingUp className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('kanban')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'kanban' ? 'text-blue-600' : 'text-slate-500'}`}>
            <Briefcase className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Leads</span>
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'analytics' ? 'text-blue-600' : 'text-slate-500'}`}>
            <BarChart3 className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Analytics</span>
          </button>
          <button onClick={() => setActiveTab('heatmap')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'heatmap' ? 'text-blue-600' : 'text-slate-500'}`}>
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Heatmap</span>
          </button>
        </div>
      </main>

      {/* MODAL 1: Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white border border-slate-200 rounded-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${isEditing ? 'max-w-4xl' : 'max-w-xl'}`}>
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Lead Record Details</h3>
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setIsEditing(false);
                }}
                className="text-slate-500 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {isEditing ? (
                /* Edit Lead Form */
                <form onSubmit={handleSaveLead} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Client Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Miller"
                        value={formClientName}
                        onChange={(e) => setFormClientName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Company / Group Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Miller Reunion"
                        value={formCompanyName}
                        onChange={(e) => setFormCompanyName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Phone</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Check In</label>
                      <input
                        type="date"
                        required
                        value={formCheckIn}
                        onChange={(e) => setFormCheckIn(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Check Out</label>
                      <input
                        type="date"
                        required
                        value={formCheckOut}
                        onChange={(e) => setFormCheckOut(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Revenue Potential ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formRevenue}
                        onChange={(e) => setFormRevenue(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Assigned Manager</label>
                      <select
                        value={formManager}
                        onChange={(e) => setFormManager(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Source</label>
                      <select
                        value={formLeadSource}
                        onChange={(e) => setFormLeadSource(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      >
                        <option value="OTA">OTA</option>
                        <option value="direct">Direct</option>
                        <option value="walk-in">Walk-in</option>
                        <option value="email">Email</option>
                        <option value="sales_call">Sales Call</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Market Segment</label>
                      <select
                        value={formSegment}
                        onChange={(e) => setFormSegment(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      >
                        <option value="corporate">Corporate</option>
                        <option value="leisure">Leisure</option>
                        <option value="group">Group</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="proposal_sent">Proposal Sent</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>

                    {formStatus === 'lost' && (
                      <div>
                        <label className="block text-rose-600 font-bold mb-1">Reason Lost</label>
                        <select
                          value={formLostReason}
                          required
                          onChange={(e) => setFormLostReason(e.target.value)}
                          className="w-full bg-white border border-rose-300 rounded-lg p-2.5 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-800 font-medium"
                        >
                          <option value="">-- Select Reason --</option>
                          <option value="Rate Too High">Rate Too High</option>
                          <option value="Unavailable Dates">Unavailable Dates</option>
                          <option value="Space Too Small">Space Too Small</option>
                          <option value="Competitor">Competitor</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Event Room</label>
                        <select
                          value={formDetails}
                          onChange={(e) => {
                            setFormDetails(e.target.value);
                            if (e.target.value && !formEventRoomRate) {
                              setFormEventRoomRate('500');
                            }
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 font-medium"
                        >
                          <option value="">-- Select Event Room --</option>
                          <option value="Lincoln">Lincoln</option>
                          <option value="Alexander">Alexander</option>
                          <option value="Alexander 1">Alexander 1</option>
                          <option value="Alexander 2">Alexander 2</option>
                        </select>
                      </div>
                      {formDetails && (
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">
                            Room Rental Price ($)
                            {formEventRoomRate && !isNaN(Number(formEventRoomRate)) && (
                              <span className="ml-2 text-[11px] text-indigo-600 font-bold">
                                (+ ${(Number(formEventRoomRate) * 0.06).toFixed(2)} tax, ${(Number(formEventRoomRate) * 0.20).toFixed(2)} gratuity)
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formEventRoomRate}
                            onChange={(e) => setFormEventRoomRate(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                            placeholder="e.g. 500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 space-y-3">
                      <label className="block text-slate-600 font-bold mb-1">Guest Rooms</label>
                      {formGuestRooms.map((room, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 relative bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div>
                            <label className="block text-slate-500 font-semibold text-xs mb-1">Type</label>
                            <select
                              value={room.type}
                              onChange={(e) => {
                                const newRooms = [...formGuestRooms];
                                newRooms[index].type = e.target.value;
                                setFormGuestRooms(newRooms);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-semibold"
                            >
                              <option value="">-- None --</option>
                              <option value="TQNN">TQNN</option>
                              <option value="KSBN">KSBN</option>
                              <option value="KNGN">KNGN</option>
                              <option value="KACN">KACN</option>
                              <option value="KWLN">KWLN</option>
                              <option value="KWBN">KWBN</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold text-xs mb-1">Count</label>
                            <input
                              type="number"
                              min="0"
                              value={room.count}
                              onChange={(e) => {
                                const newRooms = [...formGuestRooms];
                                newRooms[index].count = e.target.value;
                                setFormGuestRooms(newRooms);
                              }}
                              placeholder="e.g. 10"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold text-xs mb-1">
                              Daily Rate ($)
                              {room.rate && !isNaN(Number(room.rate)) && (
                                <span className="ml-2 text-[11px] text-indigo-600 font-bold">
                                  (+ ${(Number(room.rate) * 0.15).toFixed(2)} nightly tax)
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={room.rate}
                              onChange={(e) => {
                                const newRooms = [...formGuestRooms];
                                newRooms[index].rate = e.target.value;
                                setFormGuestRooms(newRooms);
                              }}
                              placeholder="e.g. 189"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newRooms = formGuestRooms.filter((_, i) => i !== index);
                              setFormGuestRooms(newRooms);
                            }}
                            className="absolute -top-2 -right-2 bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10"
                            title="Remove Room Type"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormGuestRooms([...formGuestRooms, { type: '', count: '', rate: '189' }])}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Room Block
                      </button>
                    </div>

                    {/* Accessories & Add-ons Block */}
                    <div className="col-span-2 space-y-3">
                      <label className="block text-slate-600 font-bold mb-1">Accessories & Add-ons</label>
                      {formAccessories.map((acc, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4 relative bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div>
                            <label className="block text-slate-500 font-semibold text-xs mb-1">Accessory / Add-on Name</label>
                            <input
                              type="text"
                              value={acc.name}
                              onChange={(e) => {
                                const newAcc = [...formAccessories];
                                newAcc[index].name = e.target.value;
                                setFormAccessories(newAcc);
                              }}
                              placeholder="e.g. AV Package, Coffee Break, Audio System"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold text-xs mb-1">Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={acc.price}
                              onChange={(e) => {
                                const newAcc = [...formAccessories];
                                newAcc[index].price = e.target.value;
                                setFormAccessories(newAcc);
                              }}
                              placeholder="e.g. 150"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newAcc = formAccessories.filter((_, i) => i !== index);
                              setFormAccessories(newAcc);
                            }}
                            className="absolute -top-2 -right-2 bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10"
                            title="Remove Accessory"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormAccessories([...formAccessories, { name: '', price: '' }])}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Accessory / Add-on
                      </button>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-600 font-bold mb-1">Additional Event Details</label>
                      <textarea
                        value={formEventDetails}
                        onChange={(e) => setFormEventDetails(e.target.value)}
                        rows={3}
                        placeholder="e.g. Catering needs, setup requirements, special requests..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-3 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 font-medium"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-600 font-bold mb-1">Attached Document (Proposal/Contract)</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
                        {formDocumentUrl ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-sky-400 font-bold shrink-0">📎</span>
                              <span className="text-slate-800 truncate font-medium">{formDocumentName || 'Attached Document'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormDocumentUrl('');
                                setFormDocumentName('');
                              }}
                              className="text-rose-400 hover:text-rose-300 font-semibold text-xs ml-2 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-[#27354E] hover:border-blue-500/50 rounded-lg cursor-pointer transition-all hover:bg-slate-100">
                              <span className="text-slate-500 font-medium text-xs">
                                {isUploading ? 'Uploading file...' : '📎 Select Proposal / Contract'}
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                disabled={isUploading}
                                onChange={handleFileChange}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-[#1A212E] text-white py-2.5 rounded-lg border border-[#303650] hover:bg-[#222B3F]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                /* View Details Panel */
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{selectedLead.name_company}</h4>
                      <p className="text-slate-500 mt-1">{selectedLead.email} | {selectedLead.phone || 'No phone'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const bookingType = getLeadBookingType(selectedLead.rooms_or_event_details);
                        return (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${bookingType.badgeClass}`}>
                            {bookingType.icon} {bookingType.label}
                          </span>
                        );
                      })()}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/10 text-sky-400 border border-blue-500/20 capitalize">
                        {selectedLead.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Tab Switcher */}
                  <div className="flex border-b border-slate-200 text-xs font-semibold">
                    <button
                      onClick={() => setLeadDetailsTab('details')}
                      className={`pb-2 px-4 border-b-2 transition-all ${leadDetailsTab === 'details'
                          ? 'border-blue-600 text-blue-600 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      👤 Details
                    </button>
                    <button
                      onClick={() => setLeadDetailsTab('timeline')}
                      className={`pb-2 px-4 border-b-2 transition-all flex items-center gap-1.5 ${leadDetailsTab === 'timeline'
                          ? 'border-blue-600 text-blue-600 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      📝 Timeline & Notes
                      {leadActivities.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {leadActivities.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {leadDetailsTab === 'details' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-slate-500 font-bold block mb-0.5">Stay Dates</span>
                          <strong className="text-slate-800 text-xs">{selectedLead.check_in_date} to {selectedLead.check_out_date}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block mb-0.5">Revenue Potential</span>
                          <strong className="text-emerald-600 text-xs font-bold">${parseFloat(selectedLead.revenue_potential || '0').toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block mb-0.5">Win Probability</span>
                          {(() => {
                            const score = calculateLeadScore(selectedLead);
                            return (
                              <strong className={`text-xs font-bold ${selectedLead.status === 'confirmed' ? 'text-emerald-600' :
                                  selectedLead.status === 'lost' ? 'text-slate-400' :
                                    score >= 70 ? 'text-emerald-600' :
                                      score >= 40 ? 'text-sky-500' :
                                        'text-rose-500'
                                }`}>
                                {selectedLead.status === 'confirmed' ? '🏆 100%' :
                                  selectedLead.status === 'lost' ? '0%' :
                                    `🎯 ${score}%`}
                              </strong>
                            );
                          })()}
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block mb-0.5">Source</span>
                          <strong className="text-slate-800 text-xs capitalize">{selectedLead.lead_source.replace(/_/g, ' ')}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block mb-0.5">Segment</span>
                          <strong className="text-slate-800 text-xs capitalize">{selectedLead.market_segment.replace(/_/g, ' ')}</strong>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 font-bold block mb-0.5">Rooms & Event Details</span>
                          <p className="text-slate-800 mt-1 text-xs flex items-center gap-1.5">
                            <span className="font-semibold">{formatRoomDetailsDisplay(selectedLead.rooms_or_event_details)}</span>
                          </p>
                        </div>

                        {selectedLead.document_url && (
                          <div className="col-span-2 border-t border-slate-200 pt-3 mt-1">
                            <span className="text-slate-500 font-bold block mb-0.5 mb-1.5 font-bold uppercase tracking-wider text-[10px]">Attached Document</span>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(selectedLead.document_url, selectedLead.document_name || 'document')}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600 text-sky-400 hover:text-white rounded-lg border border-blue-500/20 text-xs font-bold transition-all cursor-pointer"
                            >
                              <span>📎</span>
                              <span>{selectedLead.document_name || 'Download Document'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Schedule Appointment Block */}
                      <div className="space-y-3 pt-2">
                        <span className="text-slate-600 font-bold block">📅 Schedule Appointment</span>
                        {isSchedulingAppointment ? (
                          <form onSubmit={handleSaveAppointment} className="bg-blue-50 border border-blue-200 p-3 rounded-lg space-y-3 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Type</label>
                                <select
                                  value={appointmentType}
                                  onChange={e => setAppointmentType(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs outline-none focus:border-blue-500"
                                >
                                  <option value="Site Tour">Site Tour</option>
                                  <option value="Phone Call">Phone Call</option>
                                  <option value="Zoom Meeting">Zoom Meeting</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Date</label>
                                <input
                                  type="date"
                                  required
                                  min={todayStr}
                                  value={appointmentDate}
                                  onChange={e => setAppointmentDate(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Time</label>
                                <input
                                  type="time"
                                  required
                                  value={appointmentTime}
                                  onChange={e => setAppointmentTime(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                              <button type="button" onClick={() => setIsSchedulingAppointment(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                              <button type="submit" disabled={appointmentSaving} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 disabled:opacity-50">
                                {appointmentSaving ? 'Saving...' : 'Confirm'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setIsSchedulingAppointment(true)}
                            className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 font-semibold py-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
                          >
                            <CalendarDays className="h-4 w-4" />
                            <span>Book an Appointment</span>
                          </button>
                        )}
                      </div>

                      {/* AI email generator buttons */}
                      <div className="space-y-3 pt-2">
                        <span className="text-slate-600 font-bold block">AI Follow-Up Safeguard Generator</span>
                        <div className="flex gap-2">
                          <select
                            value={aiTemplateType}
                            onChange={(e) => setAiTemplateType(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-[#1F3A60]"
                          >
                            <option value="thank_you">Thank-You Email {selectedLead.status === 'new' ? '(Recommended)' : ''}</option>
                            <option value="follow_up_reminder">Proposal Follow-Up {selectedLead.status === 'proposal_sent' ? '(Recommended)' : ''}</option>
                            <option value="gentle_reminder">Gentle Reminder {selectedLead.status === 'negotiation' ? '(Recommended)' : ''}</option>
                            <option value="booking_confirmation">Booking Confirmation {selectedLead.status === 'confirmed' ? '(Recommended)' : ''}</option>
                            <option value="feedback_request">Feedback Request {selectedLead.status === 'lost' ? '(Recommended)' : ''}</option>
                          </select>

                          <button
                            onClick={() => {
                              setIsAiModalOpen(true);
                              handleGenerateAiEmail();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2 rounded-lg transition-all active:scale-95 shadow-sm"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Generate AI Email</span>
                          </button>
                        </div>
                      </div>


                    </div>
                  ) : (
                    /* Timeline and Notes Tab Content */
                    <div className="space-y-4">
                      <form onSubmit={handleSaveActivityNote} className="space-y-2">
                        <textarea
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="Add a custom activity note or sales manager update..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:bg-white focus:border-blue-500 transition-all text-xs"
                          required
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={activitySaving || !newNoteText.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                          >
                            {activitySaving ? 'Saving...' : 'Add Note'}
                          </button>
                        </div>
                      </form>

                      <div className="border-t border-slate-100 pt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                        {leadActivities.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            No activity history logged yet. Action items and notes will appear here.
                          </div>
                        ) : (
                          leadActivities.map((act) => {
                            let icon = '📝';
                            let iconBg = 'bg-slate-100 text-slate-700 border border-slate-200';
                            if (act.activity_type === 'status_change') {
                              icon = '🔄';
                              iconBg = 'bg-amber-100 text-amber-700 border border-amber-200';
                            } else if (act.activity_type === 'email_generated') {
                              icon = '✉️';
                              iconBg = 'bg-purple-100 text-purple-700 border border-purple-200';
                            } else if (act.activity_type === 'appointment_scheduled') {
                              icon = '📅';
                              iconBg = 'bg-blue-100 text-blue-700 border border-blue-200';
                            } else if (act.activity_type === 'appointment_cancelled') {
                              icon = '🚫';
                              iconBg = 'bg-rose-100 text-rose-700 border border-rose-200';
                            } else if (act.activity_type === 'document_uploaded') {
                              icon = '📎';
                              iconBg = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                            }

                            return (
                              <div key={act.id} className="flex gap-3 text-xs text-left animate-fadeIn">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${iconBg}`}>
                                  {icon}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-slate-800 font-medium leading-relaxed">{act.description}</p>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                    <span>{new Date(act.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    {act.performed_by && (
                                      <>
                                        <span>•</span>
                                        <span>By: {act.performed_by}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action items */}
                  <div className="flex gap-4 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#1A212E] text-white py-2.5 rounded-lg border border-[#303650] hover:bg-[#222B3F]"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Record</span>
                    </button>
                    {canDeleteLeads && (
                      <button
                        onClick={() => handleDeleteLead(selectedLead.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-lg border border-rose-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Lead</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <>
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
            <div className="bg-slate-50 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-700/10">
              {/* Sidebar */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm relative z-10">
              <div className="h-16 flex items-center px-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Settings</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-8">
                <div>
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveSettingsTab('profile')}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSettingsTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                      Personal Profile
                    </button>
                  </div>
                </div>

                <div>
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveSettingsTab('global')}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSettingsTab === 'global' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                      Global Variables
                    </button>
                    {canManageUsers && (
                      <button
                        onClick={() => setActiveSettingsTab('users')}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSettingsTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        Team Management
                      </button>
                    )}
                    {canManageHotelDetails && (
                      <button
                        onClick={() => setActiveSettingsTab('hotel')}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSettingsTab === 'hotel' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        Workspace Profile
                      </button>
                    )}
                  </div>
                </div>


              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
              {/* Topbar */}
              <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
                <h3 className="font-semibold text-slate-800">
                  {activeSettingsTab === 'profile' && 'Personal Profile'}
                  {activeSettingsTab === 'global' && 'Global Variables'}
                  {activeSettingsTab === 'users' && 'Team Management'}
                  {activeSettingsTab === 'hotel' && 'Workspace Profile'}
                </h3>
                <button onClick={() => setIsSettingsModalOpen(false)} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors">
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                {activeSettingsTab === 'profile' && (
                  <div className="max-w-2xl space-y-6">
                    <h4 className="text-lg font-medium text-slate-900">Personal Profile</h4>
                    <p className="text-sm text-slate-500">Update your personal contact information and email signature.</p>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your Name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input type="email" className="w-full border border-slate-300 rounded-md p-2 text-sm" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} placeholder="you@example.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input type="tel" className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="+1 (555) 000-0000" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
                      </div>
                      <button onClick={handleSaveProfile} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 w-max">Save Changes</button>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'global' && (
                  <div className="max-w-2xl space-y-6">
                    <h4 className="text-lg font-medium text-slate-900">Global Variables</h4>
                    <p className="text-sm text-slate-500">Configure default values used across the application.</p>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                        <input type="number" className="w-full border border-slate-300 rounded-md p-2 text-sm" value={globalTaxRate} onChange={e => setGlobalTaxRate(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gratuity / Service Charge (%)</label>
                        <input type="number" className="w-full border border-slate-300 rounded-md p-2 text-sm" value={globalGratuity} onChange={e => setGlobalGratuity(e.target.value)} />
                      </div>
                      <button onClick={handleSaveGlobalVars} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 w-max">Save Changes</button>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'users' && canManageUsers && (
                  <div className="max-w-4xl space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-slate-900">User Management</h4>
                        <p className="text-sm text-slate-500">Manage verified team members and their permission roles.</p>
                      </div>
                      <button onClick={() => setIsAddUserModalOpen(true)} className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1.5">
                        <span>+</span> Add User
                      </button>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="p-3.5 font-semibold text-slate-700">Name</th>
                            <th className="p-3.5 font-semibold text-slate-700">Email</th>
                            <th className="p-3.5 font-semibold text-slate-700">Role</th>
                            <th className="p-3.5 font-semibold text-slate-700 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400">
                                No registered team members found. Click &quot;+ Add User&quot; above to invite members or have them sign up.
                              </td>
                            </tr>
                          ) : (
                            users.map(u => (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3.5 font-semibold text-slate-900">{u.name}</td>
                                <td className="p-3.5 text-slate-600 font-mono text-xs">{u.email || '—'}</td>
                                <td className="p-3.5">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    {u.role}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right space-x-3">
                                  <button onClick={() => handleEditUser(u)} className="text-blue-600 hover:text-blue-800 font-semibold text-xs transition-colors">
                                    Edit Role
                                  </button>
                                  {u.email?.toLowerCase() !== currentUserEmail.toLowerCase() && u.id !== session?.user?.id && (
                                    <button onClick={() => handleDeleteUser(u)} className="text-rose-600 hover:text-rose-800 font-semibold text-xs transition-colors">
                                      Remove
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'hotel' && canManageHotelDetails && (
                  <div className="max-w-2xl space-y-6">
                    <h4 className="text-lg font-medium text-slate-900">Hotel Details</h4>
                    <p className="text-sm text-slate-500">Master configuration for your property details.</p>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hotel Name</label>
                        <input type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm" value={hotelName} onChange={e => setHotelName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Main Phone</label>
                        <input type="tel" className="w-full border border-slate-300 rounded-md p-2 text-sm" value={hotelPhone} onChange={e => setHotelPhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Physical Address</label>
                        <textarea className="w-full border border-slate-300 rounded-md p-2 text-sm h-24" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)}></textarea>
                      </div>
                      <button onClick={handleSaveHotelDetails} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 w-max">Save Changes</button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
          </div>

          {/* Add User Modal */}
          {isAddUserModalOpen && (
            <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Add Team Member</h3>
                  <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                    &times;
                  </button>
                </div>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                      value={newUserEmail}
                      onChange={e => setNewUserEmail(e.target.value)}
                      placeholder="e.g. sjenkins@hotel.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value)}
                    >
                      <option value="Sales Agent">Sales Agent</option>
                      <option value="Sales Manager">Sales Manager</option>
                      <option value="Director of Sales">Director of Sales</option>
                      <option value="Front Desk Supervisor">Front Desk Supervisor</option>
                      <option value="General Manager">General Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Initial Password <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                      placeholder="Auto-generated if left blank"
                    />
                  </div>
                  <div className="flex gap-3 justify-end mt-6 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingUser}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isSubmittingUser ? 'Provisioning...' : 'Add & Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {isEditUserModalOpen && (
            <div className="fixed inset-0 z-[110] bg-slate-900/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Edit User</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm" value={editUserName} onChange={e => setEditUserName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <input type="text" list="roles-list" className="w-full border border-slate-300 rounded-md p-2 text-sm" value={editUserRole} onChange={e => setEditUserRole(e.target.value)} placeholder="e.g. Sales Manager" />
                  </div>
                  <div className="flex gap-3 justify-end mt-6">
                    <button onClick={() => setIsEditUserModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-md">Cancel</button>
                    <button onClick={handleSaveEditUser} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700">Save Changes</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 2: Create Lead Modal */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Create New Lead Record</h3>
              <button
                onClick={() => setIsNewLeadModalOpen(false)}
                className="text-slate-500 hover:text-white font-semibold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <form onSubmit={handleSaveLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Client Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Miller"
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Company / Group Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Miller Reunion"
                      value={formCompanyName}
                      onChange={(e) => setFormCompanyName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="guest@mail.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1-555-0123"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Check In Date</label>
                    <input
                      type="date"
                      required
                      value={formCheckIn}
                      onChange={(e) => setFormCheckIn(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Check Out Date</label>
                    <input
                      type="date"
                      required
                      value={formCheckOut}
                      onChange={(e) => setFormCheckOut(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Revenue Potential ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formRevenue}
                      onChange={(e) => setFormRevenue(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Lead Source</label>
                    <select
                      value={formLeadSource}
                      onChange={(e) => setFormLeadSource(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    >
                      <option value="OTA">OTA</option>
                      <option value="direct">Direct</option>
                      <option value="walk-in">Walk-in</option>
                      <option value="email">Email</option>
                      <option value="sales_call">Sales Call</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Assigned Sales Agent</label>
                    <select
                      value={formManager}
                      onChange={(e) => setFormManager(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Market Segment</label>
                    <select
                      value={formSegment}
                      onChange={(e) => setFormSegment(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    >
                      <option value="corporate">Corporate</option>
                      <option value="leisure">Leisure</option>
                      <option value="group">Group</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="proposal_sent">Proposal Sent</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>

                  {formStatus === 'lost' && (
                    <div>
                      <label className="block text-rose-600 font-bold mb-1">Reason Lost</label>
                      <select
                        value={formLostReason}
                        required
                        onChange={(e) => setFormLostReason(e.target.value)}
                        className="w-full bg-white border border-rose-300 rounded-lg p-2.5 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-800 font-medium"
                      >
                        <option value="">-- Select Reason --</option>
                        <option value="Rate Too High">Rate Too High</option>
                        <option value="Unavailable Dates">Unavailable Dates</option>
                        <option value="Space Too Small">Space Too Small</option>
                        <option value="Competitor">Competitor</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Event Room</label>
                      <select
                        value={formDetails}
                        onChange={(e) => {
                          setFormDetails(e.target.value);
                          if (e.target.value && !formEventRoomRate) {
                            setFormEventRoomRate('500');
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 font-medium"
                      >
                        <option value="">-- Select Event Room --</option>
                        <option value="Lincoln">Lincoln</option>
                        <option value="Alexander">Alexander</option>
                        <option value="Alexander 1">Alexander 1</option>
                        <option value="Alexander 2">Alexander 2</option>
                      </select>
                    </div>
                    {formDetails && (
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">
                          Room Rental Price ($)
                          {formEventRoomRate && !isNaN(Number(formEventRoomRate)) && (
                            <span className="ml-2 text-[11px] text-indigo-600 font-bold">
                              (+ ${(Number(formEventRoomRate) * 0.06).toFixed(2)} tax, ${(Number(formEventRoomRate) * 0.20).toFixed(2)} gratuity)
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formEventRoomRate}
                          onChange={(e) => setFormEventRoomRate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                          placeholder="e.g. 500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 space-y-3">
                    <label className="block text-slate-600 font-bold mb-1">Guest Rooms</label>
                    {formGuestRooms.map((room, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 relative bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-slate-500 font-semibold text-xs mb-1">Type</label>
                          <select
                            value={room.type}
                            onChange={(e) => {
                              const newRooms = [...formGuestRooms];
                              newRooms[index].type = e.target.value;
                              setFormGuestRooms(newRooms);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-semibold"
                          >
                            <option value="">-- None --</option>
                            <option value="TQNN">TQNN</option>
                            <option value="KSBN">KSBN</option>
                            <option value="KNGN">KNGN</option>
                            <option value="KACN">KACN</option>
                            <option value="KWLN">KWLN</option>
                            <option value="KWBN">KWBN</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 font-semibold text-xs mb-1">Count</label>
                          <input
                            type="number"
                            min="0"
                            value={room.count}
                            onChange={(e) => {
                              const newRooms = [...formGuestRooms];
                              newRooms[index].count = e.target.value;
                              setFormGuestRooms(newRooms);
                            }}
                            placeholder="e.g. 10"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-semibold text-xs mb-1">
                            Daily Rate ($)
                            {room.rate && !isNaN(Number(room.rate)) && (
                              <span className="ml-2 text-[11px] text-indigo-600 font-bold">
                                (+ ${(Number(room.rate) * 0.15).toFixed(2)} nightly tax)
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={room.rate}
                            onChange={(e) => {
                              const newRooms = [...formGuestRooms];
                              newRooms[index].rate = e.target.value;
                              setFormGuestRooms(newRooms);
                            }}
                            placeholder="e.g. 189"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newRooms = formGuestRooms.filter((_, i) => i !== index);
                            setFormGuestRooms(newRooms);
                          }}
                          className="absolute -top-2 -right-2 bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10"
                          title="Remove Room Type"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormGuestRooms([...formGuestRooms, { type: '', count: '', rate: '189' }])}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Room Block
                    </button>
                  </div>

                  {/* Accessories & Add-ons Block */}
                  <div className="col-span-2 space-y-3">
                    <label className="block text-slate-600 font-bold mb-1">Accessories & Add-ons</label>
                    {formAccessories.map((acc, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4 relative bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-slate-500 font-semibold text-xs mb-1">Accessory / Add-on Name</label>
                          <input
                            type="text"
                            value={acc.name}
                            onChange={(e) => {
                              const newAcc = [...formAccessories];
                              newAcc[index].name = e.target.value;
                              setFormAccessories(newAcc);
                            }}
                            placeholder="e.g. AV Package, Coffee Break, Audio System"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-semibold text-xs mb-1">Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={acc.price}
                            onChange={(e) => {
                              const newAcc = [...formAccessories];
                              newAcc[index].price = e.target.value;
                              setFormAccessories(newAcc);
                            }}
                            placeholder="e.g. 150"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newAcc = formAccessories.filter((_, i) => i !== index);
                            setFormAccessories(newAcc);
                          }}
                          className="absolute -top-2 -right-2 bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10"
                          title="Remove Accessory"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormAccessories([...formAccessories, { name: '', price: '' }])}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Accessory / Add-on
                    </button>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Additional Event Details</label>
                    <textarea
                      placeholder="e.g. Catering needs, setup requirements, special requests..."
                      value={formEventDetails}
                      onChange={(e) => setFormEventDetails(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 h-20"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Attach Document (Proposal/Contract)</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
                      {formDocumentUrl ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sky-400 font-bold shrink-0">📎</span>
                            <span className="text-slate-800 truncate font-medium">{formDocumentName || 'Attached Document'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormDocumentUrl('');
                              setFormDocumentName('');
                            }}
                            className="text-rose-400 hover:text-rose-300 font-semibold text-xs ml-2 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-[#27354E] hover:border-blue-500/50 rounded-lg cursor-pointer transition-all hover:bg-slate-100">
                            <span className="text-slate-500 font-medium text-xs">
                              {isUploading ? 'Uploading file...' : '📎 Select Proposal / Contract'}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              disabled={isUploading}
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsNewLeadModalOpen(false)}
                    className="flex-1 bg-[#1A212E] text-white py-2.5 rounded-lg border border-[#303650] hover:bg-[#222B3F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-2.5 rounded-lg hover:from-blue-500 hover:to-sky-500 transition-all shadow-md"
                  >
                    Create Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AI Email Draft & Review Panel */}
      {isAiModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-400" />
                <h3 className="font-bold text-slate-800 text-base">Review AI Generated Follow-Up</h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <span className="text-slate-600 font-bold block">Lead Context Target:</span>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-800">
                  <div>Guest: <strong>{selectedLead.name_company}</strong></div>
                  <div>Stay Dates: <strong>{selectedLead.check_in_date} to {selectedLead.check_out_date}</strong></div>
                </div>
              </div>

              {isGeneratingAi ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500">Groq Llama3 polishing follow-up draft...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-bold">Email Content (Editable):</span>
                    <span className="text-[10px] text-blue-500 font-semibold bg-blue-500/10 border border-blue-500/10 px-2 py-0.5 rounded">
                      Manual Override Safeguard Active
                    </span>
                  </div>
                  <textarea
                    value={aiDraft}
                    onChange={(e) => {
                      setAiDraft(e.target.value);
                      setEmailWasEdited(true);
                    }}
                    className="w-full h-72 bg-[#0B0F19] border border-slate-700 rounded-lg p-4 text-xs font-mono leading-relaxed text-[#E2E8F0] focus:border-[#1F3A60] outline-none resize-none"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="flex-1 bg-[#1A212E] text-white py-2.5 rounded-lg border border-[#303650] hover:bg-[#222B3F]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyEmail}
                  disabled={isGeneratingAi || isSendingEmail || !aiDraft}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-2.5 rounded-lg hover:from-blue-500 hover:to-sky-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>{isSendingEmail ? 'Copying...' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Quick Book Appointment Modal */}
      {isQuickBookingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">📅 Quick Book Appointment</h3>
              <button
                onClick={() => setIsQuickBookingOpen(false)}
                className="text-slate-500 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveQuickAppointment} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-bold block">Selected Date</label>
                <input
                  type="date"
                  min={todayStr}
                  value={quickBookDate}
                  onChange={(e) => setQuickBookDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold block">Time</label>
                  <input
                    type="text"
                    value={quickBookTime}
                    onChange={(e) => setQuickBookTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">Type</label>
                  <select
                    value={quickBookType}
                    onChange={(e) => setQuickBookType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                  >
                    <option value="Site Tour">📍 Site Tour</option>
                    <option value="Zoom Meeting">💻 Zoom Meeting</option>
                    <option value="Phone Call">📞 Phone Call</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold block">Client Name</label>
                <input
                  type="text"
                  value={quickBookClientName}
                  onChange={(e) => setQuickBookClientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block">Host Agent</label>
                <select
                  value={quickBookAgentId}
                  onChange={(e) => setQuickBookAgentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQuickBookingOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={apptSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {apptSaving ? 'Saving...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: View / Edit / Cancel Appointment Modal */}
      {activeAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">
                {isEditingAppointment ? '✏️ Edit Appointment' : '📅 Appointment Details'}
              </h3>
              <button
                onClick={() => setActiveAppointment(null)}
                className="text-slate-500 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {isEditingAppointment ? (
              <form onSubmit={handleUpdateAppointment} className="p-6 space-y-4 text-xs text-slate-700">
                <div className="space-y-1">
                  <label className="font-bold block">Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={editApptDate}
                    onChange={(e) => setEditApptDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold block">Time</label>
                    <input
                      type="text"
                      value={editApptTime}
                      onChange={(e) => setEditApptTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold block">Type</label>
                    <select
                      value={editApptType}
                      onChange={(e) => setEditApptType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                    >
                      <option value="Site Tour">📍 Site Tour</option>
                      <option value="Zoom Meeting">💻 Zoom Meeting</option>
                      <option value="Phone Call">📞 Phone Call</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">Host Agent</label>
                  <select
                    value={editApptAgentId}
                    onChange={(e) => setEditApptAgentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingAppointment(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={apptSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {apptSaving ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-6 text-xs text-slate-700">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Scheduled For:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {new Date(activeAppointment.appointment_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-500">Time:</span>
                    <span className="font-semibold text-slate-800">{activeAppointment.appointment_time}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-500">Type:</span>
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {activeAppointment.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-500">Client / Lead:</span>
                    <span className="font-semibold text-slate-800">{activeAppointment.leads?.name_company || 'Unknown Lead'}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-500">Host Agent:</span>
                    <span className="font-semibold text-slate-800">{activeAppointment.users?.name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingAppointment(true)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold border border-slate-200 transition-colors"
                  >
                    ✏️ Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAppointment(activeAppointment.id)}
                    className="flex-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 py-2 rounded-lg font-semibold transition-colors"
                  >
                    🚫 Cancel Meeting
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAppointment(null)}
                    className="px-4 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: Day Leads Summary Modal */}
      {isDayLeadsModalOpen && selectedCalendarDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span>📅</span>
                  <span>Leads for {formatDisplayDate(selectedCalendarDate)}</span>
                </h3>
                <p className="text-xs text-slate-500">{selectedDayLeads.length} lead(s) requested for this date</p>
              </div>
              <button
                onClick={() => setIsDayLeadsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
              {selectedDayLeads.map((dayLead) => {
                const bookingType = getLeadBookingType(dayLead.rooms_or_event_details);
                return (
                  <div
                    key={dayLead.id}
                    onClick={() => {
                      setIsDayLeadsModalOpen(false);
                      const fullLead = leads.find((l) => l.id === dayLead.id);
                      if (fullLead) {
                        setSelectedLead(fullLead);
                      }
                    }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer shadow-xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{dayLead.name_company}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bookingType.badgeClass}`}>
                        {bookingType.icon} {bookingType.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <div>
                        Status: <span className="font-semibold text-slate-700 capitalize">{dayLead.status.replace('_', ' ')}</span>
                      </div>
                      <div className="font-bold text-emerald-600">
                        ${parseFloat(dayLead.revenue || '0').toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: AI Proposal & Contract Modal */}
      {isProposalModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center no-print">
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <h3 className="font-bold text-slate-800 text-base">Group Contract Rooms Agreement</h3>
              </div>
              <button
                onClick={() => setIsProposalModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-white print-content" id="proposal-print-area">
              {isGeneratingProposal ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-xs">Compiling personalized agreement terms...</p>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: proposalHtml }} />
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-4 justify-between items-center no-print text-xs">
              <button
                type="button"
                onClick={() => {
                  const printContents = document.getElementById('proposal-print-area')?.innerHTML;
                  if (printContents) {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(`
                        <html>
                          <head>
                            <title>Group Rooms Agreement - ${selectedLead.name_company}</title>
                            <style>
                              body { font-family: 'Inter', sans-serif; padding: 40px; }
                              table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                              th, td { padding: 10px; border-bottom: 1px solid #E2E8F0; text-align: left; }
                              th { background-color: #F1F5F9 !important; -webkit-print-color-adjust: exact; }
                            </style>
                          </head>
                          <body onload="window.print(); window.close();">
                            ${printContents}
                          </body>
                        </html>
                      `);
                      win.document.close();
                    }
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg border border-slate-200 transition-colors"
              >
                🖨️ Print Agreement
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-2.5 rounded-lg border border-slate-200 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
