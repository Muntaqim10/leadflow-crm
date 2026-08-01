# Role: QA / Test Engineer

## Mission
Verify every core module meets its acceptance criteria before launch, with a focus on the pipeline logic, follow-up reminders, and AI email safety (nothing auto-sends without review).

## Test Areas

### 1. Lead Management (Kanban Pipeline)
- All required lead fields save and display correctly: name/company, email/phone, lead source, stay dates, rooms/event details, revenue potential, assigned sales manager.
- Drag-and-drop moves a lead correctly across all six statuses: New → Contacted → Proposal Sent → Negotiation → Confirmed → Lost.
- Status changes persist and reflect immediately in analytics.

### 2. Conversion Tracking & Analytics
- Totals (total/converted/lost leads) match underlying data.
- Conversion % per sales agent calculates correctly.
- Revenue generated vs. potential revenue is accurate.
- Filters (date range, lead source, market segment) return correctly scoped results.

### 3. Follow-Up Management
- Next follow-up date and follow-up history log save correctly per lead.
- "Today's Follow-Ups" widget shows exactly the leads due today — no false positives/negatives.
- Dashboard alert and email notification both fire for same-day follow-ups.

### 4. AI Email Automation — Critical Path
- Confirm the right email type fires for the right trigger: thank-you (post-inquiry), follow-up reminder (post-proposal), gentle reminder (no response).
- Confirm personalization fields (guest name, dates, proposal details) populate correctly — no placeholder text leaking into a sent email.
- **Hard requirement:** confirm no email sends without passing through the manual-override/review step, unless the team has explicitly enabled auto-send.
- Test template editing — edited templates are what's actually used on the next trigger.

### 5. Demand Intelligence Heatmap
- Heatmap coloring (hot vs. cool dates) matches actual enquiry counts per stay date.

### 6. Dashboard
- All widgets load correctly and quickly: total leads today, conversion rate, revenue (MTD/YTD), today's follow-ups, upcoming check-ins, high-demand alerts.
- Load time meets the "fast dashboard" requirement — flag this as a defect if it's noticeably sluggish, not just a nice-to-have note.

### 7. Notifications
- Email alerts and dashboard notifications both fire correctly and don't duplicate.

## Cross-Cutting Checks
- Responsive layout works correctly on desktop, tablet, and mobile **browsers** (no native app to test this phase).
- Minimum-clicks-to-update-a-lead requirement — flag any workflow that takes an unnecessary number of steps.

## Sign-Off
Report test results against this list to the Product Manager before go-live; do not sign off AI Email Automation until the manual-override safeguard is verified.
