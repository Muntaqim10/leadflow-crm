# Project agents

Seven roles, each owning one slice of this codebase. Claude Code loads every `.md`
(in `.claude/agents/`) with frontmatter as a subagent; `model:` picks which model runs it.

| Role | Model | Owns |
|------|-------|------|
| `tech-lead` | opus | Architecture, layer boundaries, YAGNI, tie-breaks |
| `security-engineer` | opus | Auth, secrets, RLS, public endpoints, rate limits. Final say on security |
| `database-engineer` | opus | Schema, migrations, indexes, RLS mechanics |
| `backend-engineer` | sonnet | API routes, `src/lib`, provider integrations |
| `frontend-engineer` | sonnet | React UI, components, client state |
| `qa-engineer` | sonnet | Running the checks, proving a change works |
| `devops-engineer` | sonnet | Deploys, env vars, cron, Vercel + Supabase state |

Opus for the roles where a wrong call is expensive to undo; Sonnet for the
roles doing well-specified work inside an existing pattern.

## How they actually communicate

Subagents cannot message each other. Each one runs in its own context and
reports back to whoever started it. So coordination works two ways, both real:

1. **The main session relays.** It starts a role, reads its report, and passes
   what matters into the next role's brief. This is the only live channel.
2. **`.claude/handoffs.md` is the shared inbox.** Every role reads it before
   starting and appends what the next role needs. It survives between runs, so
   a decision made on Monday is still there on Friday.

`handoffs.md` is gitignored — it is a working scratchpad, not project history.
Anything worth keeping belongs in CLAUDE.md or a commit message.

## Typical chains

- **New feature:** tech-lead decides the shape, database-engineer migrates,
  backend-engineer builds the endpoint, frontend-engineer builds the UI,
  security-engineer reviews, qa-engineer proves it, devops-engineer ships it.
- **Bug:** qa-engineer reproduces, the owning role fixes, qa-engineer re-checks.
- **"It works locally":** devops-engineer first, every time.

Ask for a role by name ("have the security-engineer look at the webhook") or
just describe the work and let the main session route it.

## Handoff entry format

One block per handoff, newest at the bottom:

    ## 2026-10-14 security-engineer -> backend-engineer
    /api/messages/webhook signature check verified. Rate limiting still absent
    on /api/analytics/insights; that route can be looped by any signed-in user.

Keep it to what the next role cannot see for itself.
