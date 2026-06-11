"use client";

import { useRef, useState } from "react";
import { Message } from "./Message";
import { Paywall } from "./Paywall";
import { WalletButton } from "./WalletButton";
import { NetworkGuard } from "./NetworkGuard";
import { Wordmark } from "./Wordmark";
import { FREE_QUOTA, PRICE_USDC, explorerTx } from "@/lib/constants";
import type { ChatMessage, Source } from "@/types";

const SUGGESTIONS = [
  "How is gas paid on Arc?",
  "What decimals does ERC-20 USDC use?",
  "What is the Arc Testnet chain ID and RPC?",
  "When should I use App Kit?",
];

let idSeq = 0;
const newId = () => `m${++idSeq}`;

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [freeUsed, setFreeUsed] = useState(0);
  const [busy, setBusy] = useState(false);

  const [paywallFor, setPaywallFor] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const freeLeft = Math.max(0, FREE_QUOTA - freeUsed);

  function scrollDown() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function callAsk(
    question: string,
    mode: "free" | "deep",
    unlockToken?: string,
  ) {
    const pendingId = newId();
    setMessages((m) => [
      ...m,
      { id: pendingId, role: "assistant", content: "", pending: true, deep: mode === "deep" },
    ]);
    setBusy(true);
    scrollDown();

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, mode, unlockToken }),
      });
      const data = await res.json();
      const content = res.ok
        ? (data.answer as string)
        : (data.error as string) ?? "Something went wrong.";
      const sources = (res.ok ? (data.sources as Source[]) : []) ?? [];
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? { ...msg, content, sources, pending: false, deep: mode === "deep" }
            : msg,
        ),
      );
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? { ...msg, content: "Network error. Please try again.", pending: false }
            : msg,
        ),
      );
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  async function askFree(q?: string) {
    const question = (q ?? input).trim();
    if (!question || busy) return;

    if (freeLeft <= 0) {
      setPaywallFor(question);
      return;
    }

    setMessages((m) => [...m, { id: newId(), role: "user", content: question }]);
    setInput("");
    setFreeUsed((n) => n + 1);
    await callAsk(question, "free");
  }

  function onUnlock(token: string, txHash: string) {
    const question = paywallFor;
    setPaywallFor(null);
    if (!question) return;
    setMessages((m) => [
      ...m,
      {
        id: newId(),
        role: "user",
        content: `${question}  ·  paid ${PRICE_USDC} USDC`,
      },
    ]);
    // include a small confirmation with explorer link
    setMessages((m) => [
      ...m,
      {
        id: newId(),
        role: "assistant",
        content: `Payment confirmed. [tx](${explorerTx(txHash)})`,
        deep: false,
        sources: [{ title: "Payment transaction", url: explorerTx(txHash) }],
      },
    ]);
    void callAsk(question, "deep", token);
  }

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between py-4">
        <Wordmark />
        <WalletButton />
      </header>

      <div className="pb-2">
        <NetworkGuard />
      </div>

      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="max-w-md font-display text-2xl leading-snug">
              The hidden knowledge of Arc, unlocked with USDC.
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Ask anything about building on Arc. Answers are grounded in the
              official docs and cite their sources.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => askFree(s)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:border-arcane-dim hover:text-text"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <Message key={m.id} message={m} />)
        )}
      </div>

      <div className="border-t border-border py-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void askFree();
              }
            }}
            rows={1}
            placeholder="Ask about Arc, USDC gas, App Kit, deploying contracts…"
            className="max-h-40 flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-3 text-text placeholder:text-muted focus:border-arcane-dim focus:outline-none"
          />
          <button
            onClick={() => askFree()}
            disabled={busy || !input.trim()}
            className="rounded-xl bg-arcane px-5 py-3 font-medium text-ink shadow-glow transition hover:brightness-110 disabled:opacity-50"
          >
            Ask
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>
            {freeLeft > 0
              ? `${freeLeft} free question${freeLeft === 1 ? "" : "s"} left`
              : "Free questions used — deep answers cost USDC"}
          </span>
          <button
            onClick={() => setPaywallFor(input.trim() || messages.findLast((m) => m.role === "user")?.content || "")}
            disabled={busy}
            className="text-arcane hover:underline disabled:opacity-50"
          >
            Get a deep answer ({PRICE_USDC} USDC)
          </button>
        </div>
      </div>

      {paywallFor !== null && paywallFor !== "" && (
        <Paywall onUnlock={onUnlock} onClose={() => setPaywallFor(null)} />
      )}
    </div>
  );
}
