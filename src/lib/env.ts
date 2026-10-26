import { z } from "zod";

const blankToUndefined = z.preprocess((value) => value === "" ? undefined : value, z.string().optional());
const envSchema = z.object({
  GITHUB_USERNAME: z.string().trim().min(1).default("praveendhakade"),
  GITHUB_API_ENABLED: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  GITHUB_TOKEN: blankToUndefined,
  GITHUB_KNOWLEDGE_REPOS: z.preprocess((value) => value === "" ? undefined : value, z.string().optional()).transform((value) => (value ?? "").split(",").map((repo) => repo.trim()).filter(Boolean)),
  AI_PROVIDER_API_KEY: blankToUndefined,
  AI_MODEL: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().min(1).default("gpt-4o-mini")),
  AI_BASE_URL: z.preprocess((value) => value === "" ? undefined : value, z.string().url().refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname));
  }).default("https://api.openai.com/v1")),
  EMBEDDING_MODEL: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().min(1).default("text-embedding-3-small")),
  DATABASE_URL: z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional()),
  RATE_LIMIT_SALT: z.preprocess((value) => value === "" ? undefined : value, z.string().min(32).optional()),
  RAG_MIN_SIMILARITY: z.preprocess((value) => value === "" || value === undefined ? undefined : Number(value), z.number().min(0).max(1).optional()),
  NEXT_PUBLIC_SITE_URL: z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional()),
}).superRefine((value, context) => {
  if (value.DATABASE_URL && !value.RATE_LIMIT_SALT) {
    context.addIssue({ code: "custom", path: ["RATE_LIMIT_SALT"], message: "Required when DATABASE_URL is set." });
  }
  if (value.GITHUB_KNOWLEDGE_REPOS.some((repo) => !/^[A-Za-z0-9_.-]+$/.test(repo))) {
    context.addIssue({ code: "custom", path: ["GITHUB_KNOWLEDGE_REPOS"], message: "Repository names may only contain letters, numbers, dots, underscores, and hyphens." });
  }
});

export type ServerEnvironment = z.infer<typeof envSchema>;

export function getServerEnvironment(): ServerEnvironment {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? "environment")))];
    throw new Error(`Invalid server environment configuration: ${names.join(", ")}`);
  }
  return result.data;
}
