import type { Metadata } from "next";
import { ProjectExplorer } from "@/components/ProjectExplorer";
import { projects } from "@/data/portfolio";
import { getServerEnvironment } from "@/lib/env";
import { getPublicRepositories } from "@/lib/github";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

type Repo = Awaited<ReturnType<typeof getPublicRepositories>>[number];

async function getRepos(): Promise<Repo[]> {
  try {
    const environment = getServerEnvironment();
    return getPublicRepositories(environment);
  } catch { return []; }
}

export default async function ProjectsPage() {
  const repos = await getRepos();
  return <section className="container"><p className="eyebrow">Projects</p><h1>Selected product work and experiments.</h1><p className="lede">Professional contributions are described at a high level to protect employer and customer information.</p><ProjectExplorer projects={projects} repos={repos} /></section>;
}
