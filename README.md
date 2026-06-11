# Arcana - https://arcana-psi-roan.vercel.app/

**The hidden knowledge of Arc, unlocked with USDC.**

Arcana is a RAG-powered assistant for [Arc](https://docs.arc.io) (Circle's USDC-native Layer-1 testnet). Ask anything about building on Arc and get answers grounded in the official docs, with sources. Basic answers are free; **deep answers are unlocked by a small USDC payment on Arc Testnet**.

- Frontend + serverless API on **Next.js / Vercel**
- Wallet + chain via **wagmi + viem**, Arc Testnet (chain ID `5042002`)
- Paywall = a real **ERC-20 USDC** transfer (6 decimals), verified on-chain server-side
- No smart contract to deploy for the MVP

---

## 1. Prerequisites

- Node.js 18+ and npm
- A **free Groq API key** (https://console.groq.com — no credit card). Any OpenAI-compatible provider also works.
- A browser wallet (e.g. MetaMask) with **Arc Testnet** added and some **testnet USDC** from https://faucet.circle.com
- A wallet address to act as the **treasury** (receives payments) — can be your own testnet wallet

## 2. Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```
LLM_API_KEY=gsk_...                 # from console.groq.com
UNLOCK_SECRET=<any long random string>
NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTestnetWallet
```

`LLM_BASE_URL`, `LLM_MODEL`, the USDC address, and the price already have sensible defaults (Groq + Llama 3.3 70B). To use another OpenAI-compatible provider (OpenRouter, OpenAI, Together, etc.), set `LLM_BASE_URL` and `LLM_MODEL` accordingly.

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000. Ask a free question. Click **Get a deep answer**, connect your wallet, switch to Arc Testnet, and pay 0.5 USDC to unlock a deep answer.

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same environment variables in **Project Settings → Environment Variables**
   (`LLM_API_KEY`, `UNLOCK_SECRET`, `NEXT_PUBLIC_TREASURY_ADDRESS`, optionally `LLM_MODEL` / `LLM_BASE_URL` / `NEXT_PUBLIC_PRICE_USDC`).
4. Deploy. The serverless API routes run automatically.

## 5. How it works

- `src/lib/retrieval.ts` ranks chunks in `data/chunks.json` by keyword relevance (no embedding service needed).
- `/api/ask` retrieves the top chunks and asks the LLM to answer **only** from them, citing sources.
- The paywall sends USDC to the treasury. `/api/verify-payment` checks the transaction receipt on Arc (recipient + amount + success, no replay) and issues a one-time unlock token, which `/api/ask` requires for deep mode.

## 6. Expand the docs corpus (optional)

Drop markdown files into `data/sources/` (each starting with `# Title` and `URL: ...`) and run:

```bash
npm run ingest
```

## Notes & limits

- Arc Testnet only. Never use mainnet or real funds.
- ERC-20 USDC = 6 decimals; native gas USDC = 18 decimals. Don't mix them.
- The free-question counter is client-side (demo-friendly, bypassable). Replay protection for payments is in-memory; use a durable store (e.g. Upstash KV) for production.
- Re-verify Arc chain details and contract addresses on https://docs.arc.io before relying on them.
