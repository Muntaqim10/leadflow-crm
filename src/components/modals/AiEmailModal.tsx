'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Copy, Check } from 'lucide-react';
import { Lead } from '@/types/crm';

interface AiEmailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onShowSuccess: (msg: string) => void;
  onShowError: (msg: string) => void;
}

export const AiEmailModal: React.FC<AiEmailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onShowSuccess,
  onShowError
}) => {
  const [templateType, setTemplateType] = useState('thank_you');
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (lead) {
      if (lead.status === 'new') setTemplateType('thank_you');
      else if (lead.status === 'proposal_sent') setTemplateType('follow_up_reminder');
      else if (lead.status === 'negotiation') setTemplateType('gentle_reminder');
      else if (lead.status === 'confirmed') setTemplateType('booking_confirmation');
      else if (lead.status === 'lost') setTemplateType('feedback_request');
      else setTemplateType('thank_you');
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          templateType
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate email');

      setDraft(data.draft || '');
    } catch (err: any) {
      onShowError(err.message || 'Could not generate draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!draft.trim()) return;
    setIsSending(true);

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          recipientEmail: lead.email,
          subject: `Regarding your event inquiry at Hotel Flow Grand`,
          body: draft
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send email');

      onShowSuccess('Email sent successfully!');
      onClose();
    } catch (err: any) {
      onShowError(err.message || 'Could not send email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">AI Email Assistant</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Client Recipient</span>
            <strong className="text-slate-900 font-bold">{lead.name_company}</strong> ({lead.email})
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Template Intent</label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="thank_you">Thank You & Discovery</option>
              <option value="follow_up_reminder">Proposal Follow-Up Reminder</option>
              <option value="gentle_reminder">Gentle Decision Reminder</option>
              <option value="booking_confirmation">Booking Confirmation & Details</option>
              <option value="feedback_request">Feedback Request (Lost Inquiries)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? 'Drafting with Llama 3.1 AI...' : 'Generate Personalized Draft'}
          </button>

          {draft && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-700">Email Draft</label>
                <button
                  onClick={handleCopy}
                  className="text-blue-600 hover:text-blue-700 text-[11px] font-semibold flex items-center gap-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                rows={8}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-blue-600 text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSending ? 'Sending...' : 'Send to Client'}
          </button>
        </div>
      </div>
    </div>
  );
};
