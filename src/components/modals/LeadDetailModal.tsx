'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  FileText,
  Printer,
  Sparkles,
  Trash2,
  Plus,
  Paperclip,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';
import { Lead, User, Activity, Task } from '@/types/crm';
import { calculateLeadScore, getLeadBookingType, parseRoomDetails } from '@/lib/calculations';
import { generateAgreementHtml } from '@/lib/agreements';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  canDeleteLeads: boolean;
  roomTaxRate?: string;
  eventTaxRate?: string;
  eventGratuityRate?: string;
  hotelName?: string;
  onUpdateLead: (leadPayload: any) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onOpenAiDraft: (lead: Lead) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  users,
  canDeleteLeads,
  roomTaxRate = '15.0',
  eventTaxRate = '6.0',
  eventGratuityRate = '20.0',
  hotelName = 'Hotel Flow Grand',
  onUpdateLead,
  onDeleteLead,
  onOpenAiDraft
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'tasks' | 'agreement'>('details');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form states
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leadSource, setLeadSource] = useState('email');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [status, setStatus] = useState('new');
  const [revenue, setRevenue] = useState('0');
  const [assignedManager, setAssignedManager] = useState('1');
  const [marketSegment, setMarketSegment] = useState('leisure');
  const [lostReason, setLostReason] = useState('');

  // Timeline activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState('');

  // Lead tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  useEffect(() => {
    if (lead) {
      const parts = (lead.name_company || '').split(' / ');
      setClientName(parts[0] || '');
      setCompanyName(parts[1] || '');
      setEmail(lead.email || '');
      setPhone(lead.phone || '');
      setLeadSource(lead.lead_source || 'email');
      setCheckIn(lead.check_in_date || '');
      setCheckOut(lead.check_out_date || '');
      setStatus(lead.status || 'new');
      setRevenue(lead.revenue_potential || '0');
      setAssignedManager(lead.assigned_sales_manager_id || '1');
      setMarketSegment(lead.market_segment || 'leisure');
      setLostReason(lead.lost_reason || '');

      // Fetch activities
      fetch(`/api/leads/${lead.id}/activities`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setActivities)
        .catch(() => setActivities([]));

      // Fetch tasks
      fetch(`/api/leads/${lead.id}/tasks`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setTasks)
        .catch(() => setTasks([]));
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const booking = getLeadBookingType(lead.rooms_or_event_details);
  const score = calculateLeadScore(lead);
  const assignedUser = users.find((u) => u.id === lead.assigned_sales_manager_id);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const combinedName = clientName.trim() + (companyName.trim() ? ` / ${companyName.trim()}` : '');

    const payload = {
      ...lead,
      name_company: combinedName,
      email,
      phone,
      lead_source: leadSource,
      check_in_date: checkIn,
      check_out_date: checkOut,
      status,
      revenue_potential: revenue,
      assigned_sales_manager_id: assignedManager,
      market_segment: marketSegment,
      lost_reason: status === 'lost' ? lostReason : null
    };

    await onUpdateLead(payload);
    setIsEditing(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'note_added',
          description: newNote.trim(),
          performed_by: 'Staff'
        })
      });
      if (res.ok) {
        const added = await res.json();
        setActivities([added, ...activities]);
        setNewNote('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;

    try {
      const res = await fetch(`/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          assigned_to: assignedManager,
          description: newTaskDesc.trim(),
          due_date: newTaskDue || new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        const created = await res.json();
        setTasks([...tasks, created]);
        setNewTaskDesc('');
        setNewTaskDue('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const agreementHtml = generateAgreementHtml(lead, {
    hotelName,
    roomTaxRate,
    eventTaxRate,
    eventGratuityRate
  });

  const handlePrintAgreement = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Agreement - ${lead.name_company}</title>
            <style>
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; color: #1E293B; }
              @media print {
                body { padding: 0; }
                button { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${agreementHtml}
            <script>
              window.onload = () => { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {lead.name_company.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{lead.name_company}</h3>
              <p className="text-[11px] text-slate-500">{lead.email} | {lead.phone || 'No phone'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${booking.badgeClass}`}>
              {booking.icon} {booking.label}
            </span>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'details' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            👤 Lead Details
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'timeline' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 Timeline & Notes ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'tasks' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ✅ Follow-up Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('agreement')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'agreement' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📄 Contract Agreement
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
          {activeTab === 'details' && (
            <>
              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Client Name</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Check In</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Check Out</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      >
                        <option value="new">New Inquiry</option>
                        <option value="contacted">Contacted</option>
                        <option value="proposal_sent">Proposal Sent</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Revenue Potential ($)</label>
                      <input
                        type="number"
                        value={revenue}
                        onChange={(e) => setRevenue(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Stay Dates</span>
                      <strong className="text-slate-800 text-xs">{lead.check_in_date} to {lead.check_out_date}</strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Revenue Potential</span>
                      <strong className="text-emerald-600 text-xs font-bold">
                        ${parseFloat(lead.revenue_potential || '0').toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Win Probability</span>
                      <strong className="text-amber-600 text-xs font-bold">{score}%</strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Assigned Agent</span>
                      <strong className="text-slate-800 text-xs">{assignedUser?.name || 'Unassigned'}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3.5 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit Details
                      </button>
                      <button
                        onClick={() => onOpenAiDraft(lead)}
                        className="px-3.5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 flex items-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Generate AI Email
                      </button>
                    </div>

                    {canDeleteLeads && (
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Lead
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a timeline note or follow-up update..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                  Add Note
                </button>
              </form>

              <div className="space-y-3 pt-2">
                {activities.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">No activity logged yet.</div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span className="font-bold text-slate-700 capitalize">{act.activity_type.replace(/_/g, ' ')}</span>
                        <span>{new Date(act.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800 text-xs">{act.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New follow-up task description..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                />
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                  Add Task
                </button>
              </form>

              <div className="space-y-2 pt-2">
                {tasks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">No pending follow-ups for this lead.</div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-800">{task.description}</span>
                      </div>
                      <span className="text-[11px] text-blue-600 font-semibold">Due: {task.due_date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'agreement' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Official Group Agreement Document</span>
                <button
                  onClick={handlePrintAgreement}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Print / Save as PDF
                </button>
              </div>

              <div
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs overflow-y-auto max-h-96"
                dangerouslySetInnerHTML={{ __html: agreementHtml }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
