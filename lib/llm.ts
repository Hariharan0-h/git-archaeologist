/**
 * LLM wrapper — ALL Anthropic API calls must go through here.
 * Handles: retries, token logging, system prompt injection.
 */

import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a code historian. You explain why code exists, not what it does.

You are given: the code snippet, and a set of retrieved context chunks from git blame, commit messages, PR descriptions, PR review comments, and issue threads.

Rules:
- Explain the INTENT and REASON — not the implementation
- Every claim MUST be cited: (PR #X), (commit abc1234), (issue #Y)
- If context is insufficient, say: "Not enough history to determine this."
- Never invent reasons. Never hallucinate PR numbers.
- Use plain language. Max 4 paragraphs. Lead with the most important reason.

Output format: Plain prose with inline citations. End with a one-line summary labelled "TL;DR:"`;

export interface ArchaeologistAnswer {
  narrative: string;
  inputTokens: number;
  outputTokens: number;
}

export async function explainCode(
  codeSnippet: string,
  contextChunks: string[]
): Promise<ArchaeologistAnswer> {
  const userMessage = `
Code snippet to explain:
\`\`\`
${codeSnippet}
\`\`\`

Retrieved history context:
${contextChunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}

Now explain why this code was written.
`.trim();

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const narrative = response.choices[0].message.content ?? "";

      return {
        narrative,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastError;
}
