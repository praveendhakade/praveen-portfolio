# Praveen Dhakade — developer portfolio

A responsive Next.js portfolio for Praveen Kumar Dhakade. It presents consolidated résumé details, selected work, unpublished learning notes, public GitHub repositories, and an optional evidence-grounded assistant. Full résumé files and the phone number are excluded from the public repository.

## Architecture

- Next.js App Router and strict TypeScript. Public pages are static/server-rendered; the chat route uses the Node.js runtime.
- Curated facts live in `src/data/portfolio.ts`; `src/lib/knowledge.ts` shapes the approved subset used for retrieval. Full source résumés stay under ignored `Resumes/` and are never ingested.
- `src/lib/ai/provider.ts` is the typed OpenAI-compatible chat/embedding adapter. Provider secrets are read on the server only.
- `src/lib/database.ts` reuses a small serverless-safe Postgres client with prepared statements disabled for transaction poolers.
- GitHub README ingestion is an explicit allowlist operation. Each repository is checked for public visibility and ownership before fetching its README.
- GitHub Actions runs quality checks and production-route smoke tests. Vercel deployment is intended to use its native Git integration, with `main` as production.

## Local setup

Use Node.js 22.13 or newer and npm. Copy `.env.example` to `.env.local`, then:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. The public site and lexical assistant fallback run without AI or database credentials.

## Environment variables

Server variables are validated through `src/lib/env.ts`. Missing optional values use safe defaults; malformed settings return a safe service error without printing secret values.

| Variable | Purpose |
| --- | --- |
| `GITHUB_USERNAME` | Profile for public repository discovery (defaults to `praveendhakade`) |
| `GITHUB_API_ENABLED` | Set to `false` to disable repository discovery while keeping curated projects available |
| `GITHUB_TOKEN` | Optional server-only GitHub token for API rate limits |
| `GITHUB_KNOWLEDGE_REPOS` | Comma-separated explicit allowlist of public README sources for ingestion |
| `AI_PROVIDER_API_KEY` | Optional server-only OpenAI-compatible chat and embedding credential |
| `AI_MODEL` | Chat model name (defaults to `gpt-4o-mini`) |
| `AI_BASE_URL` | Provider API base URL (defaults to `https://api.openai.com/v1`) |
| `EMBEDDING_MODEL` | Embedding model; its output must contain 1536 dimensions |
| `DATABASE_URL` | Optional PostgreSQL/pgvector connection string; use a server-side pooler URL on serverless hosts |
| `RATE_LIMIT_SALT` | Random secret of at least 32 characters; required when `DATABASE_URL` is set |
| `RAG_MIN_SIMILARITY` | Similarity cutoff empirically selected after retrieval evaluation; no default is provided |
| `NEXT_PUBLIC_SITE_URL` | Confirmed production origin for metadata and sitemap URLs |

Never put secrets in `NEXT_PUBLIC_` variables or commit `.env.local`. If AI generation is enabled on a public production deployment, configure persistent PostgreSQL rate limiting as well; otherwise the route refuses paid inference. Without the AI key, the assistant can return matching curated source excerpts and contact links.
Production provider endpoints must use HTTPS; local HTTP endpoints are accepted only in development.

## Development and checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run test:e2e` starts the production build locally and checks public routes, source-bearing assistant responses, unsupported questions, and invalid input. CI uses mocked provider responses and does not require GitHub, AI, or database credentials.

## GitHub integration

The projects page fetches public repositories for `GITHUB_USERNAME`, caches the response for one hour, filters out anything not explicitly public, and falls back to a profile link if the API fails. Repositories are not automatically presented as curated professional case studies.

For knowledge ingestion, set `GITHUB_KNOWLEDGE_REPOS` to a deliberate list of repository names. The ingestion script verifies ownership and `private: false` before requesting README content. It never crawls all repositories and never runs on visitor requests.

## RAG assistant

`POST /api/chat` bounds the request body while streaming, validates question length, applies rate limits, retrieves at most four evidence chunks, and returns portfolio source links. Retrieved content and visitor questions are treated as untrusted data. The assistant cannot execute tools, write portfolio data, or access private repositories.

Without `AI_PROVIDER_API_KEY`, the server uses lexical retrieval and shows the UI's AI-disabled notice alongside matching evidence. With a provider key but no database in production, model calls are disabled so public usage cannot incur unmetered inference without durable rate limiting.

