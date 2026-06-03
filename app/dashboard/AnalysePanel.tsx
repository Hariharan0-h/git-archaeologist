"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface Props {
  repoFullName: string;
  onClose: () => void;
}

export function AnalysePanel({ repoFullName, onClose }: Props) {
  const [owner, repoName] = repoFullName.split("/");

  // File tree
  const { data: treeData, isLoading: treeLoading } = trpc.repo.tree.useQuery(
    { owner, repo: repoName },
    { staleTime: 60_000 }
  );

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string[]>([]);
  const [startLine, setStartLine] = useState<number | null>(null);
  const [endLine, setEndLine] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const submit = trpc.query.submit.useMutation({
    onSuccess: (data) => setResult(data.narrative),
  });

  const files = (treeData as any)?.tree
    ?.filter((f: any) => f.type === "blob")
    .slice(0, 200) ?? [];

  async function loadFile(path: string) {
    setSelectedFile(path);
    setStartLine(null);
    setEndLine(null);
    setResult(null);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/${path}`,
        { headers: { Accept: "application/vnd.github.raw" } }
      );
      const text = await res.text();
      setFileContent(text.split("\n"));
    } catch {
      setFileContent(["Could not load file content."]);
    }
  }

  function toggleLine(n: number) {
    if (!startLine) {
      setStartLine(n);
      setEndLine(n);
    } else if (n < startLine) {
      setStartLine(n);
    } else {
      setEndLine(n);
    }
  }

  function handleAnalyse() {
    if (!selectedFile || !startLine || !endLine) return;
    const snippet = fileContent.slice(startLine - 1, endLine).join("\n");
    submit.mutate({
      codeSnippet: snippet,
      repoFullName,
      filePath: selectedFile,
      startLine,
      endLine,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-6xl h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="font-semibold text-sm">{repoFullName}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* File tree */}
          <div className="w-64 border-r border-gray-700 overflow-y-auto p-3 shrink-0">
            {treeLoading ? (
              <p className="text-xs text-gray-500">Loading files…</p>
            ) : (
              <ul className="space-y-0.5">
                {files.map((f: any) => (
                  <li key={f.path}>
                    <button
                      onClick={() => loadFile(f.path)}
                      className={`w-full text-left text-xs px-2 py-1 rounded truncate transition-colors ${
                        selectedFile === f.path
                          ? "bg-indigo-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      {f.path}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* File content */}
          <div className="flex-1 overflow-y-auto font-mono text-xs">
            {!selectedFile ? (
              <div className="flex items-center justify-center h-full text-gray-600">
                Select a file to view
              </div>
            ) : (
              <table className="w-full border-collapse">
                <tbody>
                  {fileContent.map((line, i) => {
                    const n = i + 1;
                    const inRange = startLine && endLine && n >= startLine && n <= endLine;
                    return (
                      <tr
                        key={n}
                        onClick={() => toggleLine(n)}
                        className={`cursor-pointer ${inRange ? "bg-indigo-900/50" : "hover:bg-gray-800/50"}`}
                      >
                        <td className="select-none text-gray-600 text-right pr-3 pl-2 w-10">{n}</td>
                        <td className="whitespace-pre pr-4 text-gray-300">{line}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Result panel */}
          {result && (
            <div className="w-80 border-l border-gray-700 overflow-y-auto p-4 text-sm text-gray-300 leading-relaxed shrink-0">
              <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">Why this code?</p>
              <p className="whitespace-pre-wrap">{result}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-gray-700">
          <span className="text-xs text-gray-500">
            {startLine && endLine
              ? `Lines ${startLine}–${endLine} selected`
              : "Click a line to start selection, click another to end"}
          </span>
          <button
            onClick={handleAnalyse}
            disabled={!startLine || !endLine || submit.isPending}
            className="ml-auto rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-40 transition-colors"
          >
            {submit.isPending ? "Analysing…" : "Why? ✦"}
          </button>
          {submit.isError && (
            <span className="text-xs text-red-400">{submit.error.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
