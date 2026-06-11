import { NextResponse } from "next/server";
import { verifyPayment } from "@/lib/payment";
import { TREASURY_ADDRESS } from "@/lib/constants";
import type { VerifyRequest } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (
    !TREASURY_ADDRESS ||
    TREASURY_ADDRESS === "0x0000000000000000000000000000000000000000"
  ) {
    return NextResponse.json(
      { ok: false, reason: "Server treasury address is not configured." },
      { status: 500 },
    );
  }

  let body: VerifyRequest;
  try {
    body = (await req.json()) as VerifyRequest;
  } catch {
    return NextResponse.json({ ok: false, reason: "Invalid request body." }, { status: 400 });
  }

  const txHash = body.txHash;
  if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return NextResponse.json({ ok: false, reason: "Invalid transaction hash." }, { status: 400 });
  }

  const result = await verifyPayment(txHash);
  const status = result.ok ? 200 : result.pending ? 202 : 400;
  return NextResponse.json(result, { status });
}
