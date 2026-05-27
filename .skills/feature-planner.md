# Feature Planner Skill — Git Archaeologist

## Role
Break any feature into a **token-budget-aware task queue** with exact file targets, acceptance criteria, and session boundaries. Always check `token-manager.md` budget before emitting a plan.

---

## When to Use
- "Plan X", "break this down", "what's next", "prioritize the backlog"
- Before touching more than 2 files
- Start of each session — review deferred tasks from `rules.md`

---

## Planning Protocol

### Step 1 — Scope
Confirm (if not obvious):
- User-visible outcome of the feature?
- Dependencies on unbuilt pieces?
- MVP or post-MVP?

### Step 2 — Decompose
One task = one file or one well-defined function set.

```
[T-NNN] <imperative title>
  File: <exact path>
  Size: S | M | L   (S=<2k tokens, M=2–6k, L=6k+)
  Depends on: [T-NNN]
  Acceptance: <1–2 line testable outcome>
```

### Step 3 — Budget check
Pull remaining budget from `rules.md` Session Log. Flag tasks over budget as `[DEFERRED]`.

### Step 4 — Output

```markdown
## Feature Plan: <Name>
Total est. tokens: XX,XXX | Fits today: YES / NO

| ID    | Task                              | File                          | Size | Tokens | Session  |
|-------|-----------------------------------|-------------------------------|------|--------|----------|
| T-001 | Add DB table for X                | db/schema.ts                  | S    | 2,000  | Today    |
| T-002 | tRPC procedure: getX              | server/routers/x.ts           | M    | 3,000  | Today    |
| T-003 | BullMQ job: process-x             | jobs/worker.ts                | L    | 7,000  | DEFERRED |

T-001 → T-002 → T-003
```

---

## MVP Feature Backlog (8-Week Plan)

Update status in `rules.md` as features land.

### Week 1–2: Core Ingestion
| ID | Feature | Key Files | Size |
|---|---|---|---|
| F-001 | GitHub OAuth connect + repo list | `lib/auth.ts`, `server/routers/repo.ts` | M |
| F-002 | Repo ingestion job (clone → blame → chunk) | `jobs/worker.ts`, `lib/github.ts` | L |
| F-003 | Chunk embedding + pgvector store | `lib/embeddings.ts`, `db/schema.ts` | M |

### Week 3–4: Query & RAG
| ID | Feature | Key Files | Size |
|---|---|---|---|
| F-004 | Query endpoint (embed → similarity search → Claude) | `server/routers/query.ts`, `lib/llm.ts` | L |
| F-005 | Finding storage + retrieval | `server/routers/finding.ts`, `db/schema.ts` | M |
| F-006 | Basic query UI (code input + answer display) | `app/query/page.tsx` | M |

### Week 5–6: UX + Context
| ID | Feature | Key Files | Size |
|---|---|---|---|
| F-007 | PR + issue thread ingestion | `lib/github.ts`, `jobs/worker.ts` | L |
| F-008 | Source citation display (PR #, commit SHA, issue #) | `app/query/page.tsx`, `types/index.ts` | M |
| F-009 | Repo dashboard (ingestion status, finding history) | `app/dashboard/page.tsx` | M |

### Week 7–8: Payments + Launch
| ID | Feature | Key Files | Size |
|---|---|---|---|
| F-010 | Stripe Checkout integration | `app/api/webhooks/stripe/route.ts` | M |
| F-011 | Usage limits (query quota per plan) | `db/schema.ts`, `server/routers/query.ts` | M |
| F-012 | Landing page + auth flow | `app/page.tsx`, `app/layout.tsx` | S |

### Post-MVP
| ID | Feature | Size |
|---|---|---|
| F-013 | Multi-repo support | L |
| F-014 | Slack / IDE plugin | L |
| F-015 | Team workspaces | L |

---

## Acceptance Criteria Templates

**tRPC procedure:**
> `repo.ingest` mutation enqueues a BullMQ job and returns `{ jobId }` within 200ms; returns typed error if repo already ingesting.

**BullMQ job:**
> Job processes 1,000 commits without OOM; retries 3× on GitHub 5xx; marks repo `status='ready'` in DB on completion.

**pgvector search:**
> Returns top-10 chunks with similarity > 0.7 for a test query in < 200ms on Neon free tier.

**Page (Next.js):**
> Server component loads with valid session; redirects to `/api/auth/signin` without session; no hydration errors.

---

## Session Handoff

Write to `rules.md` at end of planning session:

```markdown
## Active Plan: <Feature Name> — [DATE]
Next task: [T-NNN] <title>
  File: <path>
  Pick up at: <function/context>
  Token budget remaining: ~X,XXX
```
