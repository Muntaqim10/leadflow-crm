# Hospitality Sales Management System — Web MVP (No Mobile App)

## One-Line Vision
A hotel-focused CRM that tracks leads, automates follow-ups with AI, and gives demand insights by stay dates — to increase conversion and revenue.

## Scope Note
This build is **web-only** for now (responsive/mobile-friendly web app). A dedicated native mobile app is deferred to a later phase.

## Tech Stack — Low/No-Cost Version
The original spec assumes Node/Django + AWS + OpenAI API, which racks up hosting + LLM bills fast. Since keeping cost near zero is a hard requirement, swap in:

- **Frontend:** Next.js, deployed on **Vercel free tier**
- **Backend:** Next.js API routes or a lightweight FastAPI service — avoids paying for a separate backend host
- **Database + Auth + Storage:** **Supabase free tier** (Postgres included, no separate DB hosting bill)
- **AI (email generation):** **Groq API free tier** or **OpenRouter free-tier models** instead of paid OpenAI API — swap in a paid key later only if quality demands it
- **Background jobs/reminders:** Supabase scheduled functions (pg_cron) or Vercel Cron — free at this scale
- **Transactional email:** **Resend free tier** (3,000 emails/month) or Gmail API — avoid paid ESPs until volume requires it
- **Hosting cost target:** $0/month at MVP scale; first paid tier only kicks in if you outgrow free-tier limits (traffic, DB size, email volume, or LLM rate limits)

> Every role file below should default to the free-tier option first and only escalate to a paid tier if a specific, measured limit is actually hit — not preemptively.

## Core Modules
| # | Module | Priority |
|---|--------|----------|
| A | Lead Management System (Kanban pipeline) | Must-have |
| B | Conversion Tracking & Analytics | Must-have |
| C | Follow-Up Management System | Must-have |
| D | AI Email Automation | Must-have |
| E | Demand Intelligence (calendar heatmap) | Must-have |
| F | Dashboard | Must-have |
| G | Notifications System | Must-have |
| — | Lead scoring, duplicate detection, Gmail/Outlook + PMS integration | Phase 2 |

## Recommended Build Order
1. Banquet + group sales leads first
2. Then expand to corporate contracts
3. PMS (Opera) integration is explicitly a later phase

## Role Assignments
Each file below is a self-contained brief for one role. Hand each person (or each hat you wear) their file directly.

| File | Role |
|------|------|
| `01_product_manager.md` | Product Manager / Project Lead |
| `02_ux_ui_designer.md` | UX/UI Designer |
| `03_frontend_developer.md` | Frontend Developer |
| `04_backend_developer.md` | Backend Developer |
| `05_database_engineer.md` | Database Engineer |
| `06_ai_ml_engineer.md` | AI/ML Engineer |
| `07_devops_engineer.md` | DevOps / Infrastructure Engineer |
| `08_qa_engineer.md` | QA / Test Engineer |

All roles should treat this README as the shared source of truth for scope, priority, and the one-line vision.
