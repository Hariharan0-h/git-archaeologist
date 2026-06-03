/**
 * query.submit — core RAG pipeline.
 * blame → commits → PRs → embed → cosine similarity → Groq LLM → finding
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";
import { repos, commits, pullRequests, findings, users } from "@/db/schema";
import {
  getBlame,
  getCommit,
  getPRsForCommit,
  getPRComments,
} from "@/lib/github";
import { explainCode } from "@/lib/llm";
import { rankChunks } from "@/lib/similarity";

const QueryInput = z.object({
  codeSnippet: z.string().min(1).max(5000),
  repoFullName: z.string(), // "owner/repo"
  filePath: z.string(),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
});

export const queryRouter = router({
  submit: protectedProcedure
    .input(QueryInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No database connection" });
      if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const token = (ctx.session as any).githubAccessToken as string;
      const [owner, repo] = input.repoFullName.split("/");
      const db = ctx.db;

      // ── 1. Upsert user row ─────────────────────────────────────────────────
      const sessionUser = ctx.session.user!;
      let userRow = (await db.select().from(users)
        .where(eq(users.email, sessionUser.email!))
        .limit(1))[0];

      if (!userRow) {
        const inserted = await db.insert(users).values({
          githubId: 0, // will be populated on full OAuth profile wiring
          email: sessionUser.email!,
          name: sessionUser.name ?? null,
          avatarUrl: sessionUser.image ?? null,
        }).returning();
        userRow = inserted[0];
      }

      // ── 2. Upsert repo row ─────────────────────────────────────────────────
      let repoRow = (await db.select().from(repos)
        .where(eq(repos.fullName, input.repoFullName))
        .limit(1))[0];

      if (!repoRow) {
        const inserted = await db.insert(repos).values({
          userId: userRow.id,
          githubRepoId: 0,
          fullName: input.repoFullName,
        }).returning();
        repoRow = inserted[0];
      }

      // ── 2. Blame → unique commit SHAs touching the selected lines ──────────
      const blameLines = await getBlame(token, owner, repo, input.filePath);
      const relevantShas = [
        ...new Set(
          blameLines
            .filter((b) => b.line >= input.startLine && b.line <= input.endLine)
            .map((b) => b.sha)
        ),
      ].slice(0, 10); // cap at 10 commits

      // ── 3. Fetch commits + PRs, store in DB, build context chunks ──────────
      const contextChunks: string[] = [];

      for (const sha of relevantShas) {
        // Check cache first
        const cached = (await db.select().from(commits)
          .where(eq(commits.sha, sha))
          .limit(1))[0];

        let commitMessage = cached?.message ?? "";
        let diffText = cached?.diffText ?? "";

        if (!cached) {
          const commitData = await getCommit(token, owner, repo, sha);
          commitMessage = commitData.commit?.message ?? "";
          diffText = commitData.files?.map((f: any) => f.patch ?? "").join("\n").slice(0, 2000) ?? "";

          await db.insert(commits).values({
            sha,
            repoId: repoRow.id,
            message: commitMessage,
            author: commitData.commit?.author?.name ?? "",
            date: commitData.commit?.author?.date ? new Date(commitData.commit.author.date) : null,
            diffText,
          }).onConflictDoNothing();
        }

        if (commitMessage) {
          contextChunks.push(`commit ${sha.slice(0, 7)}: ${commitMessage}\n${diffText.slice(0, 500)}`);
        }

        // PRs associated with this commit
        try {
          const prs: any[] = await getPRsForCommit(token, owner, repo, sha);
          for (const pr of prs.slice(0, 3)) {
            const existing = (await db.select().from(pullRequests)
              .where(eq(pullRequests.prNumber, pr.number))
              .limit(1))[0];

            let prBody = existing?.body ?? pr.body ?? "";
            let comments: any[] = [];

            if (!existing) {
              comments = await getPRComments(token, owner, repo, pr.number);
              await db.insert(pullRequests).values({
                repoId: repoRow.id,
                prNumber: pr.number,
                title: pr.title ?? "",
                body: prBody,
                commentsJson: comments,
              }).onConflictDoNothing();
            } else {
              comments = (existing.commentsJson as any[]) ?? [];
            }

            const commentText = comments.slice(0, 5).map((c: any) => c.body ?? "").join("\n");
            contextChunks.push(
              `PR #${pr.number} "${pr.title}": ${prBody.slice(0, 400)}\nReview comments: ${commentText.slice(0, 400)}`
            );
          }
        } catch {
          // PRs endpoint may 404 on some repos — non-fatal
        }
      }

      // ── 4. Rank context chunks by keyword relevance ────────────────────────
      const finalChunks = contextChunks.length > 0
        ? rankChunks(contextChunks, input.codeSnippet, 5)
        : ["No git history context found for the selected lines."];

      // ── 5. Call LLM ────────────────────────────────────────────────────────
      const { narrative } = await explainCode(input.codeSnippet, finalChunks);

      // ── 6. Persist finding ─────────────────────────────────────────────────
      const slug = Math.random().toString(36).slice(2, 10);
      await db.insert(findings).values({
        userId: userRow.id,
        repoId: repoRow.id,
        codeSnippet: input.codeSnippet,
        answer: narrative,
        citationsJson: finalChunks,
        shareSlug: slug,
      });

      return { narrative, slug, contextCount: finalChunks.length };
    }),
});
