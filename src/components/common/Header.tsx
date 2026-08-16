'use client';

import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onRefresh: () => void;
  dateFilterType: 'created_at' | 'check_in';
  onDateFilterTypeChange: (type: 'created_at' | 'check_in') => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  todayStr: string;
  onOpenNewLeadModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onRefresh,
  dateFilterType,
  onDateFilterTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  todayStr,
  onOpenNewLeadModal
}) => {
  const viewTitle =
    activeTab === 'kanban'
      ? 'Leads View'
      : activeTab === 'heatmap'
      ? 'Calendar View'
      : activeTab === 'analytics'
      ? 'Analytics View'
      : 'Dashboard View';

  const showDateFilter = activeTab === 'dashboard' || activeTab === 'kanban' || activeTab === 'analytics';

  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-slate-200 bg-slate-50 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 capitalize">{viewTitle}</h2>
        <button
          onClick={onRefresh}
          className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh database data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Date Filter */}
        {showDateFilter && (
          <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 shadow-xs">
            <select
              value={dateFilterType}
              onChange={(e) => onDateFilterTypeChange(e.target.value as 'created_at' | 'check_in')}
              className="bg-transparent font-bold text-[10px] uppercase text-slate-500 px-2 outline-none border-r border-slate-200 cursor-pointer"
            >
              <option value="created_at">Created Date</option>
              <option value="check_in">Stay Dates</option>
            </select>
            <input
              type="date"
              value={startDate}
              max={dateFilterType === 'created_at' ? todayStr : undefined}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent px-2 py-0.5 outline-none text-slate-800 focus:text-blue-600 font-medium"
            />
            <span className="text-slate-400 font-medium">to</span>
            <input
              type="date"
              value={endDate}
              max={dateFilterType === 'created_at' ? todayStr : undefined}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent px-2 py-0.5 outline-none text-slate-800 focus:text-blue-600 font-medium"
            />
          </div>
        )}

        <button
          onClick={onOpenNewLeadModal}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lead</span>
        </button>
      </div>
    </header>
  );
};
