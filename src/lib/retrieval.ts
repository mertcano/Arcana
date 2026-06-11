import type { DocChunk, Source } from "@/types";
import corpus from "../../data/chunks.json";

const chunks = corpus as DocChunk[];

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are",
  "be", "with", "as", "by", "at", "it", "this", "that", "how", "do", "does",
  "what", "when", "which", "i", "you", "can", "use", "using", "my",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

// Precompute document frequency for a light IDF weighting.
const df = new Map<string, number>();
for (const c of chunks) {
  const seen = new Set(tokenize(`${c.title} ${c.text}`));
  for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
}
const N = chunks.length;
function idf(term: string): number {
  const d = df.get(term) ?? 0;
  return Math.log((N + 1) / (d + 1)) + 1;
}

export interface Retrieved {
  chunk: DocChunk;
  score: number;
}

export function retrieve(query: string, topK = 4): Retrieved[] {
  const qTerms = tokenize(query);
  if (qTerms.length === 0) return [];

  const scored = chunks.map((chunk) => {
    const text = `${chunk.title} ${chunk.title} ${chunk.text}`.toLowerCase();
    let score = 0;
    for (const term of qTerms) {
      // count occurrences
      let from = 0;
      let count = 0;
      while (true) {
        const idx = text.indexOf(term, from);
        if (idx === -1) break;
        count++;
        from = idx + term.length;
      }
      if (count > 0) score += (1 + Math.log(count)) * idf(term);
    }
    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function uniqueSources(items: Retrieved[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const { chunk } of items) {
    if (seen.has(chunk.url)) continue;
    seen.add(chunk.url);
    out.push({ title: chunk.title, url: chunk.url });
  }
  return out;
}
