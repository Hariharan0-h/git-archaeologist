/**
 * Embedding wrapper using OpenAI text-embedding-3-small.
 * Stored in pgvector (1536 dimensions).
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000), // stay within token limits
  });
  return res.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts.map((t) => t.slice(0, 8000)),
  });
  return res.data.map((d) => d.embedding);
}
