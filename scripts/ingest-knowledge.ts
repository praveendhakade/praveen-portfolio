import { createHash } from "node:crypto";
import postgres from "postgres";
import { knowledge } from "../src/lib/knowledge";

const apiKey = process.env.AI_PROVIDER_API_KEY;
const databaseUrl = process.env.DATABASE_URL;
if (!apiKey || !databaseUrl) throw new Error("Set AI_PROVIDER_API_KEY and DATABASE_URL before ingestion.");

function chunk(text: string, size = 900): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && `${current} ${word}`.length > size) {
      result.push(current);
      const tail = current.split(" ").slice(-25).join(" ");
      current = `${tail} ${word}`;
    } else current = current ? `${current} ${word}` : word;
  }
  if (current) result.push(current);
  return result;
}

async function embedding(text: string): Promise<number[]> {
  const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/embeddings`, {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.EMBEDDING_MODEL || "text-embedding-3-small", input: text }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Embedding provider returned ${response.status}`);
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("data" in payload) || !Array.isArray(payload.data)) throw new Error("Embedding provider returned invalid data");
  const vector = payload.data[0]?.embedding;
  if (!Array.isArray(vector) || vector.length !== 1536 || vector.some((value: unknown) => typeof value !== "number")) throw new Error("Expected a 1536-value embedding vector");
  return vector;
}

const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10 });
let processed = 0;
try {
  for (const source of knowledge) {
    const chunks = chunk(source.text);
    for (let index = 0; index < chunks.length; index += 1) {
      const content = chunks[index];
      const hash = createHash("sha256").update(content).digest("hex");
      const sourceId = `${source.id}:${index}`;
      const id = createHash("sha256").update(sourceId).digest("hex");
      const existing = await sql`select id from knowledge_chunks where source_id = ${sourceId} and content_hash = ${hash} limit 1`;
      if (existing.length) continue;
      const vector = await embedding(content);
      const vectorText = `[${vector.join(",")}]`;
      await sql`
        insert into knowledge_chunks (id, source_id, source_type, title, content, metadata, content_hash, embedding)
        values (${id}, ${sourceId}, 'portfolio', ${source.title}, ${content}, ${sql.json({ href: source.href, chunk: index })}, ${hash}, ${vectorText}::vector)
        on conflict (source_id) do update set id = excluded.id, title = excluded.title, content = excluded.content,
          metadata = excluded.metadata, content_hash = excluded.content_hash,
          embedding = excluded.embedding, updated_at = now()
      `;
      processed += 1;
    }
    const activeIds = chunks.map((_, index) => `${source.id}:${index}`);
    await sql`delete from knowledge_chunks where source_id like ${`${source.id}:%`} and source_id != all(${sql.array(activeIds)})`;
  }
  console.log(`Ingestion complete. ${processed} new or updated chunks stored.`);
} catch (error) {
  console.error("Knowledge ingestion failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
} finally { await sql.end(); }
