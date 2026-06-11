export type Role = "user" | "assistant";

export interface Source {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  sources?: Source[];
  deep?: boolean;
  pending?: boolean;
}

export interface DocChunk {
  id: string;
  title: string;
  url: string;
  text: string;
}

export interface AskRequest {
  question: string;
  mode: "free" | "deep";
  unlockToken?: string;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
}

export interface VerifyRequest {
  txHash: `0x${string}`;
}

export interface VerifyResponse {
  ok: boolean;
  unlockToken?: string;
  reason?: string;
}
