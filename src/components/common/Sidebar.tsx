'use client';

import React from 'react';
import {
  TrendingUp,
  Briefcase,
  BarChart3,
  Calendar,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'kanban' | 'analytics' | 'heatmap' | 'templates';
  setActiveTab: (tab: 'dashboard' | 'kanban' | 'analytics' | 'heatmap' | 'templates') => void;
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
  return (
    <aside className="hidden md:flex w-64 bg-[#1F3A60] border-r border-[#1F3A60] flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center gap-3.5 border-b border-white/10 bg-[#1F3A60]">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl shadow-md border border-white/10 shrink-0">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-white tracking-wide leading-none">Leadflow</h1>
            <span className="text-[10px] text-blue-200/80 font-bold uppercase tracking-widest block mt-1.5">
              Sales Platform
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
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
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
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
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
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
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
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

      <div className="p-4 border-t border-white/10 bg-[#162945] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {currentUserName
              ? currentUserName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
              : 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{currentUserName}</div>
            <div className="text-[10px] text-blue-200/70 truncate">{currentUserRole || 'Front Desk Supervisor'}</div>
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
