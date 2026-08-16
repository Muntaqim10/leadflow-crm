'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  Zap,
  Target,
  PieChart,
  HelpCircle
} from 'lucide-react';
import { Analytics } from '@/types/crm';

interface AnalyticsViewProps {
  analytics: Analytics | null;
  startDate: string;
  endDate: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  startDate,
  endDate
}) => {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const handleGenerateAiInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const res = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics, startDate, endDate })
      });
      const data = await res.json();
      setAiInsights(data.insights || 'No insights generated.');
    } catch (e) {
      setAiInsights('Could not generate AI insights at this time.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  if (!analytics) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
        <BarChart3 className="h-8 w-8 text-slate-300 mb-2 animate-pulse" />
        Loading analytics metrics...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Banner with AI Insights Generator */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" /> Sales Intelligence & Performance
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            Analyzing conversions from {startDate} to {endDate}.
          </p>
        </div>
        <button
          onClick={handleGenerateAiInsights}
          disabled={isGeneratingInsights}
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Zap className="h-4 w-4 fill-current" />
          {isGeneratingInsights ? 'Analyzing Metrics...' : 'Generate AI Executive Insights'}
        </button>
      </div>

      {/* AI Insights Card */}
      {aiInsights && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
            <Sparkles className="h-4 w-4" /> AI Revenue Director Summary
          </div>
          <div className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
            {aiInsights}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Speed to First Contact</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {analytics.speedToLeadMinutes > 0 ? `${analytics.speedToLeadMinutes} mins` : '< 15 mins'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Average response time to new inquiries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Average Deal Lead Time</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{analytics.avgLeadTimeDays} days</div>
          <p className="text-[11px] text-slate-400 mt-1">From inquiry to confirmed contract</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Overall Pipeline Win Rate</span>
            <Target className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{analytics.conversionRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">Total leads converted to booking</p>
        </div>
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source ROI */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Lead Source Value & Volume</h3>
          <div className="space-y-3">
            {analytics.leadsBySource.map((s) => (
              <div key={s.source} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="capitalize">{s.source}</span>
                  <span>
                    ${s.value.toLocaleString()} ({s.count} leads)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${analytics.totalPipelineValue > 0 ? (s.value / analytics.totalPipelineValue) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lost Reasons */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Lost Reasons Analysis</h3>
          <div className="space-y-3">
            {analytics.lostReasons.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No lost deals recorded in this window.</div>
            ) : (
              analytics.lostReasons.map((r) => (
                <div key={r.reason} className="flex items-center justify-between p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-xs">
                  <span className="font-semibold text-rose-900">{r.reason}</span>
                  <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {r.count} leads
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
