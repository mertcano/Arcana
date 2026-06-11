import type { Retrieved } from "@/lib/retrieval";

// OpenAI-compatible chat endpoint. Defaults to Groq's free API.
// Works with any OpenAI-compatible provider by changing LLM_BASE_URL/LLM_MODEL.
const BASE_URL = process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1";
const MODEL = process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";

function apiKey(): string {
  const key = process.env.LLM_API_KEY;
  if (!key) throw new Error("LLM_API_KEY is not set");
  return key;
}

function buildContext(items: Retrieved[]): string {
  return items
    .map(
      (it, i) =>
        `[Source ${i + 1}] ${it.chunk.title} (${it.chunk.url})\n${it.chunk.text}`,
    )
    .join("\n\n---\n\n");
}

const SYSTEM = `You are Arcana, a precise assistant for developers building on Arc, Circle's USDC-native Layer-1 testnet.
Answer ONLY from the provided sources. Rules:
- If the sources do not contain the answer, say you are not certain and point to the closest source. Do not invent contract addresses, chain IDs, or decimals.
- Arc is testnet only. USDC is the native gas token (18 decimals). ERC-20 USDC uses 6 decimals. Never say gas is paid in ETH.
- Be concise and concrete. Use short paragraphs and fenced code blocks for code or config.
- Do not include a "Sources" list in your text; sources are shown separately by the app.`;

export async function answer(
  question: string,
  items: Retrieved[],
  deep: boolean,
): Promise<string> {
  const context = buildContext(items);
  const depth = deep
    ? "This is a DEEP answer: be thorough, include relevant code/config and edge cases."
    : "This is a FREE answer: keep it brief (a few sentences).";

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: deep ? 1200 : 450,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `${depth}\n\nSOURCES:\n${context}\n\nQUESTION: ${question}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
  return text || "I could not generate an answer. Please try rephrasing.";
}
