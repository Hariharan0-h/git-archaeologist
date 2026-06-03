import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
import { RepoList } from "./RepoList";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Git Archaeologist</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{session.user?.name}</span>
            <SignOutButton />
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Your Repositories</h2>
          <RepoList />
        </div>
      </div>
    </main>
  );
}
