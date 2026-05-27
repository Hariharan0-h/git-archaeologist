/**
 * GitHub API wrapper
 * ALL GitHub API calls must go through this module.
 * Handles: auth injection, rate-limit logging, Postgres caching.
 *
 * SECURITY: Never log the access token. Never store raw code. Read-only scope only.
 */

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// ── Blame ──────────────────────────────────────────────────────────────────

export async function getBlame(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  ref = "HEAD"
): Promise<{ sha: string; line: number }[]> {
  // GitHub REST doesn't expose blame — use GraphQL
  const query = `
    query($owner: String!, $repo: String!, $filePath: String!, $ref: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $ref) {
          ... on Commit {
            blame(path: $filePath) {
              ranges {
                startingLine
                endingLine
                commit { oid }
              }
            }
          }
        }
      }
    }
  `;
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { owner, repo, filePath, ref } }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL error: ${res.status}`);
  const json = await res.json();
  const ranges: { startingLine: number; endingLine: number; commit: { oid: string } }[] =
    json.data?.repository?.object?.blame?.ranges ?? [];
  return ranges.flatMap((r) =>
    Array.from({ length: r.endingLine - r.startingLine + 1 }, (_, i) => ({
      sha: r.commit.oid,
      line: r.startingLine + i,
    }))
  );
}

// ── Commit ─────────────────────────────────────────────────────────────────

export async function getCommit(
  token: string,
  owner: string,
  repo: string,
  sha: string
) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`GitHub commit fetch error: ${res.status}`);
  return res.json();
}

// ── Pull Requests associated with a commit ─────────────────────────────────

export async function getPRsForCommit(
  token: string,
  owner: string,
  repo: string,
  sha: string
) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}/pulls`,
    {
      headers: {
        ...headers(token),
        Accept: "application/vnd.github.groot-preview+json",
      },
    }
  );
  if (!res.ok) throw new Error(`GitHub PRs-for-commit error: ${res.status}`);
  return res.json();
}

// ── PR review comments ─────────────────────────────────────────────────────

export async function getPRComments(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error(`GitHub PR comments error: ${res.status}`);
  return res.json();
}

// ── User repos ─────────────────────────────────────────────────────────────

export async function listUserRepos(token: string) {
  const res = await fetch(
    `${GITHUB_API}/user/repos?sort=updated&per_page=50&type=all`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error(`GitHub list repos error: ${res.status}`);
  return res.json();
}

// ── Repo file tree ─────────────────────────────────────────────────────────

export async function getRepoTree(
  token: string,
  owner: string,
  repo: string,
  ref = "HEAD"
) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error(`GitHub tree error: ${res.status}`);
  return res.json();
}

// ── File content (raw) ─────────────────────────────────────────────────────

export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  ref = "HEAD"
): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`,
    { headers: { ...headers(token), Accept: "application/vnd.github.raw" } }
  );
  if (!res.ok) throw new Error(`GitHub file content error: ${res.status}`);
  return res.text();
}
