import "./load-env";
import { createHash } from "node:crypto";
import postgres from "postgres";
import { getAiConfiguration, embedText } from "../src/lib/ai/provider";
import { getServerEnvironment } from "../src/lib/env";
import { knowledge, type KnowledgeSource } from "../src/lib/knowledge";
import { splitIntoChunks } from "../src/lib/rag/chunking";

const environment = getServerEnvironment();
const ai = getAiConfiguration(environment);
if (!ai || !environment.DATABASE_URL) throw new Error("Set AI_PROVIDER_API_KEY and DATABASE_URL before ingestion.");

const MAX_README_CHARS = 30_000;
const GITHUB_API = "https://api.github.com";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function selectedPublicReadmes(): Promise<KnowledgeSource[]> {
  const documents: KnowledgeSource[] = [];
  for (const name of environment.GITHUB_KNOWLEDGE_REPOS) {
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "praveen-portfolio-ingestion",
      ...(environment.GITHUB_TOKEN ? { Authorization: `Bearer ${environment.GITHUB_TOKEN}` } : {}),
    };
    const repositoryResponse = await fetch(`${GITHUB_API}/repos/${encodeURIComponent(environment.GITHUB_USERNAME)}/${encodeURIComponent(name)}`, { headers, signal: AbortSignal.timeout(10_000) });
    if (!repositoryResponse.ok) throw new Error(`Could not verify public GitHub repository ${name} (HTTP ${repositoryResponse.status}).`);
    const repository: unknown = await repositoryResponse.json();
    const owner = isRecord(repository) && isRecord(repository.owner) ? repository.owner.login : undefined;
    if (!isRecord(repository) || repository.private !== false || typeof owner !== "string" || owner.toLowerCase() !== environment.GITHUB_USERNAME.toLowerCase()) {
      throw new Error(`Refusing to ingest ${name}: it is not verified as a public repository owned by ${environment.GITHUB_USERNAME}.`);
    }

    const readmeResponse = await fetch(`${GITHUB_API}/repos/${encodeURIComponent(environment.GITHUB_USERNAME)}/${encodeURIComponent(name)}/readme`, {
      headers: { ...headers, Accept: "application/vnd.github.raw" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!readmeResponse.ok) throw new Error(`Could not fetch README for public repository ${name} (HTTP ${readmeResponse.status}).`);
    const text = await readmeResponse.text();
    if (!text.trim()) continue;
    if (text.length > MAX_README_CHARS) throw new Error(`README for ${name} exceeds ${MAX_README_CHARS} characters; reduce it or split it before ingestion.`);
    documents.push({
      id: `github-${name}-readme`, sourceType: "github-readme", title: `${name} README`,
      href: `https://github.com/${encodeURIComponent(environment.GITHUB_USERNAME)}/${encodeURIComponent(name)}#readme`,
      contentPath: `github:${environment.GITHUB_USERNAME}/${name}/README`, text,
    });
  }
  return documents;
}

const database = postgres(environment.DATABASE_URL, { max: 1, connect_timeout: 10, prepare: false });
let processed = 0;
try {
  const documents = [...knowledge, ...await selectedPublicReadmes()];
  const activeSourceIds: string[] = [];
  for (const source of documents) {
    const chunks = splitIntoChunks(source.text);
    for (let index = 0; index < chunks.length; index += 1) {
      const content = chunks[index];
      // Include embedding configuration so changing providers/models refreshes every vector.
      const hash = createHash("sha256").update(`${new URL(ai.AI_BASE_URL).host}\0${ai.EMBEDDING_MODEL}\0${content}`).digest("hex");
      const sourceId = `${source.id}:${index}`;
      const id = createHash("sha256").update(sourceId).digest("hex");
      activeSourceIds.push(sourceId);
      const existing = await database`select id from knowledge_chunks where source_id = ${sourceId} and content_hash = ${hash} limit 1`;
      if (existing.length) {
        await database`update knowledge_chunks set last_ingested_at = now() where source_id = ${sourceId}`;
        continue;
      }
      const vector = `[${(await embedText(content, ai)).join(",")}]`;
      const metadata = database.json({
        href: source.href,
        contentPath: source.contentPath,
        projectSlug: source.projectSlug,
        chunkIndex: index,
      });
      await database`
        insert into knowledge_chunks (id, source_id, source_type, title, content, metadata, content_hash, embedding, last_ingested_at)
        values (${id}, ${sourceId}, ${source.sourceType}, ${source.title}, ${content}, ${metadata}, ${hash}, ${vector}::vector, now())
        on conflict (source_id) do update set id = excluded.id, source_type = excluded.source_type,
          title = excluded.title, content = excluded.content, metadata = excluded.metadata,
          content_hash = excluded.content_hash, embedding = excluded.embedding,
          updated_at = now(), last_ingested_at = now()
      `;
      processed += 1;
    }
  }
  await database`delete from knowledge_chunks where source_id != all(${database.array(activeSourceIds)})`;
  console.log(`Ingestion complete. ${processed} chunks updated; ${activeSourceIds.length} active chunks remain.`);
} catch (error) {
  console.error("Knowledge ingestion failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
} finally { await database.end(); }
