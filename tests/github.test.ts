import { describe, expect, it, vi } from "vitest";
import { getPublicRepositories, parsePublicRepositories } from "../src/lib/github";

describe("GitHub repository response parsing", () => {
  it("keeps only explicitly public GitHub repositories", () => {
    const parsed = parsePublicRepositories([
      { name: "portfolio", private: false, html_url: "https://github.com/praveendhakade/portfolio", language: "TypeScript", description: "Portfolio", stargazers_count: 2, topics: ["nextjs", 7], updated_at: "2026-01-01" },
      { name: "private", private: true, html_url: "https://github.com/praveendhakade/private" },
      { name: "lookalike", private: false, html_url: "https://github.com.evil.example/user/repo" },
      { name: 7, private: false, html_url: "https://github.com/user/repo" },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ name: "portfolio", html_url: "https://github.com/praveendhakade/portfolio", topics: ["nextjs"] });
  });

  it("returns no rows for non-array API failures", () => {
    expect(parsePublicRepositories({ message: "API rate limit exceeded" })).toEqual([]);
  });

  it("does not contact GitHub when discovery is disabled", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const repos = await getPublicRepositories({ GITHUB_API_ENABLED: false, GITHUB_USERNAME: "praveendhakade" }, fetcher);
    expect(repos).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses a public-only typed fallback when the API is unavailable", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify([
      { name: "public", private: false, html_url: "https://github.com/praveendhakade/public" },
      { name: "private", private: true, html_url: "https://github.com/praveendhakade/private" },
    ]), { status: 200 }));
    const repos = await getPublicRepositories({ GITHUB_API_ENABLED: true, GITHUB_USERNAME: "praveendhakade" }, fetcher);
    expect(repos.map((repo) => repo.name)).toEqual(["public"]);
    fetcher.mockImplementationOnce(async () => new Response("rate limit", { status: 403 }));
    expect(await getPublicRepositories({ GITHUB_API_ENABLED: true, GITHUB_USERNAME: "praveendhakade" }, fetcher)).toEqual([]);
  });
});
