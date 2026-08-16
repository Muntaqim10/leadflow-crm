'use client';

import React from 'react';
import { Lead } from '@/types/crm';
import { getLeadBookingType, formatDisplayDate } from '@/lib/calculations';

interface DayLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCalendarDate: string;
  selectedDayLeads: any[];
  leads: Lead[];
  setSelectedLead: (lead: Lead) => void;
}

export const DayLeadsModal: React.FC<DayLeadsModalProps> = ({
  isOpen,
  onClose,
  selectedCalendarDate,
  selectedDayLeads,
  leads,
  setSelectedLead
}) => {
  if (!isOpen || !selectedCalendarDate) return null;

  return (
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
            onClick={onClose}
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
                  onClose();
                  const fullLead = leads.find((l) => l.id === dayLead.id);
                  if (fullLead) {
                    setSelectedLead(fullLead);
                  }
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer shadow-xs space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                    {dayLead.name_company}
                  </span>
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
  );
};
