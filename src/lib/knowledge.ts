import { education, experience, profile, projects, skillGroups } from "@/data/portfolio";
import { embedText, type AiConfiguration } from "@/lib/ai/provider";
import { getDatabase } from "@/lib/database";
import { getServerEnvironment } from "@/lib/env";

export type KnowledgeSource = {
  id: string;
  sourceType: "profile" | "experience" | "education" | "project" | "skills" | "portfolio" | "github-readme";
  title: string;
  href: string;
  text: string;
  contentPath?: string;
  projectSlug?: string;
};

export type RetrievedSource = KnowledgeSource & { score: number };

export const knowledge: KnowledgeSource[] = [
  { id: "profile", sourceType: "profile", title: "Profile", href: "/about", contentPath: "content/profile.md", text: `${profile.name} is a ${profile.role}. ${profile.summary}` },
  ...experience.map((item, index) => ({ id: `experience-${index}`, sourceType: "experience" as const, title: `${item.role} at ${item.company}`, href: "/experience", contentPath: "src/data/portfolio.ts", text: `${item.dates}. ${item.summary} ${item.details.join(" ")}` })),
  { id: "education", sourceType: "education", title: "Education", href: "/experience", contentPath: "src/data/portfolio.ts", text: `${education.degree}. ${education.school}, ${education.location}. ${education.dates}.` },
  ...projects.map((project) => ({ id: `project-${project.slug}`, sourceType: "project" as const, title: project.title, href: `/projects/${project.slug}`, contentPath: "src/data/portfolio.ts", projectSlug: project.slug, text: `${project.summary} ${project.contribution} Technologies: ${project.technologies.join(", ")}.` })),
  ...skillGroups.map((group) => ({ id: `skills-${group.title}`, sourceType: "skills" as const, title: `${group.title} skills`, href: "/about", contentPath: "src/data/portfolio.ts", text: group.skills.join(", ") })),
  { id: "portfolio-assistant", sourceType: "portfolio", title: "Portfolio assistant architecture", href: "/assistant", contentPath: "README.md#assistant-and-rag", text: "The portfolio assistant has a validated Next.js chat route, curated lexical retrieval, source links, and an OpenAI-compatible provider adapter. Optional PostgreSQL with pgvector adds semantic retrieval and persistent rate limits. These external services require configuration; the portfolio remains navigable without them." },
];

const stopWords = new Set(["what", "which", "where", "when", "who", "why", "how", "is", "are", "was", "were", "the", "a", "an", "my", "me", "about", "have", "has", "with", "does", "did", "experience", "work", "can", "and", "or", "of", "to", "in", "at", "for", "do", "tell", "praveen"]);

export function retrieve(query: string, limit = 4): RetrievedSource[] {
  const terms = (query.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []).filter((term) => term.length >= 3 && !stopWords.has(term));
  if (!terms.length) return [];
  return knowledge.map((source) => {
    const sourceTerms = new Set(`${source.title} ${source.text}`.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []);
    const titleTerms = new Set(source.title.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []);
    const score = terms.reduce((total, term) => total + (sourceTerms.has(term) ? (titleTerms.has(term) ? 3 : 1) : 0), 0);
    return { ...source, score };
  }).filter((source) => source.score > 0).sort((left, right) => right.score - left.score).slice(0, limit);
}

export async function retrieveVectorCandidates(query: string, config: AiConfiguration, limit = 8): Promise<RetrievedSource[]> {
  const environment = getServerEnvironment();
  if (!environment.DATABASE_URL) return retrieve(query);
  const database = getDatabase();
  const vector = `[${(await embedText(query, config)).join(",")}]`;
  const rows = await database<{ id: string; source_id: string; source_type: KnowledgeSource["sourceType"]; title: string; content: string; metadata: { href?: string; contentPath?: string; projectSlug?: string }; score: number }[]>`
      select id, source_id, source_type, title, content, metadata,
        1 - (embedding <=> ${vector}::vector) as score
      from knowledge_chunks
      order by embedding <=> ${vector}::vector
      limit ${limit}
    `;
  const lexical = retrieve(query, 8);
  return rows.map((row) => {
      const lexicalMatch = lexical.find((source) => source.title === row.title || source.href === row.metadata.href);
      const source: KnowledgeSource = {
        id: row.source_id,
        sourceType: row.source_type,
        title: row.title,
        href: typeof row.metadata.href === "string" ? row.metadata.href : "/projects",
        text: row.content,
        ...(typeof row.metadata.contentPath === "string" ? { contentPath: row.metadata.contentPath } : {}),
        ...(typeof row.metadata.projectSlug === "string" ? { projectSlug: row.metadata.projectSlug } : {}),
      };
      return { ...source, score: row.score + (lexicalMatch ? Math.min(lexicalMatch.score * 0.01, 0.05) : 0) };
  });
}

export async function retrieveGrounded(query: string, config: AiConfiguration): Promise<RetrievedSource[]> {
  const environment = getServerEnvironment();
  if (!environment.DATABASE_URL) return retrieve(query);
  const threshold = environment.RAG_MIN_SIMILARITY;
  if (threshold === undefined) throw new Error("RAG_MIN_SIMILARITY must be calibrated with the retrieval evaluation before vector retrieval is enabled.");
  const vectorSources = (await retrieveVectorCandidates(query, config)).filter((source) => source.score >= threshold);
  const lexicalSources = retrieve(query, 4).map((source) => ({ ...source, score: source.score * 0.01 }));
  const combined = new Map<string, RetrievedSource>();
  for (const source of [...vectorSources, ...lexicalSources]) {
    const key = `${source.href}:${source.title}`;
    const previous = combined.get(key);
    if (!previous || source.score > previous.score) combined.set(key, source);
  }
  return [...combined.values()].sort((left, right) => right.score - left.score).slice(0, 4);
}

export async function checkPersistentRateLimit(clientKey: string, max = 12): Promise<boolean | null> {
  const environment = getServerEnvironment();
  if (!environment.DATABASE_URL) return null;
  const database = getDatabase();
  const rows = await database<{ request_count: number }[]>`
      insert into chat_rate_limits (client_key, window_started_at, request_count)
      values (${clientKey}, now(), 1)
      on conflict (client_key) do update set
        request_count = case when chat_rate_limits.window_started_at < now() - interval '1 minute' then 1 else chat_rate_limits.request_count + 1 end,
        window_started_at = case when chat_rate_limits.window_started_at < now() - interval '1 minute' then now() else chat_rate_limits.window_started_at end,
        updated_at = now()
      returning request_count
    `;
  if (Math.random() < 0.01) await database`delete from chat_rate_limits where updated_at < now() - interval '1 day'`;
  return rows[0].request_count <= max;
}
