'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Paperclip, X } from 'lucide-react';
import { User } from '@/types/crm';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  roomTaxRate?: string;
  eventTaxRate?: string;
  eventGratuityRate?: string;
  onSaveLead: (leadPayload: any) => Promise<void>;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  users,
  roomTaxRate = '15.0',
  eventTaxRate = '6.0',
  eventGratuityRate = '20.0',
  onSaveLead
}) => {
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leadSource, setLeadSource] = useState('email');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [assignedManager, setAssignedManager] = useState(users[0]?.id || '1');
  const [marketSegment, setMarketSegment] = useState('leisure');

  const [eventRoom, setEventRoom] = useState('');
  const [eventRoomRate, setEventRoomRate] = useState('500');
  const [eventDetails, setEventDetails] = useState('');
  const [guestRooms, setGuestRooms] = useState<{ type: string; count: string; rate: string }[]>([]);
  const [accessories, setAccessories] = useState<{ name: string; price: string }[]>([]);

  const [revenue, setRevenue] = useState('0');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Auto-calculate revenue potential with dynamic tax rates
  useEffect(() => {
    let subtotal = 0;
    let roomRevenue = 0;

    if (checkIn && checkOut && guestRooms.length > 0) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diff = Math.abs(end.getTime() - start.getTime());
      const nights = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;

      guestRooms.forEach((r) => {
        const count = parseInt(r.count) || 0;
        const rate = parseFloat(r.rate) || 0;
        roomRevenue += count * rate * nights;
      });
    }

    const roomTaxMultiplier = 1 + (parseFloat(roomTaxRate) || 15) / 100;
    subtotal += roomRevenue * roomTaxMultiplier;

    if (eventRoom) {
      const eRate = parseFloat(eventRoomRate) || 0;
      const eventTaxMultiplier = 1 + ((parseFloat(eventTaxRate) || 6) + (parseFloat(eventGratuityRate) || 20)) / 100;
      subtotal += eRate * eventTaxMultiplier;
    }

    accessories.forEach((a) => {
      const price = parseFloat(a.price) || 0;
      subtotal += price;
    });

    setRevenue(subtotal.toFixed(2));
  }, [guestRooms, eventRoom, eventRoomRate, accessories, checkIn, checkOut, roomTaxRate, eventTaxRate, eventGratuityRate]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload file');
      }

      const data = await res.json();
      setDocumentUrl(data.url);
      setDocumentName(data.name);
    } catch (err: any) {
      setFormError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const combinedName = clientName.trim() + (companyName.trim() ? ` / ${companyName.trim()}` : '');

    const leadPayload = {
      name_company: combinedName || 'Unnamed Lead',
      email,
      phone,
      lead_source: leadSource,
      check_in_date: checkIn,
      check_out_date: checkOut,
      rooms_or_event_details: JSON.stringify({
        eventRoom,
        eventRoomRate,
        guestRooms,
        accessories,
        eventDetails
      }),
      revenue_potential: revenue,
      assigned_sales_manager_id: assignedManager,
      status: 'new', // Automatically classifies as New Inquiry
      market_segment: marketSegment,
      document_url: documentUrl || null,
      document_name: documentName || null,
      lost_reason: null
    };

    try {
      await onSaveLead(leadPayload);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Create New Lead Record</h3>
            <p className="text-[11px] text-slate-500">
              New inquiries are automatically added to the first pipeline stage.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Client Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Miller"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Company / Group Name</label>
              <input
                type="text"
                placeholder="e.g. Miller Reunion / Tech Summit"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="guest@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1-555-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Check In Date</label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Check Out Date</label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Revenue Potential ($)</label>
              <input
                type="number"
                step="0.01"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800 font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Lead Source</label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              >
                <option value="OTA">OTA</option>
                <option value="direct">Direct</option>
                <option value="walk-in">Walk-in</option>
                <option value="email">Email</option>
                <option value="sales_call">Sales Call</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Assigned Sales Agent</label>
              <select
                value={assignedManager}
                onChange={(e) => setAssignedManager(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Market Segment</label>
              <select
                value={marketSegment}
                onChange={(e) => setMarketSegment(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              >
                <option value="corporate">Corporate</option>
                <option value="leisure">Leisure</option>
                <option value="group">Group</option>
              </select>
            </div>

            {/* Event Space Selector */}
            <div className="grid grid-cols-2 gap-4 col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Room / Banquet Hall</label>
                <select
                  value={eventRoom}
                  onChange={(e) => setEventRoom(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none text-slate-800"
                >
                  <option value="">-- Select Event Room --</option>
                  <option value="Grand Ballroom">Grand Ballroom</option>
                  <option value="Executive Boardroom">Executive Boardroom</option>
                  <option value="Skyline Terrace">Skyline Terrace</option>
                  <option value="Garden Pavilion">Garden Pavilion</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Room Rate ($)</label>
                <input
                  type="number"
                  value={eventRoomRate}
                  onChange={(e) => setEventRoomRate(e.target.value)}
                  placeholder="500"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Guest Rooms Block Repeater */}
            <div className="col-span-2 space-y-2">
              <label className="block text-slate-700 font-bold">Guest Rooms Block</label>
              {guestRooms.map((room, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <select
                    value={room.type}
                    onChange={(e) => {
                      const updated = [...guestRooms];
                      updated[idx].type = e.target.value;
                      setGuestRooms(updated);
                    }}
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 outline-none text-slate-800"
                  >
                    <option value="Deluxe King">Deluxe King</option>
                    <option value="Double Queen">Double Queen</option>
                    <option value="Executive Suite">Executive Suite</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Rooms"
                    value={room.count}
                    onChange={(e) => {
                      const updated = [...guestRooms];
                      updated[idx].count = e.target.value;
                      setGuestRooms(updated);
                    }}
                    className="w-20 bg-white border border-slate-300 rounded-lg p-2 outline-none text-slate-800"
                  />
                  <input
                    type="number"
                    placeholder="Rate/Night"
                    value={room.rate}
                    onChange={(e) => {
                      const updated = [...guestRooms];
                      updated[idx].rate = e.target.value;
                      setGuestRooms(updated);
                    }}
                    className="w-24 bg-white border border-slate-300 rounded-lg p-2 outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setGuestRooms(guestRooms.filter((_, i) => i !== idx))}
                    className="p-2 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setGuestRooms([...guestRooms, { type: 'Deluxe King', count: '5', rate: '180' }])}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Room Block
              </button>
            </div>

            {/* Accessories Repeater */}
            <div className="col-span-2 space-y-2">
              <label className="block text-slate-700 font-bold">Accessories & Add-ons</label>
              {accessories.map((acc, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Item (e.g. Projector AV)"
                    value={acc.name}
                    onChange={(e) => {
                      const updated = [...accessories];
                      updated[idx].name = e.target.value;
                      setAccessories(updated);
                    }}
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 outline-none text-slate-800"
                  />
                  <input
                    type="number"
                    placeholder="Price ($)"
                    value={acc.price}
                    onChange={(e) => {
                      const updated = [...accessories];
                      updated[idx].price = e.target.value;
                      setAccessories(updated);
                    }}
                    className="w-28 bg-white border border-slate-300 rounded-lg p-2 outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setAccessories(accessories.filter((_, i) => i !== idx))}
                    className="p-2 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAccessories([...accessories, { name: '', price: '' }])}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Accessory / Add-on
              </button>
            </div>

            {/* Additional Details */}
            <div className="col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Additional Event Details</label>
              <textarea
                rows={2}
                value={eventDetails}
                onChange={(e) => setEventDetails(e.target.value)}
                placeholder="Catering needs, setup requirements, special requests..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600 text-slate-800"
              />
            </div>

            {/* Contract / Proposal File Upload */}
            <div className="col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Attach Document (Proposal/Contract)</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                {documentUrl ? (
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-medium truncate">📎 {documentName || 'Attached Document'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentUrl('');
                        setDocumentName('');
                      }}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-300 hover:border-blue-500 rounded-lg cursor-pointer transition-colors bg-white">
                    <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-600 font-medium">
                      {isUploading ? 'Uploading file...' : 'Select Proposal / Contract'}
                    </span>
                    <input type="file" className="hidden" disabled={isUploading} onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Record...' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
