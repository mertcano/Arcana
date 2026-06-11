"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { WalletButton } from "./WalletButton";
import { NetworkGuard } from "./NetworkGuard";
import { usdcAbi, usdcAddress, formatUsdc, toUsdcUnits } from "@/lib/usdc";
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

type Phase = "idle" | "pending" | "verifying" | "error";

export function Paywall({ onUnlock, onClose }: Props) {
  const { address, isConnected, chainId } = useAccount();
  const onArc = chainId === ARC_TESTNET_ID;
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const { data: balance } = useReadContract({
    address: usdcAddress,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && onArc },
  });

  const required = toUsdcUnits(PRICE_USDC);
  const hasFunds = typeof balance === "bigint" && balance >= required;

  const { writeContract, data: txHash, isPending: isSigning, reset } =
    useWriteContract();
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function pay() {
    setError(null);
    setPhase("pending");
    writeContract(
      {
        address: usdcAddress,
        abi: usdcAbi,
        functionName: "transfer",
        args: [TREASURY_ADDRESS, required],
      },
      {
        onError: (e) => {
          setPhase("error");
          setError(e.message.split("\n")[0] ?? "Payment was rejected.");
        },
      },
    );
  }

  // Once the tx is mined, verify it server-side.
  useEffect(() => {
    if (!receipt || !txHash || phase === "verifying") return;
    setPhase("verifying");
    (async () => {
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash }),
        });
        const data = await res.json();
        if (res.ok && data.ok && data.unlockToken) {
          onUnlock(data.unlockToken, txHash);
        } else {
          setPhase("error");
          setError(data.reason ?? "Could not verify the payment.");
        }
      } catch {
        setPhase("error");
        setError("Network error while verifying the payment.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt, txHash]);

  const busy = isSigning || isMining || phase === "verifying";

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
          <button
            onClick={onClose}
            className="text-muted hover:text-text"
            aria-label="Close"
          >
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
                {typeof balance === "bigint" ? formatUsdc(balance) : "—"}
              </span>
            </div>

            {!hasFunds && (
              <p className="mb-3 text-sm text-danger">
                Not enough USDC.{" "}
                <a
                  href={ARC_FAUCET}
                  target="_blank"
                  rel="noreferrer"
                  className="text-arcane underline-offset-2 hover:underline"
                >
                  Get testnet USDC
                </a>
                .
              </p>
            )}

            {txHash && (
              <p className="mb-3 text-sm text-muted">
                {phase === "verifying"
                  ? "Verifying payment…"
                  : isMining
                    ? "Waiting for confirmation…"
                    : "Submitted."}{" "}
                <a
                  href={explorerTx(txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-arcane underline-offset-2 hover:underline"
                >
                  View on explorer
                </a>
              </p>
            )}

            {error && <p className="mb-3 text-sm text-danger">{error}</p>}

            <button
              onClick={phase === "error" ? () => { reset(); setPhase("idle"); setError(null); } : pay}
              disabled={!hasFunds || busy}
              className="w-full rounded-xl bg-arcane px-4 py-3 font-medium text-ink shadow-glow transition hover:brightness-110 disabled:opacity-60"
            >
              {busy
                ? "Processing…"
                : phase === "error"
                  ? "Try again"
                  : `Pay ${PRICE_USDC} USDC`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
