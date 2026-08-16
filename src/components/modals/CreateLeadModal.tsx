'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { User } from '@/types/crm';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
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
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  users,
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
  handleSaveLead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-base">Create New Lead Record</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 font-semibold text-lg"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
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
                <label className="block text-slate-600 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="guest@mail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1-555-0123"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Check In Date</label>
                <input
                  type="date"
                  required
                  value={formCheckIn}
                  onChange={(e) => setFormCheckIn(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Check Out Date</label>
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
                <label className="block text-slate-600 font-bold mb-1">Lead Source</label>
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
                <label className="block text-slate-600 font-bold mb-1">Assigned Sales Agent</label>
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
                  placeholder="e.g. Catering needs, setup requirements, special requests..."
                  value={formEventDetails}
                  onChange={(e) => setFormEventDetails(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#1F3A60] focus:ring-1 focus:ring-[#1F3A60] text-slate-800 h-20"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-600 font-bold mb-1">Attach Document (Proposal/Contract)</label>
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
                onClick={onClose}
                className="flex-1 bg-[#1A212E] text-white py-2.5 rounded-lg border border-[#303650] hover:bg-[#222B3F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-2.5 rounded-lg hover:from-blue-500 hover:to-sky-500 transition-all shadow-md"
              >
                Create Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
