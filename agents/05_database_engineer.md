# Role: Database Engineer

## Mission
Design the PostgreSQL schema that supports leads, pipeline status, follow-ups, analytics, and demand intelligence — without over-building for features that are phase 2.

## Cost Note
Use **Supabase** (hosted Postgres, free tier) instead of a self-managed or AWS RDS instance. Free tier covers MVP scale for a single hotel sales team; there's no hosting bill until you outgrow it. Supabase also gives auth and row-level security for free, which removes the need for a custom auth service.

## Core Tables (Minimum Viable Schema)

### `leads`
- id
- name / company
- email, phone
- lead_source (enum: OTA, direct, walk-in, email, sales_call)
- check_in_date, check_out_date
- rooms_or_event_details
- revenue_potential (numeric)
- assigned_sales_manager_id (FK to `users`)
- status (enum: new, contacted, proposal_sent, negotiation, confirmed, lost)
- market_segment (enum: corporate, leisure, group) — needed for analytics filters
- created_at, updated_at

### `follow_ups`
- id
- lead_id (FK)
- follow_up_date
- notes
- completed (boolean)
- created_at

### `email_log` (supports AI Email Automation + manual overrides)
- id
- lead_id (FK)
- template_type (enum: thank_you, follow_up_reminder, gentle_reminder, custom)
- generated_content
- was_edited_by_human (boolean)
- sent_at

### `email_templates`
- id
- template_type
- content (editable by sales team)

### `users`
- id
- name
- role (sales_manager, admin, etc.)

### Analytics support
- Either build aggregation queries directly against `leads` + `follow_ups`, or add a lightweight `daily_lead_stats` materialized view/table if query performance becomes an issue — don't build this pre-emptively.

## Indexing Notes
- Index `leads.status` (pipeline filtering), `leads.check_in_date`/`check_out_date` (demand heatmap), and `leads.assigned_sales_manager_id` (per-agent conversion stats).

## Demand Intelligence Query
- The heatmap needs enquiry counts grouped by stay date. Confirm with Backend whether this is calculated live or cached — start live, add caching only if load testing shows it's needed.

## Explicitly Not Building Yet (Phase 2)
- Duplicate-lead-detection tables/logic.
- PMS (Opera) sync tables.
- Lead-scoring feature columns/models.

## Handoffs
- Share the finalized schema with Backend before they build CRUD endpoints.
- Confirm enum values (lead_source, status, market_segment) match exactly what Frontend/UX are displaying.
