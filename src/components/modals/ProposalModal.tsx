'use client';

import React from 'react';
import { Lead } from '@/types/crm';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead: Lead | null;
  isGeneratingProposal: boolean;
  proposalHtml: string;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  selectedLead,
  isGeneratingProposal,
  proposalHtml
}) => {
  if (!isOpen || !selectedLead) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <h3 className="font-bold text-slate-800 text-base">Group Contract Rooms Agreement</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-white print-content" id="proposal-print-area">
          {isGeneratingProposal ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-xs">Compiling personalized agreement terms...</p>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: proposalHtml }} />
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-4 justify-between items-center no-print text-xs">
          <button
            type="button"
            onClick={() => {
              const printContents = document.getElementById('proposal-print-area')?.innerHTML;
              if (printContents) {
                const win = window.open('', '_blank');
                if (win) {
                  win.document.write(`
                    <html>
                      <head>
                        <title>Group Rooms Agreement - ${selectedLead.name_company}</title>
                        <style>
                          body { font-family: 'Inter', sans-serif; padding: 40px; }
                          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                          th, td { padding: 10px; border-bottom: 1px solid #E2E8F0; text-align: left; }
                          th { background-color: #F1F5F9 !important; -webkit-print-color-adjust: exact; }
                        </style>
                      </head>
                      <body onload="window.print(); window.close();">
                        ${printContents}
                      </body>
                    </html>
                  `);
                  win.document.close();
                }
              }
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg border border-slate-200 transition-colors"
          >
            🖨️ Print Agreement
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-2.5 rounded-lg border border-slate-200 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
