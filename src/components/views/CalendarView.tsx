'use client';

import React, { useEffect, useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { Lead } from '@/types/crm';
import { getLeadBookingType } from '@/lib/calculations';

interface CalendarViewProps {
  calendarViewMode: 'demand' | 'appointments';
  setCalendarViewMode: (mode: 'demand' | 'appointments') => void;
  heatmap: any;
  liveAppointments: any[];
  leads: Lead[];
  todayStr: string;
  setSelectedLead: (lead: Lead) => void;
  setSelectedDayLeads: (leads: any[]) => void;
  setSelectedCalendarDate: (date: string) => void;
  setIsDayLeadsModalOpen: (open: boolean) => void;
  resetLeadForm: () => void;
  setFormCheckIn: (date: string) => void;
  setIsNewLeadModalOpen: (open: boolean) => void;
  setQuickBookDate: (date: string) => void;
  setIsQuickBookingOpen: (open: boolean) => void;
  setActiveAppointment: (apt: any) => void;
  setEditApptDate: (date: string) => void;
  setEditApptTime: (time: string) => void;
  setEditApptType: (type: string) => void;
  setEditApptAgentId: (id: string) => void;
  setIsEditingAppointment: (editing: boolean) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  calendarViewMode,
  setCalendarViewMode,
  heatmap,
  liveAppointments,
  leads,
  todayStr,
  setSelectedLead,
  setSelectedDayLeads,
  setSelectedCalendarDate,
  setIsDayLeadsModalOpen,
  resetLeadForm,
  setFormCheckIn,
  setIsNewLeadModalOpen,
  setQuickBookDate,
  setIsQuickBookingOpen,
  setActiveAppointment,
  setEditApptDate,
  setEditApptTime,
  setEditApptType,
  setEditApptAgentId,
  setIsEditingAppointment
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fully scrollable calendar year (Jan 1 to Dec 31 of current year)
  const getCalendarDays = () => {
    const currentYear = new Date().getFullYear();
    const start = new Date(currentYear, 0, 1); // Jan 1
    const end = new Date(currentYear, 11, 31); // Dec 31

    const dates: Date[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const calendarDays = getCalendarDays();

  // Auto-scroll directly to today on mount and view mode switch
  useEffect(() => {
    const timer = setTimeout(() => {
      const todayEl = document.getElementById('calendar-today');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [calendarViewMode]);

  const handleJumpToToday = () => {
    const todayEl = document.getElementById('calendar-today');
    if (todayEl) {
      todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="h-full flex flex-col animate-fadeIn overflow-hidden">
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">
                {calendarViewMode === 'demand' ? 'Lead Demand Heatmap' : 'Sales Appointments Calendar'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {calendarViewMode === 'demand'
                ? 'Annual demand intelligence showing inquiry compression and requested stay dates across all active leads.'
                : 'Annual scheduled client tours, phone calls, and virtual meetings. Hover over days to view and edit appointment logs.'}
            </p>
          </div>

          {/* Demand Legend (in Demand Mode) & Quick Jump / View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {calendarViewMode === 'demand' && (
              <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-slate-500 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 text-xs">Demand:</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-white border border-slate-300"></span> Open</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-100 border border-blue-300"></span> 1 Lead</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-200 border border-blue-400"></span> 2-3 Moderate</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-200 border border-indigo-400"></span> 4+ High</span>
              </div>
            )}

            <button
              onClick={handleJumpToToday}
              type="button"
              className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              title="Jump to current date"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Today</span>
            </button>

            <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-xs shrink-0">
              <button
                onClick={() => setCalendarViewMode('demand')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  calendarViewMode === 'demand' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Demand Heatmap
              </button>
              <button
                onClick={() => setCalendarViewMode('appointments')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  calendarViewMode === 'appointments' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Appointments
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid (Full Year Scrollable) */}
        {calendarDays.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Please select a valid date range to view calendar data.
          </div>
        ) : (
          <div ref={containerRef} className="flex-1 overflow-y-auto pr-2 scrollbar-thin scroll-smooth">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {calendarDays.map((targetDate, idx) => {
                const y = targetDate.getFullYear();
                const m = String(targetDate.getMonth() + 1).padStart(2, '0');
                const d = String(targetDate.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;
                const dayLabel = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const weekdayLabel = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
                const isToday = dateStr === todayStr;

                if (calendarViewMode === 'demand') {
                  const dayData = heatmap?.[dateStr];
                  const count = dayData?.count || 0;
                  const revenue = dayData?.revenue || 0;
                  const hasDemand = count > 0;

                  // Shade color based on count
                  let shadeClass = 'bg-white border-slate-200 text-slate-400';
                  if (count > 0 && count <= 1) shadeClass = 'bg-blue-50/70 border-blue-200 text-blue-800 font-semibold shadow-xs';
                  else if (count > 1 && count <= 3)
                    shadeClass = 'bg-blue-100/70 border-blue-300 text-blue-900 font-semibold shadow-xs';
                  else if (count > 3) shadeClass = 'bg-indigo-100/80 border-indigo-300 text-indigo-900 font-bold shadow-xs';

                  return (
                    <div
                      key={idx}
                      id={isToday ? 'calendar-today' : undefined}
                      onClick={() => {
                        if (hasDemand && dayData?.leads && dayData.leads.length > 0) {
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
                        }
                      }}
                      className={`group relative p-3 rounded-lg border text-sm min-h-[95px] flex flex-col justify-between transition-all ${
                        isToday ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20' : ''
                      } ${
                        hasDemand
                          ? 'cursor-pointer hover:border-blue-400 hover:shadow-md'
                          : 'cursor-default opacity-85'
                      } ${shadeClass}`}
                    >
                      <div className="flex justify-between items-center opacity-80">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[11px] text-slate-800">{dayLabel}</span>
                          {isToday && (
                            <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-blue-600 text-white">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-medium tracking-wide uppercase">{weekdayLabel}</span>
                      </div>

                      {hasDemand ? (
                        <div className="text-left mt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold block text-slate-800">
                              {count} Lead{count > 1 ? 's' : ''}
                            </span>
                            <span className="text-[9px] font-semibold text-emerald-600">
                              ${Math.round(revenue).toLocaleString()}
                            </span>
                          </div>

                          {/* Booking Type Badges on Card */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(() => {
                              const dayLeadsList = dayData?.leads || [];
                              const types = dayLeadsList.map((l: any) =>
                                getLeadBookingType(l.rooms_or_event_details)
                              );
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
                        <div className="flex items-center gap-1 text-[10px] text-slate-300 font-medium self-start mt-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                          <span>Open</span>
                        </div>
                      )}

                      {/* Hover Popover Tooltip */}
                      {hasDemand && (
                        <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-900 text-white rounded-xl p-3 shadow-2xl z-50 pointer-events-none text-xs border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                          <div className="font-bold border-b border-slate-700 pb-1.5 mb-2 flex justify-between items-center text-slate-200">
                            <span>{dayLabel} Leads</span>
                            <span className="text-emerald-400 text-[11px]">
                              ${Math.round(revenue).toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            {(dayData?.leads || []).map((lead: any, lIdx: number) => {
                              const bType = getLeadBookingType(lead.rooms_or_event_details);
                              return (
                                <div
                                  key={lIdx}
                                  className="bg-slate-800/90 p-2 rounded-lg text-[10px] space-y-1 border border-slate-700"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-white truncate max-w-[120px]">
                                      {lead.name_company}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${bType.badgeClass}`}>
                                      {bType.icon} {bType.shortLabel}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span className="capitalize">{lead.status.replace('_', ' ')}</span>
                                    <span className="font-semibold text-emerald-400">
                                      ${parseFloat(lead.revenue || '0').toLocaleString()}
                                    </span>
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
                  const dayAppointments = liveAppointments.filter((apt: any) => apt.appointment_date === dateStr);
                  const hasAppointments = dayAppointments.length > 0;
                  const shadeClass = hasAppointments ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200';

                  return (
                    <div
                      key={idx}
                      id={isToday ? 'calendar-today' : undefined}
                      onClick={() => {
                        if (dateStr >= todayStr) {
                          setQuickBookDate(dateStr);
                          setIsQuickBookingOpen(true);
                        }
                      }}
                      className={`p-3 rounded-lg border text-sm min-h-[85px] flex flex-col transition-all shadow-sm ${
                        isToday ? 'ring-2 ring-blue-500 border-blue-500' : ''
                      } ${
                        dateStr >= todayStr
                          ? 'cursor-pointer hover:border-blue-300 hover:shadow-md ' + shadeClass
                          : 'cursor-not-allowed opacity-60 bg-slate-50'
                      }`}
                    >
                      <div
                        className={`flex justify-between items-center mb-2 ${
                          hasAppointments ? 'text-blue-700 font-bold' : 'text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[11px] text-slate-800">{dayLabel}</span>
                          {isToday && (
                            <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-blue-600 text-white">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-medium tracking-wide uppercase">{weekdayLabel}</span>
                      </div>

                      <div className="flex-1 flex flex-col gap-2">
                        {hasAppointments ? (
                          dayAppointments.map((apt: any) => (
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
                              <div className="text-slate-700 font-medium truncate">
                                {apt.leads?.name_company || 'Unknown Lead'}
                              </div>
                              <div className="text-slate-500 truncate mt-0.5">
                                Host: {apt.users?.name || 'Unassigned'}
                              </div>
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
        )}
      </div>
    </div>
  );
};
