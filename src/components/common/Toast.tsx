'use client';

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ToastProps {
  errorMsg: string;
  successMsg: string;
  onClearError?: () => void;
  onClearSuccess?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  errorMsg,
  successMsg,
  onClearError,
  onClearSuccess
}) => {
  if (!errorMsg && !successMsg) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md animate-in slide-in-from-top-2 duration-200">
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          {onClearError && (
            <button onClick={onClearError} className="text-rose-500 hover:text-rose-700 ml-3 text-sm font-bold">
              &times;
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          {onClearSuccess && (
            <button onClick={onClearSuccess} className="text-emerald-500 hover:text-emerald-700 ml-3 text-sm font-bold">
              &times;
            </button>
          )}
        </div>
      )}
    </div>
  );
};
