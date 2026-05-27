# Git Archaeologist — Rules & Session Log

## Overview
**What**: B2C SaaS — answers "why was this code written?" by mining git blame, commits, PRs, and issues via RAG + Claude Sonnet.
**Stack**: Next.js 14 App Router · tRPC · Drizzle + pgvector (Neon) · BullMQ + Redis · NextAuth (GitHub OAuth) · Stripe
**Repo**: https://github.com/Hariharan0-h/git-archaeologist
**Ground truth for stack/conventions**: `CLAUDE.md`

---

## Skill Loading Rules

Read the relevant skill file before starting any task. Multiple skills may apply.

| Trigger | Load |
|---|---|
| **Start of every session** | `.skills/token-manager.md` FIRST — always |
| Any coding task (feature, bug, endpoint, component) | `.skills/git-archaeologist-dev.md` |
| "Plan X" / "break this down" / "what's next" / new session backlog | `.skills/feature-planner.md` |
| "Write tests" / "add a test" / "is this correct" / bug report | `.skills/qa-tester.md` |
| Budget concern / large feature / end of session | `.skills/token-manager.md` |

> **Rule**: `token-manager.md` before `CLAUDE.md` before any skill. Never write code without a budget check.

---

## Token Budget

**Safe daily limit**: 80,000 output tokens (Pro tier)
**⚠️ Warning threshold**: < 15,000 remaining

| Session Date | Est. Tokens Used | Remaining |
|---|---|---|
| 2026-05-27 | ~12,000 (skills + rules.md created ×2) | ~68,000 |

---

## Architecture Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-27 | Next.js 14 App Router | Full-stack in one repo; RSC for auth-gated pages |
| 2026-05-27 | tRPC (not REST) | End-to-end type safety; no API contract drift |
| 2026-05-27 | Neon + pgvector | Serverless Postgres + vector search in one DB |
| 2026-05-27 | BullMQ for ingestion | Git ingestion is slow — must be async + retriable |
| 2026-05-27 | Drizzle (not Prisma) | Better pgvector support; raw SQL escape hatch |

---

## Feature Status

### Phase 1 — Core (Week 1–4)
| ID | Feature | Status |
|---|---|---|
| F-001 | GitHub OAuth + repo list | ⬜ pending |
| F-002 | Repo ingestion job | ⬜ pending |
| F-003 | Chunk embedding + pgvector store | ⬜ pending |
| F-004 | Query endpoint (RAG + Claude) | ⬜ pending |
| F-005 | Finding storage + retrieval | ⬜ pending |
| F-006 | Basic query UI | ⬜ pending |

### Phase 2 — Context (Week 5–6)
| ID | Feature | Status |
|---|---|---|
| F-007 | PR + issue thread ingestion | ⬜ pending |
| F-008 | Citation display | ⬜ pending |
| F-009 | Repo dashboard | ⬜ pending |

### Phase 3 — Payments + Launch (Week 7–8)
| ID | Feature | Status |
|---|---|---|
| F-010 | Stripe Checkout | ⬜ pending |
| F-011 | Usage limits per plan | ⬜ pending |
| F-012 | Landing page | ⬜ pending |

> Status legend: ⬜ pending · 🔄 in progress · ✅ done · ⏸ deferred

---

## Active Task Queue

```
No active tasks — run feature-planner to queue work.
```

---

## Session Log

### 2026-05-27 — Skills & Rules Setup
- Est. tokens used: ~12,000
- Completed:
  - Created `.skills/token-manager.md`
  - Created `.skills/git-archaeologist-dev.md` (rewritten for actual stack)
  - Created `.skills/feature-planner.md` (backlog aligned to 8-week MVP)
  - Created `.skills/qa-tester.md` (tRPC + BullMQ + Stripe patterns)
  - Created `rules.md`
- Deferred: All Phase 1 features (no code written yet)
- Next session: Check token budget → pick F-001 or F-002 to start

---

## Session Template

```markdown
### YYYY-MM-DD — <Goal>
- Est. tokens used:
- Completed:
- Deferred:
- Next session:
```
