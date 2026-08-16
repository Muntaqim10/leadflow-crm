'use client';

import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
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
  // Always default to current month and current year
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate standard 7-day calendar grid for the selected month
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Leading padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }

    // Trailing padding days to fill complete 7-day row
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const calendarDays = getMonthDays();
  const monthTitle = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="h-full flex flex-col animate-fadeIn overflow-hidden">
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col overflow-hidden">
        {/* Header with Title, Month Navigator & View Mode Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">
                {calendarViewMode === 'demand' ? 'Lead Demand Heatmap' : 'Sales Appointments Calendar'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {calendarViewMode === 'demand'
                ? 'Color-shaded calendar showing inquiry volume. Click on any date to view leads and potential revenue.'
                : 'Scheduled walkthroughs, calls, and client meetings. Click on any date to schedule or manage bookings.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Month Navigation Controls */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="font-bold text-xs text-slate-800 px-2 min-w-[110px] text-center select-none">
                {monthTitle}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-lg border border-blue-200 shadow-2xs transition-all cursor-pointer active:scale-95 ml-1"
              >
                Today
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setCalendarViewMode('demand')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  calendarViewMode === 'demand'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Demand Heatmap
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode('appointments')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  calendarViewMode === 'appointments'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Appointments
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Column Headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Dynamic Month Calendar Grid */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(({ date: targetDate, isCurrentMonth }, idx) => {
              const y = targetDate.getFullYear();
              const m = String(targetDate.getMonth() + 1).padStart(2, '0');
              const d = String(targetDate.getDate()).padStart(2, '0');
              const dateStr = `${y}-${m}-${d}`;
              const dayNum = targetDate.getDate();
              const isToday = dateStr === todayStr;

              if (calendarViewMode === 'demand') {
                const dayData = heatmap?.[dateStr];
                const count = dayData?.count || 0;
                const revenue = dayData?.revenue || 0;

                // Shade color based on count
                let shadeClass = 'bg-white border-slate-200 text-slate-600 hover:border-slate-300';
                if (count > 0 && count <= 1) shadeClass = 'bg-blue-50/70 border-blue-200 text-blue-800 font-semibold';
                else if (count > 1 && count <= 3) shadeClass = 'bg-blue-100/70 border-blue-300 text-blue-900 font-semibold';
                else if (count > 3) shadeClass = 'bg-indigo-100/80 border-indigo-300 text-indigo-900 font-bold';

                return (
                  <div
                    key={idx}
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
                    className={`group relative p-2.5 rounded-xl border text-sm min-h-[95px] flex flex-col justify-between transition-all shadow-xs ${
                      isToday ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30' : ''
                    } ${
                      !isCurrentMonth
                        ? 'opacity-35 bg-slate-50/70 border-slate-100'
                        : (dayData && dayData.leads && dayData.leads.length > 0) || dateStr >= todayStr
                        ? 'cursor-pointer hover:border-blue-400 hover:shadow-md'
                        : 'cursor-not-allowed opacity-60'
                    } ${shadeClass}`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center -ml-0.5'
                            : isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-2xs">
                          Today
                        </span>
                      )}
                    </div>

                    {count > 0 ? (
                      <div className="text-left mt-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold block text-slate-800">
                            {count} Lead{count > 1 ? 's' : ''}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-600">
                            ${Math.round(revenue).toLocaleString()}
                          </span>
                        </div>

                        {/* Booking Type Badges on Card */}
                        <div className="flex flex-wrap gap-1 mt-0.5">
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
                                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                    ✨ Both
                                  </span>
                                ) : (
                                  <>
                                    {hasEvent && (
                                      <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                        🏢 Event
                                      </span>
                                    )}
                                    {hasStay && (
                                      <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                        🛏️ Stay
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
                      <span className="text-[9px] text-slate-400 self-start mt-1 group-hover:text-blue-600 transition-colors">
                        {isCurrentMonth && dateStr >= todayStr ? '+ Add lead' : ''}
                      </span>
                    )}

                    {/* Hover Popover Tooltip */}
                    {count > 0 && (
                      <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-900 text-white rounded-xl p-3 shadow-2xl z-50 pointer-events-none text-xs border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                        <div className="font-bold border-b border-slate-700 pb-1.5 mb-2 flex justify-between items-center text-slate-200">
                          <span>{targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Leads</span>
                          <span className="text-emerald-400 text-[11px] font-bold">
                            ${Math.round(revenue).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {(dayData?.leads || []).map((lead: any, lIdx: number) => {
                            const bType = getLeadBookingType(lead.rooms_or_event_details);
                            return (
                              <div
                                key={lIdx}
                                className="bg-slate-800/90 p-2 rounded-lg text-[10px] space-y-0.5 border border-slate-700"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-white truncate max-w-[120px]">
                                    {lead.name_company}
                                  </span>
                                  <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${bType.badgeClass}`}>
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
                const shadeClass = hasAppointments ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-slate-200';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (dateStr >= todayStr) {
                        setQuickBookDate(dateStr);
                        setIsQuickBookingOpen(true);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-sm min-h-[95px] flex flex-col transition-all shadow-xs ${
                      isToday ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30' : ''
                    } ${
                      !isCurrentMonth
                        ? 'opacity-35 bg-slate-50/70 border-slate-100'
                        : dateStr >= todayStr
                        ? 'cursor-pointer hover:border-blue-400 hover:shadow-md ' + shadeClass
                        : 'cursor-not-allowed opacity-60 bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center -ml-0.5'
                            : isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-2xs">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[80px]">
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
                            className="bg-white rounded-lg border border-blue-100 p-1.5 text-[10px] shadow-2xs cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all text-left"
                          >
                            <div className="flex items-center gap-1 font-bold text-blue-800 text-[10px]">
                              <span>{apt.type === 'Site Tour' ? '📍' : apt.type === 'Zoom Meeting' ? '💻' : '📞'}</span>
                              <span>{apt.appointment_time}</span>
                            </div>
                            <div className="text-slate-700 font-medium truncate text-[10px]">
                              {apt.leads?.name_company || 'Unknown Lead'}
                            </div>
                            <div className="text-slate-400 truncate text-[9px]">
                              Host: {apt.users?.name || 'Unassigned'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[9px] text-slate-400 mt-1">
                          {isCurrentMonth && dateStr >= todayStr ? '+ Schedule' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
