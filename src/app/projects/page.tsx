import type { Metadata } from "next";
import { ProjectExplorer } from "@/components/ProjectExplorer";
import { projects } from "@/data/portfolio";
export const metadata: Metadata = { title: "Projects" };

type Repo = { name: string; description: string | null; language: string | null; html_url: string; stargazers_count: number; topics: string[]; updated_at: string };
async function getRepos(): Promise<Repo[]> {
  const username = process.env.GITHUB_USERNAME || "praveendhakade";
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`, {
      headers: { Accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) return [];
    return payload.filter((item): item is Repo => typeof item === "object" && item !== null && "name" in item && "html_url" in item)
      .map((item) => ({ name: item.name, description: typeof item.description === "string" ? item.description : null, language: typeof item.language === "string" ? item.language : null, html_url: item.html_url, stargazers_count: typeof item.stargazers_count === "number" ? item.stargazers_count : 0, topics: Array.isArray(item.topics) ? item.topics.filter((topic: unknown): topic is string => typeof topic === "string") : [], updated_at: typeof item.updated_at === "string" ? item.updated_at : "" }))
      .filter((repo) => repo.name && repo.html_url.startsWith("https://github.com/"));
  } catch { return []; }
}
export default async function ProjectsPage() { const repos = await getRepos(); return <section className="container"><p className="eyebrow">Projects</p><h1>Selected product work and experiments.</h1><p className="lede">Professional contributions are described at a high level to protect employer and customer information.</p><ProjectExplorer projects={projects} repos={repos} /></section>; }
