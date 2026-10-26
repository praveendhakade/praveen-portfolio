import { experience, profile, projects, skillGroups } from "@/data/portfolio";
import postgres from "postgres";

export type KnowledgeSource = { id: string; title: string; href: string; text: string };

export const knowledge: KnowledgeSource[] = [
  { id: "profile", title: "Profile", href: "/about", text: `${profile.name} is a ${profile.role}. ${profile.summary}` },
  ...experience.map((item, index) => ({ id: `experience-${index}`, title: `${item.role} at ${item.company}`, href: "/experience", text: `${item.dates}. ${item.summary} ${item.details.join(" ")}` })),
  ...projects.map((project) => ({ id: `project-${project.slug}`, title: project.title, href: `/projects/${project.slug}`, text: `${project.summary} ${project.contribution} Technologies: ${project.technologies.join(", ")}.` })),
  ...skillGroups.map((group) => ({ id: `skills-${group.title}`, title: `${group.title} skills`, href: "/about", text: group.skills.join(", ") })),
];

export function retrieve(query: string, limit = 4): Array<KnowledgeSource & { score: number }> {
  const stopWords = new Set(["what", "which", "where", "when", "who", "why", "how", "is", "are", "was", "were", "the", "a", "an", "my", "me", "about", "have", "has", "with", "does", "did", "experience", "work", "can", "and", "or", "of", "to", "in", "at", "for", "do", "tell", "praveen"]);
  const terms = (query.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []).filter((term) => term.length >= 3 && !stopWords.has(term));
  if (!terms.length) return [];
  return knowledge.map((source) => {
    const text = `${source.title} ${source.text}`.toLowerCase();
    const sourceTerms = new Set(text.match(/[a-z0-9+#.]+/g) ?? []);
    const titleTerms = new Set(source.title.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []);
    const score = terms.reduce((total, term) => total + (sourceTerms.has(term) ? (titleTerms.has(term) ? 3 : 1) : 0), 0);
    return { ...source, score };
  }).filter((source) => source.score > 0).sort((left, right) => right.score - left.score).slice(0, limit);
}

async function createEmbedding(query: string, apiKey: string): Promise<number[]> {
  const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/embeddings`, {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.EMBEDDING_MODEL || "text-embedding-3-small", input: query }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Embedding provider unavailable");
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("data" in payload) || !Array.isArray(payload.data)) throw new Error("Invalid embedding response");
  const vector = payload.data[0]?.embedding;
  if (!Array.isArray(vector) || vector.length !== 1536 || vector.some((value: unknown) => typeof value !== "number")) throw new Error("Invalid embedding vector");
  return vector;
}

export async function retrieveGrounded(query: string, apiKey: string): Promise<Array<KnowledgeSource & { score: number }>> {
  if (!process.env.DATABASE_URL) return retrieve(query);
  const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 8, idle_timeout: 10 });
  try {
    const vector = `[${(await createEmbedding(query, apiKey)).join(",")}]`;
    const rows = await sql<{ title: string; content: string; metadata: { href?: string }; score: number }[]>`
      select title, content, metadata, 1 - (embedding <=> ${vector}::vector) as score
      from knowledge_chunks
      order by embedding <=> ${vector}::vector
      limit 4
    `;
    const relevant = rows.filter((row) => row.score >= 0.25).map((row, index) => ({
      id: `retrieved-${index}`, title: row.title,
      href: typeof row.metadata.href === "string" ? row.metadata.href : "/projects",
      text: row.content, score: row.score,
    }));
    return relevant.length ? relevant : retrieve(query);
  } finally { await sql.end(); }
}

export async function checkPersistentRateLimit(clientKey: string, max = 12): Promise<boolean | null> {
  if (!process.env.DATABASE_URL) return null;
  const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 8, idle_timeout: 10 });
  try {
    const rows = await sql<{ request_count: number }[]>`
      insert into chat_rate_limits (client_key, window_started_at, request_count)
      values (${clientKey}, now(), 1)
      on conflict (client_key) do update set
        request_count = case when chat_rate_limits.window_started_at < now() - interval '1 minute' then 1 else chat_rate_limits.request_count + 1 end,
        window_started_at = case when chat_rate_limits.window_started_at < now() - interval '1 minute' then now() else chat_rate_limits.window_started_at end,
        updated_at = now()
      returning request_count
    `;
    return rows[0].request_count <= max;
  } finally { await sql.end(); }
}
