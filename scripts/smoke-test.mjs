import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 3217);
const baseUrl = `http://127.0.0.1:${port}`;
const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const server = spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  stdio: "ignore",
  env: { ...process.env, AI_PROVIDER_API_KEY: "", DATABASE_URL: "", RATE_LIMIT_SALT: "", GITHUB_API_ENABLED: "false" },
});

async function waitForServer() {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try { const response = await fetch(baseUrl); if (response.ok) return; } catch { /* wait for Next.js startup */ }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("Production server did not become ready in 45 seconds.");
}

try {
  await waitForServer();
  for (const path of ["/", "/about", "/experience", "/projects", "/journal", "/assistant", "/contact", "/robots.txt", "/sitemap.xml"]) {
    const response = await fetch(`${baseUrl}${path}`);
    if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  }
  const supported = await fetch(`${baseUrl}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: "What work demonstrates React and TypeScript?" }) });
  if (!supported.ok) throw new Error(`Supported assistant question returned HTTP ${supported.status}`);
  const answer = await supported.json();
  if (!Array.isArray(answer.sources) || !answer.sources.length) throw new Error("Assistant response did not include sources.");
  const unsupported = await fetch(`${baseUrl}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: "What is Praveen's favorite movie?" }) });
  const unknown = await unsupported.json();
  if (!unsupported.ok || unknown.sources?.[0]?.href !== "/contact") throw new Error("Unsupported question did not return the safe fallback.");
  const invalid = await fetch(`${baseUrl}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: "x" }) });
  if (invalid.status !== 400) throw new Error(`Invalid question returned HTTP ${invalid.status}, expected 400`);
  console.log("Production route and assistant smoke checks passed.");
} finally {
  server.kill("SIGTERM");
}
