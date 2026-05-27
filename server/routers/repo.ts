import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { listUserRepos, getRepoTree } from "@/lib/github";

export const repoRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const token = (ctx.session as any).githubAccessToken as string;
    return listUserRepos(token);
  }),

  tree: protectedProcedure
    .input(z.object({ owner: z.string(), repo: z.string(), ref: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const token = (ctx.session as any).githubAccessToken as string;
      return getRepoTree(token, input.owner, input.repo, input.ref);
    }),
});
