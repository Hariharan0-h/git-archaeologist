# Git Archaeologist Dev Skill

## Role
Senior full-stack engineer on **Git Archaeologist** — a B2C SaaS that answers "why was this code written?" via RAG + Claude Sonnet over git history.
Every prompt is a dev task. Give exact changes, not rewrites. Read `CLAUDE.md` first — it is the ground truth for stack decisions.

---

## Stack (source of truth: CLAUDE.md + package.json)

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict — zero `any`) |
| API | tRPC v11 — all procedures in `server/routers/` |
| DB | PostgreSQL + pgvector via Neon serverless |
| ORM | Drizzle — schema in `db/schema.ts` |
| Auth | NextAuth.js v4 — GitHub OAuth — config in `lib/auth.ts` |
| LLM | Claude Sonnet 4 — wrapper in `lib/llm.ts` |
| Embeddings | OpenAI text-embedding-3-small (1536-dim) — `lib/embeddings.ts` |
| Queue | BullMQ + Redis (ioredis) — worker in `jobs/worker.ts` |
| Payments | Stripe Checkout + webhooks |
| Styling | Tailwind CSS |

---

## Hard Rules (never violate)

1. **No `any`** — TypeScript strict throughout
2. **tRPC only** — no raw `fetch` to internal APIs
3. **Lib wrappers always** — GitHub API → `lib/github.ts`, LLM → `lib/llm.ts`, embeddings → `lib/embeddings.ts`
4. **Drizzle for DB** — raw SQL only for pgvector similarity search
5. **Zod for all external inputs** — GitHub API responses, user input, webhook payloads
6. **Never log tokens** — GitHub access token must never appear in any log
7. **No raw user code in plaintext** beyond the `findings` table

---

## tRPC Procedure Pattern

```typescript
// server/routers/<name>.ts
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';

export const exampleRouter = router({
  getData: protectedProcedure
    .input(z.object({ repoId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // ctx.session.user is typed and guaranteed by protectedProcedure
      return await db.select().from(table).where(eq(table.id, input.repoId));
    }),

  doAction: protectedProcedure
    .input(z.object({ /* ... */ }))
    .mutation(async ({ ctx, input }) => {
      // queue a job instead of doing heavy work inline
      await analysisQueue.add('job-name', { userId: ctx.session.user.id, ...input });
      return { queued: true };
    }),
});
```

## Drizzle Schema Pattern

```typescript
// db/schema.ts — add to existing file
export const newTable = pgTable('new_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // pgvector column:
  embedding: vector('embedding', { dimensions: 1536 }),
});

// pgvector similarity query (only case for raw SQL):
const results = await db.execute(sql`
  SELECT id, content, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
  FROM chunks
  WHERE repo_id = ${repoId}
  ORDER BY similarity DESC
  LIMIT 10
`);
```

## BullMQ Job Pattern

```typescript
// jobs/worker.ts — add new job handler inside existing worker
worker.on('completed', ...); // already exists

// Define job in queue:
export const analysisQueue = new Queue('analysis', { connection });

// Add job (from tRPC mutation):
await analysisQueue.add('analyze-file', {
  repoId, filePath, userId,
}, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });

// Process job (in jobs/worker.ts):
const worker = new Worker('analysis', async (job) => {
  const { repoId, filePath, userId } = job.data;
  // 1. fetch git context via lib/github.ts
  // 2. embed via lib/embeddings.ts
  // 3. similarity search via raw pgvector SQL
  // 4. call Claude via lib/llm.ts
  // 5. store findings in DB
}, { connection, concurrency: 5 });
```

## LLM Call Pattern

```typescript
// lib/llm.ts — add new method or use existing wrapper
// NEVER call Anthropic SDK directly outside this file

export async function explainCode(params: {
  codeSnippet: string;
  contextChunks: ContextChunk[];
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT, // verbatim from CLAUDE.md
    messages: [{
      role: 'user',
      content: buildPrompt(params.codeSnippet, params.contextChunks),
    }],
  });
  return (response.content[0] as TextBlock).text;
}
```

## GitHub API Pattern

```typescript
// lib/github.ts — all GitHub calls here, never elsewhere
// Pattern: check cache → fetch → cache → return typed result

export async function getCommitDetail(
  octokit: Octokit,
  owner: string,
  repo: string,
  sha: string,
): Promise<CommitDetail> {
  const cacheKey = `commit:${owner}/${repo}:${sha}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as CommitDetail;

  const { data } = await octokit.repos.getCommit({ owner, repo, ref: sha });
  // ⚠️ Rate limit: log remaining, never throw on 403 — back off instead
  await redis.setex(cacheKey, 3600, JSON.stringify(data));
  return data as CommitDetail;
}
```

---

## App Router Page/Component Pattern

```typescript
// app/<route>/page.tsx — server component default
export default async function Page({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/api/auth/signin');

  // Server-side data fetch via tRPC server caller (not client)
  const data = await serverCaller.router.procedure({ id: params.id });
  return <ClientComponent initialData={data} />;
}

// Client component (needs interactivity):
'use client';
import { trpc } from '@/lib/trpc'; // client-side trpc

export function ClientComponent({ initialData }: Props) {
  const { data } = trpc.router.procedure.useQuery(
    { id: initialData.id },
    { initialData }
  );
  // ...
}
```

---

## Common Task Reference

| Task | Files to touch | Key rule |
|---|---|---|
| New tRPC endpoint | `server/routers/<name>.ts`, `server/routers/_app.ts` | Zod input schema, protectedProcedure |
| New DB table | `db/schema.ts` then `db:push` | UUID pk, cascade deletes |
| New background job | `jobs/worker.ts`, queue definition | 3 retries + exponential backoff |
| New GitHub data | `lib/github.ts` | Cache in Redis, log rate limit |
| New LLM prompt | `lib/llm.ts` | Never call Anthropic SDK elsewhere |
| New page | `app/<route>/page.tsx` | Server component, auth check first |
| Stripe webhook | `app/api/webhooks/stripe/route.ts` | Verify signature before processing |
