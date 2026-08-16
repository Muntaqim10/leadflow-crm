'use client';

import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'kanban' | 'analytics' | 'heatmap' | 'templates';
  fetchData: () => void;
  dateFilterType: 'created_at' | 'check_in';
  setDateFilterType: (type: 'created_at' | 'check_in') => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  todayStr: string;
  getDefaultStartDate: () => string;
  getDefaultEndDate: () => string;
  getPastWeekStartDate: () => string;
  getTodayDate: () => string;
  getCurrentMonthStartDate: () => string;
  getCurrentMonthEndDate: () => string;
  onAddLead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  fetchData,
  dateFilterType,
  setDateFilterType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  todayStr,
  getDefaultStartDate,
  getDefaultEndDate,
  getPastWeekStartDate,
  getTodayDate,
  getCurrentMonthStartDate,
  getCurrentMonthEndDate,
  onAddLead
}) => {
  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-slate-200 bg-slate-50 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 capitalize">
          {activeTab === 'kanban'
            ? 'Leads View'
            : activeTab === 'heatmap'
            ? 'Calendar View'
            : `${activeTab} view`}
        </h2>
        <button
          onClick={fetchData}
          className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh database data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Global Date Filter Controls for Dashboard, Leads (Kanban), and Analytics */}
      {(activeTab === 'dashboard' || activeTab === 'kanban' || activeTab === 'analytics') && (
        <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 shadow-sm">
          <select
            value={dateFilterType}
            onChange={(e) => {
              const newType = e.target.value as 'created_at' | 'check_in';
              setDateFilterType(newType);
              if (newType === 'created_at') {
                setStartDate(getPastWeekStartDate());
                setEndDate(getTodayDate());
              } else {
                setStartDate(getCurrentMonthStartDate());
                setEndDate(getCurrentMonthEndDate());
              }
            }}
            className="bg-transparent font-bold text-[10px] uppercase text-slate-500 px-2 outline-none border-r border-slate-200 cursor-pointer"
          >
            <option value="created_at">Created Date</option>
            <option value="check_in">Stay Dates</option>
          </select>
          <input
            type="date"
            value={startDate}
            max={dateFilterType === 'created_at' ? todayStr : undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent px-2 py-0.5 outline-none text-slate-800 focus:text-blue-600 font-medium"
          />
          <span className="text-slate-400 font-medium">to</span>
          <input
            type="date"
            value={endDate}
            max={dateFilterType === 'created_at' ? todayStr : undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent px-2 py-0.5 outline-none text-slate-800 focus:text-blue-600 font-medium"
          />
          {(startDate !== getDefaultStartDate() ||
            (dateFilterType === 'created_at' ? endDate !== todayStr : endDate !== getDefaultEndDate())) && (
            <button
              onClick={() => {
                setStartDate(getDefaultStartDate());
                setEndDate(dateFilterType === 'created_at' ? todayStr : getDefaultEndDate());
              }}
              className="text-slate-400 hover:text-slate-600 font-bold px-2 cursor-pointer text-sm"
              title="Clear date filter"
            >
              &times;
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={onAddLead}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lead</span>
        </button>
      </div>
    </header>
  );
};
