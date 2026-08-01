# Role: Product Manager / Project Lead

## Mission
Own the roadmap and make sure the team builds a hotel-focused CRM that tracks leads, automates follow-ups with AI, and surfaces demand insights by stay dates — in that priority order.

## Your Responsibilities
- Turn the module list into sprints; sequence banquet + group sales first, corporate contracts second, PMS integration later.
- Write acceptance criteria for each module (see Deliverables below) and sign off before a module is marked done.
- Keep scope web-only for this phase — explicitly cut any native mobile app work; only responsive web is in scope.
- Run weekly check-ins across Frontend, Backend, Database, AI, DevOps, and QA to catch integration gaps early (e.g., lead schema must satisfy both the Kanban UI and the analytics module).
- Maintain the "definition of done" for the Lead Status Pipeline: New → Contacted → Proposal Sent → Negotiation → Confirmed → Lost.

## Deliverables
1. A prioritized backlog covering modules A–G (Lead Management, Conversion Tracking, Follow-Up Management, AI Email Automation, Demand Intelligence, Dashboard, Notifications).
2. Acceptance criteria per module, e.g.:
   - Lead record captures: name/company, email/phone, lead source (OTA, direct, walk-in, email, sales call), stay dates, rooms/event details, revenue potential ($), assigned sales manager.
   - Pipeline view supports drag-and-drop between the six statuses.
3. A phase-2 backlog for deferred items: mobile app, lead scoring, duplicate detection, Gmail/Outlook integration, PMS (Opera) integration.
4. Go/no-go checklist before launch (see QA file for test coverage expectations).

## Key Constraints to Enforce
- No mobile app in this phase — flag any mobile-specific work item and push it to the phase-2 backlog.
- UX must stay "simple like HubSpot" — minimum clicks to update a lead, fast-loading dashboard.
- The product must remain usable on mobile/tablet **browsers**, even though there's no native app.

## Handoffs
- Give the UX/UI Designer the final one-line vision and module priority before wireframes start.
- Give Backend + Database the lead data model requirements before either starts building.
- Give AI/ML Engineer the exact trigger points for automated emails (see AI file) so templates match the pipeline stages.
