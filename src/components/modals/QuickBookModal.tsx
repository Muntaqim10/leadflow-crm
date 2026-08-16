'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, User as UserIcon } from 'lucide-react';
import { User, Lead } from '@/types/crm';

interface QuickBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  leads: Lead[];
  defaultDate?: string;
  onShowSuccess: (msg: string) => void;
  onShowError: (msg: string) => void;
  onRefreshAppointments: () => void;
}

export const QuickBookModal: React.FC<QuickBookModalProps> = ({
  isOpen,
  onClose,
  users,
  leads,
  defaultDate,
  onShowSuccess,
  onShowError,
  onRefreshAppointments
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [selectedAgentId, setSelectedAgentId] = useState(users[0]?.id || '');
  const [type, setType] = useState('Site Tour');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      onShowError('Please select an active lead inquiry.');
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLeadId,
          agent_id: selectedAgentId || users[0]?.id,
          type,
          appointment_date: date,
          appointment_time: time
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to book appointment');

      onShowSuccess('Appointment scheduled successfully!');
      onRefreshAppointments();
      onClose();
    } catch (err: any) {
      onShowError(err.message || 'Could not schedule appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Schedule Tour / Consultation</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Lead Inquiry</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name_company} ({l.check_in_date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Meeting / Tour Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="Site Tour">🏛️ In-Person Site Tour</option>
              <option value="Zoom Meeting">💻 Zoom Video Conference</option>
              <option value="Phone Consultation">📞 Phone Consultation</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Host Agent</label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
