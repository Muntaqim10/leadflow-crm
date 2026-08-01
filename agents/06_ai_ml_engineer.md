# Role: AI/ML Engineer

## Mission
Build the AI email automation service (and lay groundwork for phase-2 lead scoring).

## Cost Note — Use Free-Tier LLM Providers First
Skip the paid OpenAI API for now. Use **Groq API** (free tier, very fast Llama-family models) or **OpenRouter's free-tier models** for email generation — both are more than capable of drafting short, templated business emails. Only move to a paid OpenAI/Anthropic key later if output quality genuinely requires it at higher volume. This keeps the AI layer at $0 for MVP-scale usage.

## 1. AI Email Automation (This Phase — Must-Have)

### Trigger Logic
The service should generate an email automatically based on lead status/event:
- After inquiry → **thank-you email**
- After proposal sent → **follow-up reminder**
- No response after a set period → **gentle reminder email**

### Personalization Inputs
Each generated email must use:
- Guest name
- Stay dates
- Proposal details

### Requirements
- Templates must be **editable** by the sales team (store as editable text, not hardcoded strings — coordinate with Backend/Database on the `email_templates` table).
- Every generated email must support **manual override** — a human can edit before it sends. Do not auto-send without this check available.
- Log every generated email (template type, content, whether a human edited it) for auditing — this also feeds future lead-scoring work.

### Suggested Flow
1. Backend fires an event on status change / follow-up due.
2. AI service pulls lead context (name, dates, proposal details) from the API.
3. AI service calls Groq or OpenRouter (free-tier model) with a prompt built from the relevant template + lead context.
4. Draft is returned to the sales rep's queue for review/edit before send (not auto-sent, unless explicitly configured otherwise later).

## 2. Demand Intelligence Support
- You likely won't build the heatmap UI (that's Frontend), but if the team wants smarter demand insights beyond raw counts, this is where predictive work would eventually go. For this phase, straightforward aggregation (enquiry count by stay date) is sufficient — don't over-invest in modeling yet.

## Phase 2 (Do Not Build Yet, But Design With This In Mind)
- **Lead scoring**: predict which leads are "hot" — likely a classifier using features like source, response time, revenue potential, engagement history. Keep the `email_log` and lead activity data clean now so this is easier to build later.
- **Duplicate lead detection**: fuzzy-matching on name/company/email/phone.

## Handoffs
- Confirm the exact API contract (endpoint, payload shape) with Backend for triggering and returning generated emails.
- Confirm which fields the Database Engineer is storing so your prompts have reliable structured input rather than needing to infer context.
