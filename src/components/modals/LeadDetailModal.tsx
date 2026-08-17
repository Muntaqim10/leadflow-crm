'use client';

import React from 'react';
import {
  CalendarDays,
  Sparkles,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { Lead, User } from '@/types/crm';
import { calculateLeadScore, getLeadBookingType, formatStayRange, formatCreatedDateDisplay } from '@/lib/calculations';

interface LeadDetailModalProps {
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  leadDetailsTab: 'details' | 'timeline';
  setLeadDetailsTab: (tab: 'details' | 'timeline') => void;
  users: User[];
  canDeleteLeads: boolean;
  formClientName: string;
  setFormClientName: (val: string) => void;
  formCompanyName: string;
  setFormCompanyName: (val: string) => void;
  formEmail: string;
  setFormEmail: (val: string) => void;
  formPhone: string;
  setFormPhone: (val: string) => void;
  formCheckIn: string;
  setFormCheckIn: (val: string) => void;
  formCheckOut: string;
  setFormCheckOut: (val: string) => void;
  formRevenue: string;
  setFormRevenue: (val: string) => void;
  formLeadSource: string;
  setFormLeadSource: (val: string) => void;
  formManager: string;
  setFormManager: (val: string) => void;
  formSegment: string;
  setFormSegment: (val: string) => void;
  formStatus: string;
  setFormStatus: (val: string) => void;
  formLostReason: string;
  setFormLostReason: (val: string) => void;
  formDetails: string;
  setFormDetails: (val: string) => void;
  formEventRoomRate: string;
  setFormEventRoomRate: (val: string) => void;
  formGuestRooms: Array<{ type: string; count: string; rate: string }>;
  setFormGuestRooms: (rooms: Array<{ type: string; count: string; rate: string }>) => void;
  formAccessories: Array<{ name: string; price: string }>;
  setFormAccessories: (accessories: Array<{ name: string; price: string }>) => void;
  formEventDetails: string;
  setFormEventDetails: (val: string) => void;
  formDocumentUrl: string;
  setFormDocumentUrl: (val: string) => void;
  formDocumentName: string;
  setFormDocumentName: (val: string) => void;
  isUploading: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveLead: (e: React.FormEvent) => void;
  formatRoomDetailsDisplay: (details: string) => string;
  handleDownloadFile: (url: string, name: string) => void;
  isSchedulingAppointment: boolean;
  setIsSchedulingAppointment: (val: boolean) => void;
  handleSaveAppointment: (e: React.FormEvent) => void;
  appointmentType: string;
  setAppointmentType: (val: string) => void;
  appointmentDate: string;
  setAppointmentDate: (val: string) => void;
  appointmentTime: string;
  setAppointmentTime: (val: string) => void;
  appointmentSaving: boolean;
  todayStr: string;
  aiTemplateType: string;
  setAiTemplateType: (val: string) => void;
  setIsAiModalOpen: (open: boolean) => void;
  handleGenerateAiEmail: () => void;
  newNoteText: string;
  setNewNoteText: (val: string) => void;
  handleSaveActivityNote: (e: React.FormEvent) => void;
  activitySaving: boolean;
  leadActivities: any[];
  handleDeleteLead: (id: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  selectedLead,
  setSelectedLead,
  isEditing,
  setIsEditing,
  leadDetailsTab,
  setLeadDetailsTab,
  users,
  canDeleteLeads,
  formClientName,
  setFormClientName,
  formCompanyName,
  setFormCompanyName,
  formEmail,
  setFormEmail,
  formPhone,
  setFormPhone,
  formCheckIn,
  setFormCheckIn,
  formCheckOut,
  setFormCheckOut,
  formRevenue,
  setFormRevenue,
  formLeadSource,
  setFormLeadSource,
  formManager,
  setFormManager,
  formSegment,
  setFormSegment,
  formStatus,
  setFormStatus,
  formLostReason,
  setFormLostReason,
  formDetails,
  setFormDetails,
  formEventRoomRate,
  setFormEventRoomRate,
  formGuestRooms,
  setFormGuestRooms,
  formAccessories,
  setFormAccessories,
  formEventDetails,
  setFormEventDetails,
  formDocumentUrl,
  setFormDocumentUrl,
  formDocumentName,
  setFormDocumentName,
  isUploading,
  handleFileChange,
  handleSaveLead,
  formatRoomDetailsDisplay,
  handleDownloadFile,
  isSchedulingAppointment,
  setIsSchedulingAppointment,
  handleSaveAppointment,
  appointmentType,
  setAppointmentType,
  appointmentDate,
  setAppointmentDate,
  appointmentTime,
  setAppointmentTime,
  appointmentSaving,
  todayStr,
  aiTemplateType,
  setAiTemplateType,
  setIsAiModalOpen,
  handleGenerateAiEmail,
  newNoteText,
  setNewNoteText,
  handleSaveActivityNote,
  activitySaving,
  leadActivities,
  handleDeleteLead
}) => {
  if (!selectedLead) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`bg-white border border-slate-200 rounded-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
          isEditing ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-base">Lead Record Details</h3>
          <button
            onClick={() => {
              setSelectedLead(null);
              setIsEditing(false);
            }}
            className="text-slate-500 hover:text-slate-700 font-semibold text-lg"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {isEditing ? (
            /* Edit Lead Form */
            <form onSubmit={handleSaveLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Miller"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Company / Group Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Miller Reunion"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Check In</label>
                  <input
                    type="date"
                    required
                    value={formCheckIn}
                    onChange={(e) => setFormCheckIn(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Check Out</label>
                  <input
                    type="date"
                    required
                    value={formCheckOut}
                    onChange={(e) => setFormCheckOut(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Revenue Potential ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formRevenue}
                    onChange={(e) => setFormRevenue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Assigned Manager</label>
                  <select
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Source</label>
                  <select
                    value={formLeadSource}
                    onChange={(e) => setFormLeadSource(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  >
                    <option value="OTA">OTA</option>
                    <option value="direct">Direct</option>
                    <option value="walk-in">Walk-in</option>
                    <option value="email">Email</option>
                    <option value="sales_call">Sales Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Market Segment</label>
                  <select
                    value={formSegment}
                    onChange={(e) => setFormSegment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  >
                    <option value="corporate">Corporate</option>
                    <option value="leisure">Leisure</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                {formStatus === 'lost' && (
                  <div>
                    <label className="block text-rose-600 font-bold mb-1">Reason Lost</label>
                    <select
                      value={formLostReason}
                      required
                      onChange={(e) => setFormLostReason(e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded-lg p-2.5 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-800 font-medium"
                    >
                      <option value="">-- Select Reason --</option>
                      <option value="Rate Too High">Rate Too High</option>
                      <option value="Unavailable Dates">Unavailable Dates</option>
                      <option value="Space Too Small">Space Too Small</option>
                      <option value="Competitor">Competitor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Event Room</label>
                    <select
                      value={formDetails}
                      onChange={(e) => {
                        setFormDetails(e.target.value);
                        if (e.target.value && !formEventRoomRate) {
                          setFormEventRoomRate('500');
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 font-medium"
                    >
                      <option value="">-- Select Event Room --</option>
                      <option value="Lincoln">Lincoln</option>
                      <option value="Alexander">Alexander</option>
                      <option value="Alexander 1">Alexander 1</option>
                      <option value="Alexander 2">Alexander 2</option>
                    </select>
                  </div>
                  {formDetails && (
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">
                        Room Rental Price ($)
                        {formEventRoomRate && !isNaN(Number(formEventRoomRate)) && (
                          <span className="ml-2 text-[11px] text-indigo-600 font-bold">
                            (+ ${(Number(formEventRoomRate) * 0.06).toFixed(2)} tax, $
                            {(Number(formEventRoomRate) * 0.2).toFixed(2)} gratuity)
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formEventRoomRate}
                        onChange={(e) => setFormEventRoomRate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                        placeholder="e.g. 500"
                      />
                    </div>
                  )}
                </div>

                <div className="col-span-2 space-y-3">
                  <label className="block text-slate-600 font-bold mb-1">Guest Rooms</label>
                  {formGuestRooms.map((room, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 relative bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <label className="block text-slate-500 font-semibold text-xs mb-1">Type</label>
                        <select
                          value={room.type}
                          onChange={(e) => {
                            const newRooms = [...formGuestRooms];
                            newRooms[index].type = e.target.value;
                            setFormGuestRooms(newRooms);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-semibold"
                        >
                          <option value="">-- None --</option>
                          <option value="TQNN">TQNN</option>
                          <option value="KSBN">KSBN</option>
                          <option value="KNGN">KNGN</option>
                          <option value="KACN">KACN</option>
                          <option value="KWLN">KWLN</option>
                          <option value="KWBN">KWBN</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold text-xs mb-1">Count</label>
                        <input
                          type="number"
                          min="0"
                          value={room.count}
                          onChange={(e) => {
                            const newRooms = [...formGuestRooms];
                            newRooms[index].count = e.target.value;
                            setFormGuestRooms(newRooms);
                          }}
                          placeholder="e.g. 10"
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold text-xs mb-1">
                          Daily Rate ($)
                          {room.rate && !isNaN(Number(room.rate)) && (
                            <span className="ml-2 text-[11px] text-indigo-600 font-bold">
                              (+ ${(Number(room.rate) * 0.15).toFixed(2)} nightly tax)
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={room.rate}
                          onChange={(e) => {
                            const newRooms = [...formGuestRooms];
                            newRooms[index].rate = e.target.value;
                            setFormGuestRooms(newRooms);
                          }}
                          placeholder="e.g. 189"
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newRooms = formGuestRooms.filter((_, i) => i !== index);
                          setFormGuestRooms(newRooms);
                        }}
                        className="absolute -top-2 -right-2 bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10"
                        title="Remove Room Type"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormGuestRooms([...formGuestRooms, { type: '', count: '', rate: '189' }])}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Room Block
                  </button>
                </div>

                {/* Accessories & Add-ons Block */}
                <div className="col-span-2 space-y-3">
                  <label className="block text-slate-600 font-bold mb-1">Accessories & Add-ons</label>
                  {formAccessories.map((acc, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 relative bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <label className="block text-slate-500 font-semibold text-xs mb-1">Accessory / Add-on Name</label>
                        <input
                          type="text"
                          value={acc.name}
                          onChange={(e) => {
                            const newAcc = [...formAccessories];
                            newAcc[index].name = e.target.value;
                            setFormAccessories(newAcc);
                          }}
                          placeholder="e.g. AV Package, Coffee Break, Audio System"
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold text-xs mb-1">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={acc.price}
                          onChange={(e) => {
                            const newAcc = [...formAccessories];
                            newAcc[index].price = e.target.value;
                            setFormAccessories(newAcc);
                          }}
                          placeholder="e.g. 150"
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 text-xs font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newAcc = formAccessories.filter((_, i) => i !== index);
                          setFormAccessories(newAcc);
                        }}
                        className="absolute -top-2 -right-2 bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10"
                        title="Remove Accessory"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormAccessories([...formAccessories, { name: '', price: '' }])}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Accessory / Add-on
                  </button>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Additional Event Details</label>
                  <textarea
                    value={formEventDetails}
                    onChange={(e) => setFormEventDetails(e.target.value)}
                    rows={3}
                    placeholder="e.g. Catering needs, setup requirements, special requests..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-3 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 font-medium"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Attached Document (Proposal/Contract)</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
                    {formDocumentUrl ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-sky-400 font-bold shrink-0">📎</span>
                          <span className="text-slate-800 truncate font-medium">
                            {formDocumentName || 'Attached Document'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormDocumentUrl('');
                            setFormDocumentName('');
                          }}
                          className="text-rose-400 hover:text-rose-300 font-semibold text-xs ml-2 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-[#27354E] hover:border-blue-500/50 rounded-lg cursor-pointer transition-all hover:bg-slate-100">
                          <span className="text-slate-500 font-medium text-xs">
                            {isUploading ? 'Uploading file...' : '📎 Select Proposal / Contract'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            disabled={isUploading}
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-[#1A212E] text-white py-2.5 rounded-lg border border-[#303650] hover:bg-[#222B3F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            /* View Details Panel */
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{selectedLead.name_company}</h4>
                  <p className="text-slate-500 mt-1">
                    {selectedLead.email} | {selectedLead.phone || 'No phone'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const bookingType = getLeadBookingType(selectedLead.rooms_or_event_details);
                    return (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${bookingType.badgeClass}`}>
                        {bookingType.icon} {bookingType.label}
                      </span>
                    );
                  })()}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/10 text-sky-400 border border-blue-500/20 capitalize">
                    {selectedLead.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex border-b border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setLeadDetailsTab('details')}
                  className={`pb-2 px-4 border-b-2 transition-all ${
                    leadDetailsTab === 'details'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  👤 Details
                </button>
                <button
                  onClick={() => setLeadDetailsTab('timeline')}
                  className={`pb-2 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                    leadDetailsTab === 'timeline'
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📝 Timeline & Notes
                  {leadActivities.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {leadActivities.length}
                    </span>
                  )}
                </button>
              </div>

              {leadDetailsTab === 'details' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">📅 Stay Dates</span>
                      <strong className="text-slate-800 text-xs">
                        {formatStayRange(selectedLead.check_in_date, selectedLead.check_out_date)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">📥 Inquiry Created</span>
                      <strong className="text-indigo-600 text-xs font-semibold">
                        {formatCreatedDateDisplay(selectedLead.created_at)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">Revenue Potential</span>
                      <strong className="text-emerald-600 text-xs font-bold">
                        ${parseFloat(selectedLead.revenue_potential || '0').toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">Win Probability</span>
                      {(() => {
                        const score = calculateLeadScore(selectedLead);
                        return (
                          <strong
                            className={`text-xs font-bold ${
                              selectedLead.status === 'confirmed'
                                ? 'text-emerald-600'
                                : selectedLead.status === 'lost'
                                ? 'text-slate-400'
                                : score >= 70
                                ? 'text-emerald-600'
                                : score >= 40
                                ? 'text-sky-500'
                                : 'text-rose-500'
                            }`}
                          >
                            {selectedLead.status === 'confirmed'
                              ? '🏆 100%'
                              : selectedLead.status === 'lost'
                              ? '0%'
                              : `🎯 ${score}%`}
                          </strong>
                        );
                      })()}
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">Source</span>
                      <strong className="text-slate-800 text-xs capitalize">
                        {selectedLead.lead_source.replace(/_/g, ' ')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">Segment</span>
                      <strong className="text-slate-800 text-xs capitalize">
                        {selectedLead.market_segment.replace(/_/g, ' ')}
                      </strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 font-bold block mb-0.5">Rooms & Event Details</span>
                      <p className="text-slate-800 mt-1 text-xs flex items-center gap-1.5">
                        <span className="font-semibold">
                          {formatRoomDetailsDisplay(selectedLead.rooms_or_event_details)}
                        </span>
                      </p>
                    </div>

                    {selectedLead.document_url && (
                      <div className="col-span-2 border-t border-slate-200 pt-3 mt-1">
                        <span className="text-slate-500 font-bold block mb-0.5 mb-1.5 uppercase tracking-wider text-[10px]">
                          Attached Document
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadFile(
                              selectedLead.document_url || '',
                              selectedLead.document_name || 'document'
                            )
                          }
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600 text-sky-400 hover:text-white rounded-lg border border-blue-500/20 text-xs font-bold transition-all cursor-pointer"
                        >
                          <span>📎</span>
                          <span>{selectedLead.document_name || 'Download Document'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Schedule Appointment Block */}
                  <div className="space-y-3 pt-2">
                    <span className="text-slate-600 font-bold block">📅 Schedule Appointment</span>
                    {isSchedulingAppointment ? (
                      <form
                        onSubmit={handleSaveAppointment}
                        className="bg-blue-50 border border-blue-200 p-3 rounded-lg space-y-3 animate-fadeIn"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                              Type
                            </label>
                            <select
                              value={appointmentType}
                              onChange={(e) => setAppointmentType(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded p-2 text-xs outline-none focus:border-blue-500"
                            >
                              <option value="Site Tour">Site Tour</option>
                              <option value="Phone Call">Phone Call</option>
                              <option value="Zoom Meeting">Zoom Meeting</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                              Date
                            </label>
                            <input
                              type="date"
                              required
                              min={todayStr}
                              value={appointmentDate}
                              onChange={(e) => setAppointmentDate(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded p-2 text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                              Time
                            </label>
                            <input
                              type="time"
                              required
                              value={appointmentTime}
                              onChange={(e) => setAppointmentTime(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded p-2 text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setIsSchedulingAppointment(false)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={appointmentSaving}
                            className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {appointmentSaving ? 'Saving...' : 'Confirm'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsSchedulingAppointment(true)}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 font-semibold py-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
                      >
                        <CalendarDays className="h-4 w-4" />
                        <span>Book an Appointment</span>
                      </button>
                    )}
                  </div>

                  {/* AI email generator buttons */}
                  <div className="space-y-3 pt-2">
                    <span className="text-slate-600 font-bold block">AI Follow-Up Safeguard Generator</span>
                    <div className="flex gap-2">
                      <select
                        value={aiTemplateType}
                        onChange={(e) => setAiTemplateType(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-[#1F3A60]"
                      >
                        <option value="thank_you">
                          Thank-You Email {selectedLead.status === 'new' ? '(Recommended)' : ''}
                        </option>
                        <option value="follow_up_reminder">
                          Proposal Follow-Up {selectedLead.status === 'proposal_sent' ? '(Recommended)' : ''}
                        </option>
                        <option value="gentle_reminder">
                          Gentle Reminder {selectedLead.status === 'negotiation' ? '(Recommended)' : ''}
                        </option>
                        <option value="booking_confirmation">
                          Booking Confirmation {selectedLead.status === 'confirmed' ? '(Recommended)' : ''}
                        </option>
                        <option value="feedback_request">
                          Feedback Request {selectedLead.status === 'lost' ? '(Recommended)' : ''}
                        </option>
                      </select>

                      <button
                        onClick={() => {
                          setIsAiModalOpen(true);
                          handleGenerateAiEmail();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2 rounded-lg transition-all active:scale-95 shadow-sm"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Generate AI Email</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Timeline and Notes Tab Content */
                <div className="space-y-4">
                  <form onSubmit={handleSaveActivityNote} className="space-y-2">
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Add a custom activity note or sales manager update..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:bg-white focus:border-blue-500 transition-all text-xs"
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={activitySaving || !newNoteText.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                      >
                        {activitySaving ? 'Saving...' : 'Add Note'}
                      </button>
                    </div>
                  </form>

                  <div className="border-t border-slate-100 pt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {leadActivities.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No activity history logged yet. Action items and notes will appear here.
                      </div>
                    ) : (
                      leadActivities.map((act: any) => {
                        let icon = '📝';
                        let iconBg = 'bg-slate-100 text-slate-700 border border-slate-200';
                        if (act.activity_type === 'status_change') {
                          icon = '🔄';
                          iconBg = 'bg-amber-100 text-amber-700 border border-amber-200';
                        } else if (act.activity_type === 'email_generated') {
                          icon = '✉️';
                          iconBg = 'bg-purple-100 text-purple-700 border border-purple-200';
                        } else if (act.activity_type === 'appointment_scheduled') {
                          icon = '📅';
                          iconBg = 'bg-blue-100 text-blue-700 border border-blue-200';
                        } else if (act.activity_type === 'appointment_cancelled') {
                          icon = '🚫';
                          iconBg = 'bg-rose-100 text-rose-700 border border-rose-200';
                        } else if (act.activity_type === 'document_uploaded') {
                          icon = '📎';
                          iconBg = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                        }

                        return (
                          <div key={act.id} className="flex gap-3 text-xs text-left animate-fadeIn">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${iconBg}`}>
                              {icon}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-slate-800 font-medium leading-relaxed">{act.description}</p>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                <span>
                                  {new Date(act.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {act.performed_by && (
                                  <>
                                    <span>•</span>
                                    <span>By: {act.performed_by}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Action items */}
              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1A212E] text-white py-2.5 rounded-lg border border-[#303650] hover:bg-[#222B3F]"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Record</span>
                </button>
                {canDeleteLeads && (
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-lg border border-rose-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Lead</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
