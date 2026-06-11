import { erc20Abi, formatUnits, parseUnits } from "viem";
import { USDC_ADDRESS, USDC_DECIMALS } from "@/lib/constants";

// Minimal ABI re-export for convenience.
export const usdcAbi = erc20Abi;
export const usdcAddress = USDC_ADDRESS;

// ERC-20 USDC uses 6 decimals. Never use parseEther here.
export function toUsdcUnits(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS);
}

export function fromUsdcUnits(raw: bigint): string {
  return formatUnits(raw, USDC_DECIMALS);
}

// Pretty display, e.g. "0.50 USDC"
export function formatUsdc(raw: bigint, fractionDigits = 2): string {
  const n = Number(fromUsdcUnits(raw));
  return `${n.toFixed(fractionDigits)} USDC`;
}
