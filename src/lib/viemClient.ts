import { createPublicClient, http } from "viem";
import { arcTestnet } from "@/lib/chains/arcTestnet";
import { ARC_RPC_URL } from "@/lib/constants";

// Server-only client used by the payment verification route.
export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_RPC_URL),
});