### Supabase PostgreSQL and pgvector setup

1. Create a Supabase project. The first migration enables the `vector` extension.
2. Copy a server-side pooled PostgreSQL connection string into `DATABASE_URL`. Use a pooler compatible with serverless workloads; do not expose it to browser code.
3. Generate a random `RATE_LIMIT_SALT` with at least 32 characters.
4. Connect the repository in Supabase **Project Settings > Integrations > GitHub Integration**. Set the working directory to `.` and enable **Deploy to production** for `main`. This repository has `supabase/config.toml` and ordered files in `supabase/migrations/`; Supabase applies pending migrations from that folder on production pushes. Check the migration status in Supabase before relying on the schema. Do not also run these files manually if the integration has already applied them.
5. Add `AI_PROVIDER_API_KEY`. Keep the chat and embedding models compatible with a 1536-dimensional embedding output.
6. Set `GITHUB_KNOWLEDGE_REPOS` only for public repositories whose README content is approved for retrieval.
7. Run `npm run rag:ingest` from a trusted environment. It chunks curated content and allowlisted public README files, hashes each chunk, skips embedding calls for unchanged content, updates changed chunks, and deletes stale chunks after successful ingestion.
8. Run `npm run rag:evaluate`. Review source ranks and the proposed cutoff. If positives and the unsupported query overlap, do not enable vector answers; improve the source set or retrieval first. Set `RAG_MIN_SIMILARITY` to an evaluation-supported value before deploying.
9. Re-run ingestion after profile/project changes or when selected README files change. It is a separate command and is not part of chat requests.

Chunk rows retain source ID/type/title, content, URL or source path, project slug when applicable, chunk index, content hash, embedding, and last-ingested timestamp. PostgreSQL uses an HNSW cosine index and parameterized SQL. The chat handler combines vector results with lexical matches and applies the configured cutoff.

## CI and branch protection

`.github/workflows/ci.yml` grants only `contents: read` and runs `npm ci`, lint, type checking, tests, build, and production smoke checks on pull requests and `main` pushes. Supabase's GitHub integration separately applies database migrations from `supabase/migrations/` when production deployment is enabled.

To require the checks before merging:

1. In GitHub, open **Settings → Rules → Rulesets** (or branch protection rules) and target `main`.
2. Require a pull request and require the `quality` status check from the CI workflow.
3. Disable force pushes and branch deletion for `main`. Avoid granting the CI workflow write permissions.
4. In Vercel, enable preview deployments for pull requests and keep `main` as the production branch.

## Vercel deployment

The project is not linked to a Vercel account from this workspace, and no deployment URL has been verified. Import the existing GitHub repository through the Vercel dashboard:

1. Choose **Add New → Project** and import `praveendhakade/praveen-portfolio`.
2. Keep the detected Next.js framework preset and default build command. Do not enable static export; the chat Route Handler needs a server runtime.
3. Set production branch to `main`. Leave native GitHub preview and production deployments enabled. Do not add a second GitHub Actions deploy workflow or Vercel token.
4. Add only the required server environment variables in Vercel project settings. Set `NEXT_PUBLIC_SITE_URL` to the confirmed site domain and redeploy so metadata and sitemap use it.
5. After import, verify the homepage, all main routes, `/api/chat` with missing credentials, the repository fallback, and Vercel build/runtime logs.

Preview deployments follow pull requests; production deployments follow successful changes to `main`. Configure provider/database values only after provisioning those services. Never paste credentials into GitHub issues, logs, or this repository.

## Cost, troubleshooting, and limits

- Static portfolio pages and the lexical assistant fallback do not require a model or vector database.
- Chat inference, embeddings, GitHub API quotas, Supabase storage/connections, and Vercel usage can have costs or changing free-tier limits; check each provider's current plan.
- `The assistant is temporarily unavailable` with a configured database usually means migrations were not applied, `RATE_LIMIT_SALT` is missing/short, or the pooler is unreachable.
- Vector chat requires a calibrated `RAG_MIN_SIMILARITY`. The evaluation script requires a configured database and AI provider; no production threshold has been measured in this workspace.
- A failed README fetch aborts ingestion rather than silently replacing the knowledge base with partial input. Check repository visibility, API quota, allowlist name, and README size.
- No AI key, database, Vercel project, or deployment authorization was available during this implementation. No production deployment is claimed.
