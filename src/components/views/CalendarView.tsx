'use client';

import React, { useEffect, useRef } from 'react';
import { CalendarDays, Flame, Zap, Sparkles, Calendar } from 'lucide-react';
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

  // Group the full year into 12 months with calculated demand & appointment stats
  const getMonthsData = () => {
    const currentYear = new Date().getFullYear();
    const months = [];

    for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
      const monthDate = new Date(currentYear, monthIdx, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const lastDay = new Date(currentYear, monthIdx + 1, 0).getDate();

      const days: Date[] = [];
      let monthTotalLeads = 0;
      let monthTotalRev = 0;
      let monthTotalAppts = 0;

      for (let d = 1; d <= lastDay; d++) {
        const dateObj = new Date(currentYear, monthIdx, d);
        days.push(dateObj);

        const mStr = String(monthIdx + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        const dateKey = `${currentYear}-${mStr}-${dStr}`;

        const dayData = heatmap?.[dateKey];
        if (dayData) {
          monthTotalLeads += dayData.count || 0;
          monthTotalRev += dayData.revenue || 0;
        }

        const appts = (liveAppointments || []).filter((apt: any) => apt.appointment_date === dateKey);
        monthTotalAppts += appts.length;
      }

      months.push({
        monthIdx,
        monthName,
        days,
        totalLeads: monthTotalLeads,
        totalRev: monthTotalRev,
        totalAppts: monthTotalAppts
      });
    }

    return months;
  };

  const monthsData = getMonthsData();

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
        {/* Header with Title, Heat Legend & View Toggle */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 shrink-0 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">
                {calendarViewMode === 'demand' ? 'Lead Demand Heatmap' : 'Sales Appointments Calendar'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {calendarViewMode === 'demand'
                ? 'Thermal demand intelligence showing peak inquiry compression, hot dates, and potential revenue across the full year.'
                : 'Annual schedule for client site walkthroughs, phone calls, and virtual presentations.'}
            </p>
          </div>

          {/* Demand Scale Legend & Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {calendarViewMode === 'demand' && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-700 text-xs mr-0.5">Demand Scale:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300"></span> Open
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-400 border border-emerald-500"></span> Low (1)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-yellow-400 border border-yellow-500"></span> Moderate (2–3)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-red-500 border border-red-600"></span> High (4+)
                </span>
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

            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs shrink-0">
              <button
                onClick={() => setCalendarViewMode('demand')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  calendarViewMode === 'demand'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Demand Heatmap
              </button>
              <button
                onClick={() => setCalendarViewMode('appointments')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  calendarViewMode === 'appointments'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Appointments
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Months Container */}
        <div ref={containerRef} className="flex-1 overflow-y-auto pr-2 scrollbar-thin scroll-smooth space-y-8">
          {monthsData.map((month) => {
            // Determine Monthly Demand Tier
            const isHighDemandMonth = month.totalLeads >= 5;
            const isModerateDemandMonth = month.totalLeads >= 2 && month.totalLeads < 5;
            const isLowDemandMonth = month.totalLeads === 1;

            return (
              <div key={month.monthIdx} className="space-y-3">
                {/* Month Summary Banner */}
                <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <h4 className="font-extrabold text-sm text-slate-800 tracking-tight">{month.monthName}</h4>
                  </div>

                  {calendarViewMode === 'demand' ? (
                    <div className="flex items-center gap-2.5">
                      {month.totalLeads > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">
                            {month.totalLeads} Total Inquir{month.totalLeads > 1 ? 'ies' : 'y'} •{' '}
                            <span className="text-emerald-600 font-bold">
                              ${Math.round(month.totalRev).toLocaleString()}
                            </span>
                          </span>

                          {isHighDemandMonth && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                              HIGH DEMAND
                            </span>
                          )}
                          {isModerateDemandMonth && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-900 border border-yellow-300 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                              MODERATE DEMAND
                            </span>
                          )}
                          {isLowDemandMonth && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              LOW DEMAND
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Open Capacity • 0 Inquiries</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-slate-600">
                      {month.totalAppts > 0 ? (
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {month.totalAppts} Scheduled Meeting{month.totalAppts > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">No scheduled meetings</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {month.days.map((targetDate, idx) => {
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

                      // Demand Categories: Red = High (4+), Yellow = Moderate (2-3), Green = Low (1)
                      const isHigh = count >= 4 || revenue >= 15000;
                      const isModerate = (count >= 2 && count <= 3) || revenue >= 5000;
                      const isLow = count === 1;

                      let demandCardClass = 'bg-white border-slate-200 text-slate-400';
                      let headerDayColor = 'text-slate-800';

                      if (isHigh) {
                        demandCardClass =
                          'bg-red-50/90 border-red-300 text-red-950 shadow-xs hover:border-red-400';
                        headerDayColor = 'text-red-950 font-black';
                      } else if (isModerate) {
                        demandCardClass =
                          'bg-yellow-50/90 border-yellow-300 text-yellow-950 shadow-2xs hover:border-yellow-400';
                        headerDayColor = 'text-yellow-950 font-bold';
                      } else if (isLow) {
                        demandCardClass =
                          'bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:border-emerald-400 shadow-2xs';
                        headerDayColor = 'text-emerald-950 font-bold';
                      }

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
                            isToday ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/30' : ''
                          } ${
                            hasDemand
                              ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]'
                              : 'cursor-default opacity-85'
                          } ${demandCardClass}`}
                        >
                          <div className="flex justify-between items-center opacity-85">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold text-[11px] ${headerDayColor}`}>{dayLabel}</span>
                              {isToday && (
                                <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-blue-600 text-white shadow-2xs">
                                  Today
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-medium tracking-wide uppercase">{weekdayLabel}</span>
                          </div>

                          {hasDemand ? (
                            <div className="text-left mt-2 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  {isHigh && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>}
                                  {isModerate && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                                  {isLow && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                                  <span className="text-[10px] font-bold block text-slate-900">
                                    {count} Lead{count > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] font-extrabold ${
                                    isHigh ? 'text-red-700' : isModerate ? 'text-yellow-800' : 'text-emerald-700'
                                  }`}
                                >
                                  ${Math.round(revenue).toLocaleString()}
                                </span>
                              </div>

                              {/* Booking Type Badges */}
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
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isHigh ? 'bg-red-500' : isModerate ? 'bg-yellow-400' : 'bg-emerald-400'
                                    }`}
                                  ></span>
                                  <span>
                                    {dayLabel} {isHigh ? 'High Demand' : isModerate ? 'Moderate Demand' : 'Low Demand'}
                                  </span>
                                </span>
                                <span className="text-emerald-400 text-[11px] font-bold">
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
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${bType.badgeClass}`}
                                        >
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
                      // Appointments View
                      const dayAppointments = (liveAppointments || []).filter(
                        (apt: any) => apt.appointment_date === dateStr
                      );
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
                            isToday ? 'ring-2 ring-blue-600 border-blue-600' : ''
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
                                    <span>
                                      {apt.type === 'Site Tour' ? '📍' : apt.type === 'Zoom Meeting' ? '💻' : '📞'}
                                    </span>
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

