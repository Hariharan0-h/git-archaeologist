# QA Tester Skill — Git Archaeologist

## Role
Write targeted tests and verify acceptance criteria. Every output is a **specific test or bug report**. Read `CLAUDE.md` for the exact stack before writing tests.

---

## Test Stack

| Layer | Tool |
|---|---|
| Unit + Integration | Vitest |
| tRPC procedures | `@trpc/server` `createCaller` |
| DB | Drizzle test utils + Neon test branch |
| GitHub API mock | `vi.mock('@octokit/rest')` |
| LLM mock | `vi.mock('@anthropic-ai/sdk')` |
| Embeddings mock | `vi.mock('openai')` |
| BullMQ mock | `vi.mock('bullmq')` |
| E2E | Playwright |

---

## Test File Locations

```
__tests__/
├── server/
│   ├── routers/repo.test.ts
│   ├── routers/query.test.ts
│   └── routers/finding.test.ts
├── lib/
│   ├── github.test.ts
│   ├── llm.test.ts
│   └── embeddings.test.ts
├── jobs/
│   └── worker.test.ts
└── app/
    └── webhooks/stripe.test.ts
```

---

## tRPC Procedure Test Pattern

```typescript
// __tests__/server/routers/query.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '@/server/routers/_app';
import { createInnerTRPCContext } from '@/server/context';

vi.mock('@/lib/embeddings');
vi.mock('@/lib/llm');
vi.mock('@/lib/github');

describe('query.ask', () => {
  const session = { user: { id: 'user-123', email: 'test@test.com' }, expires: '' };

  it('returns finding with citation when context is found', async () => {
    vi.mocked(embedText).mockResolvedValue(new Array(1536).fill(0));
    vi.mocked(explainCode).mockResolvedValue('Because of PR #42...');

    const caller = appRouter.createCaller(createInnerTRPCContext({ session }));
    const result = await caller.query.ask({
      repoId: 'repo-uuid',
      codeSnippet: 'const x = 1;',
      lineStart: 10,
      lineEnd: 12,
    });

    expect(result.answer).toContain('PR #42');
    expect(result.confidence).toMatch(/high|medium|low/);
    expect(result.citations).toHaveLength(expect.any(Number));
  });

  it('throws UNAUTHORIZED when no session', async () => {
    const caller = appRouter.createCaller(createInnerTRPCContext({ session: null }));
    await expect(caller.query.ask({ repoId: 'x', codeSnippet: 'x', lineStart: 1, lineEnd: 1 }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('returns NOT_FOUND for unknown repoId', async () => {
    const caller = appRouter.createCaller(createInnerTRPCContext({ session }));
    await expect(caller.query.ask({ repoId: 'nonexistent', codeSnippet: 'x', lineStart: 1, lineEnd: 1 }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
```

## lib/github.ts Test Pattern

```typescript
// __tests__/lib/github.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCommitDetail } from '@/lib/github';

vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),  // cache miss by default
    setex: vi.fn().mockResolvedValue('OK'),
  })),
}));

describe('getCommitDetail()', () => {
  it('fetches from GitHub and caches on cache miss', async () => {
    const mockOctokit = { repos: { getCommit: vi.fn().mockResolvedValue({ data: COMMIT_FIXTURE }) } };
    const result = await getCommitDetail(mockOctokit as any, 'owner', 'repo', 'abc123');

    expect(mockOctokit.repos.getCommit).toHaveBeenCalledOnce();
    expect(result.sha).toBe('abc123');
  });

  it('returns cached result without calling GitHub', async () => {
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(COMMIT_FIXTURE));
    const mockOctokit = { repos: { getCommit: vi.fn() } };

    await getCommitDetail(mockOctokit as any, 'owner', 'repo', 'abc123');
    expect(mockOctokit.repos.getCommit).not.toHaveBeenCalled();
  });

  it('backs off (does not throw) on GitHub 403', async () => {
    const mockOctokit = {
      repos: { getCommit: vi.fn().mockRejectedValue({ status: 403 }) },
    };
    // Should not throw — should return null or retry
    await expect(getCommitDetail(mockOctokit as any, 'o', 'r', 'sha')).resolves.toBeNull();
  });
});
```

## BullMQ Job Test Pattern

```typescript
// __tests__/jobs/worker.test.ts
import { describe, it, expect, vi } from 'vitest';
import { processAnalysisJob } from '@/jobs/worker';

vi.mock('@/lib/github');
vi.mock('@/lib/embeddings');
vi.mock('@/lib/llm');
vi.mock('@/db');

describe('processAnalysisJob()', () => {
  it('stores finding in DB on success', async () => {
    vi.mocked(fetchBlame).mockResolvedValue(BLAME_FIXTURE);
    vi.mocked(embedText).mockResolvedValue(new Array(1536).fill(0.1));
    vi.mocked(explainCode).mockResolvedValue('TL;DR: performance fix (commit abc1234)');
    const insertSpy = vi.mocked(db.insert).mockReturnThis();

    await processAnalysisJob({ repoId: 'r', filePath: 'src/index.ts', userId: 'u' });
    expect(insertSpy).toHaveBeenCalled();
  });

  it('retries on transient GitHub error without throwing', async () => {
    vi.mocked(fetchBlame)
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValueOnce(BLAME_FIXTURE);

    await expect(processAnalysisJob({ repoId: 'r', filePath: 'f', userId: 'u' })).resolves.not.toThrow();
  });
});
```

## Stripe Webhook Test

```typescript
// __tests__/app/webhooks/stripe.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import Stripe from 'stripe';

vi.mock('stripe');

describe('POST /api/webhooks/stripe', () => {
  it('returns 400 on invalid signature', async () => {
    vi.mocked(Stripe.prototype.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const req = new Request('http://localhost', {
      method: 'POST', body: '{}', headers: { 'stripe-signature': 'bad' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('activates subscription on checkout.session.completed', async () => {
    const updateSpy = vi.fn();
    vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue({ where: updateSpy }) } as any);
    // ... setup event mock, call POST, assert updateSpy called with correct plan
  });
});
```

---

## Bug Report Format

```markdown
## Bug: <title>
**Severity**: Critical | High | Medium | Low
**File**: <path>:<line>
**Symptom**: <what breaks>
**Root cause**: <exact condition>
**Fix**: <exact change>
**Test to add**: <test case that catches this>
```

---

## QA Checklist (per feature)

- [ ] Happy path test
- [ ] Auth guard: UNAUTHORIZED when no session
- [ ] Invalid input: Zod parse error returned (not 500)
- [ ] GitHub 403/429: does not throw, backs off
- [ ] LLM timeout: returns error, does not hang
- [ ] Cache hit: no external API call made
- [ ] DB constraint violation: typed error returned
- [ ] `tsc --noEmit` passes (zero type errors)
- [ ] No `any` added without justification comment
