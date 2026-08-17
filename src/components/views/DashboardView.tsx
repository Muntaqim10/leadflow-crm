'use client';

import React from 'react';
import {
  Users,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Trash2,
  AlertTriangle,
  CalendarDays,
  Plus
} from 'lucide-react';
import { Lead, User } from '@/types/crm';
import { getTodayDate, formatStayRange, formatCreatedDateDisplay } from '@/lib/calculations';

interface TaskItem {
  id: string;
  description: string;
  assignee_id?: string;
  assignee?: { id: string; name: string };
  lead_id?: string;
  lead?: { id: string; name_company: string };
  due_date?: string;
  status: 'pending' | 'completed';
}

interface DashboardViewProps {
  startDate: string;
  endDate: string;
  analytics: any;
  filteredLeads: Lead[];
  leads: Lead[];
  activeLeads: Lead[];
  users: User[];
  allActiveLeadsForSearch: Lead[];
  tasksFilter: 'mine' | 'all';
  setTasksFilter: (filter: 'mine' | 'all') => void;
  showCompletedTasks: boolean;
  setShowCompletedTasks: (show: boolean) => void;
  newTaskDescription: string;
  setNewTaskDescription: (desc: string) => void;
  newTaskAssignee: string;
  setNewTaskAssignee: (id: string) => void;
  taskLeadSearchTerm: string;
  setTaskLeadSearchTerm: (term: string) => void;
  newTaskLeadId: string;
  setNewTaskLeadId: (id: string) => void;
  newTaskDueDate: string;
  setNewTaskDueDate: (date: string) => void;
  handleCreateTask: (e: React.FormEvent) => void;
  isFetchingTasks: boolean;
  filteredTeamTasks: TaskItem[];
  handleToggleTaskStatus: (taskId: string, currentStatus: string) => void;
  handleDeleteTask: (taskId: string) => void;
  setSelectedLead: (lead: Lead) => void;
  formatRoomDetailsDisplay: (details: string) => string;
  heatmap: any;
  liveAppointments: any[];
  setActiveAppointment: (apt: any) => void;
  onScheduleAppointment?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  startDate,
  endDate,
  analytics,
  filteredLeads,
  leads,
  activeLeads,
  users,
  allActiveLeadsForSearch,
  tasksFilter,
  setTasksFilter,
  showCompletedTasks,
  setShowCompletedTasks,
  newTaskDescription,
  setNewTaskDescription,
  newTaskAssignee,
  setNewTaskAssignee,
  taskLeadSearchTerm,
  setTaskLeadSearchTerm,
  newTaskLeadId,
  setNewTaskLeadId,
  newTaskDueDate,
  setNewTaskDueDate,
  handleCreateTask,
  isFetchingTasks,
  filteredTeamTasks,
  handleToggleTaskStatus,
  handleDeleteTask,
  setSelectedLead,
  formatRoomDetailsDisplay,
  heatmap,
  liveAppointments,
  setActiveAppointment,
  onScheduleAppointment
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              {startDate || endDate ? 'Filtered Leads' : 'Total Leads'}
            </span>
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/10 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
            {analytics?.summary.totalLeads || filteredLeads.length}
          </h3>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">Live</span> database connection
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Conversion Rate</span>
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/10 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
            {analytics?.summary.conversionRate ? `${analytics.summary.conversionRate.toFixed(1)}%` : '0%'}
          </h3>
          <div className="text-[11px] text-slate-500 mt-2">
            Confirmed / Total leads
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Confirmed Revenue</span>
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-sky-500 border border-blue-500/10 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
            ${analytics?.summary.revenueGenerated.toLocaleString() || '0'}
          </h3>
          <div className="text-[11px] text-emerald-600 font-medium mt-2">
            Converted bookings
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Potential Revenue</span>
            <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600 border border-sky-100 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
            ${analytics?.summary.potentialRevenue.toLocaleString() || '0'}
          </h3>
          <div className="text-[11px] text-sky-600 font-medium mt-2">
            Excludes Lost leads
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Team Tasks (Left Column) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-base">Team Tasks</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setTasksFilter('mine')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    tasksFilter === 'mine' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  My Tasks
                </button>
                <button
                  onClick={() => setTasksFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    tasksFilter === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Team Tasks
                </button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-slate-700">
                <input
                  type="checkbox"
                  checked={showCompletedTasks}
                  onChange={(e) => setShowCompletedTasks(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Show Completed
              </label>
            </div>
          </div>

          <form onSubmit={handleCreateTask} className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 space-y-2.5">
            <div>
              <input
                type="text"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="New task description..."
                className="w-full bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-blue-500 text-xs text-slate-800"
                required
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="flex-1 min-w-[120px] bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-blue-500 text-xs text-slate-700"
              >
                <option value="">Assign To</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <div className="flex-1 min-w-[130px]">
                <input
                  list="leads-list"
                  type="text"
                  value={
                    taskLeadSearchTerm ||
                    (newTaskLeadId ? allActiveLeadsForSearch.find((l) => l.id === newTaskLeadId)?.name_company || '' : '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setTaskLeadSearchTerm(val);
                    const matchedLead = allActiveLeadsForSearch.find((l) => l.name_company === val);
                    if (matchedLead) {
                      setNewTaskLeadId(matchedLead.id);
                    } else {
                      setNewTaskLeadId('');
                    }
                  }}
                  placeholder="Link Lead (Search...)"
                  className="w-full bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-blue-500 text-xs text-slate-700"
                />
                <datalist id="leads-list">
                  {allActiveLeadsForSearch
                    .filter((l) => !taskLeadSearchTerm || l.name_company.toLowerCase().includes(taskLeadSearchTerm.toLowerCase()))
                    .slice(0, 10)
                    .map((l) => (
                      <option key={l.id} value={l.name_company} />
                    ))}
                </datalist>
              </div>
              <input
                type="datetime-local"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="flex-1 min-w-[170px] bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-blue-500 text-xs text-slate-700"
              />
              <button
                type="submit"
                disabled={!newTaskDescription.trim()}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-md text-xs transition-colors disabled:opacity-50 shadow-xs"
              >
                + Add Task
              </button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {isFetchingTasks ? (
              <div className="text-center py-4 text-slate-400 text-xs">Loading tasks...</div>
            ) : filteredTeamTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No tasks found in this view.
              </div>
            ) : (
              filteredTeamTasks.map((task) => (
                <div
                  key={task.id}
                  className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    task.status === 'completed'
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/50 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <button
                    onClick={() => handleToggleTaskStatus(task.id, task.status)}
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      task.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 hover:border-emerald-500'
                    }`}
                  >
                    {task.status === 'completed' && <span className="text-xs leading-none">✓</span>}
                  </button>
                  <div
                    className="flex-1 min-w-0"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName !== 'BUTTON' && task.lead_id) {
                        const lead = leads.find((l) => l.id === task.lead_id);
                        if (lead) setSelectedLead(lead);
                      }
                    }}
                  >
                    <p
                      className={`text-sm font-medium ${
                        task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800'
                      }`}
                    >
                      {task.description}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-slate-500 font-medium">
                      {task.assignee?.name && (
                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          👤 {task.assignee.name}
                        </span>
                      )}
                      {task.lead?.name_company && (
                        <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          🏢 {task.lead.name_company}
                        </span>
                      )}
                      {task.due_date && (
                        <span
                          className={`flex items-center gap-1 ${
                            new Date(task.due_date) < new Date() && task.status !== 'completed'
                              ? 'text-rose-600 bg-rose-50'
                              : 'text-slate-600 bg-slate-100'
                          } px-1.5 py-0.5 rounded`}
                        >
                          📅 Due:{' '}
                          {new Date(task.due_date).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="shrink-0 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Follow-ups and Alerts (Right Sidebar) */}
        <div className="lg:col-span-1 flex flex-col gap-8 h-[700px]">
          {/* Urgency Widget: Today's Follow-Ups */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">Follow-Ups</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
                Due
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {activeLeads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-500/30 transition-all cursor-pointer flex items-center justify-between group"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-[#2563EB] transition-colors">
                      {lead.name_company}
                    </h4>
                    <div className="flex flex-col gap-0.5 mt-1 text-[10px]">
                      <div className="text-slate-700 font-semibold flex items-center gap-1">
                        <span>📅 Stay:</span> {formatStayRange(lead.check_in_date, lead.check_out_date)}
                      </div>
                      {lead.created_at && (
                        <div className="text-indigo-600 font-medium">
                          📥 Inquired: {formatCreatedDateDisplay(lead.created_at)}
                        </div>
                      )}
                      <span className="text-slate-500 line-clamp-1">
                        {formatRoomDetailsDisplay(lead.rooms_or_event_details)}
                      </span>
                      <span className="text-emerald-600 font-bold">
                        ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button className="p-1.5 bg-blue-600/10 hover:bg-blue-600 text-sky-400 hover:text-white rounded-lg transition-all group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {activeLeads.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <CheckCircle2 className="h-8 w-8 text-slate-600" />
                  <p className="text-sm">Caught up!</p>
                </div>
              )}
            </div>
          </div>

          {/* High-Demand Dates alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-sky-400" />
              <h3 className="font-bold text-slate-800 text-base">Demand Alerts</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              <div className="space-y-2">
                {heatmap &&
                  Object.entries(heatmap)
                    .sort((a: any, b: any) => b[1].count - a[1].count)
                    .slice(0, 4)
                    .map(([date, info]: [string, any]) => (
                      <div key={date} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-rose-500/10 rounded text-rose-400 border border-rose-500/10 font-bold text-[9px]">
                            HOT
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 leading-none">{date}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{info.count} inquiries</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-emerald-400">
                            ${Math.round(info.revenue).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}

                {(!heatmap || Object.keys(heatmap).length === 0) && (
                  <div className="h-24 flex flex-col items-center justify-center text-slate-600 text-xs text-center">
                    No demand data.
                    <br />
                    Populate stays first.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Upcoming Appointments</h3>
          </div>
          {onScheduleAppointment && (
            <button
              onClick={onScheduleAppointment}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Schedule a new appointment"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Appointment</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {(() => {
            const todayStr = getTodayDate();
            const upcoming = (liveAppointments || []).filter((apt: any) => apt.appointment_date >= todayStr).slice(0, 5);

            if (upcoming.length === 0) {
              return (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 min-h-[150px] py-4">
                  <CalendarDays className="h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium">No upcoming appointments scheduled.</p>
                </div>
              );
            }

            return upcoming.map((apt: any) => (
              <div
                key={apt.id}
                onClick={() => setActiveAppointment(apt)}
                className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between"
                title="Click to view details, reschedule, or cancel appointment"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
                      apt.type === 'Site Tour'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : apt.type === 'Zoom Meeting'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {apt.type === 'Site Tour' ? '📍' : apt.type === 'Zoom Meeting' ? '💻' : '📞'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{apt.leads?.name_company || 'Unknown Lead'}</h4>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span className="font-semibold">
                        {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{apt.appointment_time}</span>
                      <span>•</span>
                      <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold border border-slate-200 text-slate-700">
                        {apt.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Host</div>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold uppercase text-slate-600 border border-slate-200">
                      {apt.users?.name ? apt.users.name.substring(0, 2) : '??'}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">{apt.users?.name || 'Unassigned'}</div>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};
