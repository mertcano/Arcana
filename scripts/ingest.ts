/**
 * Optional corpus builder.
 *
 * The repo already ships a ready-to-use data/chunks.json, so you do NOT need
 * to run this for the MVP. Use it only to expand the corpus.
 *
 * How it works: drop markdown files into data/sources/. Each file should start
 * with a title and a URL line, e.g.:
 *
 *   # Connect to Arc
 *   URL: https://docs.arc.io/arc/references/connect-to-arc
 *
 *   ...body paragraphs...
 *
 * Run: npm run ingest
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

interface Chunk {
  id: string;
  title: string;
  url: string;
  text: string;
}

const SOURCES_DIR = join(process.cwd(), "data", "sources");
const OUT = join(process.cwd(), "data", "chunks.json");

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function chunkText(body: string, max = 700): string[] {
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > max && buf) {
      chunks.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

function main() {
  if (!existsSync(SOURCES_DIR)) {
    console.error(`No sources dir at ${SOURCES_DIR}. Nothing to do.`);
    process.exit(0);
  }
  const files = readdirSync(SOURCES_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.error("No .md files in data/sources. Nothing to do.");
    process.exit(0);
  }

  const out: Chunk[] = [];
  for (const file of files) {
    const raw = readFileSync(join(SOURCES_DIR, file), "utf8");
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const urlMatch = raw.match(/^URL:\s*(\S+)$/m);
    const title = titleMatch?.[1]?.trim() ?? file.replace(/\.md$/, "");
    const url = urlMatch?.[1]?.trim() ?? "https://docs.arc.io/";
    const body = raw
      .replace(/^#\s+.+$/m, "")
      .replace(/^URL:\s*\S+$/m, "")
      .trim();

    chunkText(body).forEach((text, i) => {
      out.push({ id: `${slug(title)}-${i}`, title, url, text });
    });
  }

  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.length} chunks to ${OUT}`);
}

main();
