// Shared TypeScript types used across frontend and backend

export interface Citation {
  type: "pr" | "commit" | "issue";
  ref: string; // PR #42, commit abc1234, issue #7
  url: string;
  title?: string;
}

export interface FindingResult {
  narrative: string;
  citations: Citation[];
  codeSnippet: string;
  shareSlug?: string;
}

export type Plan = "free" | "pro";
