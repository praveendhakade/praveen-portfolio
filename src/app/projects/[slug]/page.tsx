import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/data/portfolio";

export function generateStaticParams() { return projects.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const project = projects.find((item) => item.slug === slug); return { title: project?.title ?? "Project" }; }
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const project = projects.find((item) => item.slug === slug); if (!project) notFound(); return <article className="container"><Link className="muted" href="/projects">← All projects</Link><p className="eyebrow" style={{marginTop:"2rem"}}>{project.category} · {project.status}</p><h1>{project.title}</h1><p className="lede">{project.summary}</p><div className="prose"><h2>Contribution</h2><p>{project.contribution}</p><h2>Technologies</h2><div className="tag-list">{project.technologies.map((tech) => <span className="tag" key={tech}>{tech}</span>)}</div><h2>Project notes</h2><p>This case study contains only the contribution and tools supported by the supplied portfolio materials. No private code, customer data, internal screenshots, or unverified outcome metrics are included.</p></div></article>; }
