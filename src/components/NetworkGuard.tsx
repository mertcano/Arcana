"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { useMounted } from "@/lib/useMounted";
import { ARC_TESTNET_ID, ARC_FAUCET } from "@/lib/constants";

export function NetworkGuard() {
  const mounted = useMounted();
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!mounted || !isConnected || chainId === ARC_TESTNET_ID) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
      <span className="text-text">
        You are on the wrong network. Arcana payments run on Arc Testnet.
      </span>
      <div className="flex items-center gap-3">
        <a
          href={ARC_FAUCET}
          target="_blank"
          rel="noreferrer"
          className="text-arcane underline-offset-2 hover:underline"
        >
          Get testnet USDC
        </a>
        <button
          onClick={() => switchChain({ chainId: ARC_TESTNET_ID })}
          disabled={isPending}
          className="rounded-lg bg-arcane px-3 py-1.5 font-medium text-ink hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? "Switching…" : "Switch to Arc Testnet"}
        </button>
      </div>
    </div>
  );
}
