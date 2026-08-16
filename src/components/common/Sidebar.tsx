'use client';

import React from 'react';
import {
  TrendingUp,
  Briefcase,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentUserName: string;
  currentUserRole: string;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUserName,
  currentUserRole,
  onOpenSettings,
  onSignOut
}) => {
  const initials = currentUserName
    ? currentUserName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="w-64 bg-[#0F1E36] text-white flex flex-col justify-between border-r border-[#1F3A60] shrink-0 h-screen select-none">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#1F3A60]">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white leading-tight">Leadflow</h1>
            <p className="text-[10px] text-blue-200/70 font-medium">SALES PLATFORM</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600/10 text-sky-400 border border-blue-500/20'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
            <ChevronRight className={`h-3 w-3 opacity-60 ${activeTab === 'dashboard' ? 'block' : 'hidden'}`} />
          </button>

          <button
            onClick={() => setActiveTab('kanban')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'kanban'
                ? 'bg-blue-600/10 text-sky-400 border border-blue-500/20'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4" />
              <span>Leads</span>
            </div>
            <ChevronRight className={`h-3 w-3 opacity-60 ${activeTab === 'kanban' ? 'block' : 'hidden'}`} />
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600/10 text-sky-400 border border-blue-500/20'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </div>
            <ChevronRight className={`h-3 w-3 opacity-60 ${activeTab === 'analytics' ? 'block' : 'hidden'}`} />
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'heatmap'
                ? 'bg-blue-600/10 text-sky-400 border border-blue-500/20'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </div>
            <ChevronRight className={`h-3 w-3 opacity-60 ${activeTab === 'heatmap' ? 'block' : 'hidden'}`} />
          </button>
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-white/10 bg-[#162945] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{currentUserName}</div>
            <div className="text-[10px] text-blue-200/70 truncate">{currentUserRole}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={onSignOut}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
