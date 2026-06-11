import Anthropic from "@anthropic-ai/sdk";
import type { Retrieved } from "@/lib/retrieval";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
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

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: deep ? 1200 : 450,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `${depth}\n\nSOURCES:\n${context}\n\nQUESTION: ${question}`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return text || "I could not generate an answer. Please try rephrasing.";
}
