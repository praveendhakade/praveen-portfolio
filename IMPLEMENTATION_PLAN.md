# Implementation plan

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
- [x] Install dependencies and run lint, type check, unit tests, production build, and npm audit.
- [ ] Push the initial commit (GitHub authentication is not connected in this workspace).
- [ ] Connect Vercel and verify a deployment (account access unavailable).

## Milestone 5 — basic RAG assistant

- [x] Chat UI and validated `/api/chat` handler.
- [x] Curated retrieval, source links, no-key deterministic fallback, and OpenAI-compatible provider adapter.
- [x] Bounded request size, provider timeout, safe errors, and request limiting.
- [ ] Verify with a configured provider credential.

## Milestone 6 — persistent RAG

- [x] pgvector schema, document metadata, deterministic chunks/hashes, and ingestion script.
- [x] Embedding retrieval and persistent database rate-limit path.
- [ ] Apply migration and run ingestion against a configured PostgreSQL instance.
- [ ] Evaluate retrieval relevance with the PDF-reconciled knowledge set.

## Milestone 7 — final audit

- [ ] Run browser smoke checks, responsive/accessibility audit, and deployment verification.
- [ ] Verify provider failure, missing-key behavior, responsive layout, accessibility, and SEO.
- [x] Keep deployment and unverified work accurately documented.
