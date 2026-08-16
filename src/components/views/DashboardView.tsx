'use client';

import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Clock,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Lead, Task, User } from '@/types/crm';
import { calculateLeadScore, getLeadBookingType, formatDisplayDate } from '@/lib/calculations';

interface DashboardViewProps {
  leads: Lead[];
  tasks: Task[];
  users: User[];
  onSelectLead: (lead: Lead) => void;
  onOpenNewLead: () => void;
  onNavigateToTab: (tab: 'kanban' | 'analytics' | 'heatmap') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  tasks,
  users,
  onSelectLead,
  onOpenNewLead,
  onNavigateToTab
}) => {
  // Metrics calculation
  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => l.status !== 'lost' && l.status !== 'confirmed');
  const confirmedLeads = leads.filter(l => l.status === 'confirmed');

  const totalPipelineValue = leads
    .filter(l => l.status !== 'lost')
    .reduce((sum, l) => sum + (parseFloat(l.revenue_potential || '0') || 0), 0);

  const confirmedRevenue = confirmedLeads
    .reduce((sum, l) => sum + (parseFloat(l.revenue_potential || '0') || 0), 0);

  const winRate = totalLeads > 0 ? Math.round((confirmedLeads.length / totalLeads) * 100) : 0;

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 5);

  const pendingTasks = tasks.filter(t => t.status === 'pending').slice(0, 5);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F1E36] to-[#1E3A8A] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Executive Sales Overview</h2>
          <p className="text-xs text-blue-200 mt-1">
            Real-time pipeline health, conversion pacing, and immediate follow-up priorities.
          </p>
        </div>
        <button
          onClick={onOpenNewLead}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add New Lead
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold">Total Pipeline Value</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">${totalPipelineValue.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" /> Active quotes in pipeline
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold">Confirmed Bookings</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">${confirmedRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {confirmedLeads.length} signed agreements
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold">Active Opportunities</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeLeads.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across 4 open sales stages
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold">Conversion Win Rate</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{winRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Overall closing ratio
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Inquiries Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Lead Inquiries</h3>
              <p className="text-xs text-slate-500">Latest prospects registered in your pipeline</p>
            </div>
            <button
              onClick={() => onNavigateToTab('kanban')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Pipeline <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentLeads.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No recent leads found.</div>
            ) : (
              recentLeads.map((lead) => {
                const booking = getLeadBookingType(lead.rooms_or_event_details);
                const score = calculateLeadScore(lead);

                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0">
                        {lead.name_company.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{lead.name_company}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {lead.email} | Stay: {lead.check_in_date}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${booking.badgeClass}`}>
                        {booking.icon} {booking.label}
                      </span>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">
                          ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">{score}% win prob</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Priority Follow-up Tasks (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Pending Follow-Ups</h3>
                <p className="text-xs text-slate-500">Action items assigned to agents</p>
              </div>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {pendingTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No pending tasks. Great job!</div>
              ) : (
                pendingTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-slate-800">{t.description}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>👤 {t.assignee_name || 'Agent'}</span>
                      <span className="font-medium text-blue-600">Due: {t.due_date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={() => onNavigateToTab('heatmap')}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-blue-600" /> Open Demand Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
