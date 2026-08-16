'use client';

import React, { useState } from 'react';
import { User as UserType, Lead } from '@/types/crm';
import { Plus, Edit2, Trash2, Shield, AlertTriangle, ShieldCheck, Briefcase, Eye } from 'lucide-react';

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
  templates: any[];
  selectedTemplateType: string;
  setSelectedTemplateType: (type: string) => void;
  templateContent: string;
  setTemplateContent: React.Dispatch<React.SetStateAction<string>>;
  handleSaveTemplate: () => void;
  isSavingTemplate: boolean;
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
  templates,
  selectedTemplateType,
  setSelectedTemplateType,
  templateContent,
  setTemplateContent,
  handleSaveTemplate,
  isSavingTemplate,
  onRefreshUsers,
  onShowSuccess,
  onShowError
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'global' | 'templates' | 'users' | 'hotel'>('profile');
  const [profileName, setProfileName] = useState(currentUserName);
  const [profileEmail, setProfileEmail] = useState(currentUserEmail);

  // User Management modals inside Settings
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Sales Agent');
  const [newUserTier, setNewUserTier] = useState<'admin' | 'sales' | 'read_only'>('sales');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('Sales Agent');
  const [editUserTier, setEditUserTier] = useState<'admin' | 'sales' | 'read_only'>('sales');
  const [isEditingUserSubmitting, setIsEditingUserSubmitting] = useState(false);

  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [reassignUserId, setReassignUserId] = useState('');
  const [confirmDeleteChecked, setConfirmDeleteChecked] = useState(false);
  const [isDeletingUserSubmitting, setIsDeletingUserSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole.trim() || 'Sales Agent',
          permission_tier: newUserTier,
          password: newUserPassword || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to add user');

      onShowSuccess(`User ${newUserName} created successfully!`);
      setIsAddUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('Sales Agent');
      setNewUserTier('sales');
      setNewUserPassword('');
      onRefreshUsers();
    } catch (err: any) {
      onShowError(err.message || 'Could not add user.');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsEditingUserSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editUserName.trim(),
          role: editUserRole.trim() || 'Sales Agent',
          permission_tier: editUserTier
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to update user');

      onShowSuccess(`User ${editUserName} updated successfully!`);
      setEditingUser(null);
      onRefreshUsers();
    } catch (err: any) {
      onShowError(err.message || 'Could not update user.');
    } finally {
      setIsEditingUserSubmitting(false);
    }
  };

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingUser || !confirmDeleteChecked) return;
    setIsDeletingUserSubmitting(true);
    try {
      const url = `/api/users?id=${encodeURIComponent(deletingUser.id)}${
        reassignUserId ? `&reassignTo=${encodeURIComponent(reassignUserId)}` : ''
      }`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete user');

      onShowSuccess(`User ${deletingUser.name} deleted and records reassigned.`);
      setDeletingUser(null);
      onRefreshUsers();
    } catch (err: any) {
      onShowError(err.message || 'Could not delete user.');
    } finally {
      setIsDeletingUserSubmitting(false);
    }
  };

  const otherUsers = users.filter((u) => u.id !== deletingUser?.id);

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
        <div className="bg-slate-50 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-700/10">
          {/* Sidebar */}
          <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm relative z-10">
            <div className="h-16 flex items-center px-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Settings</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</div>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveSettingsTab('profile')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeSettingsTab === 'profile'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Personal Profile
                  </button>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace</div>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveSettingsTab('global')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeSettingsTab === 'global'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Global Variables
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab('templates')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeSettingsTab === 'templates'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Email Templates
                  </button>
                  {canManageUsers && (
                    <button
                      onClick={() => setActiveSettingsTab('users')}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeSettingsTab === 'users'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      Team Management
                    </button>
                  )}
                  {canManageHotelDetails && (
                    <button
                      onClick={() => setActiveSettingsTab('hotel')}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeSettingsTab === 'hotel'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      Workspace Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
            {/* Topbar */}
            <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
              <h3 className="font-semibold text-slate-800">
                {activeSettingsTab === 'profile' && 'Personal Profile'}
                {activeSettingsTab === 'global' && 'Global Variables'}
                {activeSettingsTab === 'templates' && 'AI Email Templates'}
                {activeSettingsTab === 'users' && 'Team Management'}
                {activeSettingsTab === 'hotel' && 'Workspace Profile'}
              </h3>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12">
              {activeSettingsTab === 'profile' && (
                <div className="max-w-2xl space-y-6">
                  <h4 className="text-lg font-medium text-slate-900">Personal Profile</h4>
                  <p className="text-sm text-slate-500">Update your personal contact information and email signature.</p>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Your Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onShowSuccess('Personal profile details saved!')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {activeSettingsTab === 'global' && (
                <div className="max-w-2xl space-y-6">
                  <h4 className="text-lg font-medium text-slate-900">Global Financial Variables</h4>
                  <p className="text-sm text-slate-500">
                    Define distinct tax rates and service charges for rooms, event rentals, and banquet catering.
                  </p>

                  <div className="grid gap-5">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <label className="block text-sm font-bold text-slate-800">
                        🏨 Guest Room Occupancy Tax Rate (%)
                      </label>
                      <p className="text-xs text-slate-500">
                        Standard state/city occupancy lodging tax applied to all guest room night revenue.
                      </p>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none mt-2"
                        value={roomTaxRate}
                        onChange={(e) => setRoomTaxRate(e.target.value)}
                        placeholder="15.0"
                      />
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <label className="block text-sm font-bold text-slate-800">
                        🏢 Event Space Sales Tax Rate (%)
                      </label>
                      <p className="text-xs text-slate-500">
                        Sales tax applied to meeting rooms, banquet hall rentals, and venue fees.
                      </p>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none mt-2"
                        value={eventTaxRate}
                        onChange={(e) => setEventTaxRate(e.target.value)}
                        placeholder="6.0"
                      />
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <label className="block text-sm font-bold text-slate-800">
                        🍽️ Event Space Gratuity & Service Charge (%)
                      </label>
                      <p className="text-xs text-slate-500">
                        Service charge and gratuity applied to function spaces, banquet setups, and catering.
                      </p>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none mt-2"
                        value={eventGratuityRate}
                        onChange={(e) => setEventGratuityRate(e.target.value)}
                        placeholder="20.0"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onShowSuccess('Financial variables updated successfully!')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                  >
                    Save Variables
                  </button>
                </div>
              )}

              {activeSettingsTab === 'templates' && (
                <div className="max-w-3xl space-y-6">
                  <h4 className="text-lg font-medium text-slate-900">Email Templates</h4>
                  <p className="text-sm text-slate-500">
                    Customize standard communication drafts used by the AI assistant and sales team.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'thank_you', label: 'Thank-You & Discovery' },
                      { id: 'follow_up_reminder', label: 'Proposal Follow-Up' },
                      { id: 'gentle_reminder', label: 'Gentle Reminder' },
                      { id: 'booking_confirmation', label: 'Booking Confirmation' },
                      { id: 'feedback_request', label: 'Feedback Request' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedTemplateType(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selectedTemplateType === tab.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 space-y-1.5 text-xs text-blue-900">
                    <span className="font-bold block">Available Merge Variables (click to insert):</span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                      {['{guest_name}', '{check_in}', '{check_out}', '{hotel_name}', '{room_rate}', '{details}'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setTemplateContent((prev) => prev + ' ' + v)}
                          className="bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer"
                        >
                          + {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={8}
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-blue-600 font-sans"
                      placeholder="Write your email template structure here..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isSavingTemplate ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              )}

              {activeSettingsTab === 'users' && canManageUsers && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">Team Management</h4>
                      <p className="text-sm text-slate-500">
                        Manage sales team member accounts, roles, and pipeline assignments.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add Team Member
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Position / Title</th>
                          <th className="py-3 px-4">Access Level</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                              No team members found. Click &quot;+ Add Team Member&quot; to invite someone.
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => {
                            const isCurrent = u.email?.toLowerCase() === currentUserEmail.toLowerCase();
                            const tier = u.permission_tier || (
                              u.role?.toLowerCase().includes('general manager') || u.role?.toLowerCase().includes('admin') || u.role?.toLowerCase().includes('supervisor') || u.role?.toLowerCase().includes('director')
                                ? 'admin'
                                : u.role?.toLowerCase().includes('read') || u.role?.toLowerCase().includes('viewer')
                                ? 'read_only'
                                : 'sales'
                            );

                            return (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  {u.name} {isCurrent && <span className="text-slate-400 font-normal ml-1">(You)</span>}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{u.email || '—'}</td>
                                <td className="py-3.5 px-4 font-medium text-slate-800">
                                  {u.role || 'Sales Agent'}
                                </td>
                                <td className="py-3.5 px-4">
                                  {tier === 'admin' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                      <ShieldCheck className="h-3 w-3 text-purple-600" /> Administrator
                                    </span>
                                  ) : tier === 'read_only' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      <Eye className="h-3 w-3 text-slate-500" /> Read-Only
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      <Briefcase className="h-3 w-3 text-blue-600" /> Sales Team
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right space-x-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUser(u);
                                      setEditUserName(u.name);
                                      setEditUserRole(u.role);
                                      setEditUserTier(tier);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  {!isCurrent ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeletingUser(u);
                                        setConfirmDeleteChecked(false);
                                        setReassignUserId(otherUsers[0]?.id || '');
                                      }}
                                      className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                                    >
                                      Delete User
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">(Current Account)</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'hotel' && canManageHotelDetails && (
                <div className="max-w-2xl space-y-6">
                  <h4 className="text-lg font-medium text-slate-900">Workspace & Property Profile</h4>
                  <p className="text-sm text-slate-500">
                    Set property name, contact details, and location for auto-generated proposals and agreements.
                  </p>

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Property / Hotel Name</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                        value={hotelName}
                        onChange={(e) => setHotelName(e.target.value)}
                        placeholder="Hotel Flow Grand"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Main Phone Number</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                        value={hotelPhone}
                        onChange={(e) => setHotelPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Physical Address</label>
                      <textarea
                        rows={3}
                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                        value={hotelAddress}
                        onChange={(e) => setHotelAddress(e.target.value)}
                        placeholder="123 Luxury Ave, New York, NY 10001"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onShowSuccess('Workspace details updated successfully!')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                  >
                    Save Property Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Add Team Member</h3>
                <p className="text-[11px] text-slate-500">Create an account and assign workspace position</p>
              </div>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800"
                />
              </div>

              {/* Permission Tier Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Permission / Access Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserTier('admin')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      newUserTier === 'admin'
                        ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/20 text-purple-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      <span>Admin</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5 leading-tight">Full access (taxes, users, delete)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewUserTier('sales')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      newUserTier === 'sales'
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Briefcase className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>Sales Team</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5 leading-tight">Manage deals, tasks & tours</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewUserTier('read_only')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      newUserTier === 'read_only'
                        ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-500/20 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Eye className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      <span>Read-Only</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5 leading-tight">View-only stays & calendar</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title / Position</label>
                <input
                  type="text"
                  required
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  placeholder="e.g. Corporate Sales Manager, Front Desk Supervisor"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800"
                />
                {/* Quick-fill Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium self-center mr-1">Suggestions:</span>
                  {[
                    'Sales Manager',
                    'Director of Sales',
                    'Corporate Account Executive',
                    'Event & Catering Specialist',
                    'Front Desk Supervisor',
                    'General Manager'
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setNewUserRole(sugg)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        newUserRole === sugg
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temporary Password (Optional)</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Leave empty to auto-generate secure password"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800"
                />
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  {isAddingUser ? 'Adding...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Team Member</h3>
                <p className="text-[11px] text-slate-500">Update name, access tier, or customize workspace position</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800"
                />
              </div>

              {/* Permission Tier Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Permission / Access Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditUserTier('admin')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      editUserTier === 'admin'
                        ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/20 text-purple-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      <span>Admin</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5 leading-tight">Full access (taxes, users, delete)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditUserTier('sales')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      editUserTier === 'sales'
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Briefcase className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>Sales Team</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5 leading-tight">Manage deals, tasks & tours</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditUserTier('read_only')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      editUserTier === 'read_only'
                        ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-500/20 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Eye className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      <span>Read-Only</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5 leading-tight">View-only stays & calendar</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title / Position</label>
                <input
                  type="text"
                  required
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  placeholder="e.g. Corporate Sales Manager, Front Desk Supervisor"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800"
                />
                {/* Quick-fill Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium self-center mr-1">Suggestions:</span>
                  {[
                    'Sales Manager',
                    'Director of Sales',
                    'Corporate Account Executive',
                    'Event & Catering Specialist',
                    'Front Desk Supervisor',
                    'General Manager'
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setEditUserRole(sugg)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        editUserRole === sugg
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingUserSubmitting}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  {isEditingUserSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete User Account</h3>
                <p className="text-[11px] text-slate-500">Reassign leads and remove login credentials</p>
              </div>
            </div>

            <form onSubmit={handleDeleteUser} className="space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">
                You are deleting <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.email}).
              </p>

              {otherUsers.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reassign active leads and appointments to:
                  </label>
                  <select
                    value={reassignUserId}
                    onChange={(e) => setReassignUserId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                  >
                    {otherUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-start gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={confirmDeleteChecked}
                  onChange={(e) => setConfirmDeleteChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-slate-600 text-[11px]">
                  I confirm that I want to remove this user from the workspace and reassign all associated data.
                </span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!confirmDeleteChecked || isDeletingUserSubmitting}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {isDeletingUserSubmitting ? 'Deleting...' : 'Delete & Reassign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
