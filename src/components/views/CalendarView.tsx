'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Flame,
  Users,
  Building
} from 'lucide-react';
import { HeatmapData, Appointment, Lead, User } from '@/types/crm';

interface CalendarViewProps {
  heatmap: HeatmapData | null;
  appointments: Appointment[];
  leads: Lead[];
  users: User[];
  onSelectDay: (dateStr: string, dayLeads: any[]) => void;
  onOpenQuickBook: (dateStr?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  heatmap,
  appointments,
  leads,
  users,
  onSelectDay,
  onOpenQuickBook
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const dayCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    dayCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    dayCells.push(day);
  }

  const daysMap = new Map<string, any>();
  if (heatmap?.days) {
    heatmap.days.forEach((d) => daysMap.set(d.date, d));
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-xs text-slate-800 px-3">{monthName}</span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Jump to Today
          </button>
        </div>

        <button
          onClick={() => onOpenQuickBook()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Quick Schedule Tour / Call
        </button>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {dayCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-28 bg-slate-50/50" />;
            }

            const monthPadded = String(currentMonth + 1).padStart(2, '0');
            const dayPadded = String(day).padStart(2, '0');
            const dateKey = `${currentYear}-${monthPadded}-${dayPadded}`;

            const dayDemand = daysMap.get(dateKey);
            const isPeak = heatmap?.peakDays?.includes(dateKey);

            // Get day leads and appointments
            const dayLeads = leads.filter(
              (l) => l.check_in_date <= dateKey && l.check_out_date >= dateKey && l.status !== 'lost'
            );
            const dayAppts = appointments.filter((a) => a.appointment_date === dateKey);

            return (
              <div
                key={dateKey}
                onClick={() => onSelectDay(dateKey, dayLeads)}
                className={`h-28 p-2 flex flex-col justify-between transition-colors cursor-pointer hover:bg-blue-50/40 relative ${
                  dayDemand ? dayDemand.color : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-800">{day}</span>
                  {isPeak && (
                    <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-amber-700 bg-amber-100 border border-amber-300 px-1 py-0.2 rounded-full">
                      <Flame className="h-2.5 w-2.5 fill-current" /> PEAK
                    </span>
                  )}
                </div>

                <div className="space-y-1 my-auto">
                  {dayDemand && dayDemand.rooms > 0 && (
                    <div className="text-[10px] font-bold text-slate-800 bg-white/90 px-1.5 py-0.5 rounded shadow-2xs">
                      🏨 {dayDemand.rooms} Rooms
                    </div>
                  )}
                  {dayAppts.length > 0 && (
                    <div className="text-[10px] font-semibold text-blue-700 bg-blue-50/90 border border-blue-200 px-1.5 py-0.5 rounded truncate">
                      📅 {dayAppts.length} Tours/Appts
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-semibold text-slate-500 text-right">
                  {dayDemand && dayDemand.revenue > 0 ? `$${Math.round(dayDemand.revenue).toLocaleString()}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
