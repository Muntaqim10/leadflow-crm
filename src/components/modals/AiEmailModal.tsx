'use client';

import React from 'react';
import { Sparkles, Copy } from 'lucide-react';
import { Lead } from '@/types/crm';

interface AiEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead: Lead | null;
  isGeneratingAi: boolean;
  aiDraft: string;
  setAiDraft: (val: string) => void;
  setEmailWasEdited: (val: boolean) => void;
  handleCopyEmail: () => void;
  isSendingEmail: boolean;
}

export const AiEmailModal: React.FC<AiEmailModalProps> = ({
  isOpen,
  onClose,
  selectedLead,
  isGeneratingAi,
  aiDraft,
  setAiDraft,
  setEmailWasEdited,
  handleCopyEmail,
  isSendingEmail
}) => {
  if (!isOpen || !selectedLead) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-400" />
            <h3 className="font-bold text-slate-800 text-base">Review AI Generated Follow-Up</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 font-semibold text-lg"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <span className="text-slate-600 font-bold block">Lead Context Target:</span>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-800">
              <div>
                Guest: <strong>{selectedLead.name_company}</strong>
              </div>
              <div>
                Stay Dates:{' '}
                <strong>
                  {selectedLead.check_in_date} to {selectedLead.check_out_date}
                </strong>
              </div>
            </div>
          </div>

          {isGeneratingAi ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500">Groq Llama3 polishing follow-up draft...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Email Content (Editable):</span>
                <span className="text-[10px] text-blue-500 font-semibold bg-blue-500/10 border border-blue-500/10 px-2 py-0.5 rounded">
                  Manual Override Safeguard Active
                </span>
              </div>
              <textarea
                value={aiDraft}
                onChange={(e) => {
                  setAiDraft(e.target.value);
                  setEmailWasEdited(true);
                }}
                className="w-full h-72 bg-[#0B0F19] border border-slate-700 rounded-lg p-4 text-xs font-mono leading-relaxed text-[#E2E8F0] focus:border-[#1F3A60] outline-none resize-none"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 bg-[#1A212E] text-white py-2.5 rounded-lg border border-[#303650] hover:bg-[#222B3F]"
            >
              Cancel
            </button>
            <button
              onClick={handleCopyEmail}
              disabled={isGeneratingAi || isSendingEmail || !aiDraft}
              className="flex-1 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-2.5 rounded-lg hover:from-blue-500 hover:to-sky-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>{isSendingEmail ? 'Copying...' : 'Copy to Clipboard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
