"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useMounted } from "@/lib/useMounted";
import { explorerAddress } from "@/lib/constants";

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletButton() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (!mounted) {
    return (
      <div className="h-9 w-32 rounded-lg border border-border bg-surface" aria-hidden />
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={explorerAddress(address)}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-sm text-text hover:border-arcane-dim"
        >
          {shorten(address)}
        </a>
        <button
          onClick={() => disconnect()}
          className="rounded-lg px-2 py-1.5 text-sm text-muted hover:text-text"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="rounded-lg bg-arcane px-4 py-2 text-sm font-medium text-ink shadow-glow transition hover:brightness-110 disabled:opacity-60"
    >
      {isPending ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
