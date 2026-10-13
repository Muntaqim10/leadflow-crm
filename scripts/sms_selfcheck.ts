/**
 * Self-check for the Twilio webhook signature verifier and phone normalization.
 * Run: npx tsx scripts/sms_selfcheck.ts
 *
 * GOLDEN_SIGNATURE was produced independently of the implementation, with:
 *   printf '%s' "<url>BodyHi thereFrom+15551234567" \
 *     | openssl dgst -sha1 -hmac "test_auth_token" -binary | base64
 * so this check fails if the verifier's algorithm drifts, rather than agreeing
 * with whatever the verifier happens to compute.
 */

import assert from 'node:assert';

process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';

import { verifyTwilioSignature, toE164, isStopKeyword, isStartKeyword } from '../src/lib/sms';

const URL_UNDER_TEST = 'https://example.com/api/messages/webhook';
const PARAMS = { Body: 'Hi there', From: '+15551234567' };
const GOLDEN_SIGNATURE = '1FNLrol1vU8//y1i/iYggaHKy0k=';

assert.equal(verifyTwilioSignature(URL_UNDER_TEST, PARAMS, GOLDEN_SIGNATURE), true, 'valid signature must pass');
assert.equal(verifyTwilioSignature(URL_UNDER_TEST, PARAMS, null), false, 'missing signature must fail');
assert.equal(verifyTwilioSignature(URL_UNDER_TEST, PARAMS, 'AAAA'), false, 'garbage signature must fail');
assert.equal(
  verifyTwilioSignature(URL_UNDER_TEST, { ...PARAMS, Body: 'Hi there!' }, GOLDEN_SIGNATURE),
  false,
  'tampered body must fail'
);
assert.equal(
  verifyTwilioSignature(`${URL_UNDER_TEST}?x=1`, PARAMS, GOLDEN_SIGNATURE),
  false,
  'different url must fail'
);

assert.equal(toE164('(555) 123-4567'), '+15551234567');
assert.equal(toE164('+44 20 7946 0958'), '+442079460958');
assert.equal(toE164('15551234567'), '+15551234567');
assert.equal(toE164('12345'), null);
assert.equal(toE164(''), null);

assert.equal(isStopKeyword(' STOP '), true);
assert.equal(isStopKeyword('stop please'), false);
assert.equal(isStartKeyword('START'), true);

console.log('sms self-check passed');
