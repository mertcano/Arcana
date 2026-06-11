import { NextResponse } from "next/server";
import { retrieve, uniqueSources } from "@/lib/retrieval";
import { answer } from "@/lib/llm";
import { consumeUnlockToken } from "@/lib/payment";
import type { AskRequest } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: AskRequest;
  try {
    body = (await req.json()) as AskRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }

  const deep = body.mode === "deep";

  if (deep) {
    if (!body.unlockToken || !consumeUnlockToken(body.unlockToken)) {
      return NextResponse.json(
        { error: "Deep answers require a valid payment. Pay to unlock." },
        { status: 402 },
      );
    }
  }

  const topK = deep ? 6 : 4;
  const retrieved = retrieve(question, topK);

  if (retrieved.length === 0) {
    return NextResponse.json({
      answer:
        "I could not find anything relevant in the Arc docs corpus for that. Try asking about USDC gas, decimals, chain details, App Kit, or deploying contracts.",
      sources: [],
    });
  }

  try {
    const text = await answer(question, retrieved, deep);
    return NextResponse.json({ answer: text, sources: uniqueSources(retrieved) });
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("LLM_API_KEY")
        ? "Server is missing LLM_API_KEY. Set it in your environment."
        : "The assistant failed to answer. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
