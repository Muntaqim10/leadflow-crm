# Role: Frontend Developer

## Mission
Build the responsive web client (React / Next.js) — no native mobile app in this phase.

## Stack
- React / Next.js
- Talk to Backend via REST/GraphQL API (confirm with Backend Developer)
- Responsive layout: desktop, tablet, and mobile **browser** support required

## Features to Build

### 1. Lead Management (Kanban Pipeline)
- Drag-and-drop board with columns: New, Contacted, Proposal Sent, Negotiation, Confirmed, Lost.
- Lead card shows: name/company, stay dates, revenue potential, assigned sales manager.
- Lead detail modal/page with full editable fields: name/company, email/phone, lead source (OTA, direct, walk-in, email, sales call), stay dates (check-in/check-out), number of rooms/event details, revenue potential ($), assigned sales manager.
- Optimize for minimum clicks to update a lead's status (this is a stated UX priority — don't bury status changes in menus).

### 2. Conversion Tracking & Analytics Dashboard
- Charts/tables for: total leads, converted leads, lost leads, conversion % per sales agent, revenue generated vs. potential revenue.
- Filters: date range, lead source, market segment (corporate, leisure, group).

### 3. Follow-Up Management UI
- "Today's Follow-Ups" widget on the main dashboard.
- Follow-up history log on each lead's detail view.
- Next follow-up date field, editable.

### 4. AI Email Automation UI
- Template library view (editable templates for: thank-you after inquiry, follow-up reminder after proposal, gentle reminder on no response).
- Manual override: let a sales rep edit the AI-generated draft before sending.

### 5. Demand Intelligence Calendar Heatmap
- Calendar view color-coded by enquiry volume per date (hot vs. cool dates), driven by stay dates and enquiry counts from the backend.

### 6. Main Dashboard
- Widgets: total leads today, conversion rate, revenue (MTD/YTD), today's follow-ups, upcoming check-ins, high-demand dates alert.

### 7. Notifications
- In-app/dashboard notification component for same-day follow-up alerts.

## Non-Functional Requirements
- Fast dashboard load — this was explicitly called out, so treat it as a hard requirement, not a nice-to-have.
- Keep interaction patterns close to HubSpot-level simplicity.

## Out of Scope (this phase)
- React Native / native mobile app build.
- Slack/WhatsApp UI (optional, phase 2).
