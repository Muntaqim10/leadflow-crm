# Role: Backend Developer

## Mission
Build the API and business logic layer (Node.js or Django) powering the CRM. No native mobile client to support this phase — one web-facing API is enough.

## Stack (Cost-Conscious)
- **Next.js API routes** (or a small FastAPI service if Python is preferred) — no separate backend host to pay for
- **Supabase** for Postgres + auto-generated REST/RPC access (see Database Engineer file) — free tier covers MVP scale
- Integrates with the AI/ML Engineer's **Groq/OpenRouter free-tier** email generation service (not paid OpenAI, unless quality later requires it)
- Use **Supabase scheduled functions or Vercel Cron** (free) for follow-up due-date checks instead of a paid queue/worker service

## Core Services to Build

### 1. Lead Management API
- CRUD for leads with fields: name/company, email/phone, lead source (OTA, direct, walk-in, email, sales call), stay dates (check-in/check-out), rooms/event details, revenue potential ($), assigned sales manager.
- Status transitions across the pipeline: New, Contacted, Proposal Sent, Negotiation, Confirmed, Lost.
- Endpoint(s) to support drag-and-drop reordering/status updates from the Kanban UI.

### 2. Conversion Tracking & Analytics API
- Aggregation endpoints for: total leads, converted leads, lost leads, conversion % per sales agent, revenue generated vs. potential revenue.
- Support filters: date range, lead source, market segment (corporate, leisure, group).

### 3. Follow-Up Management
- Store next follow-up date and a follow-up history log per lead.
- Background job (cron/queue) to detect due/overdue follow-ups and feed the "Today's Follow-Ups" widget and notification system.
- Optional: escalation logic if a follow-up is missed (flagged as an advanced/optional feature — build after core follow-ups work).

### 4. AI Email Automation — Backend Hooks
- Trigger points based on lead status changes:
  - After inquiry → thank-you email
  - After proposal → follow-up reminder
  - No response after N days → gentle reminder
- Pass guest name, dates, and proposal details to the AI/ML Engineer's email generation service.
- Store editable templates and allow manual override before send.

### 5. Demand Intelligence API
- Endpoint that aggregates enquiry counts by stay date to power the calendar heatmap (hot vs. cool dates).

### 6. Notifications API
- Email alerts for same-day follow-ups.
- Dashboard notification feed.
- Design the notification service so Slack/WhatsApp can be added later without a rewrite (phase 2, optional).

## Phase 2 (Not This Build)
- Lead scoring (AI-predicted hot leads)
- Duplicate lead detection
- Gmail/Outlook integration
- PMS integration (Opera)

## Handoffs
- Confirm final lead schema with Database Engineer before building CRUD endpoints.
- Confirm API contract for email triggers with AI/ML Engineer.
- Provide DevOps with environment/config requirements (env vars, secrets for OpenAI API key, DB connection).
