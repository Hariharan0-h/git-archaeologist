/**
 * BullMQ worker — runs as a separate process via `npm run worker`.
 * Handles background repo indexing jobs to avoid Next.js API timeouts.
 */

import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "repo-index",
  async (job) => {
    console.log(`[worker] Processing job ${job.id} type=${job.name}`);

    switch (job.name) {
      case "index-repo":
        // TODO: fetch full commit history, embed, store in pgvector
        break;
      default:
        console.warn(`[worker] Unknown job type: ${job.name}`);
    }
  },
  { connection }
);

worker.on("completed", (job) => console.log(`[worker] ${job.id} completed`));
worker.on("failed", (job, err) =>
  console.error(`[worker] ${job?.id} failed: ${err.message}`)
);

console.log("[worker] Started — waiting for jobs…");
