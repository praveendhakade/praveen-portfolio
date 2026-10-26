import type { MetadataRoute } from "next";
import { projects } from "@/data/portfolio";
const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
export default function sitemap(): MetadataRoute.Sitemap { if (!base) return []; return ["", "/about", "/experience", "/projects", "/journal", "/assistant", "/contact", ...projects.map(({ slug }) => `/projects/${slug}`)].map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly", priority: path ? 0.7 : 1 })); }
