import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const findingRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // TODO: return findings for current user
    return [];
  }),

  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      // TODO: fetch finding by share slug (public — no auth check needed)
      return null;
    }),
});
