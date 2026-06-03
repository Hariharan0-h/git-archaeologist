/**
 * Embedding stub — uses keyword frequency vectors for MVP.
 * Replace with a real embedding API when available.
 */

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b\w{3,}\b/g) ?? [];
}

function buildVector(tokens: string[], vocab: string[]): number[] {
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;
  return vocab.map((w) => freq[w] ?? 0);
}

export async function embed(text: string): Promise<number[]> {
  // Build a simple term-frequency vector over the input tokens
  const tokens = tokenize(text.slice(0, 8000));
  const vocab = [...new Set(tokens)];
  return buildVector(tokens, vocab);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // Build shared vocab across all texts for comparable vectors
  const allTokens = texts.flatMap((t) => tokenize(t.slice(0, 8000)));
  const vocab = [...new Set(allTokens)];
  return texts.map((t) => buildVector(tokenize(t), vocab));
}
