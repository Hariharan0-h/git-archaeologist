import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { SignInButton } from "./SignInButton";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-950 text-white p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Git Archaeologist</h1>
        <p className="text-gray-400 mt-2">Why was this code written?</p>
      </div>

      {session ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-300 text-sm">
            Signed in as <span className="font-medium text-white">{session.user?.name}</span>
          </p>
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Go to Dashboard →
          </Link>
        </div>
      ) : (
        <SignInButton />
      )}
    </main>
  );
}
