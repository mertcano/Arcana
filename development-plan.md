# Arcana — Development Plan (development-plan.md)

Build the smallest working version first. Pause after each phase for review.

---

## Phase 0 — Scaffold & Vercel pipeline
Goal: an empty Next.js app live on Vercel.

- [ ] `npx create-next-app@latest arcana` (TypeScript, App Router, Tailwind, ESLint).
- [ ] `git init`, first commit, push to GitHub.
- [ ] Import repo into Vercel, deploy. Confirm live URL.
- [ ] Add `.env.example` and `.gitignore` (ensure `.env*` ignored).

Done when: blank app is live on a Vercel URL.

## Phase 1 — Arc chain + wallet
Goal: connect a wallet and confirm Arc Testnet.

- [ ] `npm i wagmi viem @tanstack/react-query`.
- [ ] `src/lib/chains/arcTestnet.ts` (defineChain: id 5042002, USDC nativeCurrency 18 decimals, RPC, explorer).
- [ ] `src/lib/wagmi.ts` config with injected connector + arcTestnet.
- [ ] `WalletButton` + `NetworkGuard` (detect wrong chain, switch button, faucet link).
- [ ] `src/lib/usdc.ts`: ERC-20 helpers, USDC address constant, **6 decimals**; `readUsdcBalance`.

Done when: connect wallet → see Arc Testnet + ERC-20 USDC balance.

## Phase 2 — RAG ingest
Goal: a committed embeddings index.

- [ ] `scripts/ingest.ts`: fetch chosen Arc docs (start with `llms.txt` + a few key pages), clean text, chunk (~500–800 tokens), embed via API, write `data/embeddings.json` (`[{ id, text, source, embedding }]`).
- [ ] `src/lib/embeddings.ts`: load index, embed query, cosine top-k.
- [ ] Run `npm run ingest` once; commit the JSON.

Done when: a query returns relevant chunks locally.

## Phase 3 — Free Q&A
Goal: working free chat with sources.

- [ ] `src/lib/rag.ts`: retrieve → build grounded prompt (instruct: cite sources, say "not sure" if weak).
- [ ] `src/lib/llm.ts`: Anthropic call (server-side; `ANTHROPIC_API_KEY` from env).
- [ ] `POST /api/ask` free mode.
- [ ] `Chat`, `Message`, `SourceList` components.
- [ ] Client free-quota counter (e.g. 3/session).

Done when: ask a question → grounded answer + source links.

## Phase 4 — Paywall + verification
Goal: real testnet USDC payment unlocks a deep answer.

- [ ] `src/lib/constants.ts`: `PRICE_USDC = "0.5"`, `TREASURY = env`, USDC address.
- [ ] `Paywall` component: balance check, `transfer(treasury, parseUnits("0.5",6))`, pending/explorer states.
- [ ] `POST /api/verify-payment`: viem `getTransactionReceipt`, check status + Transfer log (to/amount), reject reused hash, issue HMAC unlock token (~10 min TTL).
- [ ] Extend `/api/ask` deep mode: validate one-time token, richer retrieval, code-aware prompt.

Done when: pay 0.5 testnet USDC → deep answer unlocks + explorer link shows.

## Phase 5 — Polish & states
- [ ] All wallet/network/tx states (table in project-flow.md §5).
- [ ] Empty/error states for RAG.
- [ ] Loading + streaming (or short answers within Vercel timeout).
- [ ] Mobile layout pass.

## Phase 6 — Ship
- [ ] `README.md`: setup, env vars, `ingest`, dev, deploy, run commands.
- [ ] Vercel env vars set (`ANTHROPIC_API_KEY`, embedding key, `NEXT_PUBLIC_TREASURY_ADDRESS`, `UNLOCK_SECRET`).
- [ ] Final deploy. Capture live URL + a sample payment explorer link.
- [ ] Fill the Arc House form draft in `train.md` §9.

## Phase 7 — Optional upgrades (post-MVP)
- [ ] `PaymentReceiver.sol` contract emitting `Paid` events (Foundry, deploy to Arc Testnet).
- [ ] Upstash KV for durable used-hash + rate limiting.
- [ ] App Kit / Unified Balance so users can pay from other chains.

---

## Env Vars
```
ANTHROPIC_API_KEY=        # server-side only
EMBEDDING_API_KEY=        # server-side only (ingest + query)
NEXT_PUBLIC_TREASURY_ADDRESS=0x...   # your testnet wallet
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
UNLOCK_SECRET=            # server-side HMAC secret
```

## Commands (reference)
```
npm run ingest     # build data/embeddings.json
npm run dev        # local dev
npm run build      # production build / typecheck
```
