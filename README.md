# Praveen Dhakade — developer portfolio

A dark, responsive Next.js portfolio for Praveen Kumar Dhakade. It presents verified high-level experience, selected case studies, technical skills, unpublished learning notes, a public GitHub repository feed, and an optional evidence-grounded assistant.

## Architecture

- Next.js App Router with strict TypeScript.
- Editable profile and case study data in `src/data/portfolio.ts`; content review notes and journal drafts in `content/`.
- Server-rendered pages with a small client-side project search/filter and assistant form.
- Public GitHub REST API discovery is cached for one hour and falls back to a link to the profile.
- Assistant retrieves only curated portfolio evidence. Without AI credentials it returns matching evidence directly and links to its source pages.
- Optional PostgreSQL/pgvector enables vector retrieval and cross-instance chat rate limits. Static pages remain usable without it.

## Local setup

Use Node.js 22 and npm. Copy `.env.example` to `.env.local`, then install and start:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. No database, AI provider, or GitHub token is needed for the core site. `package-lock.json` is committed so local installs and CI use the same dependency versions.

## Environment

| Variable | Purpose |
| --- | --- |
| `GITHUB_USERNAME` | Public repositories to discover (defaults in code to `praveendhakade`) |
| `GITHUB_TOKEN` | Optional server-only token for higher GitHub API limits |
| `AI_PROVIDER_API_KEY` | Optional server-only OpenAI-compatible chat/embedding API key |
| `AI_MODEL` | Chat model name (defaults to `gpt-4o-mini`) |
| `AI_BASE_URL` | OpenAI-compatible API base (defaults to `https://api.openai.com/v1`) |
| `EMBEDDING_MODEL` | Embedding model returning 1536 dimensions (defaults to `text-embedding-3-small`) |
| `DATABASE_URL` | Optional PostgreSQL/pgvector connection string |
| `NEXT_PUBLIC_SITE_URL` | Deployed origin for metadata and sitemap URLs |

Never add secrets to `NEXT_PUBLIC_` variables or commit `.env.local`.

## Development and quality checks

```sh
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs lint, TypeScript, tests, and the production build for pull requests and pushes to `main`. The checks are defined but have not been run in the current environment because network access to install npm dependencies is unavailable.

## Content integrity

- Complete resume files are intentionally excluded from Git (`Resumes/` in `.gitignore`). The phone number is not published.
- Public project descriptions omit employer code, customer information, private screenshots, and unverified metrics.
- Journal entries are marked as drafts.
- The PDF-converted Markdown and updated Markdown resume were read and combined. The conversion has not been visually checked against PDF pages. Review `content/review-checklist.md` before expanding project claims.

## GitHub integration

The projects page fetches public repositories for `GITHUB_USERNAME`, sorts by recent update, and caches the response for one hour. It does not publish private repositories or automatically label repositories as featured case studies. When the API is unavailable, the page shows a link to the GitHub profile and still renders curated case studies.

## Assistant and RAG

`POST /api/chat` validates questions (3–600 characters), retrieves from curated portfolio text, bounds results, returns source links, and times out provider requests. With no `AI_PROVIDER_API_KEY`, it returns matching source text instead of pretending model generation is active. With a key, it calls an OpenAI-compatible Chat Completions endpoint and instructs the model to treat retrieved content as untrusted evidence.

The optional persistent path uses PostgreSQL with pgvector:

1. Provision a PostgreSQL database with the pgvector extension available.
2. Set `DATABASE_URL`, `AI_PROVIDER_API_KEY`, and optionally `AI_BASE_URL`/`EMBEDDING_MODEL`.
3. Apply `migrations/001_knowledge.sql`.
4. Run `npm run rag:ingest` to chunk approved profile/project facts, hash them, generate embeddings, and upsert changed chunks.
5. Configure the same variables in the host environment and test representative supported and unsupported questions.

Embeddings are expected to have 1536 dimensions. Model inference, embedding generation, and database hosting may have costs or changing free-tier limits. If persistent storage is not configured, retrieval falls back to lexical matching; request limits then use a process-local best-effort counter. Use the database-backed rate limit for public multi-instance AI deployments.

## Contact

The contact page uses `mailto:` and public profile links. No form claims to send or store messages.

## Deployment

1. Create a GitHub repository named `praveen-portfolio` under `praveendhakade` and push `main`.
2. Import the repository into Vercel using native Git integration and set `main` as the production branch.
3. Add only the required environment variables in Vercel project settings. Set `NEXT_PUBLIC_SITE_URL` to the confirmed deployed domain.
4. Vercel creates preview deployments for branches/pull requests and production deployments from `main` after merge.
5. Verify each route, assistant missing-key behavior, repository fallback, and runtime/build logs in Vercel.

No production deployment or external account configuration has been performed from this workspace.

## Known limitations

- The PDF-to-Markdown transcription has not been visually checked against the PDF pages; see `content/review-checklist.md`.
- GitHub repository metadata, AI responses, database retrieval, and deployment have not been live-verified.
- CI and build commands are configured but require installing dependencies and running the checks.
- GitHub repository descriptions can be incomplete; curated portfolio case studies remain the source for featured professional work.
