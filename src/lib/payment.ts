import crypto from "crypto";
import { decodeEventLog, decodeFunctionData, erc20Abi, getAddress, parseUnits } from "viem";
import { publicClient } from "@/lib/viemClient";
import { USDC_ADDRESS, TREASURY_ADDRESS, PRICE_USDC } from "@/lib/constants";
import { toUsdcUnits } from "@/lib/usdc";

const SECRET = process.env.UNLOCK_SECRET ?? "dev-only-insecure-secret";
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

// MVP replay protection: remember redeemed tx hashes in memory.
// For production, move this to a durable store (e.g. Upstash KV).
const usedHashes = new Set<string>();

export interface VerifyResult {
  ok: boolean;
  unlockToken?: string;
  reason?: string;
  pending?: boolean;
}

function sign(payload: string): string {
  const h = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${h}`;
}

export function issueUnlockToken(): string {
  const payload = `${crypto.randomBytes(8).toString("hex")}:${Date.now()}`;
  return sign(payload);
}

export function consumeUnlockToken(token: string): boolean {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const expected = sign(payload).slice(lastDot + 1);
  const got = token.slice(lastDot + 1);
  if (expected.length !== got.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got))) return false;

  const ts = Number(payload.split(":")[1]);
  if (!ts || Date.now() - ts > TOKEN_TTL_MS) return false;
  return true;
}

export async function verifyPayment(
  txHash: `0x${string}`,
): Promise<VerifyResult> {
  if (usedHashes.has(txHash.toLowerCase())) {
    return { ok: false, reason: "This payment was already redeemed." };
  }

  let receipt;
  try {
    receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  } catch {
    return { ok: false, pending: true, reason: "Payment not found yet. Try again in a moment." };
  }

  if (receipt.status !== "success") {
    return { ok: false, reason: "The payment transaction failed on-chain." };
  }

  const treasury = getAddress(TREASURY_ADDRESS);
  const usdc = getAddress(USDC_ADDRESS);
  const requiredErc20 = toUsdcUnits(PRICE_USDC); // 6 decimals
  const requiredNative = parseUnits(PRICE_USDC, 18); // native USDC = 18 decimals

  let paid = false;

  // (1) Decode the transaction calldata: an ERC-20 transfer(to, value) to USDC.
  try {
    const tx = await publicClient.getTransaction({ hash: txHash });
    if (tx.to && getAddress(tx.to) === usdc && tx.input && tx.input !== "0x") {
      const decoded = decodeFunctionData({ abi: erc20Abi, data: tx.input });
      if (decoded.functionName === "transfer") {
        const [to, value] = decoded.args as [`0x${string}`, bigint];
        if (getAddress(to) === treasury && value >= requiredErc20) paid = true;
      }
    }
    // (3) Or a plain native USDC value transfer straight to the treasury.
    if (!paid && tx.to && getAddress(tx.to) === treasury && tx.value >= requiredNative) {
      paid = true;
    }
  } catch {
    // fall through to log scan
  }

  // (2) Fallback: scan for a standard ERC-20 Transfer event to the treasury.
  if (!paid) {
    for (const log of receipt.logs) {
      if (getAddress(log.address) !== usdc) continue;
      try {
        const ev = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics });
        if (ev.eventName !== "Transfer") continue;
        const to = getAddress(ev.args.to as `0x${string}`);
        const value = ev.args.value as bigint;
        if (to === treasury && value >= requiredErc20) {
          paid = true;
          break;
        }
      } catch {
        // not a Transfer event; skip
      }
    }
  }

  if (!paid) {
    return {
      ok: false,
      reason: `No USDC payment of at least ${PRICE_USDC} to the treasury was found in this transaction.`,
    };
  }

  usedHashes.add(txHash.toLowerCase());
  return { ok: true, unlockToken: issueUnlockToken() };
}
