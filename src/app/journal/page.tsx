import type { Metadata } from "next";
export const metadata: Metadata = { title: "Journal" };
const drafts = [
  { title: "Designing a portfolio assistant around evidence", topic: "RAG · Draft note", summary: "Questions to answer while building a small retrieval pipeline: which sources are approved, how can an answer cite them, and what should happen when evidence is missing?" },
  { title: "Reliable data transformations", topic: "Testing · Draft note", summary: "A learning note about treating transformation logic as a boundary worth testing, with representative inputs and explicit expected outputs." },
];
export default function JournalPage() { return <section className="container"><p className="eyebrow">Journal</p><h1>Notes from the workbench.</h1><p className="lede">These are unpublished learning notes, not claimed articles.</p><div className="grid">{drafts.map((draft) => <article className="card" key={draft.title}><p className="mono">{draft.topic}</p><h2>{draft.title}</h2><p>{draft.summary}</p><span className="tag">Draft · unpublished</span></article>)}</div></section>; }
