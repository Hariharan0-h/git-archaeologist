# Token Manager Skill — Git Archaeologist

## Purpose
Plan, size, and checkpoint every work session so you never exceed Claude's daily token budget. This skill is **mandatory at the start of every session** before any coding begins.

---

## Token Budget Constants

| Tier | Daily Output Tokens | Safe Session Budget | Reserve |
|---|---|---|---|
| Pro | ~100,000 | 80,000 | 20,000 |
| Team | ~200,000 | 160,000 | 40,000 |

> **Default assumption**: Pro tier — 80,000 safe tokens per day unless stated otherwise.

---

## Task Size Estimates (Git Archaeologist Stack)

| Task Type | Estimated Output Tokens |
|---|---|
| New tRPC procedure (simple query) | 1,000–2,000 |
| New tRPC procedure (mutation + job enqueue) | 2,000–4,000 |
| New Drizzle table + migration | 1,500–3,000 |
| New BullMQ job handler (full pipeline) | 4,000–8,000 |
| New Next.js page (server component + client) | 3,000–6,000 |
| New GitHub API method in lib/github.ts | 1,500–3,000 |
| New LLM prompt + wrapper in lib/llm.ts | 2,000–4,000 |
| pgvector similarity search query | 1,000–2,500 |
| Stripe webhook handler | 2,000–4,000 |
| Feature slice (schema + tRPC + page) | 8,000–15,000 |
| Test suite for a module | 3,000–8,000 |
| Bug fix (targeted) | 500–2,000 |
| Refactor existing module | 2,000–6,000 |
| Skill / planning doc | 3,000–8,000 |

---

## Protocol — Run at Session Start

### Step 1 — Budget Check
- What has been done today? (estimate tokens spent)
- Check `rules.md` → Session Log for today's entry
- Remaining = 80,000 − tokens already used

### Step 2 — Task Sizing
For each item in today's queue, assign a cost from the table above. Sum them.

### Step 3 — Fit or Split

```
If SUM(tasks) ≤ remaining:
  → Do all tasks this session
Else:
  → Pick highest-priority tasks that fit
  → Defer the rest with a checkpoint note in rules.md
```

### Step 4 — Checkpoint Note (write to rules.md before stopping)

```markdown
## Session Checkpoint — [DATE]
### Completed
- [x] Task A — <file changed>
- [x] Task B — <file changed>

### Deferred
- [ ] Task C — file: <path>, pick up at: <function/line>
- [ ] Task D — blocked by Task C

### Context
- Branch: main
- Last edited: <path>
- Key decision: <decision>
- Token budget remaining today: ~X,XXX
```

---

## Chunking Rules

1. **Never start a feature you can't finish** — if a feature slice costs 10k and you have 6k left, defer the whole slice
2. **Always finish a function** — never stop mid-function; reduce scope instead (drop edge cases, add `// TODO: deferred`)
3. **One file at a time** — complete each file before moving on
4. **No re-explaining** — don't re-summarize already-done work mid-session; wastes tokens
5. **Pattern references** — if same pattern shown already this session: `// same pattern as lib/github.ts:getCommitDetail`

---

## Daily Planning Template

When user says "plan today" or "what should we do":

```markdown
## Token Plan — [DATE]
Budget: 80,000 tokens | Used today: X,XXX | Remaining: X,XXX

| # | Task | Est. Tokens | Cumulative | Session |
|---|---|---|---|---|
| 1 | <task> | X,XXX | X,XXX | Today |
| 2 | <task> | X,XXX | X,XXX | Today |
| 3 | <task> | X,XXX | X,XXX | DEFERRED |
```

---

## Warning Triggers

Emit **⚠️ TOKEN WARNING** when:
- Remaining drops below 15,000
- A single response exceeds 5,000 tokens
- User asks for something clearly over budget

```
⚠️ TOKEN WARNING: ~X,XXX tokens remaining today.
Stopping after [current task]. Defer [next task] to next session.
Checkpoint written to rules.md.
```
