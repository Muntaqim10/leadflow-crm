'use client';

import React from 'react';
import { User } from '@/types/crm';

interface QuickBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  quickBookDate: string;
  setQuickBookDate: (val: string) => void;
  quickBookTime: string;
  setQuickBookTime: (val: string) => void;
  quickBookType: string;
  setQuickBookType: (val: string) => void;
  quickBookClientName: string;
  setQuickBookClientName: (val: string) => void;
  quickBookAgentId: string;
  setQuickBookAgentId: (val: string) => void;
  users: User[];
  handleSaveQuickAppointment: (e: React.FormEvent) => void;
  apptSaving: boolean;
  todayStr: string;
}

export const QuickBookModal: React.FC<QuickBookModalProps> = ({
  isOpen,
  onClose,
  quickBookDate,
  setQuickBookDate,
  quickBookTime,
  setQuickBookTime,
  quickBookType,
  setQuickBookType,
  quickBookClientName,
  setQuickBookClientName,
  quickBookAgentId,
  setQuickBookAgentId,
  users,
  handleSaveQuickAppointment,
  apptSaving,
  todayStr
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-base">📅 Quick Book Appointment</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSaveQuickAppointment} className="p-6 space-y-4 text-xs text-slate-700">
          <div className="space-y-1">
            <label className="font-bold block">Selected Date</label>
            <input
              type="date"
              min={todayStr}
              value={quickBookDate}
              onChange={(e) => setQuickBookDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold block">Time</label>
              <input
                type="text"
                value={quickBookTime}
                onChange={(e) => setQuickBookTime(e.target.value)}
                placeholder="e.g. 10:00 AM"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold block">Type</label>
              <select
                value={quickBookType}
                onChange={(e) => setQuickBookType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
              >
                <option value="Site Tour">📍 Site Tour</option>
                <option value="Zoom Meeting">💻 Zoom Meeting</option>
                <option value="Phone Call">📞 Phone Call</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold block">Client Name</label>
            <input
              type="text"
              value={quickBookClientName}
              onChange={(e) => setQuickBookClientName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-800"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold block">Host Agent</label>
            <select
              value={quickBookAgentId}
              onChange={(e) => setQuickBookAgentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={apptSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {apptSaving ? 'Saving...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
