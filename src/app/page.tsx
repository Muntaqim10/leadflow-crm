'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeadData } from '@/hooks/useLeadData';
import { useDateFilter } from '@/hooks/useDateFilter';
import { Toast } from '@/components/common/Toast';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { DashboardView } from '@/components/views/DashboardView';
import { KanbanView } from '@/components/views/KanbanView';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { CalendarView } from '@/components/views/CalendarView';
import { LeadDetailModal } from '@/components/modals/LeadDetailModal';
import { CreateLeadModal } from '@/components/modals/CreateLeadModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { AiEmailModal } from '@/components/modals/AiEmailModal';
import { QuickBookModal } from '@/components/modals/QuickBookModal';
import { DayLeadsModal } from '@/components/modals/DayLeadsModal';
import { Lead, Analytics, HeatmapData } from '@/types/crm';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kanban' | 'analytics' | 'heatmap'>('dashboard');

  // Toasts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // SWR Lead Data & Custom Hooks
  const {
    leads,
    templates,
    liveAppointments,
    users,
    tasks,
    isLoading,
    setLeads,
    mutateLeads,
    mutateUsers,
    mutateAppointments,
    refreshAll
  } = useLeadData(true);

  // Authentication & Authorization Hook
  const {
    session,
    setSession,
    authLoading,
    authMode,
    setAuthMode,
    currentUserName,
    currentUserRole,
    currentUserEmail,
    canDeleteLeads,
    canManageUsers,
    canManageHotelDetails,
    handleSignOut
  } = useAuth(users);

  // Date Filtering Hook
  const {
    dateFilterType,
    setDateFilterType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    todayStr
  } = useDateFilter();

  // Financial Settings State
  const [roomTaxRate, setRoomTaxRate] = useState('15.0');
  const [eventTaxRate, setEventTaxRate] = useState('6.0');
  const [eventGratuityRate, setEventGratuityRate] = useState('20.0');
  const [hotelName, setHotelName] = useState('Hotel Flow Grand');
  const [hotelPhone, setHotelPhone] = useState('+1 (555) 123-4567');
  const [hotelAddress, setHotelAddress] = useState('123 Luxury Ave, New York, NY 10001');

  // Analytics & Demand Data
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);

  // Modal Control States
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiDraftLead, setAiDraftLead] = useState<Lead | null>(null);
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
  const [quickBookDefaultDate, setQuickBookDefaultDate] = useState<string | undefined>(undefined);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [selectedDayLeads, setSelectedDayLeads] = useState<Lead[]>([]);

  // Fetch Analytics & Heatmap on date / tab change
  const fetchAnalytics = async () => {
    try {
      let url = `/api/analytics?startDate=${startDate}&endDate=${endDate}&filterType=${dateFilterType}`;
      const res = await fetch(url);
      if (res.ok) setAnalytics(await res.json());
    } catch (e) {
      console.warn('Analytics fetch error:', e);
    }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await fetch('/api/demand/heatmap');
      if (res.ok) setHeatmap(await res.json());
    } catch (e) {
      console.warn('Heatmap fetch error:', e);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAnalytics();
      fetchHeatmap();
    }
  }, [startDate, endDate, dateFilterType, session]);

  // Lead CRUD Operations
  const handleSaveNewLead = async (leadPayload: any) => {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadPayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create lead');
    }
    setSuccessMsg('New lead inquiry created successfully!');
    refreshAll();
  };

  const handleUpdateLead = async (leadPayload: any) => {
    const res = await fetch(`/api/leads/${leadPayload.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadPayload)
    });
    if (!res.ok) throw new Error('Failed to update lead');
    const updated = await res.json();
    setSelectedLead(updated);
    setSuccessMsg('Lead record updated successfully!');
    refreshAll();
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    const prev = [...leads];
    setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus as any } : l)));

    try {
      const target = leads.find((l) => l.id === leadId);
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, status: newStatus })
      });
      if (!res.ok) throw new Error();
      mutateLeads();
    } catch (err) {
      setLeads(prev);
      setErrorMsg('Failed to update status. Reverted changes.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!canDeleteLeads) {
      setErrorMsg('You do not have permission to delete leads.');
      return;
    }
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lead');
      setSuccessMsg('Lead deleted successfully.');
      setSelectedLead(null);
      mutateLeads();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not delete lead.');
    }
  };

  // Auth Loading Splash Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A1120] flex items-center justify-center">
        <div className="text-white text-xs font-semibold animate-pulse flex items-center gap-2">
          Connecting to Leadflow workspace...
        </div>
      </div>
    );
  }

  // Not authenticated -> Show clean AuthScreen
  if (!session) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        onSuccess={(newSession) => setSession(newSession)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans select-none text-slate-800">
      {/* Toast Notification Banner */}
      <Toast
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      {/* Main Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Application Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC] relative">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onRefresh={refreshAll}
          dateFilterType={dateFilterType}
          onDateFilterTypeChange={setDateFilterType}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          todayStr={todayStr}
          onOpenNewLeadModal={() => setIsNewLeadOpen(true)}
        />

        {/* View Switcher */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              leads={leads}
              tasks={tasks}
              users={users}
              onSelectLead={setSelectedLead}
              onOpenNewLead={() => setIsNewLeadOpen(true)}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanView
              leads={leads}
              users={users}
              canDeleteLeads={canDeleteLeads}
              onSelectLead={setSelectedLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onDeleteLead={handleDeleteLead}
              onOpenAiDraft={setAiDraftLead}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              analytics={analytics}
              startDate={startDate}
              endDate={endDate}
            />
          )}

          {activeTab === 'heatmap' && (
            <CalendarView
              heatmap={heatmap}
              appointments={liveAppointments}
              leads={leads}
              users={users}
              onSelectDay={(dateStr, dayLeads) => {
                setSelectedDayDate(dateStr);
                setSelectedDayLeads(dayLeads);
              }}
              onOpenQuickBook={(dateStr) => {
                setQuickBookDefaultDate(dateStr);
                setIsQuickBookOpen(true);
              }}
            />
          )}
        </div>
      </main>

      {/* MODALS */}
      {/* 1. Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        users={users}
        canDeleteLeads={canDeleteLeads}
        roomTaxRate={roomTaxRate}
        eventTaxRate={eventTaxRate}
        eventGratuityRate={eventGratuityRate}
        hotelName={hotelName}
        onUpdateLead={handleUpdateLead}
        onDeleteLead={handleDeleteLead}
        onOpenAiDraft={setAiDraftLead}
      />

      {/* 2. Create Lead Modal */}
      <CreateLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        users={users}
        roomTaxRate={roomTaxRate}
        eventTaxRate={eventTaxRate}
        eventGratuityRate={eventGratuityRate}
        onSaveLead={handleSaveNewLead}
      />

      {/* 3. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
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
        onRefreshUsers={mutateUsers}
        onShowSuccess={setSuccessMsg}
        onShowError={setErrorMsg}
      />

      {/* 4. AI Email Draft Modal */}
      <AiEmailModal
        lead={aiDraftLead}
        isOpen={!!aiDraftLead}
        onClose={() => setAiDraftLead(null)}
        onShowSuccess={setSuccessMsg}
        onShowError={setErrorMsg}
      />

      {/* 5. Quick Book Appointment Modal */}
      <QuickBookModal
        isOpen={isQuickBookOpen}
        onClose={() => setIsQuickBookOpen(false)}
        users={users}
        leads={leads}
        defaultDate={quickBookDefaultDate}
        onShowSuccess={setSuccessMsg}
        onShowError={setErrorMsg}
        onRefreshAppointments={mutateAppointments}
      />

      {/* 6. Calendar Day Breakdown Modal */}
      <DayLeadsModal
        isOpen={!!selectedDayDate}
        dateStr={selectedDayDate}
        dayLeads={selectedDayLeads}
        onClose={() => setSelectedDayDate(null)}
        onSelectLead={setSelectedLead}
      />
    </div>
  );
}
