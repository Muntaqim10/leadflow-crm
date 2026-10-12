@AGENTS.md

# LeadFlow CRM

Hotel sales CRM: leads through a 6-stage pipeline, AI-drafted follow-up emails, demand analytics by stay date. Solo project, free tiers everywhere — prefer the free option and only escalate when a real limit is hit.

## Checks before you call something done
No test runner exists. `npx tsc --noEmit` and `npm run lint` are the checks. For logic worth verifying, compile the module to a temp dir and exercise it with `node` rather than adding a test framework.

`master` auto-deploys to production on push. Confirm the Vercel deploy reaches Ready, not just that the push succeeded.

## Auth and data access
- Supabase Auth. `/api/auth/login` signs in server-side and sets an httpOnly `auth_token` cookie holding the access token.
- `src/proxy.ts` is middleware over `/api/:path*`: it 401s any `/api/*` request without that cookie. `/api/auth/*` and `/api/cron/*` are the only exemptions. **A new public endpoint must be exempted there or it fails with "Unauthorized" no matter what the route does.**
- `getSupabaseClient()` in [src/lib/db.ts](src/lib/db.ts): default forwards the user's token (RLS applies); `true` uses the service role key and bypasses RLS. Service role only where a user genuinely cannot act for themselves.
- RLS is enabled on `users`, `email_log`, `follow_ups` with no policies, so those are service-role-only today. The anon key is public by design; never let a server-only key reach a `NEXT_PUBLIC_*` var.

## Infrastructure that bites
- **Supabase is free-tier and auto-pauses when idle.** Symptom: `ERR_NAME_NOT_RESOLVED` on `*.supabase.co` plus a 401 from login. A daily Vercel cron (`vercel.json` → `/api/cron/keep-alive`) keeps it awake.
- Rate limiting via Upstash Redis, configured in production. [src/lib/rate-limit.ts](src/lib/rate-limit.ts) falls back to an in-memory map when Redis is absent (local dev) — per-instance, so it is advisory only on serverless.
- AI provider is chosen by whichever key is set, Groq before OpenRouter ([src/lib/ai.ts](src/lib/ai.ts)). A placeholder key counts as set.
- Email via Resend. Secrets live in `.env.local` (gitignored) and Vercel env; `CRON_SECRET` is Vercel-only.

## Conventions
- Revenue math belongs in [src/lib/calculations.ts](src/lib/calculations.ts). It is currently duplicated into the create and detail modals — extend the lib and have callers use it rather than adding a fourth copy.
- `agents/` holds the original planning and role docs. Useful as intent, stale on specifics (it still names Groq as the AI choice). Treat the code as truth.
