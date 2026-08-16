'use client';

import React from 'react';
import { Lead } from '@/types/crm';
import { calculateLeadScore } from '@/lib/calculations';

export const PIPELINE_STATUSES = [
  { key: 'new', label: 'New Inquiry', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', solidColor: 'bg-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', solidColor: 'bg-purple-500' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20', solidColor: 'bg-sky-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', solidColor: 'bg-amber-500' },
  { key: 'confirmed', label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', solidColor: 'bg-emerald-500' },
  { key: 'lost', label: 'Lost', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', solidColor: 'bg-rose-500' },
];

interface KanbanViewProps {
  viewMode: 'board' | 'list';
  setViewMode: (mode: 'board' | 'list') => void;
  filteredLeads: Lead[];
  handleUpdateStatus: (leadId: string, status: string, lostReason?: string) => void;
  setSelectedLead: (lead: Lead) => void;
  formatRoomDetailsDisplay: (details: string) => string;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  viewMode,
  setViewMode,
  filteredLeads,
  handleUpdateStatus,
  setSelectedLead,
  formatRoomDetailsDisplay
}) => {
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    handleUpdateStatus(id, status);
  };

  return (
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
            className={`w-1/2 sm:w-auto px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'board' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Board View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`w-1/2 sm:w-auto px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
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
            const colLeads = filteredLeads.filter((l) => l.status === col.key);
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
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                              {lead.name_company}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                                lead.status === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : lead.status === 'lost'
                                  ? 'bg-slate-50 text-slate-400 border-slate-200'
                                  : score >= 70
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : score >= 40
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {lead.status === 'confirmed'
                                ? '🏆 100%'
                                : lead.status === 'lost'
                                ? '0%'
                                : `🎯 ${score}%`}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="space-y-1 text-xs text-slate-500 mb-3">
                        <div className="flex justify-between">
                          <span>Dates:</span>
                          <span className="text-slate-700 font-medium">
                            {lead.check_in_date} to {lead.check_out_date}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Details:</span>
                          <span className="text-slate-700 font-medium truncate max-w-[170px]" title={lead.rooms_or_event_details}>
                            {formatRoomDetailsDisplay(lead.rooms_or_event_details)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Source:</span>
                          <span className="text-slate-700 font-medium capitalize">
                            {lead.lead_source?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Segment:</span>
                          <span className="text-slate-700 font-medium capitalize">
                            {lead.market_segment?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-700">Value:</span>
                        <span className="text-xs font-extrabold text-emerald-600">
                          ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {colLeads.length === 0 && (
                    <div className="h-24 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                      Drop lead here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Spreadsheet View */
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Client / Company</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Win Prob</th>
                  <th className="p-4">Stay Dates</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Segment</th>
                  <th className="p-4 text-right">Potential Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const score = calculateLeadScore(lead);
                  const statusInfo = PIPELINE_STATUSES.find((s) => s.key === lead.status) || PIPELINE_STATUSES[0];
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-800">{lead.name_company}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                            lead.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : lead.status === 'lost'
                              ? 'bg-slate-50 text-slate-400 border-slate-200'
                              : score >= 70
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : score >= 40
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {lead.status === 'confirmed' ? '🏆 100%' : lead.status === 'lost' ? '0%' : `🎯 ${score}%`}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">
                        {lead.check_in_date} to {lead.check_out_date}
                      </td>
                      <td className="p-4 text-slate-500 max-w-[200px] truncate" title={lead.rooms_or_event_details}>
                        {formatRoomDetailsDisplay(lead.rooms_or_event_details)}
                      </td>
                      <td className="p-4 text-slate-600 capitalize">{lead.lead_source?.replace(/_/g, ' ')}</td>
                      <td className="p-4 text-slate-600 capitalize">{lead.market_segment?.replace(/_/g, ' ')}</td>
                      <td className="p-4 text-right font-bold text-emerald-600">
                        ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
