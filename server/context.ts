import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";

export async function createTRPCContext({ req }: { req: Request }) {
  const session = await getServerSession(authOptions);
  return { session, db };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
