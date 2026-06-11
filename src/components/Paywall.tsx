"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits, toHex } from "viem";
import { WalletButton } from "./WalletButton";
import { NetworkGuard } from "./NetworkGuard";
import {
  ARC_TESTNET_ID,
  ARC_FAUCET,
  PRICE_USDC,
  TREASURY_ADDRESS,
  explorerTx,
} from "@/lib/constants";

interface Props {
  onUnlock: (unlockToken: string, txHash: string) => void;
  onClose: () => void;
}

type Phase = "idle" | "sending" | "verifying" | "error";

// Minimal EIP-1193 provider shape.
type Eip1193 = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Paywall({ onUnlock, onClose }: Props) {
  const { address, isConnected, chainId, connector } = useAccount();
  const onArc = chainId === ARC_TESTNET_ID;
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Native USDC balance (18 decimals), read server-side. null = unknown.
  const [balanceRaw, setBalanceRaw] = useState<bigint | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!address || !onArc) return;
    try {
      const res = await fetch(`/api/balance?address=${address}`);
      const data = await res.json();
      if (res.ok && typeof data.raw === "string") setBalanceRaw(BigInt(data.raw));
      else setBalanceRaw(null);
    } catch {
      setBalanceRaw(null);
    }
  }, [address, onArc]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const required = parseUnits(PRICE_USDC, 18); // native USDC = 18 decimals
  const knownInsufficient = balanceRaw !== null && balanceRaw < required;

  async function verifyLoop(hash: string) {
    setPhase("verifying");
    for (let i = 0; i < 25; i++) {
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: hash }),
        });
        const data = await res.json();
        if (res.status === 202) {
          await sleep(1500); // still pending; Arc finality is sub-second
          continue;
        }
        if (res.ok && data.ok && data.unlockToken) {
          onUnlock(data.unlockToken, hash);
          return;
        }
        setPhase("error");
        setError(data.reason ?? "Could not verify the payment.");
        return;
      } catch {
        await sleep(1500);
      }
    }
    setPhase("error");
    setError("Timed out waiting for the payment to confirm.");
  }

  async function pay() {
    setError(null);
    setTxHash(null);
    if (!address || !connector) return;
    setPhase("sending");
    try {
      const provider = (await connector.getProvider()) as Eip1193;
      // Let the wallet handle gas/fees. A native USDC value transfer to the treasury.
      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: TREASURY_ADDRESS,
            value: toHex(required),
          },
        ],
      })) as string;
      setTxHash(hash);
      await verifyLoop(hash);
    } catch (e) {
      setPhase("error");
      const msg = e instanceof Error ? e.message.split("\n")[0] : "Payment was rejected.";
      setError(msg);
    }
  }

  const busy = phase === "sending" || phase === "verifying";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl">Unlock a deep answer</h2>
            <p className="mt-1 text-sm text-muted">
              Pay {PRICE_USDC} USDC on Arc Testnet to get a thorough, code-aware
              answer for this question.
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text" aria-label="Close">
            ✕
          </button>
        </div>

        {!isConnected ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted">Connect a wallet to continue.</p>
            <WalletButton />
          </div>
        ) : !onArc ? (
          <NetworkGuard />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-raised px-4 py-3 text-sm">
              <span className="text-muted">Your USDC balance</span>
              <span className="font-mono">
                {balanceRaw !== null
                  ? `${Number(formatUnits(balanceRaw, 18)).toFixed(2)} USDC`
                  : "—"}
              </span>
            </div>

            {knownInsufficient && (
              <p className="mb-3 text-sm text-danger">
                Not enough USDC.{" "}
                <a href={ARC_FAUCET} target="_blank" rel="noreferrer" className="text-arcane underline-offset-2 hover:underline">
                  Get testnet USDC
                </a>
                .
              </p>
            )}

            {txHash && (
              <p className="mb-3 text-sm text-muted">
                {phase === "verifying" ? "Verifying payment…" : "Submitted."}{" "}
                <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className="text-arcane underline-offset-2 hover:underline">
                  View on explorer
                </a>
              </p>
            )}

            {error && <p className="mb-3 text-sm text-danger">{error}</p>}

            <button
              onClick={phase === "error" ? () => { setPhase("idle"); setError(null); } : pay}
              disabled={knownInsufficient || busy}
              className="w-full rounded-xl bg-arcane px-4 py-3 font-medium text-ink shadow-glow transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Processing…" : phase === "error" ? "Try again" : `Pay ${PRICE_USDC} USDC`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
