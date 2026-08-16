'use client';

import React, { useState } from 'react';
import {
  LayoutGrid,
  List,
  Sparkles,
  Search,
  ArrowRight,
  MoreVertical,
  Trash2,
  FileText,
  Mail,
  Building
} from 'lucide-react';
import { Lead, LeadStatus, User } from '@/types/crm';
import { calculateLeadScore, getLeadBookingType, formatDisplayDate } from '@/lib/calculations';

interface KanbanViewProps {
  leads: Lead[];
  users: User[];
  canDeleteLeads: boolean;
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, newStatus: string) => void;
  onDeleteLead: (leadId: string) => void;
  onOpenAiDraft: (lead: Lead) => void;
}

const COLUMNS: { id: LeadStatus; label: string; color: string; border: string; bg: string }[] = [
  { id: 'new', label: 'New Inquiry', color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50/50' },
  { id: 'contacted', label: 'Contacted', color: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50/50' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'text-sky-600', border: 'border-sky-200', bg: 'bg-sky-50/50' },
  { id: 'negotiation', label: 'Negotiation', color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50/50' },
  { id: 'confirmed', label: 'Confirmed', color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50/50' },
  { id: 'lost', label: 'Lost', color: 'text-rose-600', border: 'border-rose-200', bg: 'bg-rose-50/50' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  leads,
  users,
  canDeleteLeads,
  onSelectLead,
  onUpdateLeadStatus,
  onDeleteLead,
  onOpenAiDraft
}) => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name_company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.phone && l.phone.includes(searchQuery));
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedLeadId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      onUpdateLeadStatus(leadId, newStatus);
    }
    setDraggedLeadId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/50">
      {/* Top Filter Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search company, client, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'board' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Board View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="h-3.5 w-3.5" /> List View
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'board' ? (
        <div className="flex-1 overflow-x-auto p-6 flex gap-4 min-h-0 select-none">
          {COLUMNS.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.id);
            const colValue = colLeads.reduce((sum, l) => sum + (parseFloat(l.revenue_potential || '0') || 0), 0);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="w-80 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden h-full max-h-full"
              >
                {/* Column Header */}
                <div className={`p-4 border-b border-slate-200 flex items-center justify-between ${col.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${col.color} uppercase tracking-wider`}>
                      {col.label}
                    </span>
                    <span className="bg-white/80 border border-slate-200 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {colLeads.length}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-600">
                    ${colValue.toLocaleString()}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-3 overflow-y-auto flex-1 space-y-3">
                  {colLeads.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
                      Drop leads here
                    </div>
                  ) : (
                    colLeads.map((lead) => {
                      const booking = getLeadBookingType(lead.rooms_or_event_details);
                      const score = calculateLeadScore(lead);
                      const assignedUser = users.find((u) => u.id === lead.assigned_sales_manager_id);

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => onSelectLead(lead)}
                          className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-xl p-4 transition-all cursor-pointer space-y-3 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                                {lead.name_company}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{lead.email}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${booking.badgeClass}`}>
                              {booking.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Stay Dates</span>
                              <strong className="text-slate-700">{lead.check_in_date || 'TBD'}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 block text-[10px]">Revenue</span>
                              <strong className="text-emerald-600 font-bold">
                                ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                              </strong>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="truncate">👤 {assignedUser?.name || 'Assigned Agent'}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenAiDraft(lead);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                title="Draft AI Email"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                              </button>
                              {canDeleteLeads && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteLead(lead.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Client / Company</th>
                  <th className="py-3.5 px-4">Booking Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Stay Dates</th>
                  <th className="py-3.5 px-4">Revenue</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No leads match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const booking = getLeadBookingType(lead.rooms_or_event_details);
                    const assignedUser = users.find((u) => u.id === lead.assigned_sales_manager_id);

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{lead.name_company}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{lead.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${booking.badgeClass}`}>
                            {booking.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {lead.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {lead.check_in_date} to {lead.check_out_date}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{assignedUser?.name || '—'}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAiDraft(lead);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Generate AI Email"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                          {canDeleteLeads && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLead(lead.id);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete Lead"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
