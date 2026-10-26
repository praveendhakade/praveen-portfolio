# Implementation plan

## Audit findings (2026-10-26)

- Existing repo is a Next.js 16.4.3 App Router application with strict TypeScript, 12 public page routes, `/api/chat`, a GitHub public-repository page, and an existing local commit on `main` tracking `origin/main`.
- The build-generated `next-env.d.ts` differs from the tracked file and now references Next 16's `.next/dev/types`; this related generated update is retained for review.
- Existing CI had no explicit workflow permissions or production smoke step. No Vercel CLI/project config or Vercel credentials are present. No AI/database variables are configured.
- Existing assistant had lexical fallback and an optional vector schema/ingester, but model calls were inline, vector cutoff was an uncalibrated literal, request body reads were not byte bounded for chunked requests, and README ingestion/evaluation were absent.
- Secret-bearing env files are excluded by `.gitignore`; complete résumé files remain excluded from Git.
- A clean `npm ci` succeeded using a temporary copy of the current manifest/lockfile. This machine's Node is 22.6.0, below the declared 22.13 minimum, so npm reports engine warnings; CI is pinned to 22.13.0.
- Deployment and database provisioning remain manual until an account/project and credentials are available. No uncommitted changes will be deployed.

## Milestone 1 — inspect and consolidate

- [x] Inspect workspace and source files.
- [x] Read both available Markdown resume versions and combine their unique facts.
- [x] Reconcile the supplied PDF-converted Markdown and updated Markdown cumulatively; visual verification of conversion fidelity remains noted in `content/review-checklist.md`.
- [x] Create editable profile, experience, project, skill, education, and journal content structures.
- [x] Record discrepancies and source review actions.
- [x] Establish strict TypeScript Next.js application foundation.

## Milestone 2 — portfolio pages

- [x] Responsive navigation, footer, dark-first design, keyboard focus, reduced motion.
- [x] Home, about, experience, projects, project detail, journal drafts, assistant, contact, and not-found routes.
- [x] Metadata, robots, sitemap, semantic page structure.
- [x] Project search and category filtering.
- [ ] Browser-level accessibility and responsive audit.

## Milestone 3 — GitHub integration

- [x] Discover public repositories via anonymous GitHub REST API with one-hour caching.
- [x] Handle errors with a profile link fallback.
- [x] Keep manually curated case studies separate from discovered repositories.
- [x] Verify the public GitHub repository feed for the supplied profile.

## Milestone 4 — CI and deployment

- [x] CI workflow for lint, type check, unit tests, and build.
- [x] Vercel and GitHub setup documented.
- [x] Install from the lockfile and run lint, type check, 23 unit/API tests, production build, smoke checks, and npm audit (zero advisories).
- [x] Least-privilege CI permissions, mocked GitHub API tests, and production route smoke tests.
- [ ] Import the repository into Vercel and verify a deployment (project/account access unavailable).

## Milestone 5 — basic RAG assistant

- [x] Chat UI and validated `/api/chat` handler.
- [x] Curated lexical/vector retrieval, source links, no-key fallback, and typed OpenAI-compatible adapters.
- [x] Streaming byte limits, question validation, provider timeout, safe errors, and durable rate limits when DB is configured.
- [x] Chat endpoint tests for source links, missing evidence, malformed/large input, provider quota/failure, injection handling, database failure, and local burst limits.
- [ ] Verify with a configured provider credential.

## Milestone 6 — persistent RAG

- [x] pgvector migrations, source metadata, deterministic chunks/hashes, and incremental/deletion-aware ingestion.
- [x] Explicit public GitHub README allowlist with repository visibility/owner checks.
- [x] Embedding retrieval, HNSW index, and persistent rate-limit path.
- [x] Retrieval evaluation set and cutoff calibration script (requires configured DB/provider).
- [x] Normalization/chunking and cutoff-separation unit tests.
- [ ] Apply migration and run ingestion against a configured PostgreSQL instance.
- [ ] Run evaluation, select a cutoff from observed scores, and verify retrieval relevance.

## Milestone 7 — final audit

- [x] Production-route smoke tests cover navigation routes and missing-key assistant behavior.
- [ ] Verify configured-provider and database failure paths against live services.
- [ ] Complete visual responsive/accessibility and SEO audit in a browser.
- [ ] Deploy through Vercel's native Git integration and verify the production URL.
- [x] Keep deployment and unverified work accurately documented.
