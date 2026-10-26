"use client";

import { FormEvent, useState } from "react";

type Answer = { answer: string; sources: { title: string; href: string }[]; unavailable?: boolean };

export function Assistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setAnswer(null);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) });
      const payload = await response.json() as Answer & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The assistant could not answer right now.");
      setAnswer(payload);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The assistant could not answer right now."); }
    finally { setBusy(false); }
  }

  return <div className="prose"><p>Ask about documented experience, technologies, or projects. Answers are intended to stay grounded in the portfolio content.</p><div className="chat-box" aria-live="polite">{busy ? <p>Looking through portfolio notes…</p> : error ? <p role="alert">{error}</p> : answer ? <><p>{answer.answer}</p>{answer.unavailable && <p className="muted">AI responses are not configured on this deployment.</p>}{answer.sources.length > 0 && <p>Sources: {answer.sources.map((source, index) => <span key={source.href}><a href={source.href}>{source.title}</a>{index < answer.sources.length - 1 ? " · " : ""}</span>)}</p>}</> : <p className="muted">Try: “What work demonstrates React and TypeScript?”</p>}</div><form className="chat-form" onSubmit={submit}><label className="sr-only" htmlFor="question">Your question</label><input id="question" maxLength={600} required value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about Praveen’s work"/><button className="button primary" disabled={busy}>{busy ? "Thinking…" : "Ask"}</button></form></div>;
}
