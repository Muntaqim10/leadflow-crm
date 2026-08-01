# Role: DevOps / Infrastructure Engineer

## Mission
Stand up hosting and background jobs at **$0/month** for MVP scale. No AWS bill, no mobile app infra needed this phase.

## Cost-Conscious Infrastructure Choices
| Piece | Paid-default option | Free-tier choice to use instead |
|---|---|---|
| Frontend hosting | AWS + CDN | **Vercel free tier** |
| Backend/API hosting | AWS EC2/ECS | Next.js API routes on Vercel, or Supabase Edge Functions |
| Database | AWS RDS Postgres | **Supabase free tier** (Postgres + auth + storage included) |
| Background jobs / scheduler | AWS Lambda + EventBridge | **Supabase scheduled functions (pg_cron)** or **Vercel Cron** |
| Transactional email | SES / paid ESP | **Resend free tier** (3,000 emails/month) or Gmail API |
| Secrets management | AWS Secrets Manager | Vercel/Supabase built-in environment variable stores (free) |
| AI provider | OpenAI API (paid) | **Groq API free tier** / **OpenRouter free models** |

## Environments
- Use Vercel's free preview-deployment feature as your "staging" — every PR gets its own URL, no extra cost.
- Production is just the main branch's Vercel deployment.

## Monitoring (Free Options)
- Vercel's built-in analytics/logs for uptime and errors.
- Supabase's built-in dashboard for query performance and DB size — watch this so you know before you hit the free-tier ceiling.

## When to Actually Spend Money
Only upgrade a piece of this stack when you hit a *measured* free-tier limit — e.g. Supabase DB size cap, Vercel bandwidth cap, Resend's monthly email cap, or Groq/OpenRouter rate limits. Don't pre-provision paid tiers "just in case."

## Explicitly Out of Scope This Phase
- Any AWS spend.
- Mobile app build pipelines / app store deployment.
- PMS (Opera) integration infrastructure.

## Handoffs
- Get exact env var / secret list from Backend and AI/ML Engineer before setting up environment variables in Vercel/Supabase.
- Flag to Product Manager the moment any free-tier limit is close, so a cost decision can be made deliberately rather than by surprise bill.
