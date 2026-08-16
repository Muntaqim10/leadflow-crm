'use client';

import React from 'react';
import { User } from '@/types/crm';

interface AppointmentDetailModalProps {
  activeAppointment: any;
  setActiveAppointment: (apt: any) => void;
  isEditingAppointment: boolean;
  setIsEditingAppointment: (editing: boolean) => void;
  editApptDate: string;
  setEditApptDate: (date: string) => void;
  editApptTime: string;
  setEditApptTime: (time: string) => void;
  editApptType: string;
  setEditApptType: (type: string) => void;
  editApptAgentId: string;
  setEditApptAgentId: (id: string) => void;
  users: User[];
  handleUpdateAppointment: (e: React.FormEvent) => void;
  handleDeleteAppointment: (id: string) => void;
  apptSaving: boolean;
  todayStr: string;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  activeAppointment,
  setActiveAppointment,
  isEditingAppointment,
  setIsEditingAppointment,
  editApptDate,
  setEditApptDate,
  editApptTime,
  setEditApptTime,
  editApptType,
  setEditApptType,
  editApptAgentId,
  setEditApptAgentId,
  users,
  handleUpdateAppointment,
  handleDeleteAppointment,
  apptSaving,
  todayStr
}) => {
  if (!activeAppointment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-base">
            {isEditingAppointment ? '✏️ Edit Appointment' : '📅 Appointment Details'}
          </h3>
          <button
            onClick={() => setActiveAppointment(null)}
            className="text-slate-500 hover:text-slate-700 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {isEditingAppointment ? (
          <form onSubmit={handleUpdateAppointment} className="p-6 space-y-4 text-xs text-slate-700">
            <div className="space-y-1">
              <label className="font-bold block">Date</label>
              <input
                type="date"
                min={todayStr}
                value={editApptDate}
                onChange={(e) => setEditApptDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold block">Time</label>
                <input
                  type="text"
                  value={editApptTime}
                  onChange={(e) => setEditApptTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block">Type</label>
                <select
                  value={editApptType}
                  onChange={(e) => setEditApptType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-blue-500 focus:bg-white outline-none"
                >
                  <option value="Site Tour">📍 Site Tour</option>
                  <option value="Zoom Meeting">💻 Zoom Meeting</option>
                  <option value="Phone Call">📞 Phone Call</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold block">Host Agent</label>
              <select
                value={editApptAgentId}
                onChange={(e) => setEditApptAgentId(e.target.value)}
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
                onClick={() => setIsEditingAppointment(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={apptSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {apptSaving ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6 text-xs text-slate-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Scheduled For:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {new Date(activeAppointment.appointment_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-500">Time:</span>
                <span className="font-semibold text-slate-800">{activeAppointment.appointment_time}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-500">Type:</span>
                <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {activeAppointment.type}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-500">Client / Lead:</span>
                <span className="font-semibold text-slate-800">
                  {activeAppointment.leads?.name_company || 'Unknown Lead'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-500">Host Agent:</span>
                <span className="font-semibold text-slate-800">
                  {activeAppointment.users?.name || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditingAppointment(true)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold border border-slate-200 transition-colors"
              >
                ✏️ Reschedule
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAppointment(activeAppointment.id)}
                className="flex-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 py-2 rounded-lg font-semibold transition-colors"
              >
                🚫 Cancel Meeting
              </button>
              <button
                type="button"
                onClick={() => setActiveAppointment(null)}
                className="px-4 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
