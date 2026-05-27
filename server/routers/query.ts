/**
 * query.submit — the core RAG pipeline procedure.
 * Accepts code snippet (paste mode) or file path + line range.
 * Returns an answer narrative with citations.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";

const QueryInput = z.object({
  // Paste mode
  codeSnippet: z.string().min(1).max(5000),
  // Repo mode (optional — required if not paste mode)
  repoFullName: z.string().optional(), // "owner/repo"
  filePath: z.string().optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
});

export const queryRouter = router({
  submit: protectedProcedure
    .input(QueryInput)
    .mutation(async ({ ctx, input }) => {
      // TODO Week 3-4: full pipeline implementation
      // 1. Rate-limit check (free tier: 50/month)
      // 2. If repo mode: fetch blame → commits → PRs via lib/github.ts
      // 3. Chunk + embed context via lib/embeddings.ts
      // 4. Similarity search in pgvector
      // 5. Call lib/llm.ts → explainCode()
      // 6. Persist finding, return answer

      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Pipeline not yet implemented — Week 3-4 deliverable",
      });
    }),
});
