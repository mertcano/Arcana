import { NextResponse } from "next/server";
import { formatUnits, getAddress, isAddress } from "viem";
import { publicClient } from "@/lib/viemClient";

export const runtime = "nodejs";

// Native USDC balance (18 decimals). On Arc the native and ERC-20 USDC balances
// are the same underlying funds, and eth_getBalance is the most reliable read.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Invalid address." }, { status: 400 });
  }

  try {
    const raw = await publicClient.getBalance({ address: getAddress(address) });
    return NextResponse.json({
      raw: raw.toString(),
      formatted: formatUnits(raw, 18),
    });
  } catch {
    return NextResponse.json({ error: "Could not read balance." }, { status: 502 });
  }
}
