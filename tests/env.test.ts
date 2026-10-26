import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerEnvironment } from "../src/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("server environment validation", () => {
  it("supplies safe defaults without service credentials", () => {
    vi.stubEnv("AI_PROVIDER_API_KEY", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("RATE_LIMIT_SALT", "");
    vi.stubEnv("GITHUB_KNOWLEDGE_REPOS", "");
    vi.stubEnv("RAG_MIN_SIMILARITY", "");
    const environment = getServerEnvironment();
    expect(environment.GITHUB_USERNAME).toBe("praveendhakade");
    expect(environment.GITHUB_API_ENABLED).toBe(true);
    expect(environment.GITHUB_KNOWLEDGE_REPOS).toEqual([]);
    expect(environment.AI_PROVIDER_API_KEY).toBeUndefined();
  });

  it("requires a sufficiently long salt when persistent storage is configured", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://portfolio:secret@localhost:5432/portfolio");
    vi.stubEnv("RATE_LIMIT_SALT", "short");
    expect(() => getServerEnvironment()).toThrow("RATE_LIMIT_SALT");
    expect(() => getServerEnvironment()).not.toThrow("secret");
  });

  it("accepts a database URL and threshold only after they validate", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://portfolio:secret@localhost:5432/portfolio");
    vi.stubEnv("RATE_LIMIT_SALT", "a-random-test-salt-that-is-at-least-32-chars");
    vi.stubEnv("RAG_MIN_SIMILARITY", "0.72");
    expect(getServerEnvironment().RAG_MIN_SIMILARITY).toBe(0.72);
    vi.stubEnv("RAG_MIN_SIMILARITY", "1.2");
    expect(() => getServerEnvironment()).toThrow("RAG_MIN_SIMILARITY");
  });

  it("rejects malformed public-repository allowlist names", () => {
    vi.stubEnv("GITHUB_KNOWLEDGE_REPOS", "../private-repo");
    expect(() => getServerEnvironment()).toThrow("GITHUB_KNOWLEDGE_REPOS");
  });

  it("rejects plaintext provider URLs in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_BASE_URL", "http://api.example.test/v1");
    expect(() => getServerEnvironment()).toThrow("AI_BASE_URL");
  });
});
