import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  json,
  vector,
  unique,
} from "drizzle-orm/pg-core";

// ── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  githubId: integer("github_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  plan: text("plan").notNull().default("free"), // "free" | "pro"
  queryCount: integer("query_count").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Repos ──────────────────────────────────────────────────────────────────

export const repos = pgTable("repos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  githubRepoId: integer("github_repo_id").notNull(),
  fullName: text("full_name").notNull(), // "owner/repo"
  lastIndexedAt: timestamp("last_indexed_at"),
});

// ── Commits ────────────────────────────────────────────────────────────────

export const commits = pgTable(
  "commits",
  {
    id: serial("id").primaryKey(),
    sha: text("sha").notNull(),
    repoId: integer("repo_id")
      .notNull()
      .references(() => repos.id),
    message: text("message"),
    author: text("author"),
    date: timestamp("date"),
    diffText: text("diff_text"),
  },
  (t) => ({ uniq: unique().on(t.sha, t.repoId) })
);

// ── Pull Requests ──────────────────────────────────────────────────────────

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: serial("id").primaryKey(),
    repoId: integer("repo_id")
      .notNull()
      .references(() => repos.id),
    prNumber: integer("pr_number").notNull(),
    title: text("title"),
    body: text("body"),
    commentsJson: json("comments_json"),
  },
  (t) => ({ uniq: unique().on(t.prNumber, t.repoId) })
);

// ── Embeddings (pgvector) ──────────────────────────────────────────────────

export const embeddings = pgTable("embeddings", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id")
    .notNull()
    .references(() => repos.id),
  sourceType: text("source_type").notNull(), // "commit" | "pr" | "issue"
  sourceId: text("source_id").notNull(),
  chunkText: text("chunk_text").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
});

// ── Findings ───────────────────────────────────────────────────────────────

export const findings = pgTable("findings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  repoId: integer("repo_id").references(() => repos.id),
  codeSnippet: text("code_snippet").notNull(),
  answer: text("answer").notNull(),
  citationsJson: json("citations_json"),
  shareSlug: text("share_slug").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
