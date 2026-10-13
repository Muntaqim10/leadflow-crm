'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Send } from 'lucide-react';

interface SmsMessage {
  id: string;
  direction: 'in' | 'out';
  body: string;
  status?: string | null;
  created_at: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Could not load messages.');
    return res.json();
  });

/**
 * SMS thread for one lead. Self-contained — it owns its own fetching and sending so
 * the lead modal only has to render it.
 */
export const LeadMessages: React.FC<{ leadId: string; phone?: string }> = ({ leadId, phone }) => {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const { data, error, mutate } = useSWR(`/api/messages?leadId=${encodeURIComponent(leadId)}`, fetcher, {
    refreshInterval: 20000, // replies arrive out of band, so poll while the thread is open
  });

  const messages: SmsMessage[] = data?.messages || [];
  const smsConfigured = data?.smsConfigured !== false;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, body: draft.trim() }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Could not send the message.');
      setDraft('');
      if (payload?.warning) setSendError(payload.warning);
      await mutate();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send the message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {!smsConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs">
          Texting is not set up yet. Add <strong>TWILIO_ACCOUNT_SID</strong>, <strong>TWILIO_AUTH_TOKEN</strong> and{' '}
          <strong>TWILIO_PHONE_NUMBER</strong> to this deployment&apos;s environment variables to enable it.
        </div>
      )}

      {!phone && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-lg p-3 text-xs">
          This lead has no phone number. Add one on the Details tab to text them.
        </div>
      )}

      <div className="border border-slate-200 rounded-lg p-3 space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin bg-slate-50">
        {error ? (
          <div className="text-center py-8 text-rose-500 text-xs">Could not load the message history.</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No texts yet. Anything you send, and any reply, shows up here.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap break-words ${
                  msg.direction === 'out'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                }`}
              >
                <p>{msg.body}</p>
                <span className={`block mt-1 text-[10px] ${msg.direction === 'out' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleString()}
                  {msg.direction === 'out' && msg.status ? ` · ${msg.status}` : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {sendError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-2.5 text-xs">{sendError}</div>
      )}

      <form onSubmit={handleSend} className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={phone ? `Text ${phone}...` : 'Add a phone number to text this lead'}
          rows={2}
          maxLength={1600}
          disabled={!phone || !smsConfigured || sending}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:bg-white focus:border-blue-500 transition-all text-xs disabled:opacity-60"
        />
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-400">{draft.length}/1600</span>
          <button
            type="submit"
            disabled={!draft.trim() || !phone || !smsConfigured || sending}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? 'Sending...' : 'Send Text'}
          </button>
        </div>
      </form>
    </div>
  );
};
