'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { TrendingUp, Briefcase, BarChart3, Calendar } from 'lucide-react';
import { Lead, User, FollowUp, Analytics, Template, HeatmapData } from '@/types/crm';
import {
  calculateLeadScore,
  parseRoomDetails,
  getPastWeekStartDate,
  getTodayDate,
  getCurrentMonthStartDate,
  getCurrentMonthEndDate,
  formatRoomDetailsDisplay,
  formatLocalDate,
  calculateEstimatedRevenue,
  getLeadBookingType
} from '@/lib/calculations';

// Common Components
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';

// Auth Screen
import { AuthScreen } from '@/components/auth/AuthScreen';

// Main Views
import { DashboardView } from '@/components/views/DashboardView';
import { KanbanView } from '@/components/views/KanbanView';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { CalendarView } from '@/components/views/CalendarView';

// Modals
import { SettingsModal } from '@/components/modals/SettingsModal';
import { CreateLeadModal } from '@/components/modals/CreateLeadModal';
import { LeadDetailModal } from '@/components/modals/LeadDetailModal';
import { AiEmailModal } from '@/components/modals/AiEmailModal';
import { QuickBookModal } from '@/components/modals/QuickBookModal';
import { AppointmentDetailModal } from '@/components/modals/AppointmentDetailModal';
import { DayLeadsModal } from '@/components/modals/DayLeadsModal';
import { ProposalModal } from '@/components/modals/ProposalModal';

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
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    // Check if recovery link was opened in URL
    if (typeof window !== 'undefined') {
      if (window.location.hash.includes('type=recovery') || window.location.href.includes('reset=true')) {
        setAuthMode('reset_password');
      }
    }



    // Safety timeout: max 1200ms to end auth loading state regardless of network/Supabase errors
    const timer = setTimeout(() => {
      if (active) setAuthLoading(false);
    }, 1200);

    // Attempt Supabase getSession
    supabase.auth
      .getSession()
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

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, supaSession) => {
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
  const fetcher = (url: string) =>
    fetch(url).then((res) => {
      if (!res.ok) throw new Error('Could not connect to database.');
      return res.json();
    });

  const { data: leadsData, error: leadsError, mutate: mutateLeads } = useSWR(session ? '/api/leads' : null, fetcher, {
    fallbackData: []
  });
  const { data: templatesData, mutate: mutateTemplates } = useSWR(session ? '/api/templates' : null, fetcher, {
    fallbackData: []
  });
  const { data: appData, mutate: mutateAppointments } = useSWR(session ? '/api/appointments' : null, fetcher, {
    fallbackData: { appointments: [] }
  });
  const { data: usersData, mutate: mutateUsers } = useSWR(session ? '/api/users' : null, fetcher, { fallbackData: [] });

  const leads: Lead[] = Array.isArray(leadsData) ? leadsData : [];
  const setLeads = (newLeads: any) => mutateLeads(newLeads, false);

  const templates: Template[] = Array.isArray(templatesData) ? templatesData : [];
  const liveAppointments: any[] = appData?.appointments || [];

  // Authorization Helpers
  const currentUserEmail = session?.user?.email || '';
  const emailLower = currentUserEmail.toLowerCase().trim();
  const isMuntaqim = emailLower === 'muntaqim@leadflow.com' || emailLower === 'muntaquime@gmail.com';
  const isRokeya = emailLower === 'rokeya@leadflow.com';
  const isRiham = emailLower === 'riham@leadflow.com';

  const defaultUserRole = isMuntaqim
    ? 'Front Desk Supervisor'
    : session?.user?.user_metadata?.role || 'Sales Agent';
  const defaultUserName =
    session?.user?.user_metadata?.name ||
    session?.user?.user_metadata?.full_name ||
    (isMuntaqim ? 'Muntaqim Elahi' : emailLower ? emailLower.split('@')[0] : 'User');

  const users: User[] =
    Array.isArray(usersData) && usersData.length > 0
      ? usersData
      : session?.user
      ? [{ id: session.user.id, name: defaultUserName, email: currentUserEmail, role: defaultUserRole }]
      : [];

  const currentUserObj = users.find(
    (u) => (u.email && u.email.toLowerCase().trim() === emailLower) || u.id === session?.user?.id
  );
  const currentUserRole = currentUserObj?.role || defaultUserRole;
  const currentUserName = currentUserObj?.name || defaultUserName;
  const currentUserTier = (currentUserObj as any)?.permission_tier || session?.user?.user_metadata?.permission_tier;

  const roleLower = currentUserRole.toLowerCase();
  const isGeneralManager = currentUserTier === 'admin' || roleLower.includes('general manager') || roleLower.includes('admin');
  const isFrontDeskSupervisor =
    roleLower.includes('front desk supervisor') ||
    roleLower.includes('supervisor') ||
    isMuntaqim;
  const isSalesAgent = roleLower.includes('agent') && !isGeneralManager && !isFrontDeskSupervisor;

  const canManageUsers = currentUserTier === 'admin' || isGeneralManager || isFrontDeskSupervisor || isMuntaqim;
  const canDeleteLeads = canManageUsers && !isRokeya && !isRiham && !isSalesAgent;
  const canManageHotelDetails = canManageUsers;

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  // Page level states
  const isLoading = session ? !leadsData && !leadsError : true;
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

  // Settings State
  const [roomTaxRate, setRoomTaxRate] = useState('15.0');
  const [eventTaxRate, setEventTaxRate] = useState('6.0');
  const [eventGratuityRate, setEventGratuityRate] = useState('20.0');

  const [hotelName, setHotelName] = useState('Hotel Flow Grand');
  const [hotelPhone, setHotelPhone] = useState('+1 (555) 123-4567');
  const [hotelAddress, setHotelAddress] = useState('123 Luxury Ave, New York, NY 10001');

  // Settings Email Template State
  const [selectedSettingsTemplateType, setSelectedSettingsTemplateType] = useState<string>('thank_you');
  const [editingTemplateContent, setEditingTemplateContent] = useState<string>('');
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);

  useEffect(() => {
    const t = templates.find((item) => item.template_type === selectedSettingsTemplateType);
    if (t) {
      setEditingTemplateContent(t.content || '');
    } else {
      if (selectedSettingsTemplateType === 'thank_you') {
        setEditingTemplateContent(
          `Dear {guest_name},\n\nThank you for reaching out regarding your upcoming stay with us from {check_in} to {check_out}.\n\nWe are delighted to assist with your booking and look forward to welcoming you to {hotel_name}.\n\nBest regards,\nSales & Guest Experience Team`
        );
      } else if (selectedSettingsTemplateType === 'follow_up_reminder') {
        setEditingTemplateContent(
          `Dear {guest_name},\n\nI wanted to follow up on the custom group proposal we prepared for your stay from {check_in} to {check_out}.\n\nPlease let us know if you have any questions or would like to secure the agreed dates.\n\nWarm regards,\nSales Team`
        );
      } else if (selectedSettingsTemplateType === 'gentle_reminder') {
        setEditingTemplateContent(
          `Hi {guest_name},\n\nJust checking in regarding your pending reservation for {check_in}.\n\nDates for this period are filling up fast, and we want to ensure we hold your preferred rates and rooms.\n\nBest,\nSales Team`
        );
      } else if (selectedSettingsTemplateType === 'booking_confirmation') {
        setEditingTemplateContent(
          `Dear {guest_name},\n\nWe are thrilled to confirm your booking at {hotel_name} from {check_in} to {check_out}!\n\nYour agreement details and schedule have been finalized. Please reach out if you need anything prior to arrival.\n\nWarm regards,\nFront Desk & Sales Team`
        );
      } else if (selectedSettingsTemplateType === 'feedback_request') {
        setEditingTemplateContent(
          `Dear {guest_name},\n\nThank you for considering {hotel_name} for your event from {check_in} to {check_out}.\n\nWe would love to know if there is anything we could have done differently to better suit your needs.\n\nSincerely,\nGuest Services`
        );
      }
    }
  }, [selectedSettingsTemplateType, templates]);

  const handleSaveSettingsTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: selectedSettingsTemplateType,
          content: editingTemplateContent
        })
      });
      if (!res.ok) throw new Error('Failed to save template');
      mutateTemplates();
      setSuccessMsg('Email template saved successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Lead Form State
  const [formClientName, setFormClientName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLeadSource, setFormLeadSource] = useState('email');
  const [formCheckIn, setFormCheckIn] = useState('');
  const [formCheckOut, setFormCheckOut] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formEventRoomRate, setFormEventRoomRate] = useState('500');
  const [formGuestRooms, setFormGuestRooms] = useState<Array<{ type: string; count: string; rate: string }>>([]);
  const [formAccessories, setFormAccessories] = useState<Array<{ name: string; price: string }>>([]);
  const [formEventDetails, setFormEventDetails] = useState('');
  const [formRevenue, setFormRevenue] = useState('0');
  const [formManager, setFormManager] = useState('');
  const [formStatus, setFormStatus] = useState('new');
  const [formSegment, setFormSegment] = useState('leisure');
  const [formDocumentUrl, setFormDocumentUrl] = useState('');
  const [formDocumentName, setFormDocumentName] = useState('');
  const [formLostReason, setFormLostReason] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (users.length > 0 && (!formManager || !users.some((u) => u.id === formManager))) {
      setFormManager(currentUserObj?.id || users[0]?.id || '');
    }
  }, [users, currentUserObj, formManager]);

  // Auto-calculate Revenue Potential dynamically when event room, rates, guest rooms, or dates change
  useEffect(() => {
    if (isNewLeadModalOpen || (selectedLead && isEditing)) {
      const calculated = calculateEstimatedRevenue(
        formCheckIn,
        formCheckOut,
        formDetails,
        formEventRoomRate,
        formGuestRooms,
        formAccessories
      );
      if (calculated > 0 || isNewLeadModalOpen) {
        setFormRevenue(calculated.toString());
      }
    }
  }, [formCheckIn, formCheckOut, formDetails, formEventRoomRate, formGuestRooms, formAccessories, isNewLeadModalOpen, isEditing]);

  // Proposal Modal State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [proposalHtml, setProposalHtml] = useState('');

  // AI Email Generator Modal State
  const [aiTemplateType, setAiTemplateType] = useState('thank_you');
  const [aiDraft, setAiDraft] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailWasEdited, setEmailWasEdited] = useState(false);
  const [aiDraftLogId, setAiDraftLogId] = useState<string | null>(null);

  // Lead Activities State
  const [leadActivities, setLeadActivities] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [activitySaving, setActivitySaving] = useState(false);
  const [leadDetailsTab, setLeadDetailsTab] = useState<'details' | 'timeline'>('details');

  // Quick Book & Appointment Modal State
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [quickBookDate, setQuickBookDate] = useState('');
  const [quickBookTime, setQuickBookTime] = useState('10:00');
  const [quickBookType, setQuickBookType] = useState('Site Tour');
  const [quickBookClientName, setQuickBookClientName] = useState('');
  const [quickBookGroupName, setQuickBookGroupName] = useState('');
  const [quickBookClientEmail, setQuickBookClientEmail] = useState('');
  const [quickBookClientPhone, setQuickBookClientPhone] = useState('');
  const [quickBookAgentId, setQuickBookAgentId] = useState('');
  const [apptSaving, setApptSaving] = useState(false);

  // Auto-populate email and phone if an existing group is selected
  useEffect(() => {
    if (quickBookGroupName && isQuickBookingOpen) {
      const existingLead = leads.find(
        (l) => l.name_company.toLowerCase() === quickBookGroupName.toLowerCase().trim()
      );
      if (existingLead) {
        if (existingLead.email) setQuickBookClientEmail(existingLead.email);
        if (existingLead.phone) setQuickBookClientPhone(existingLead.phone);
      }
    }
  }, [quickBookGroupName, leads, isQuickBookingOpen]);

  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editApptDate, setEditApptDate] = useState('');
  const [editApptTime, setEditApptTime] = useState('');
  const [editApptType, setEditApptType] = useState('Site Tour');
  const [editApptAgentId, setEditApptAgentId] = useState('1');

  // Schedule Appointment from Lead Modal State
  const [isSchedulingAppointment, setIsSchedulingAppointment] = useState(false);
  const [appointmentType, setAppointmentType] = useState('Site Tour');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [appointmentSaving, setAppointmentSaving] = useState(false);

  // Team Task State
  const [leadTasks, setLeadTasks] = useState<any[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskLeadId, setNewTaskLeadId] = useState('');
  const [taskLeadSearchTerm, setTaskLeadSearchTerm] = useState('');
  const [tasksFilter, setTasksFilter] = useState<'all' | 'mine'>('all');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const todayStr = useMemo(() => getTodayDate(), []);

  // Global Date Filter State
  const [dateFilterType, setDateFilterType] = useState<'created_at' | 'check_in'>('created_at');
  const getDefaultStartDate = () => (dateFilterType === 'created_at' ? getPastWeekStartDate() : getCurrentMonthStartDate());
  const getDefaultEndDate = () => (dateFilterType === 'created_at' ? getTodayDate() : getCurrentMonthEndDate());

  const [startDate, setStartDate] = useState(getPastWeekStartDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all');

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (dateFilterType) params.set('filterType', dateFilterType);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchData = async () => {
    try {
      mutateLeads();
      mutateTemplates();
      mutateAppointments();
      mutateUsers();
      fetchTasks();

      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (dateFilterType) params.set('filterType', dateFilterType);

      const [resAnalytics, resHeatmap, resFollowUps] = await Promise.all([
        fetch(`/api/analytics?${params.toString()}`),
        fetch('/api/demand/heatmap'),
        fetch('/api/demand/follow-ups')
      ]);

      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());
      if (resHeatmap.ok) setHeatmap(await resHeatmap.json());
      if (resFollowUps.ok) {
        const fuData = await resFollowUps.json();
        setFollowUps(fuData.followUps || []);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setLeadTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newTaskDescription,
          assigned_to: newTaskAssignee || null,
          due_date: newTaskDueDate || null,
          lead_id: newTaskLeadId || null
        })
      });

      if (!res.ok) throw new Error('Failed to create task');

      const data = await res.json();
      setLeadTasks((prev) => [data.task, ...prev]);
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
      setLeadTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update task');
    } catch (err: any) {
      console.error(err);
      setLeadTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t)));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setLeadTasks((prev) => prev.filter((t) => t.id !== taskId));
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err: any) {
      console.error(err);
      fetchTasks();
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAnalytics();
    }
  }, [session, startDate, endDate, dateFilterType, leadsData]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      let sessionData: any = null;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail.trim(), password: authPassword })
        });
        const data = await res.json();
        if (res.ok && data.session) {
          sessionData = data.session;
        } else if (!res.ok) {
          throw new Error(data.error || 'Invalid credentials');
        }
      } catch (serverErr: any) {
        console.warn('Server login failed, trying direct Supabase client sign-in:', serverErr.message);
        const { data: supaLoginData, error: supaLoginErr } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword
        });
        if (supaLoginErr) throw supaLoginErr;
        sessionData = supaLoginData.session;
      }

      if (sessionData) {
        setSession(sessionData);

        setSuccessMsg('Logged in successfully!');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
          name: authName.trim(),
          role: 'Sales Agent'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      if (data.session) {
        setSession(data.session);

        setSuccessMsg('Account created successfully! Welcome to Leadflow.');
      } else {
        setSuccessMsg('Registration successful! You can now log in.');
        setAuthMode('signin');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setSuccessMsg('If an account exists with this email, a password reset link has been sent.');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to request password reset.');
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
      setSuccessMsg('Password updated successfully! You can now log in.');
      setAuthMode('signin');
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to update password.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout API error', e);
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {}

    setSession(null);
    setAnalytics(null);
    setHeatmap(null);
  };

  // Auto-hide success and error notification banners
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
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

      const status = selectedLead.status;
      if (status === 'new') setAiTemplateType('thank_you');
      else if (status === 'proposal_sent') setAiTemplateType('follow_up_reminder');
      else if (status === 'negotiation') setAiTemplateType('gentle_reminder');
      else if (status === 'confirmed') setAiTemplateType('booking_confirmation');
      else if (status === 'lost') setAiTemplateType('feedback_request');
      else setAiTemplateType('thank_you');

      // Fetch activities for the selected lead
      fetch(`/api/leads/${selectedLead.id}/activities`)
        .then(res => res.json())
        .then(data => {
          if (data.activities) {
            setLeadActivities(data.activities);
          } else {
            setLeadActivities([]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch lead activities:', err);
          setLeadActivities([]);
        });
    } else {
      setLeadActivities([]);
    }
  }, [selectedLead]);

  // Lead CRUD Actions
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const combinedName = formClientName.trim() + (formCompanyName.trim() ? ` / ${formCompanyName.trim()}` : '');
    const isCreating = !selectedLead || !isEditing;
    const finalStatus = isCreating ? 'new' : formStatus;

    const validManager = users.find((u) => u.id === formManager)?.id || currentUserObj?.id || users[0]?.id || null;

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
      revenue_potential: parseFloat(formRevenue) || 0,
      assigned_sales_manager_id: validManager,
      status: finalStatus,
      market_segment: formSegment,
      document_url: formDocumentUrl,
      document_name: formDocumentName,
      lost_reason: finalStatus === 'lost' ? formLostReason : null
    };

    try {
      if (selectedLead && isEditing) {
        const res = await fetch(`/api/leads/${selectedLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to update lead');
        const savedLead = data.lead || data;
        setLeads(leads.map((l) => (l.id === selectedLead.id ? savedLead : l)));
        setSelectedLead(savedLead);
        setIsEditing(false);
        setSuccessMsg('Lead updated successfully!');
      } else {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to create lead');
        const newLead = data.lead || data;
        setLeads([...leads, newLead]);
        setIsNewLeadModalOpen(false);
        resetLeadForm();
        setSuccessMsg('New lead created successfully!');
      }
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving lead');
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string, lostReason?: string) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus, lost_reason: lostReason || l.lost_reason } : l)));

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...targetLead,
          status: newStatus,
          lost_reason: lostReason || targetLead.lost_reason
        })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchData();
    } catch (err: any) {
      setErrorMsg('Could not update status.');
      fetchData();
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!canDeleteLeads) {
      setErrorMsg('You do not have permission to delete leads. Only General Managers and Supervisors can delete records.');
      return;
    }

    if (!confirm('Are you sure you want to delete this lead record permanently?')) return;

    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete lead');
      }
      setLeads(leads.filter((l) => l.id !== id));
      setSelectedLead(null);
      setSuccessMsg('Lead record deleted successfully.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting lead.');
    }
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setAppointmentSaving(true);

    try {
      const targetAgentId = selectedLead.assigned_sales_manager_id || currentUserObj?.id || users[0]?.id || null;

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          agent_id: targetAgentId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          type: appointmentType
        })
      });

      if (!res.ok) throw new Error('Failed to schedule appointment');

      setSuccessMsg('Appointment scheduled successfully!');
      setIsSchedulingAppointment(false);
      mutateAppointments();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save appointment.');
    } finally {
      setAppointmentSaving(false);
    }
  };

  const handleSaveQuickAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setApptSaving(true);

    try {
      const targetAgentId = quickBookAgentId || currentUserObj?.id || users[0]?.id || null;

      const targetNameCompany = quickBookGroupName.trim() || quickBookClientName.trim() || 'Quick Book Client';
      const existingLead = leads.find(
        (l) => l.name_company.toLowerCase() === targetNameCompany.toLowerCase()
      );

      let targetLeadId = existingLead?.id;

      // Create a new lead if no existing lead is found
      if (!targetLeadId) {
        const leadRes = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name_company: targetNameCompany,
            email: quickBookClientEmail || 'quickbook@example.com',
            phone: quickBookClientPhone || '',
            rooms_or_event_details: `Client Name: ${quickBookClientName}`,
            lead_source: 'sales_call',
            check_in_date: quickBookDate,
            check_out_date: quickBookDate,
            assigned_sales_manager_id: targetAgentId,
            status: 'new',
            market_segment: 'corporate'
          })
        });

        if (!leadRes.ok) throw new Error('Failed to create contact for appointment');
        const leadData = await leadRes.json();
        targetLeadId = leadData.lead?.id || leadData.id;
      }

      // Format time from 24h (HH:mm) to 12h (hh:mm A) for consistency
      let formattedTime = quickBookTime;
      if (quickBookTime && quickBookTime.includes(':')) {
        const [h, m] = quickBookTime.split(':');
        let hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        formattedTime = `${hour}:${m} ${ampm}`;
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: targetLeadId,
          agent_id: targetAgentId,
          appointment_date: quickBookDate,
          appointment_time: formattedTime,
          type: quickBookType
        })
      });

      if (!res.ok) throw new Error('Failed to save appointment');

      setSuccessMsg('Appointment scheduled successfully!');
      setIsQuickBookingOpen(false);
      setQuickBookClientName('');
      setQuickBookGroupName('');
      setQuickBookClientEmail('');
      setQuickBookClientPhone('');
      mutateAppointments();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not schedule appointment.');
    } finally {
      setApptSaving(false);
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment) return;
    setApptSaving(true);

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

      setSuccessMsg('Appointment updated successfully!');
      setActiveAppointment(null);
      setIsEditingAppointment(false);
      mutateAppointments();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update appointment.');
    } finally {
      setApptSaving(false);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel appointment');
      setSuccessMsg('Appointment cancelled.');
      setActiveAppointment(null);
      mutateAppointments();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not cancel appointment.');
    }
  };

  const handleGenerateProposalContract = () => {
    if (!selectedLead) return;
    setIsGeneratingProposal(true);

    const escapeHtml = (unsafe: string) => {
      if (!unsafe) return '';
      return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    setTimeout(() => {
      const parsed = parseRoomDetails(selectedLead.rooms_or_event_details);
      const checkInDate = new Date(selectedLead.check_in_date);
      const checkOutDate = new Date(selectedLead.check_out_date);
      const nights = Math.ceil(Math.abs(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

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
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(r.type)} Block</td>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${count} Rooms</td>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">
                $${rate.toFixed(2)}<br>
                <span style="font-size: 11px; color: #64748B;">+$${(rate * 0.15).toFixed(2)} tax (15%)</span>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold;">$${rev.toLocaleString(undefined, {
                minimumFractionDigits: 2
              })}</td>
            </tr>
          `;
        });
      } else {
        guestRoomsHtml = `<tr><td colspan="4" style="padding: 15px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #64748B;">No guest room blocks requested.</td></tr>`;
      }

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
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold;">📍 ${escapeHtml(parsed.eventRoom)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(parsed.eventDetails) || 'Meeting / Setup Details'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">$${eventRate.toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2 }
                )}</td>
              </tr>
            </tbody>
          </table>
        `;
      }

      let accessoriesHtml = '';
      let totalAccessories = 0;
      if (parsed.accessories && parsed.accessories.length > 0) {
        let rows = '';
        parsed.accessories.forEach((a: any) => {
          const price = parseFloat(a.price) || 0;
          totalAccessories += price;
          rows += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">✨ ${escapeHtml(a.name)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">$${price.toLocaleString(
                undefined,
                { minimumFractionDigits: 2 }
              )}</td>
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

      const roomTaxPct = parseFloat(roomTaxRate) || 15;
      const eventTaxPct = parseFloat(eventTaxRate) || 6;
      const eventGratuityPct = parseFloat(eventGratuityRate) || 20;

      const guestRoomsTax = totalRoomsRev * (roomTaxPct / 100);
      const eventTax = eventRate * (eventTaxPct / 100);
      const eventGratuity = eventRate * (eventGratuityPct / 100);
      const grandTotal = totalRoomsRev + guestRoomsTax + eventRate + eventTax + eventGratuity + totalAccessories;

      const html = `
        <div style="font-family: 'Inter', sans-serif; color: #1E293B; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #1E3A8A; margin: 0; font-size: 24px;">${escapeHtml(hotelName.toUpperCase())}</h1>
            <p style="color: #64748B; margin: 5px 0 0 0; font-size: 14px;">Group Rooms & Event Agreement</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px;">
            <div>
              <strong style="color: #0F172A; display: block; margin-bottom: 5px;">ORGANIZATION / GROUP DETAILS:</strong>
              <strong>Group Name:</strong> ${escapeHtml(selectedLead.name_company)}<br>
              <strong>Contact Email:</strong> ${escapeHtml(selectedLead.email)}<br>
              <strong>Contact Phone:</strong> ${escapeHtml(selectedLead.phone || 'N/A')}<br>
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
                <td style="text-align: right; font-weight: bold; color: #1E293B;">$${totalRoomsRev.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}</td>
              </tr>
              <tr>
                <td style="color: #475569;">Guest Room Occupancy Taxes (${roomTaxPct}%):</td>
                <td style="text-align: right; font-weight: bold; color: #E11D48;">$${guestRoomsTax.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}</td>
              </tr>
              ${
                parsed.eventRoom
                  ? `
              <tr>
                <td style="color: #475569;">Event Space Rental:</td>
                <td style="text-align: right; font-weight: bold; color: #1E293B;">$${eventRate.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}</td>
              </tr>
              <tr>
                <td style="color: #475569;">Event Space Tax (${eventTaxPct}%):</td>
                <td style="text-align: right; font-weight: bold; color: #E11D48;">$${eventTax.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}</td>
              </tr>
              <tr>
                <td style="color: #475569;">Event Space Gratuity & Service Charge (${eventGratuityPct}%):</td>
                <td style="text-align: right; font-weight: bold; color: #E11D48;">$${eventGratuity.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}</td>
              </tr>`
                  : ''
              }
              ${
                parsed.accessories && parsed.accessories.length > 0
                  ? `
              <tr>
                <td style="color: #475569;">Accessories & Services:</td>
                <td style="text-align: right; font-weight: bold; color: #1E293B;">$${totalAccessories.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}</td>
              </tr>`
                  : ''
              }
              <tr style="border-top: 2px solid #E2E8F0;">
                <td style="padding-top: 10px; font-size: 14px; font-weight: bold; color: #1E3A8A;">ESTIMATED TOTAL CONTRACT VALUE:</td>
                <td style="padding-top: 10px; text-align: right; font-size: 18px; font-weight: 900; color: #10B981;">$${grandTotal.toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2 }
                )}</td>
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
                <div style="border-bottom: 1px solid #94A3B8; height: 40px; margin-bottom: 5px; position: relative;"></div>
                <strong>Authorized Client Signature (Guest)</strong>
                <div style="font-size: 11px; color: #64748B;">Date: ________________________</div>
              </div>
              <div>
                <div style="border-bottom: 1px solid #94A3B8; height: 40px; margin-bottom: 5px; position: relative;">
                  <span style="font-family: 'Dancing Script', cursive; font-size: 24px; color: #0F172A; position: absolute; bottom: 2px; font-style: italic; white-space: nowrap;">
                    ${(() => {
                      const fullName = session?.user?.user_metadata?.full_name;
                      const assignedUser = users.find((u: any) => u.id === selectedLead.assigned_sales_manager_id);
                      if (fullName) return escapeHtml(fullName);
                      if (assignedUser) return escapeHtml(assignedUser.name);
                      const emailName = session?.user?.email?.split('@')[0] || 'Sales Agent';
                      return escapeHtml(emailName.charAt(0).toUpperCase() + emailName.slice(1));
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
    setFormManager(currentUserObj?.id || users[0]?.id || '');
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
        body: formData
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
    const downloadUrl = `${window.location.origin}/api/leads/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(
      filename || 'document'
    )}`;
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
          templateType: aiTemplateType
        })
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
    if (!aiDraft) return;
    setIsSendingEmail(true);
    try {
      await navigator.clipboard.writeText(aiDraft);
      setSuccessMsg('Email draft copied to clipboard!');
      setIsAiModalOpen(false);

      if (aiDraftLogId && selectedLead) {
        fetch('/api/email/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logId: aiDraftLogId,
            leadId: selectedLead.id,
            action: 'copied_to_clipboard',
            finalContent: aiDraft,
            wasEdited: emailWasEdited
          })
        }).catch((e) => console.error('Email log update error', e));
      }
    } catch (err) {
      setErrorMsg('Failed to copy to clipboard.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSaveActivityNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNoteText.trim()) return;

    setActivitySaving(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newNoteText.trim(),
          activity_type: 'note',
          performed_by: session?.user?.email || 'User'
        })
      });

      if (!res.ok) throw new Error('Failed to save activity note');

      const data = await res.json();
      setLeadActivities([data.activity, ...leadActivities]);
      setNewNoteText('');
      setSuccessMsg('Activity note added!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save note.');
    } finally {
      setActivitySaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Filter leads based on selected global date range
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      let targetDateStr = '';
      if (dateFilterType === 'created_at') {
        if (lead.created_at) {
          targetDateStr = formatLocalDate(new Date(lead.created_at));
        }
      } else {
        targetDateStr = lead.check_in_date || '';
      }

      if (!targetDateStr) return false;
      if (startDate && targetDateStr < startDate) return false;
      if (endDate && targetDateStr > endDate) return false;

      if (bookingTypeFilter !== 'all') {
        const bookingType = getLeadBookingType(lead.rooms_or_event_details);
        if (bookingType.type !== bookingTypeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [leads, dateFilterType, startDate, endDate, bookingTypeFilter]);

  const activeLeads = useMemo(() => {
    return filteredLeads.filter((l) => l.status !== 'confirmed' && l.status !== 'lost');
  }, [filteredLeads]);

  const allActiveLeadsForSearch = useMemo(() => {
    return leads.filter((l) => l.status !== 'confirmed' && l.status !== 'lost');
  }, [leads]);

  const loggedInUserId = useMemo(() => {
    if (!session?.user?.email) return null;
    const user = users.find((u) => u.email === session.user?.email);
    return user ? user.id : null;
  }, [session, users]);

  const filteredTeamTasks = useMemo(() => {
    let filtered = leadTasks;
    if (tasksFilter === 'mine' && loggedInUserId) {
      filtered = filtered.filter((t) => t.assigned_to === loggedInUserId);
    }
    if (!showCompletedTasks) {
      filtered = filtered.filter((t) => t.status !== 'completed');
    }
    return filtered;
  }, [leadTasks, tasksFilter, showCompletedTasks, loggedInUserId]);

  // Segment, Revenue and Pipeline values computed from /api/analytics
  const corporateCount = analytics?.corporateCount ?? analytics?.segmentCounts?.corporate ?? 0;
  const leisureCount = analytics?.leisureCount ?? analytics?.segmentCounts?.leisure ?? 0;
  const groupCount = analytics?.groupCount ?? analytics?.segmentCounts?.group ?? 0;

  const corporatePct = analytics?.corporatePct ?? 0;
  const leisurePct = analytics?.leisurePct ?? 0;
  const groupPct = analytics?.groupPct ?? 0;

  const pieConicGradient = `conic-gradient(
    #3B82F6 0% ${corporatePct}%, 
    #10B981 ${corporatePct}% ${corporatePct + leisurePct}%, 
    #6366F1 ${corporatePct + leisurePct}% 100%
  )`;

  const confirmedRevBySegment = analytics?.confirmedRevBySegment ?? { corporate: 0, leisure: 0, group: 0 };
  const totalConfirmedRev = analytics?.totalConfirmedRev ?? analytics?.summary?.revenueGenerated ?? 0;

  const pipelineValueByStage = analytics?.pipelineValueByStage ?? {
    new: 0,
    contacted: 0,
    proposal_sent: 0,
    negotiation: 0,
    confirmed: 0,
    lost: 0
  };
  const totalActivePipelineValue = analytics?.totalActivePipelineValue ?? analytics?.summary?.potentialRevenue ?? 0;

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const statsPayload = {
        totalPipelineValue: totalActivePipelineValue,
        totalLeads: analytics?.summary?.totalLeads ?? filteredLeads.length,
        confirmedLeads: analytics?.summary?.convertedLeads ?? 0,
        conversionRate: analytics?.summary?.conversionRate ?? 0,
        confirmedRevBySegment,
        pipelineValueByStage,
        corporateCount,
        leisureCount,
        groupCount
      };

      const res = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: statsPayload })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate insights');
      }

      setAiInsights(data.insights || 'No insights generated.');
      setSuccessMsg('AI Weekly Executive Insights generated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not generate weekly insights.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      setErrorMsg('No leads available to export.');
      return;
    }
    const headers = [
      'Lead / Company',
      'Email',
      'Phone',
      'Status',
      'Segment',
      'Est. Revenue',
      'Check In',
      'Check Out',
      'Rooms / Event Details',
      'Source'
    ];
    const rows = filteredLeads.map((l) => [
      `"${(l.name_company || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.status || '').replace(/"/g, '""')}"`,
      `"${(l.market_segment || '').replace(/"/g, '""')}"`,
      l.revenue_potential || '0',
      l.check_in_date || '',
      l.check_out_date || '',
      `"${(l.rooms_or_event_details || '').replace(/"/g, '""')}"`,
      `"${(l.lead_source || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leadflow-pipeline-report-${getTodayDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg('Pipeline CSV report downloaded successfully!');
  };

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
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authName={authName}
        setAuthName={setAuthName}
        authError={authError}
        setAuthError={setAuthError}
        successMsg={successMsg}
        setSuccessMsg={setSuccessMsg}
        authSubmitting={authSubmitting}
        handleSignIn={handleSignIn}
        handleSignUp={handleSignUp}
        handleForgotPassword={handleForgotPassword}
        handleResetPassword={handleResetPassword}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC] relative">
        <Header
          activeTab={activeTab}
          fetchData={fetchData}
          dateFilterType={dateFilterType}
          setDateFilterType={setDateFilterType}
          bookingTypeFilter={bookingTypeFilter}
          setBookingTypeFilter={setBookingTypeFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          todayStr={todayStr}
          getDefaultStartDate={getDefaultStartDate}
          getDefaultEndDate={getDefaultEndDate}
          getPastWeekStartDate={getPastWeekStartDate}
          getTodayDate={getTodayDate}
          getCurrentMonthStartDate={getCurrentMonthStartDate}
          getCurrentMonthEndDate={getCurrentMonthEndDate}
          onAddLead={() => {
            resetLeadForm();
            setIsEditing(false);
            setIsNewLeadModalOpen(true);
          }}
        />

        {/* View Inner Panel */}
        <div
          className={`flex-1 flex flex-col min-h-0 bg-[#F8FAFC] ${
            activeTab === 'heatmap' ? 'overflow-hidden p-8' : 'overflow-y-auto p-8'
          }`}
        >
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm font-medium">Loading database records...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  startDate={startDate}
                  endDate={endDate}
                  filteredLeads={filteredLeads}
                  analytics={analytics}
                  filteredTeamTasks={filteredTeamTasks}
                  tasksFilter={tasksFilter}
                  setTasksFilter={setTasksFilter}
                  showCompletedTasks={showCompletedTasks}
                  setShowCompletedTasks={setShowCompletedTasks}
                  handleCreateTask={handleCreateTask}
                  newTaskDescription={newTaskDescription}
                  setNewTaskDescription={setNewTaskDescription}
                  newTaskDueDate={newTaskDueDate}
                  setNewTaskDueDate={setNewTaskDueDate}
                  newTaskAssignee={newTaskAssignee}
                  setNewTaskAssignee={setNewTaskAssignee}
                  users={users}
                  taskLeadSearchTerm={taskLeadSearchTerm}
                  setTaskLeadSearchTerm={setTaskLeadSearchTerm}
                  newTaskLeadId={newTaskLeadId}
                  setNewTaskLeadId={setNewTaskLeadId}
                  allActiveLeadsForSearch={allActiveLeadsForSearch}
                  leads={leads}
                  activeLeads={activeLeads}
                  setSelectedLead={setSelectedLead}
                  handleToggleTaskStatus={handleToggleTaskStatus}
                  handleDeleteTask={handleDeleteTask}
                  isFetchingTasks={false}
                  formatRoomDetailsDisplay={formatRoomDetailsDisplay}
                  heatmap={heatmap}
                  liveAppointments={liveAppointments}
                  setActiveAppointment={setActiveAppointment}
                  onScheduleAppointment={() => {
                    setQuickBookDate(todayStr);
                    setIsQuickBookingOpen(true);
                  }}
                />
              )}

              {activeTab === 'kanban' && (
                <KanbanView
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  filteredLeads={filteredLeads}
                  handleUpdateStatus={handleUpdateStatus}
                  setSelectedLead={setSelectedLead}
                  formatRoomDetailsDisplay={formatRoomDetailsDisplay}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  contentRef={contentRef}
                  handleGenerateInsights={handleGenerateInsights}
                  isGeneratingInsights={isGeneratingInsights}
                  analytics={analytics}
                  aiInsights={aiInsights}
                  handleDownloadCSV={handleDownloadCSV}
                  filteredLeads={filteredLeads}
                  pieConicGradient={pieConicGradient}
                  corporateCount={corporateCount}
                  corporatePct={corporatePct}
                  leisureCount={leisureCount}
                  leisurePct={leisurePct}
                  groupCount={groupCount}
                  groupPct={groupPct}
                  getInitials={getInitials}
                  totalConfirmedRev={totalConfirmedRev}
                  confirmedRevBySegment={confirmedRevBySegment}
                  totalActivePipelineValue={totalActivePipelineValue}
                  pipelineValueByStage={pipelineValueByStage}
                />
              )}

              {activeTab === 'heatmap' && (
                <CalendarView
                  calendarViewMode={calendarViewMode}
                  setCalendarViewMode={setCalendarViewMode}
                  heatmap={heatmap}
                  liveAppointments={liveAppointments}
                  leads={leads}
                  todayStr={todayStr}
                  setSelectedLead={setSelectedLead}
                  setSelectedDayLeads={setSelectedDayLeads}
                  setSelectedCalendarDate={setSelectedCalendarDate}
                  setIsDayLeadsModalOpen={setIsDayLeadsModalOpen}
                  resetLeadForm={resetLeadForm}
                  setFormCheckIn={setFormCheckIn}
                  setIsNewLeadModalOpen={setIsNewLeadModalOpen}
                  setQuickBookDate={setQuickBookDate}
                  setIsQuickBookingOpen={setIsQuickBookingOpen}
                  setActiveAppointment={setActiveAppointment}
                  setEditApptDate={setEditApptDate}
                  setEditApptTime={setEditApptTime}
                  setEditApptType={setEditApptType}
                  setEditApptAgentId={setEditApptAgentId}
                  setIsEditingAppointment={setIsEditingAppointment}
                />
              )}
            </>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden flex items-center justify-around bg-white border-t border-slate-200 p-2 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center p-2 rounded-lg ${
              activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <TrendingUp className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex flex-col items-center p-2 rounded-lg ${
              activeTab === 'kanban' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Briefcase className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Leads</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center p-2 rounded-lg ${
              activeTab === 'analytics' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex flex-col items-center p-2 rounded-lg ${
              activeTab === 'heatmap' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Calendar</span>
          </button>
        </div>
      </main>

      {/* MODALS */}
      <LeadDetailModal
        selectedLead={selectedLead}
        setSelectedLead={setSelectedLead}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        leadDetailsTab={leadDetailsTab}
        setLeadDetailsTab={setLeadDetailsTab}
        users={users}
        canDeleteLeads={canDeleteLeads}
        formClientName={formClientName}
        setFormClientName={setFormClientName}
        formCompanyName={formCompanyName}
        setFormCompanyName={setFormCompanyName}
        formEmail={formEmail}
        setFormEmail={setFormEmail}
        formPhone={formPhone}
        setFormPhone={setFormPhone}
        formCheckIn={formCheckIn}
        setFormCheckIn={setFormCheckIn}
        formCheckOut={formCheckOut}
        setFormCheckOut={setFormCheckOut}
        formRevenue={formRevenue}
        setFormRevenue={setFormRevenue}
        formLeadSource={formLeadSource}
        setFormLeadSource={setFormLeadSource}
        formManager={formManager}
        setFormManager={setFormManager}
        formSegment={formSegment}
        setFormSegment={setFormSegment}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        formLostReason={formLostReason}
        setFormLostReason={setFormLostReason}
        formDetails={formDetails}
        setFormDetails={setFormDetails}
        formEventRoomRate={formEventRoomRate}
        setFormEventRoomRate={setFormEventRoomRate}
        formGuestRooms={formGuestRooms}
        setFormGuestRooms={setFormGuestRooms}
        formAccessories={formAccessories}
        setFormAccessories={setFormAccessories}
        formEventDetails={formEventDetails}
        setFormEventDetails={setFormEventDetails}
        formDocumentUrl={formDocumentUrl}
        setFormDocumentUrl={setFormDocumentUrl}
        formDocumentName={formDocumentName}
        setFormDocumentName={setFormDocumentName}
        isUploading={isUploading}
        handleFileChange={handleFileChange}
        handleSaveLead={handleSaveLead}
        formatRoomDetailsDisplay={formatRoomDetailsDisplay}
        handleDownloadFile={handleDownloadFile}
        isSchedulingAppointment={isSchedulingAppointment}
        setIsSchedulingAppointment={setIsSchedulingAppointment}
        handleSaveAppointment={handleSaveAppointment}
        appointmentType={appointmentType}
        setAppointmentType={setAppointmentType}
        appointmentDate={appointmentDate}
        setAppointmentDate={setAppointmentDate}
        appointmentTime={appointmentTime}
        setAppointmentTime={setAppointmentTime}
        appointmentSaving={appointmentSaving}
        todayStr={todayStr}
        aiTemplateType={aiTemplateType}
        setAiTemplateType={setAiTemplateType}
        setIsAiModalOpen={setIsAiModalOpen}
        handleGenerateAiEmail={handleGenerateAiEmail}
        newNoteText={newNoteText}
        setNewNoteText={setNewNoteText}
        handleSaveActivityNote={handleSaveActivityNote}
        activitySaving={activitySaving}
        leadActivities={leadActivities}
        handleDeleteLead={handleDeleteLead}
      />

      <CreateLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        users={users}
        formClientName={formClientName}
        setFormClientName={setFormClientName}
        formCompanyName={formCompanyName}
        setFormCompanyName={setFormCompanyName}
        formEmail={formEmail}
        setFormEmail={setFormEmail}
        formPhone={formPhone}
        setFormPhone={setFormPhone}
        formCheckIn={formCheckIn}
        setFormCheckIn={setFormCheckIn}
        formCheckOut={formCheckOut}
        setFormCheckOut={setFormCheckOut}
        formRevenue={formRevenue}
        setFormRevenue={setFormRevenue}
        formLeadSource={formLeadSource}
        setFormLeadSource={setFormLeadSource}
        formManager={formManager}
        setFormManager={setFormManager}
        formSegment={formSegment}
        setFormSegment={setFormSegment}
        formDetails={formDetails}
        setFormDetails={setFormDetails}
        formEventRoomRate={formEventRoomRate}
        setFormEventRoomRate={setFormEventRoomRate}
        formGuestRooms={formGuestRooms}
        setFormGuestRooms={setFormGuestRooms}
        formAccessories={formAccessories}
        setFormAccessories={setFormAccessories}
        formEventDetails={formEventDetails}
        setFormEventDetails={setFormEventDetails}
        formDocumentUrl={formDocumentUrl}
        setFormDocumentUrl={setFormDocumentUrl}
        formDocumentName={formDocumentName}
        setFormDocumentName={setFormDocumentName}
        isUploading={isUploading}
        handleFileChange={handleFileChange}
        handleSaveLead={handleSaveLead}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        users={users}
        leads={leads}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName}
        canManageUsers={canManageUsers}
        canManageHotelDetails={canManageHotelDetails}
        roomTaxRate={roomTaxRate}
        setRoomTaxRate={setRoomTaxRate}
        eventTaxRate={eventTaxRate}
        setEventTaxRate={setEventTaxRate}
        eventGratuityRate={eventGratuityRate}
        setEventGratuityRate={setEventGratuityRate}
        hotelName={hotelName}
        setHotelName={setHotelName}
        hotelPhone={hotelPhone}
        setHotelPhone={setHotelPhone}
        hotelAddress={hotelAddress}
        setHotelAddress={setHotelAddress}
        templates={templates}
        selectedTemplateType={selectedSettingsTemplateType}
        setSelectedTemplateType={setSelectedSettingsTemplateType}
        templateContent={editingTemplateContent}
        setTemplateContent={setEditingTemplateContent}
        handleSaveTemplate={handleSaveSettingsTemplate}
        isSavingTemplate={isSavingTemplate}
        onRefreshUsers={mutateUsers}
        onShowSuccess={(msg) => setSuccessMsg(msg)}
        onShowError={(msg) => setErrorMsg(msg)}
      />

      <AiEmailModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        selectedLead={selectedLead}
        isGeneratingAi={isGeneratingAi}
        aiDraft={aiDraft}
        setAiDraft={setAiDraft}
        setEmailWasEdited={setEmailWasEdited}
        handleCopyEmail={handleCopyEmail}
        isSendingEmail={isSendingEmail}
      />

      <QuickBookModal
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
        quickBookDate={quickBookDate}
        setQuickBookDate={setQuickBookDate}
        quickBookTime={quickBookTime}
        setQuickBookTime={setQuickBookTime}
        quickBookType={quickBookType}
        setQuickBookType={setQuickBookType}
        quickBookClientName={quickBookClientName}
        setQuickBookClientName={setQuickBookClientName}
        quickBookGroupName={quickBookGroupName}
        setQuickBookGroupName={setQuickBookGroupName}
        quickBookClientEmail={quickBookClientEmail}
        setQuickBookClientEmail={setQuickBookClientEmail}
        quickBookClientPhone={quickBookClientPhone}
        setQuickBookClientPhone={setQuickBookClientPhone}
        quickBookAgentId={quickBookAgentId}
        setQuickBookAgentId={setQuickBookAgentId}
        users={users}
        leads={leads}
        handleSaveQuickAppointment={handleSaveQuickAppointment}
        apptSaving={apptSaving}
        todayStr={todayStr}
      />

      <AppointmentDetailModal
        activeAppointment={activeAppointment}
        setActiveAppointment={setActiveAppointment}
        isEditingAppointment={isEditingAppointment}
        setIsEditingAppointment={setIsEditingAppointment}
        editApptDate={editApptDate}
        setEditApptDate={setEditApptDate}
        editApptTime={editApptTime}
        setEditApptTime={setEditApptTime}
        editApptType={editApptType}
        setEditApptType={setEditApptType}
        editApptAgentId={editApptAgentId}
        setEditApptAgentId={setEditApptAgentId}
        users={users}
        handleUpdateAppointment={handleUpdateAppointment}
        handleDeleteAppointment={handleDeleteAppointment}
        apptSaving={apptSaving}
        todayStr={todayStr}
      />

      <DayLeadsModal
        isOpen={isDayLeadsModalOpen}
        onClose={() => setIsDayLeadsModalOpen(false)}
        selectedCalendarDate={selectedCalendarDate || ''}
        selectedDayLeads={selectedDayLeads}
        leads={leads}
        setSelectedLead={setSelectedLead}
      />

      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        selectedLead={selectedLead}
        isGeneratingProposal={isGeneratingProposal}
        proposalHtml={proposalHtml}
      />
    </div>
  );
}
