'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, User as UserIcon, X, AlertTriangle } from 'lucide-react';
import { User, Lead } from '@/types/crm';

interface TeamManagementTabProps {
  users: User[];
  leads: Lead[];
  currentUserEmail: string;
  onRefreshUsers: () => void;
  onShowSuccess: (msg: string) => void;
  onShowError: (msg: string) => void;
}

export const TeamManagementTab: React.FC<TeamManagementTabProps> = ({
  users,
  leads,
  currentUserEmail,
  onRefreshUsers,
  onShowSuccess,
  onShowError
}) => {
  // Add User Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Sales Agent');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('Sales Agent');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete / Offboarding Modal
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [reassignId, setReassignId] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          role: newRole,
          password: newPassword || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to add user');

      onShowSuccess(`User ${newName} created successfully!`);
      setIsAddOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      onRefreshUsers();
    } catch (err: any) {
      onShowError(err.message || 'Could not add user.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName.trim(),
          role: editRole
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to update user');

      onShowSuccess(`User ${editName} updated successfully!`);
      setEditingUser(null);
      onRefreshUsers();
    } catch (err: any) {
      onShowError(err.message || 'Could not update user.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingUser || !confirmChecked) return;
    setIsDeleting(true);

    try {
      const url = `/api/users?id=${encodeURIComponent(deletingUser.id)}${reassignId ? `&reassignTo=${encodeURIComponent(reassignId)}` : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete user');

      onShowSuccess(`User ${deletingUser.name} removed and records reassigned.`);
      setDeletingUser(null);
      onRefreshUsers();
    } catch (err: any) {
      onShowError(err.message || 'Could not delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const otherUsers = users.filter((u) => u.id !== deletingUser?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">Team Management</h4>
          <p className="text-sm text-slate-500">Manage sales team member accounts, roles, and pipeline assignments.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Team Member
        </button>
      </div>

      {/* Users Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  No team members found. Click &quot;+ Add Team Member&quot; to invite someone.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isCurrent = u.email?.toLowerCase() === currentUserEmail.toLowerCase();

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {u.name} {isCurrent && <span className="text-slate-400 font-normal ml-1">(You)</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {u.email || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(u);
                          setEditName(u.name);
                          setEditRole(u.role);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Edit
                      </button>
                      {!isCurrent ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingUser(u);
                            setConfirmChecked(false);
                            setReassignId(otherUsers[0]?.id || '');
                          }}
                          className="text-rose-600 hover:text-rose-800 font-semibold"
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

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Add Team Member</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                >
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Director of Sales">Director of Sales</option>
                  <option value="Front Desk Supervisor">Front Desk Supervisor</option>
                  <option value="General Manager">General Manager</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temporary Password (Optional)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty to auto-generate"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {isSubmittingAdd ? 'Adding...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Edit Team Member</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                >
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Director of Sales">Director of Sales</option>
                  <option value="Front Desk Supervisor">Front Desk Supervisor</option>
                  <option value="General Manager">General Manager</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Reassign User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                    value={reassignId}
                    onChange={(e) => setReassignId(e.target.value)}
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
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
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
                  disabled={!confirmChecked || isDeleting}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete & Reassign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
