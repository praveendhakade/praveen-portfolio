import type { Metadata } from "next";
import { Assistant } from "@/components/Assistant";
export const metadata: Metadata = { title: "Portfolio Assistant" };
export default function AssistantPage() { return <section className="container"><p className="eyebrow">Portfolio assistant</p><h1>Ask about my documented work.</h1><Assistant /></section>; }
