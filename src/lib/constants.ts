// Central constants for Arcana. Arc Testnet only.
// Re-verify against https://docs.arc.io/arc/references/contract-addresses

export const ARC_TESTNET_ID = 5042002;
export const ARC_RPC_URL = "https://rpc.testnet.arc.network";
export const ARC_EXPLORER = "https://testnet.arcscan.app";
export const ARC_FAUCET = "https://faucet.circle.com";

// ERC-20 USDC on Arc Testnet. 6 decimals (NOT 18 — 18 is native gas USDC).
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
  "0x3600000000000000000000000000000000000000") as `0x${string}`;
export const USDC_DECIMALS = 6;

// Treasury that receives paywall payments. Set this to YOUR testnet wallet.
export const TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Price per deep answer, in human USDC.
export const PRICE_USDC = process.env.NEXT_PUBLIC_PRICE_USDC ?? "0.5";

// Free questions allowed per browser session before the paywall.
export const FREE_QUOTA = 3;

export function explorerTx(hash: string) {
  return `${ARC_EXPLORER}/tx/${hash}`;
}
export function explorerAddress(addr: string) {
  return `${ARC_EXPLORER}/address/${addr}`;
}
