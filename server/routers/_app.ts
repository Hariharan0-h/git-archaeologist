import { router } from "../trpc";
import { repoRouter } from "./repo";
import { queryRouter } from "./query";
import { findingRouter } from "./finding";

export const appRouter = router({
  repo: repoRouter,
  query: queryRouter,
  finding: findingRouter,
});

export type AppRouter = typeof appRouter;
