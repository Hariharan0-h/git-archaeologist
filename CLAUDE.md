# Git History Archaeologist — Project Context

## Product
B2C SaaS for developers. Answers "why was this code written?" by mining git blame, commits, PRs, and issue threads using RAG + Claude Sonnet.

## Stack
- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS
- Backend: tRPC (procedures in `/server/routers/`), BullMQ + Redis for job queue (`/jobs/worker.ts`)
- DB: PostgreSQL with pgvector extension — schema in `/db/schema.ts`, ORM via Drizzle
- Auth: NextAuth.js with GitHub OAuth (read-only scope) — config in `/lib/auth.ts`
- LLM: Claude Sonnet 4 via Anthropic API — wrapper in `/lib/llm.ts`
- Embeddings: OpenAI text-embedding-3-small (1536-dim) — wrapper in `/lib/embeddings.ts`
- Payments: Stripe Checkout + webhooks

## File Conventions
| Path | Purpose |
|---|---|
| `lib/github.ts` | ALL GitHub API calls — auth, caching, rate-limit logging |
| `lib/llm.ts` | ALL Anthropic API calls — retries, system prompt |
| `lib/embeddings.ts` | ALL OpenAI embedding calls |
| `db/schema.ts` | Drizzle schema — single source of truth for DB shape |
| `server/routers/` | tRPC procedure definitions |
| `jobs/worker.ts` | BullMQ background job processor |

## Coding Rules
- TypeScript strict mode everywhere. **No `any`.**
- tRPC procedures for all API calls — no raw fetch to internal APIs
- All GitHub API calls go through `/lib/github.ts` wrapper (handles auth + caching)
- All LLM calls go through `/lib/llm.ts` wrapper (handles retries + logging)
- Zod schemas for all external inputs (GitHub API responses, user input)
- Error handling: never throw from API routes, return typed error objects
- DB queries via Drizzle ORM. Never raw SQL **except** for pgvector similarity search.
- **SECURITY**: Never log the GitHub access token. Never store raw user code in plaintext beyond findings table.

## MVP Scope (8 Weeks)
See the original product doc. Push back on any feature not in the Week 1–8 plan.

## What I Need From You
- Give me exact code changes, not full file rewrites
- Call out security issues immediately (especially GitHub token handling)
- Flag GitHub API rate limit risks in any new fetch code
- Suggest caching strategy whenever you add a new data fetch
- Keep MVP scope — push back if I over-engineer

## LLM System Prompt (verbatim — core IP)
```
You are a code historian. You explain why code exists, not what it does.
You are given: the code snippet, and a set of retrieved context chunks from git blame, commit messages, PR descriptions, PR review comments, and issue threads.
Rules:
- Explain the INTENT and REASON — not the implementation
- Every claim MUST be cited: (PR #X), (commit abc1234), (issue #Y)
- If context is insufficient, say: "Not enough history to determine this."
- Never invent reasons. Never hallucinate PR numbers.
- Use plain language. Max 4 paragraphs. Lead with the most important reason.
Output format: Plain prose with inline citations. End with a one-line summary labelled "TL;DR:"
```
