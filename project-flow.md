# Arcana — Project Flow (project-flow.md)

End-to-end flows for the MVP. Keep this in sync with `train.md`.

---

## 1. High-Level Flow

```
User question
   │
   ▼
[Free RAG answer] ── (wants deeper?) ──► [Paywall]
                                              │
                                              ▼
                              Connect wallet → Arc Testnet check
                                              │
                                              ▼
                              Pay 0.5 USDC (ERC-20) → treasury
                                              │
                                              ▼
                       /api/verify-payment (on-chain receipt check)
                                              │
                                  unlock token (short-lived)
                                              │
                                              ▼
                          /api/ask (premium) → Deep answer
                                              │
                                              ▼
                        Answer + sources + payment explorer link
```

---

## 2. Free Answer Flow

1. User types a question in the chat box.
2. Client checks session free-quota (e.g. 3 left). If 0 → show paywall instead.
3. `POST /api/ask` with `{ question, mode: "free" }`.
4. Server: embed question → cosine top-k from `embeddings.json` → build grounded prompt → LLM → return `{ answer, sources }`.
5. UI renders answer + a `SourceList` of doc links. Decrement free quota.

## 3. Deep (Paid) Answer Flow

1. User clicks "Deep answer" (or quota is 0).
2. `Paywall` modal opens. It checks:
   - wallet connected? if not → connect.
   - on Arc Testnet (chainId 5042002)? if not → "Switch to Arc Testnet" button + faucet link.
   - ERC-20 USDC balance >= 0.5? if not → show faucet link + message.
3. User confirms payment → app calls USDC `transfer(treasury, parseUnits("0.5", 6))`.
4. On tx hash:
   - show "Pending…" with explorer link `https://testnet.arcscan.app/tx/<hash>`.
5. `POST /api/verify-payment` with `{ txHash }`.
6. Server verifies (see flow 4). On success → returns `{ unlockToken }`.
7. `POST /api/ask` with `{ question, mode: "deep", unlockToken }`.
8. Server validates token (one-time use), runs a richer retrieval (higher top-k, code-aware prompt), returns deep answer.
9. UI shows deep answer + sources + payment explorer link.

## 4. Payment Verification Flow (server)

```
receive txHash
   │
   ▼
viem getTransactionReceipt(txHash)
   │
   ├── not found / pending → 202 "still pending, retry"
   │
   ▼
status == "success"?                 ── no ──► 400 "tx failed"
   │ yes
   ▼
decode ERC-20 Transfer log from USDC contract
   │
   ├── to == TREASURY ?              ── no ──► 400 "wrong recipient"
   ├── value >= parseUnits("0.5",6)? ── no ──► 400 "amount too low"
   ├── txHash already used?          ── yes ─► 409 "already redeemed"
   │
   ▼
mark hash used → issue unlockToken (HMAC, ~10 min TTL) → 200
```

## 5. Wallet / Network State Machine (UI)

| State | UI |
|---|---|
| No wallet | "Connect wallet" button |
| Connected, wrong chain | "Switch to Arc Testnet" button |
| Right chain, low USDC | Balance + faucet link + disabled pay |
| Right chain, funded | "Pay 0.5 USDC" enabled |
| Tx pending | Spinner + explorer link |
| Tx success | "Unlocked" + deep answer |
| Tx failed | Error + retry |

## 6. Error Handling Principles

- Every on-chain action shows an explorer link.
- ERC-20 USDC math always uses 6 decimals.
- Verification failures return a clear reason, never a silent unlock.
- If RAG retrieval is weak, the model is instructed to say it isn't sure and link the closest docs.
