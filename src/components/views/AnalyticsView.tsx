'use client';

import React from 'react';
import {
  BarChart3,
  Sparkles,
  Download
} from 'lucide-react';
import { Lead } from '@/types/crm';
import { PIPELINE_STATUSES } from './KanbanView';

interface AnalyticsViewProps {
  contentRef: any;
  handleGenerateInsights: () => void;
  isGeneratingInsights: boolean;
  analytics: any;
  aiInsights: string | null;
  handleDownloadCSV: () => void;
  filteredLeads: Lead[];
  pieConicGradient: string;
  corporateCount: number;
  corporatePct: number;
  leisureCount: number;
  leisurePct: number;
  groupCount: number;
  groupPct: number;
  getInitials: (name: string) => string;
  totalConfirmedRev: number;
  confirmedRevBySegment: Record<string, number>;
  totalActivePipelineValue: number;
  pipelineValueByStage: Record<string, number>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  contentRef,
  handleGenerateInsights,
  isGeneratingInsights,
  analytics,
  aiInsights,
  handleDownloadCSV,
  filteredLeads,
  pieConicGradient,
  corporateCount,
  corporatePct,
  leisureCount,
  leisurePct,
  groupCount,
  groupPct,
  getInitials,
  totalConfirmedRev,
  confirmedRevBySegment,
  totalActivePipelineValue,
  pipelineValueByStage
}) => {
  return (
    <div className="space-y-8 print:space-y-4 animate-fadeIn" ref={contentRef}>
      {/* Print-only Header */}
      <div className="hidden print:block mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 rounded-lg p-2">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">LeadFlow</h1>
        </div>
        <h2 className="text-xl font-bold text-slate-700 mt-4">Pipeline & Analytics Report</h2>
        <p className="text-slate-500 font-medium mt-1">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* AI Executive Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24 text-blue-600" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Sparkles className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">AI Executive Summary</h2>
                <p className="text-xs text-slate-500">Groq-powered pipeline analysis</p>
              </div>
            </div>
            <button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights || !analytics}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer print:hidden"
            >
              {isGeneratingInsights ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Weekly Insights</span>
                </>
              )}
            </button>
          </div>

          {isGeneratingInsights && !aiInsights && (
            <div className="py-8 text-center animate-pulse">
              <p className="text-blue-600 font-medium text-sm">Groq Llama 3.1 analyzing pipeline data...</p>
            </div>
          )}

          {aiInsights && (
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-5 border border-white mt-4 shadow-sm">
              <ul className="space-y-4">
                {aiInsights
                  .split(/\n|\*(?=\s)/)
                  .filter((line) => line.trim().length > 0)
                  .map((line, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-500 mr-3 mt-1 text-lg leading-none">•</span>
                      <span className="text-slate-700 text-sm font-medium leading-relaxed">
                        {line.replace(/^\*\s*|^-\s*/, '').replace(/\*/g, '').trim()}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {!isGeneratingInsights && !aiInsights && (
            <p className="text-slate-500 text-sm mt-2">
              Click generate to analyze your current pipeline health, top performers, and areas of opportunity.
            </p>
          )}
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-8 print:gap-4">
        {/* Status count charts - CSS Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 text-base mb-6">Leads Count by Status</h3>
          <div className="space-y-4">
            {PIPELINE_STATUSES.map((status) => {
              const count = Number(analytics?.statusCounts?.[status.key as keyof typeof analytics.statusCounts] || 0);
              const statusCountsVals = Object.values(analytics?.statusCounts || { new: 1 }) as number[];
              const maxCount = Math.max(...statusCountsVals);
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={status.key} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${status.solidColor}`}></span>
                      <span className="capitalize">{status.label}</span>
                    </span>
                    <span className="text-slate-800 font-bold">{count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${status.solidColor}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Segment Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-2">Market Segment Share</h3>
            <p className="text-[11px] text-slate-500 mb-4">Distribution of leads across target markets</p>
          </div>

          <div className="flex justify-center items-center py-4">
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center relative shadow-lg"
              style={{ background: pieConicGradient }}
            >
              {/* Inner cutout for donut effect */}
              <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Leads</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-0.5">{filteredLeads.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center border-t border-slate-200 pt-4">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-sky-600">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Corporate</span>
              </div>
              <span className="text-xs font-bold text-slate-800 mt-1 block">
                {corporateCount} ({corporatePct.toFixed(0)}%)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Leisure</span>
              </div>
              <span className="text-xs font-bold text-slate-800 mt-1 block">
                {leisureCount} ({leisurePct.toFixed(0)}%)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Group</span>
              </div>
              <span className="text-xs font-bold text-slate-800 mt-1 block">
                {groupCount} ({groupPct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Sales agent performance */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 text-base mb-6">Sales Agent Conversions</h3>
          <div className="space-y-4">
            {analytics?.agentConversion.map((agent: any) => (
              <div key={agent.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1F3A60]/10 text-[#1F3A60] flex items-center justify-center font-bold text-xs">
                    {getInitials(agent.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{agent.name}</h4>
                    <span className="text-xs text-slate-600 font-medium">{agent.total} leads managed</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-600">{agent.conversionRate.toFixed(1)}%</span>
                  <div className="text-xs text-slate-500 mt-0.5">{agent.confirmed} closed bookings</div>
                </div>
              </div>
            ))}

            {(!analytics?.agentConversion || analytics.agentConversion.length === 0) && (
              <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                No agent performance records found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lost Reason Analysis & Lead Source Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4">
        {/* Lost Reasons chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 text-base mb-2">Lost Business Analysis</h3>
          <p className="text-[11px] text-slate-500 mb-6">Why leads were lost (reasons captured on status change)</p>

          <div className="space-y-4">
            {Object.entries(
              analytics?.lostReasons || {
                'Rate Too High': 0,
                'Unavailable Dates': 0,
                'Space Too Small': 0,
                Competitor: 0,
                Other: 0
              }
            ).map(([reason, count]: [string, any]) => {
              const lostVals = Object.values(analytics?.lostReasons || {}) as number[];
              const totalLost = lostVals.reduce((a: number, b: number) => a + Number(b), 0) || 1;
              const percentage = (Number(count) / totalLost) * 100;
              return (
                <div key={reason} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600 font-semibold">{reason}</span>
                    <span className="text-slate-800 font-bold">
                      {count} deals ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Source Performance Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-2">Lead Source Conversion & ROI</h3>
            <p className="text-[11px] text-slate-500 mb-4">Compare performance metrics across lead generation sources</p>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Source</th>
                  <th className="py-2.5 text-center">Total Leads</th>
                  <th className="py-2.5 text-center">Conversion</th>
                  <th className="py-2.5 text-right">Confirmed Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(analytics?.sourcePerformance || []).map((item: any) => (
                  <tr key={item.source} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-700 capitalize">{item.source.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 text-center text-slate-600">{item.total}</td>
                    <td className="py-2.5 text-center font-extrabold text-emerald-600">{item.conversionRate.toFixed(1)}%</td>
                    <td className="py-2.5 text-right font-extrabold text-slate-800">${item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {(!analytics?.sourcePerformance || analytics.sourcePerformance.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                      No source data available for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Financial & Pipeline Value Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4 my-8 print:my-4">
        {/* Card 1: Confirmed Revenue by Segment */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Confirmed Revenue by Segment</h3>
                <p className="text-[11px] text-slate-500">Actual converted bookings revenue contribution</p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 font-extrabold text-sm">
                ${totalConfirmedRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {[
                { key: 'corporate', label: 'Corporate', color: 'from-blue-600 to-blue-500', icon: '💼' },
                { key: 'leisure', label: 'Leisure', color: 'from-emerald-500 to-emerald-400', icon: '⛱️' },
                { key: 'group', label: 'Group / Events', color: 'from-indigo-600 to-indigo-500', icon: '👥' }
              ].map((seg) => {
                const val = confirmedRevBySegment[seg.key] || 0;
                const pct = totalConfirmedRev > 0 ? (val / totalConfirmedRev) * 100 : 0;
                return (
                  <div key={seg.key} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span>{seg.icon}</span>
                        <span>{seg.label}</span>
                      </span>
                      <span className="text-slate-800 font-bold">
                        ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full bg-gradient-to-r ${seg.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Total Pipeline Lead Value */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Pipeline Total Lead Value</h3>
                <p className="text-[11px] text-slate-500">Value of active leads in pipeline stages (excluding Lost)</p>
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100 font-extrabold text-sm">
                ${totalActivePipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {PIPELINE_STATUSES.filter((s) => s.key !== 'lost').map((status) => {
                const val = pipelineValueByStage[status.key] || 0;
                const pct = totalActivePipelineValue > 0 ? (val / totalActivePipelineValue) * 100 : 0;
                return (
                  <div key={status.key} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${status.solidColor}`}></span>
                        <span className="capitalize">{status.label}</span>
                      </span>
                      <span className="text-slate-800 font-bold">
                        ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${status.solidColor}`}
                        style={{
                          width: `${pct}%`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-8 print:gap-4">
        {/* Speed-to-lead */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Speed-to-Lead Response</h3>
            <p className="text-xs text-slate-600 font-medium">Average response hours (lead creation to first contact)</p>
          </div>

          <div className="my-4 text-center">
            <span className="text-3xl font-extrabold text-slate-800">
              {analytics?.avgResponseTimeHours ? `${analytics.avgResponseTimeHours.toFixed(1)}h` : 'N/A'}
            </span>
            <div className="mt-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              {analytics?.avgResponseTimeHours && analytics.avgResponseTimeHours < 24 ? (
                <span className="text-emerald-600 font-bold">● Meets SLA (&lt; 24h)</span>
              ) : analytics?.avgResponseTimeHours ? (
                <span className="text-rose-500 font-bold">▲ Exceeds SLA</span>
              ) : (
                <span>No contacts recorded</span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Agent Avg Hours</h4>
            {(analytics?.agentResponseTimes || []).map((agent: any) => (
              <div key={agent.id} className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">{agent.name}</span>
                <span className="font-bold text-slate-800">{agent.avgHours.toFixed(1)}h</span>
              </div>
            ))}
            {(!analytics?.agentResponseTimes || analytics.agentResponseTimes.length === 0) && (
              <div className="text-slate-500 text-xs italic">No logs recorded</div>
            )}
          </div>
        </div>

        {/* Booking Window */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Booking Window (Lead Time)</h3>
            <p className="text-xs text-slate-600 font-medium">Average days between booking and check-in date</p>
          </div>

          <div className="my-4 text-center">
            <span className="text-3xl font-extrabold text-slate-800">
              {analytics?.avgBookingLeadTime ? `${Math.round(analytics.avgBookingLeadTime)} days` : 'N/A'}
            </span>
            <div className="text-xs text-slate-500 mt-1 font-medium">Average across all closed bookings</div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Corporate</span>
              <span className="font-bold text-slate-800">
                {Math.round(analytics?.bookingLeadTimeBySegment?.corporate || 0)} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Leisure</span>
              <span className="font-bold text-slate-800">
                {Math.round(analytics?.bookingLeadTimeBySegment?.leisure || 0)} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Group Business</span>
              <span className="font-bold text-slate-800">
                {Math.round(analytics?.bookingLeadTimeBySegment?.group || 0)} days
              </span>
            </div>
          </div>
        </div>

        {/* Pipeline Velocity & Stagnant Leads warnings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Stagnant Leads Warning</h3>
            <p className="text-xs text-slate-600 font-medium">Leads in proposal/negotiation for over 10 days</p>
          </div>

          <div className="my-4 text-center">
            <span
              className={`text-4xl font-black ${
                analytics?.stagnantCount && analytics.stagnantCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-300'
              }`}
            >
              {analytics?.stagnantCount || 0}
            </span>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Stale Leads in Pipeline</div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Avg Days in Stage</h4>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">New Stage</span>
              <span className="font-bold text-slate-800">{Math.round(analytics?.averageDaysInStage?.new || 0)} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Proposal Sent</span>
              <span className="font-bold text-slate-800">
                {Math.round(analytics?.averageDaysInStage?.proposal_sent || 0)} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Negotiation</span>
              <span className="font-bold text-slate-800">
                {Math.round(analytics?.averageDaysInStage?.negotiation || 0)} days
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
