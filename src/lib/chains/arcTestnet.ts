import { defineChain } from "viem";
import {
  ARC_TESTNET_ID,
  ARC_RPC_URL,
  ARC_EXPLORER,
} from "@/lib/constants";

// USDC is the NATIVE gas token on Arc and uses 18 decimals for gas.
// ERC-20 USDC (for transfers) uses 6 decimals — handled separately in usdc.ts.
export const arcTestnet = defineChain({
  id: ARC_TESTNET_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan Testnet",
      url: ARC_EXPLORER,
    },
  },
  testnet: true,
});
