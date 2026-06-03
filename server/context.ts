import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { DB } from "@/db";

export async function createTRPCContext({ req }: { req: Request }) {
  const session = await getServerSession(authOptions);

  // Lazy-load DB so routes that don't need it work without DATABASE_URL
  let db: DB | null = null;
  if (process.env.DATABASE_URL) {
    const { db: _db } = await import("@/db");
    db = _db;
  }

  return { session, db };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
