"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/data/portfolio";

type PublicRepo = { name: string; description: string | null; language: string | null; html_url: string; stargazers_count: number; topics: string[]; updated_at: string };

export function ProjectExplorer({ projects, repos }: { projects: Project[]; repos: PublicRepo[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const shown = useMemo(() => projects.filter((project) => {
    const haystack = `${project.title} ${project.summary} ${project.technologies.join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (category === "All" || project.category === category);
  }), [projects, query, category]);

  return <>
    <div className="filter-bar"><label className="sr-only" htmlFor="project-search">Search projects</label><input id="project-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects or technologies"/><label className="sr-only" htmlFor="project-category">Filter by category</label><select id="project-category" value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option><option>Professional</option><option>Personal</option><option>Learning</option></select></div>
    {shown.length ? <div className="grid">{shown.map((project) => <article className="card" key={project.slug}><div className="card-top"><span className="mono">{project.category}</span><span className="muted">{project.status}</span></div><h2><a href={`/projects/${project.slug}`}>{project.title} ↗</a></h2><p>{project.summary}</p><div className="tag-list">{project.technologies.map((tech) => <span className="tag" key={tech}>{tech}</span>)}</div></article>)}</div> : <p className="empty">No projects match those filters.</p>}
    <section className="section"><div className="section-heading"><div><p className="eyebrow">GitHub profile</p><h2>Public repositories</h2></div><a className="button" href="https://github.com/praveendhakade">View all ↗</a></div>{repos.length ? <div className="grid">{repos.slice(0, 6).map((repo) => <article className="card" key={repo.name}><h3><a href={repo.html_url}>{repo.name} ↗</a></h3><p>{repo.description || "No description provided."}</p><span className="muted">{repo.language || "Language not specified"} · ★ {repo.stargazers_count}</span>{repo.topics.length > 0 && <div className="tag-list">{repo.topics.slice(0, 4).map((topic) => <span className="tag" key={topic}>{topic}</span>)}</div>}</article>)}</div> : <p className="notice">GitHub repository data is temporarily unavailable. Visit the profile for the current public list.</p>}</section>
  </>;
}
