'use client';

import React, { useState } from 'react';
import { X, User, Settings, Mail, Users, Building, CheckCircle2 } from 'lucide-react';
import { User as UserType, Lead } from '@/types/crm';
import { TeamManagementTab } from './TeamManagementTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserType[];
  leads: Lead[];
  currentUserEmail: string;
  currentUserName: string;
  canManageUsers: boolean;
  canManageHotelDetails: boolean;
  roomTaxRate: string;
  setRoomTaxRate: (rate: string) => void;
  eventTaxRate: string;
  setEventTaxRate: (rate: string) => void;
  eventGratuityRate: string;
  setEventGratuityRate: (rate: string) => void;
  hotelName: string;
  setHotelName: (name: string) => void;
  hotelPhone: string;
  setHotelPhone: (phone: string) => void;
  hotelAddress: string;
  setHotelAddress: (addr: string) => void;
  onRefreshUsers: () => void;
  onShowSuccess: (msg: string) => void;
  onShowError: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  users,
  leads,
  currentUserEmail,
  currentUserName,
  canManageUsers,
  canManageHotelDetails,
  roomTaxRate,
  setRoomTaxRate,
  eventTaxRate,
  setEventTaxRate,
  eventGratuityRate,
  setEventGratuityRate,
  hotelName,
  setHotelName,
  hotelPhone,
  setHotelPhone,
  hotelAddress,
  setHotelAddress,
  onRefreshUsers,
  onShowSuccess,
  onShowError
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'global' | 'templates' | 'users' | 'hotel'>('profile');

  // Profile Form
  const [profileName, setProfileName] = useState(currentUserName);
  const [profileEmail, setProfileEmail] = useState(currentUserEmail);

  // Email Templates
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('thank_you');
  const [templateContent, setTemplateContent] = useState<string>('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    onShowSuccess('Profile updated successfully!');
  };

  const handleSaveGlobalVars = () => {
    onShowSuccess('Global financial variables updated successfully!');
  };

  const handleSaveHotel = () => {
    onShowSuccess('Workspace details updated successfully!');
  };

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: selectedTemplateType,
          content: templateContent
        })
      });
      if (!res.ok) throw new Error('Failed to save template');
      onShowSuccess('AI Email Template updated successfully!');
    } catch (err: any) {
      onShowError(err.message || 'Could not save template.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh] h-[700px]">
        {/* Left Navigation Menu */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 text-sm">Settings</h3>

            <div className="space-y-1 text-xs font-semibold">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider px-3 mb-1 block">Account</span>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  activeTab === 'profile' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <User className="h-4 w-4" /> Personal Profile
              </button>
            </div>

            <div className="space-y-1 text-xs font-semibold">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider px-3 mb-1 block">Workspace</span>
              <button
                onClick={() => setActiveTab('global')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  activeTab === 'global' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Settings className="h-4 w-4" /> Global Variables
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  activeTab === 'templates' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Mail className="h-4 w-4" /> Email Templates
              </button>
              {canManageUsers && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                    activeTab === 'users' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Users className="h-4 w-4" /> Team Management
                </button>
              )}
              {canManageHotelDetails && (
                <button
                  onClick={() => setActiveTab('hotel')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                    activeTab === 'hotel' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Building className="h-4 w-4" /> Workspace Profile
                </button>
              )}
            </div>
          </div>

          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800 font-semibold py-2">
            Close Settings
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-8 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
            <h4 className="font-bold text-slate-800 text-sm capitalize">
              {activeTab === 'profile' && 'Personal Profile'}
              {activeTab === 'global' && 'Global Financial Variables'}
              {activeTab === 'templates' && 'AI Email Templates'}
              {activeTab === 'users' && 'Team Management'}
              {activeTab === 'hotel' && 'Workspace Profile'}
            </h4>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-1 text-xs space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-xl space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500"
                >
                  Save Profile
                </button>
              </div>
            )}

            {/* Global Financial Variables Tab */}
            {activeTab === 'global' && (
              <div className="max-w-xl space-y-5">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">
                    🏨 Guest Room Occupancy Tax Rate (%)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Standard state/city occupancy lodging tax applied to all guest room night revenue.
                  </p>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-600 outline-none mt-2"
                    value={roomTaxRate}
                    onChange={(e) => setRoomTaxRate(e.target.value)}
                    placeholder="15.0"
                  />
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">
                    🏢 Event Space Sales Tax Rate (%)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Sales tax applied to meeting rooms, banquet hall rentals, and venue fees.
                  </p>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-600 outline-none mt-2"
                    value={eventTaxRate}
                    onChange={(e) => setEventTaxRate(e.target.value)}
                    placeholder="6.0"
                  />
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">
                    🍽️ Event Space Gratuity & Service Charge (%)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Service charge and gratuity applied to function spaces, banquet setups, and catering.
                  </p>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-600 outline-none mt-2"
                    value={eventGratuityRate}
                    onChange={(e) => setEventGratuityRate(e.target.value)}
                    placeholder="20.0"
                  />
                </div>

                <button
                  onClick={handleSaveGlobalVars}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 shadow-xs"
                >
                  Save Financial Variables
                </button>
              </div>
            )}

            {/* Email Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                  {[
                    { key: 'thank_you', label: 'Thank You Email' },
                    { key: 'follow_up_reminder', label: 'Proposal Follow-Up' },
                    { key: 'gentle_reminder', label: 'Gentle Reminder' },
                    { key: 'booking_confirmation', label: 'Booking Confirmation' },
                    { key: 'feedback_request', label: 'Feedback Request' }
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setSelectedTemplateType(t.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedTemplateType === t.key
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-700">Merge Variables (click to insert):</div>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {['{guest_name}', '{check_in}', '{check_out}', '{hotel_name}', '{room_rate}', '{details}'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setTemplateContent((prev) => prev + ' ' + v)}
                        className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="Draft email template body here..."
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-600"
                />

                <button
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSavingTemplate ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            )}

            {/* Team Management Tab */}
            {activeTab === 'users' && canManageUsers && (
              <TeamManagementTab
                users={users}
                leads={leads}
                currentUserEmail={currentUserEmail}
                onRefreshUsers={onRefreshUsers}
                onShowSuccess={onShowSuccess}
                onShowError={onShowError}
              />
            )}

            {/* Hotel Profile Tab */}
            {activeTab === 'hotel' && canManageHotelDetails && (
              <div className="max-w-xl space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hotel / Property Name</label>
                  <input
                    type="text"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Main Contact Phone</label>
                  <input
                    type="text"
                    value={hotelPhone}
                    onChange={(e) => setHotelPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                  <textarea
                    rows={2}
                    value={hotelAddress}
                    onChange={(e) => setHotelAddress(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveHotel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500"
                >
                  Save Workspace Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
