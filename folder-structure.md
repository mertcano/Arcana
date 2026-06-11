# Arcana — Folder Structure (folder-structure.md)

Target structure for the MVP. The agent may adjust names slightly but should keep this shape.

```
arcana/
├─ train.md                      # project memory (Arc rules + project brief)
├─ project-flow.md               # user + verification flows
├─ development-plan.md           # phased build plan
├─ folder-structure.md           # this file
├─ README.md                     # setup, env, run, deploy
├─ .env.example                  # env keys, NO secrets
├─ .gitignore                    # ignores .env*, node_modules, etc.
├─ next.config.mjs
├─ package.json
├─ tsconfig.json
├─ tailwind.config.ts
├─ postcss.config.mjs
│
├─ public/
│  └─ (icons, og image)
│
├─ data/
│  └─ embeddings.json            # prebuilt RAG index (committed for MVP)
│
├─ scripts/
│  └─ ingest.ts                  # fetch docs → chunk → embed → embeddings.json
│
└─ src/
   ├─ app/
   │  ├─ layout.tsx              # providers (wagmi, react-query)
   │  ├─ page.tsx                # main chat page
   │  ├─ globals.css
   │  └─ api/
   │     ├─ ask/route.ts         # RAG query (free + deep modes)
   │     └─ verify-payment/route.ts   # on-chain payment verification
   │
   ├─ components/
   │  ├─ Chat.tsx                # chat container + input + quota
   │  ├─ Message.tsx             # single message bubble
   │  ├─ SourceList.tsx          # cited doc links
   │  ├─ WalletButton.tsx        # connect/disconnect
   │  ├─ NetworkGuard.tsx        # wrong-chain / switch-to-Arc / faucet
   │  └─ Paywall.tsx             # pay 0.5 USDC modal + states
   │
   ├─ lib/
   │  ├─ chains/
   │  │  └─ arcTestnet.ts        # viem defineChain (id 5042002, USDC 18d)
   │  ├─ wagmi.ts                # wagmi config + connectors
   │  ├─ viemClient.ts           # server public client for verification
   │  ├─ usdc.ts                 # ERC-20 helpers (6 decimals), balance, transfer
   │  ├─ rag.ts                  # retrieve + build grounded prompt
   │  ├─ embeddings.ts           # load index + cosine search + embed query
   │  ├─ llm.ts                  # Anthropic call (server-side)
   │  ├─ payment.ts              # receipt check, unlock-token sign/verify
   │  └─ constants.ts            # addresses, price, treasury, chainId
   │
   └─ types/
      └─ index.ts                # shared TS types (Message, Source, AskBody…)
```

## Notes
- `data/embeddings.json` is committed so the MVP needs **no external vector DB**.
- Anything secret lives only in env vars / server routes — never in `src/components` or anything `NEXT_PUBLIC_*` beyond public addresses.
- `viemClient.ts` (server) is separate from `wagmi.ts` (client) — verification runs server-side.
- Phase 2 (optional contract) would add:
  ```
  contracts/
  ├─ src/PaymentReceiver.sol
  ├─ script/Deploy.s.sol
  ├─ test/PaymentReceiver.t.sol
  └─ foundry.toml
  ```
