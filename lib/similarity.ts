/**
 * Rank chunks by keyword overlap with the query — no embedding API needed.
 * Returns top-k chunks sorted by descending overlap score.
 */
export function rankChunks(chunks: string[], query: string, k: number): string[] {
  const queryTokens = new Set(query.toLowerCase().match(/\b\w{3,}\b/g) ?? []);
  return chunks
    .map((chunk) => {
      const chunkTokens = chunk.toLowerCase().match(/\b\w{3,}\b/g) ?? [];
      const overlap = chunkTokens.filter((t) => queryTokens.has(t)).length;
      return { chunk, score: overlap };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.chunk);
}

/** Cosine similarity between two equal-length vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Return top-k rows by cosine similarity to queryEmbedding */
export function topK<T extends { embedding: string | null }>(
  rows: T[],
  queryEmbedding: number[],
  k: number
): T[] {
  return rows
    .filter((r) => r.embedding !== null)
    .map((r) => ({
      row: r,
      score: cosineSimilarity(JSON.parse(r.embedding!), queryEmbedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.row);
}
