/**
 * SMS client for texting leads, and the verifier for Twilio's inbound webhook.
 *
 * Twilio's REST API is form-encoded with basic auth, so a raw fetch covers it and
 * the SDK is not worth the dependency — same reasoning as the chat-completion
 * wrapper in ./ai.ts.
 */

import crypto from 'crypto';

/** Longest body Twilio accepts for a concatenated message. */
const MAX_BODY_LENGTH = 1600;

/**
 * Thrown when the Twilio env vars are missing, so a route can tell a deployment
 * that was never configured apart from a send that genuinely failed upstream.
 */
export class SmsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmsConfigError';
  }
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

function resolveTwilio(): TwilioConfig {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new SmsConfigError(
      'SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER.'
    );
  }

  return { accountSid, authToken, fromNumber };
}

/** True when the host has all three Twilio vars, so the UI can hide or explain the feature. */
export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

/**
 * Normalizes the free-text `leads.phone` value to E.164, which is the only format
 * Twilio accepts. Returns null when the input cannot be read as a phone number, so
 * the caller can say so instead of letting Twilio reject it.
 *
 * ponytail: assumes a North American number when no country code is present. Take a
 * default-country setting (or a real parser like libphonenumber) if leads outside
 * +1 start showing up.
 */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (hasPlus) {
    // Shortest real E.164 subscriber numbers are 8 digits including country code.
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

/** Keywords US carriers require to opt a recipient out. */
const STOP_KEYWORDS = new Set(['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit', 'revoke']);
/** Keywords that opt a recipient back in. */
const START_KEYWORDS = new Set(['start', 'unstop', 'yes']);

export function isStopKeyword(body: string): boolean {
  return STOP_KEYWORDS.has(body.trim().toLowerCase().replace(/[.!]$/, ''));
}

export function isStartKeyword(body: string): boolean {
  return START_KEYWORDS.has(body.trim().toLowerCase().replace(/[.!]$/, ''));
}

export interface SentSms {
  sid: string;
  status: string;
  from: string;
  to: string;
}

/** Sends one text. `to` must already be E.164 (see toE164). */
export async function sendSms(to: string, body: string): Promise<SentSms> {
  const { accountSid, authToken, fromNumber } = resolveTwilio();

  if (!body.trim()) throw new Error('Message body is empty');
  if (body.length > MAX_BODY_LENGTH) {
    throw new Error(`Message is ${body.length} characters; the limit is ${MAX_BODY_LENGTH}`);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: fromNumber, Body: body }).toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Twilio API error (status=${response.status}):`, errorText);
    // Twilio returns a human-readable `message` plus a numeric code; the message is
    // the actionable part (unverified number, unregistered campaign, bad number) and
    // carries no account secrets, so it is worth surfacing.
    let detail = '';
    try {
      detail = JSON.parse(errorText)?.message || '';
    } catch {
      /* non-JSON error body; the status alone will have to do */
    }
    throw new Error(
      `Twilio returned status ${response.status}${detail ? `: ${detail}` : ''}`
    );
  }

  const data = await response.json();
  return { sid: data.sid, status: data.status, from: data.from, to: data.to };
}

/**
 * Verifies Twilio's X-Twilio-Signature: HMAC-SHA1, keyed with the auth token, over
 * the full request URL followed by each POST parameter name and value concatenated
 * in alphabetical order by name.
 *
 * This is the only thing standing between the public webhook route and anyone who
 * can POST to it, so a failure here must reject the request.
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null
): boolean {
  if (!signature) return false;

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const payload = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const expected = crypto.createHmac('sha1', authToken).update(Buffer.from(payload, 'utf-8')).digest('base64');

  const given = Buffer.from(signature);
  const mine = Buffer.from(expected);
  // Lengths must match before timingSafeEqual, which throws on a mismatch.
  return given.length === mine.length && crypto.timingSafeEqual(given, mine);
}
