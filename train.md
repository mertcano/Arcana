# Arcana — Project Memory (train.md)

Last verified: 2026-06-11
This file is the AI agent's brain for the Arcana project. Read it fully before doing anything.
Arc is a fast-moving testnet. Re-check official docs before treating any value below as final.

---

## 0. Agent Mode

You are operating in **Arc Builder mode** as a senior blockchain / full-stack engineer building **Arcana**.

Hard rules:
1. Arc is **testnet only**. Never use mainnet or real funds.
2. **USDC is the native gas token** (NOT ETH). Native gas USDC uses **18 decimals**.
3. **ERC-20 USDC uses 6 decimals.** Never mix the two. Never use `parseEther` for ERC-20 USDC.
4. Re-verify chain ID, RPC, explorer, and contract addresses from docs at project start.
5. EVM tooling is fine (Viem, Ethers, Wagmi, Foundry, Hardhat).
6. **Never** put API keys, private keys, or secrets in client code. Anthropic key is **server-side only**.
7. Plan before coding. Build the smallest working version first.
8. Never claim "it works" without running build/typecheck. Never claim "deployed" without a URL/explorer link.

---

## 1. Project Identity

- **Name:** Arcana
- **Tagline:** *The hidden knowledge of Arc, unlocked with USDC.*
- **One-liner:** A RAG-powered assistant for Arc/Circle docs. Basic answers are free; "deep" answers are unlocked with a small USDC payment on Arc Testnet.
- **Category (Arc House form):** Developer tooling + Consumer finance (AI angle).
- **Stage:** Testnet / in-progress build.
- **Hosting:** Frontend + serverless API on **Vercel**. No backend server. **No smart contract deploy required for MVP** (we verify a standard USDC ERC-20 transfer on-chain).

### Core value
Developers get grounded, source-cited answers about Arc. The paywall is a live demo of USDC-as-payment on Arc: pay-per-deep-answer.

---

## 2. User Flow

1. User opens site, asks a question.
2. **Free tier:** RAG answer with sources, rate-limited (e.g. 3 per session, client-side counter — bypassable, acceptable for testnet demo).
3. User requests a **Deep answer** (more sources, longer, code-aware) → paywall.
4. Connect wallet → **NetworkGuard** checks Arc Testnet (chainId 5042002); offers switch + faucet link.
5. User pays **0.5 testnet USDC** (ERC-20) to `NEXT_PUBLIC_TREASURY_ADDRESS`.
6. Frontend sends tx hash to `/api/verify-payment`.
7. Server verifies on-chain via Arc RPC: recipient == treasury, amount >= price, status == success, hash not already used.
8. Server returns a short-lived unlock token → `/api/ask` accepts it for one premium answer.
9. UI shows premium answer + **explorer link** to the payment tx.

---

## 3. Architecture

- **Frontend:** Next.js (App Router, TypeScript, Tailwind) on Vercel.
- **Wallet/chain:** wagmi + viem, injected connector, Arc Testnet chain definition.
- **RAG:**
  - `scripts/ingest.ts` fetches a small set of Arc docs, chunks them, embeds them, writes `data/embeddings.json` (committed to repo → MVP needs no external vector DB).
  - `/api/ask` loads the index, does cosine similarity retrieval, builds a grounded prompt, calls the LLM, returns answer + cited sources.
- **LLM:** Anthropic API (server-side only).
- **Embeddings:** small embedding model via API at ingest time; query embedding at request time. Keep the index small for MVP.
- **Paywall (MVP, no contract):** standard ERC-20 USDC `transfer` to treasury → `/api/verify-payment` checks the receipt with viem. Track used tx hashes in memory (or Upstash KV later) to limit replay.
- **Phase 2 (optional):** a tiny `PaymentReceiver.sol` that emits a `Paid(user, amount)` event for cleaner verification. Not required for MVP.

---

## 4. Arc Testnet Network Details (re-verify before building)

| Field | Value |
|---|---|
| Network name | Arc Testnet |
| Chain ID | `5042002` |
| Chain ID hex | `0x4CEF52` |
| RPC | `https://rpc.testnet.arc.network` |
| WebSocket | `wss://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |
| Native gas token | USDC (18 decimals) |
| ERC-20 USDC decimals | 6 |
| CCTP domain | `36` |

**Key contract (verify at https://docs.arc.io/arc/references/contract-addresses):**
| Contract | Arc Testnet address |
|---|---|
| USDC (ERC-20) | `0x3600000000000000000000000000000000000000` |

Wallet manual-add fields:
```
Network Name: Arc Testnet
RPC URL: https://rpc.testnet.arc.network
Chain ID: 5042002
Currency Symbol: USDC
Block Explorer URL: https://testnet.arcscan.app
```

---

## 5. Docs To Check First

Every project:
- https://docs.arc.io/llms.txt
- https://docs.arc.io/arc/references/connect-to-arc
- https://docs.arc.io/arc/references/contract-addresses
- https://docs.arc.io/arc/references/gas-and-fees
- https://docs.arc.io/arc/references/evm-compatibility

For ingesting docs content into RAG, the docs themselves + `llms.txt` are the source corpus.

---

## 6. Risks

- Arc testnet values / contract addresses can change → verify from docs.
- USDC decimal confusion (ERC-20 = 6, native gas = 18). Use `parseUnits(amount, 6)` / `formatUnits(raw, 6)` for ERC-20 USDC.
- Anthropic / embedding API keys must stay server-side.
- Payment verification must check recipient + amount + success + replay. MVP replay protection = used-hash set.
- Vercel serverless ~10s timeout → stream LLM responses or keep them short.
- RAG answer quality depends on the ingested corpus; cite sources and allow "I don't know."
- Faucet balance may be limited (≈1 USDC/day).

---

## 7. Definition Of Done (MVP)

- Arc Testnet config correct (chainId 5042002, USDC as gas).
- ERC-20 USDC handled at 6 decimals everywhere.
- USDC contract address verified from official docs.
- Free RAG Q&A works with source citations.
- Paywall: real testnet USDC transfer verified on-chain unlocks one deep answer.
- All UI states handled (no wallet / wrong chain / low balance / pending / success / fail) + explorer link.
- Build + typecheck pass.
- Secrets not in repo; `.env.example` present without secrets.
- Deployed to Vercel with a live URL; README has run commands.

---

## 8. Empirical Honesty Rule

If a value is unknown, say `UNKNOWN / NEEDS VERIFICATION` instead of guessing. Never fabricate contract addresses, decimals, or API behavior.

---

## 9. Arc House Form — Draft Answers (fill final values after MVP is live)

- **Project / build name:** Arcana
- **One-line description:** RAG assistant for Arc/Circle docs with a USDC paywall for deep answers, running on Arc Testnet.
- **Category:** Developer tooling (secondary: Consumer finance / AI agents).
- **Stage:** Testnet / in-progress build.
- **Testnet contract addresses deployed:** None for MVP (verifies standard USDC ERC-20 transfers). Treasury address + (optional) PaymentReceiver to be added here.
- **Plan to launch a token:** No.
- **Keep building toward testnet/mainnet:** Yes.
- **How it relates to Arc / USDC / Circle tooling:** Uses USDC as the native payment rail on Arc Testnet; demonstrates pay-per-use access gated by on-chain USDC settlement; corpus is Arc/Circle docs.
- **Feedback wanted at office hours:** Payment-verification UX, replay protection approach, whether to move to a PaymentReceiver contract, and unified-balance/App Kit fit.
- **Comfortable presenting live 5-10 min:** Yes.
- **Links / Demo / GitHub / site:** TO FILL after deploy.
