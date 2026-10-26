import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AiProviderError, generateGroundedAnswer, getAiConfiguration } from "@/lib/ai/provider";
import { getServerEnvironment } from "@/lib/env";
import { checkPersistentRateLimit, retrieve, retrieveGrounded } from "@/lib/knowledge";

export const runtime = "nodejs";

const requestSchema = z.object({ question: z.string().trim().min(3).max(600) });
const memoryLimits = new Map<string, { count: number; resetsAt: number }>();
const MAX_BODY_BYTES = 4096;
const RATE_WINDOW_MS = 60_000;

class RequestTooLargeError extends Error {}

async function readBoundedJson(request: NextRequest): Promise<unknown> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) throw new RequestTooLargeError();
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestTooLargeError();
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function visitorAddress(request: NextRequest): string {
  const direct = request.headers.get("x-real-ip")?.trim();
  if (direct) return direct;
  const chain = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
  return chain.at(-1) ?? "unknown";
}

async function limitRequests(request: NextRequest, salt?: string): Promise<boolean> {
  const address = visitorAddress(request);
  const key = salt ? createHmac("sha256", salt).update(address).digest("hex") : address;
  const persistent = await checkPersistentRateLimit(key);
  if (persistent !== null) return persistent;
  const now = Date.now();
  if (memoryLimits.size > 1000) {
    for (const [visitor, counter] of memoryLimits) if (counter.resetsAt <= now) memoryLimits.delete(visitor);
  }
  const current = memoryLimits.get(key);
  if (current && current.resetsAt > now && current.count >= 12) return false;
  memoryLimits.set(key, current && current.resetsAt > now ? { ...current, count: current.count + 1 } : { count: 1, resetsAt: now + RATE_WINDOW_MS });
  return true;
}

export async function POST(request: NextRequest) {
  let environment;
  try { environment = getServerEnvironment(); }
  catch { return NextResponse.json({ error: "The assistant is temporarily unavailable because its server configuration is incomplete." }, { status: 503 }); }

  let body: unknown;
  try { body = await readBoundedJson(request); }
  catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Question payload is too large." }, { status: 413 });
    return NextResponse.json({ error: "Send a valid JSON question." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Questions must be between 3 and 600 characters." }, { status: 400 });

  const ai = getAiConfiguration(environment);
  if (ai && process.env.NODE_ENV === "production" && !environment.DATABASE_URL) {
    return NextResponse.json({ error: "AI chat needs persistent rate limiting before it can be enabled on this deployment." }, { status: 503 });
  }
  let allowed: boolean;
  try { allowed = await limitRequests(request, environment.RATE_LIMIT_SALT); }
  catch { return NextResponse.json({ error: "The assistant is temporarily unavailable." }, { status: 503 }); }
  if (!allowed) return NextResponse.json({ error: "Please wait a minute before asking another question." }, { status: 429 });

  let sources;
  try { sources = ai ? await retrieveGrounded(parsed.data.question, ai) : retrieve(parsed.data.question); }
  catch (error) {
    if (error instanceof AiProviderError && error.failure === "quota") return NextResponse.json({ error: "The assistant has reached its provider quota. Please try again later or use the contact page." }, { status: 503 });
    return NextResponse.json({ error: "Portfolio retrieval is temporarily unavailable. Please try again later." }, { status: 503 });
  }
  if (!sources.length) return NextResponse.json({ answer: "I couldn't find relevant information in the published portfolio content. Try asking about experience, projects, or technologies, or contact Praveen directly.", sources: [{ title: "Contact", href: "/contact" }] });

  const citations = sources.map(({ title, href }) => ({ title, href }));
  if (!ai) return NextResponse.json({ answer: sources.slice(0, 3).map(({ title, text }) => `${title}: ${text}`).join("\n\n"), sources: citations, unavailable: true });
  try {
    const answer = await generateGroundedAnswer(parsed.data.question, sources, ai);
    return NextResponse.json({ answer, sources: citations });
  } catch (error) {
    if (error instanceof AiProviderError && error.failure === "quota") return NextResponse.json({ error: "The assistant has reached its provider quota. Please try again later or use the contact page." }, { status: 503 });
    return NextResponse.json({ error: "The assistant provider is unavailable. Please try again later or use the contact page." }, { status: 503 });
  }
}
