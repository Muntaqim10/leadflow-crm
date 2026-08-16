'use client';

import React from 'react';
import { X, Calendar, DollarSign, Users, ArrowRight } from 'lucide-react';
import { Lead } from '@/types/crm';
import { getLeadBookingType } from '@/lib/calculations';

interface DayLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null;
  dayLeads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export const DayLeadsModal: React.FC<DayLeadsModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  dayLeads,
  onSelectLead
}) => {
  if (!isOpen || !dateStr) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Stay Dates for {dateStr}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
          {dayLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400">No active bookings for this date.</div>
          ) : (
            dayLeads.map((lead) => {
              const booking = getLeadBookingType(lead.rooms_or_event_details);

              return (
                <div
                  key={lead.id}
                  onClick={() => {
                    onClose();
                    onSelectLead(lead);
                  }}
                  className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-bold text-slate-900 truncate">{lead.name_company}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Stay: {lead.check_in_date} to {lead.check_out_date}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">
                        ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                      </div>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${booking.badgeClass}`}>
                        {booking.label}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
