export type PublicRepository = {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count: number;
  topics: string[];
  updated_at: string;
};

export type GitHubSettings = { GITHUB_API_ENABLED: boolean; GITHUB_USERNAME: string; GITHUB_TOKEN?: string };

export async function getPublicRepositories(settings: GitHubSettings, fetcher: typeof fetch = fetch): Promise<PublicRepository[]> {
  if (!settings.GITHUB_API_ENABLED) return [];
  try {
    const response = await fetcher(`https://api.github.com/users/${encodeURIComponent(settings.GITHUB_USERNAME)}/repos?sort=updated&per_page=30`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(settings.GITHUB_TOKEN ? { Authorization: `Bearer ${settings.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    return parsePublicRepositories(await response.json());
  } catch { return []; }
}

export function parsePublicRepositories(payload: unknown): PublicRepository[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((item): PublicRepository[] => {
    if (typeof item !== "object" || item === null || !("name" in item) || typeof item.name !== "string" || !item.name.trim() || !("html_url" in item) || typeof item.html_url !== "string" || !("private" in item) || item.private !== false) return [];
    try {
      const url = new URL(item.html_url);
      if (url.protocol !== "https:" || url.hostname !== "github.com") return [];
    } catch { return []; }
    return [{
      name: item.name,
      description: "description" in item && typeof item.description === "string" ? item.description : null,
      language: "language" in item && typeof item.language === "string" ? item.language : null,
      html_url: item.html_url,
      stargazers_count: "stargazers_count" in item && typeof item.stargazers_count === "number" ? item.stargazers_count : 0,
      topics: "topics" in item && Array.isArray(item.topics) ? item.topics.filter((topic: unknown): topic is string => typeof topic === "string") : [],
      updated_at: "updated_at" in item && typeof item.updated_at === "string" ? item.updated_at : "",
    }];
  });
}
