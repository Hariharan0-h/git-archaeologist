"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AnalysePanel } from "./AnalysePanel";

export function RepoList() {
  const { data: repos, isLoading, error } = trpc.repo.list.useQuery();
  const [activeRepo, setActiveRepo] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-sm text-gray-500 text-center py-12">Loading repositories…</div>;
  }
  if (error) {
    return <div className="text-sm text-red-400 text-center py-12">Failed to load repositories: {error.message}</div>;
  }
  if (!repos?.length) {
    return <div className="text-sm text-gray-500 text-center py-12">No repositories found.</div>;
  }

  return (
    <>
      <ul className="divide-y divide-gray-800">
        {repos.map((repo: any) => (
          <li key={repo.id} className="flex items-center justify-between py-4 gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-medium text-sm truncate">{repo.full_name}</span>
              {repo.description && (
                <span className="text-xs text-gray-500 truncate">{repo.description}</span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-gray-600">{repo.language ?? ""}</span>
              <span className="text-xs text-gray-600">★ {repo.stargazers_count}</span>
              <button
                onClick={() => setActiveRepo(repo.full_name)}
                className="text-xs rounded-md bg-indigo-600 px-3 py-1.5 font-medium hover:bg-indigo-500 transition-colors"
              >
                Analyse
              </button>
            </div>
          </li>
        ))}
      </ul>

      {activeRepo && (
        <AnalysePanel
          repoFullName={activeRepo}
          onClose={() => setActiveRepo(null)}
        />
      )}
    </>
  );
}
