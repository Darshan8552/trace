# Trace

Trace is a document assistant: upload the sources for a notebook, ask questions in plain language, and get answers with the exact passages they came from. Every notebook keeps its own file set, and citations open the passage they came from.

Built with Next.js 16 (App Router), Prisma 7 on Neon Postgres, better-auth, the AI SDK, and Vercel Blob.

## Requirements

- Node.js 20.9 or newer
- pnpm 12 or newer
- A Neon Postgres database
- A Vercel Blob store
- A Brevo account for transactional email (OTP codes)
- A Google AI API key (chat + embeddings)

## Getting started

```bash
pnpm install
cp .env.example .env
# fill in the values described below
pnpm db:apply
pnpm dev
```

Open <http://localhost:3000>, create an account, and verify the 6-digit code sent to your email.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled Neon connection string used by the app. |
| `DIRECT_URL` | yes | Direct (unpooled) Neon connection used for migrations. Falls back to `DATABASE_URL`. |
| `BETTER_AUTH_SECRET` | yes | Random secret, at least 32 characters. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | yes | Public origin, for example `http://localhost:3000` or `https://trace.example.com`. |
| `BREVO_API_KEY` | for email | Brevo API key. Without it, OTP emails cannot be sent. |
| `EMAIL_FROM` | for email | Verified sender address in Brevo. |
| `EMAIL_FROM_NAME` | no | Sender display name. Defaults to `Trace`. |
| `GOOGLE_CLIENT_ID` | no | Enables Google sign-in when set with the secret. |
| `GOOGLE_CLIENT_SECRET` | no | Google OAuth client secret. |
| `STORAGE_PROVIDER` | no | Storage provider id. Defaults to `vercel-blob`. |
| `BLOB_READ_WRITE_TOKEN` | for uploads | Vercel Blob read/write token. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes | Google AI API key. |
| `AI_CHAT_PROVIDER` | no | Chat provider id. Defaults to `google`. |
| `AI_CHAT_MODEL` | no | Chat model. Defaults to `gemini-3.5-flash-lite`. |
| `AI_EMBEDDING_PROVIDER` | no | Embedding provider id. Defaults to `google`. |
| `AI_EMBEDDING_MODEL` | no | Embedding model. Defaults to `gemini-embedding-001`. |
| `AI_EMBEDDING_DIMENSIONS` | no | Embedding dimensions. Defaults to `1536`; must match the `vector(1536)` column. |
| `RATE_LIMIT_STORE` | no | `memory` (default; single instance) or `postgres` (shared across instances). |
| `ADMIN_EMAILS` | no | Comma-separated bootstrap/break-glass allowlist for `/admin`. The normal path is the `role` column managed through the Users section. |
| `REINDEX_SECRET` | no | 32+ character bearer token that lets `pnpm reindex` call the reindex route without a browser session. |
| `INGEST_SPREADSHEETS` | no | `1`/`true` enables CSV and XLSX sources. Defaults to off. |
| `INGEST_OCR` | no | `1`/`true` enables OCR for image-only PDFs (first run downloads the English model). Defaults to off. |

Environment values are validated lazily by `src/lib/env.ts` (`serverEnv()`), so a missing optional integration only fails when that feature is used.

### Set up the database

The schema lives in `prisma/schema.prisma`; the Prisma client is generated into `src/generated/prisma`.

```bash
pnpm db:apply     # guarded migrate deploy + generate
pnpm db:check     # verifies the HNSW and full-text indexes
```

> **Never run `prisma migrate dev` or `prisma db push` directly.** Prisma diffs can emit `DROP INDEX "chunk_embedding_idx"` (HNSW) or `"chunk_content_fts_idx"` (full-text), which silently disables retrieval. Use the guarded flow:
>
> 1. `pnpm db:migrate` — writes SQL only (`migrate dev --create-only`).
> 2. Inspect and edit the SQL in `prisma/migrations`.
> 3. `pnpm db:apply` — aborts if a pending migration drops either index.

### Google sign-in (optional)

Create an OAuth client in Google Cloud Console and add the authorized redirect URI:

```
{BETTER_AUTH_URL}/api/auth/callback/google
```

Google is hidden on the sign-in page unless both client variables are set.

### Email (required for email/password)

Trace sends OTP codes through Brevo. Verify `EMAIL_FROM` as a sender in Brevo, then set `BREVO_API_KEY`. Codes are hashed at rest and expire after 10 minutes.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next dev server on port 3000. |
| `pnpm build` / `pnpm start` | Production build and server. |
| `pnpm lint` | Biome check (there is no `next lint`). |
| `pnpm format` | Biome format with writes. |
| `pnpm test` | Vitest suite in `test/`. |
| `pnpm test:eval` | Retrieval recall against a local question fixture (see below). |
| `pnpm test:e2e` | Playwright browser suite in `e2e/` (starts the dev server). |
| `pnpm test:a11y` | Axe checks (`@a11y`) on the landing page, chat library, and a chat with a cited source. |
| `pnpm exec tsc --noEmit` | Typecheck. |
| `pnpm db:check` | Verify the vector and full-text indexes. |
| `pnpm db:apply` | Guarded `migrate deploy` + client generation. |
| `pnpm db:migrate` | Write a migration only (`--create-only`). |
| `pnpm db:generate` | Regenerate the Prisma client. |
| `pnpm db:studio` | Open Prisma Studio. |
| `pnpm storage:retry` | Retry blob deletions recorded in `blob_deletion`. |
| `pnpm reindex` | Dry-run a global reindex of failed or stale documents; add `--apply`. |
| `pnpm admin:grant <email>` | Grant the `admin` role directly; add `--revoke` to remove it. |

## How it works

- **Auth.** better-auth with the Prisma adapter. Email/password requires OTP verification; Google is enabled when credentials exist. The `admin()` plugin owns `user.role`, `user.banned`, `user.banReason`, and `user.banExpires`; banned sessions are rejected at sign-in. Settings lists active devices (revoke one or all others), exports account data as JSON, and deletes the account after confirmation. `src/proxy.ts` redirects signed-out users away from `/chat`, `/settings`, and `/admin`, but real authorization happens in server code (`getSession` / `requireSession`).
- **Admin bootstrap.** An account is an admin when `user.role = 'admin'` or its email is in `ADMIN_EMAILS` (break-glass). On a fresh database, grant the first role with `pnpm admin:grant you@example.com`, then sign out and back in so the session carries the role. Further changes happen in `/admin` → Users (promote/demote, ban/unban, delete); those actions call `auth.api.*` so plugin permissions and ban hooks run, and an admin cannot demote, ban, or delete themselves. Impersonation is intentionally not exposed.
- **Notebooks.** A chat owns one document set (max 10 documents, 20 MB each, PDF/DOCX/TXT/MD, 200k pasted characters). Documents and messages cascade with the chat; deleting a chat also removes its blobs. The first answered turn gets an AI-generated title unless you rename the notebook yourself.
- **Demo notebook.** From an empty library, "Try a demo notebook" calls `POST /api/notebooks/demo`, which stores three short bundled text sources, indexes them, and opens the new notebook with the normal suggestion chips. The chat is titled `Demo notebook` with `titleIsAuto: false`, so a second click reuses it instead of duplicating. Missing storage returns 503 before anything is created.
- **Navigation.** Pin a notebook with the pin action to keep it first in the library. `Cmd/Ctrl+K` opens a command palette for new/demo/template notebooks, recent notebooks, full-text search, settings, and admin. Notebook templates (research, contract review, meeting notes) are offered from the empty library and create a titled notebook with bundled sample sources through `POST /api/notebooks/template`, then pass `?template=…` so starter questions render. In a chat, `C` focuses the composer, `J`/`K` moves between answers, `S` toggles sources, and `?` lists the shortcuts.
- **Ingestion.** The browser uploads directly to Vercel Blob under `documents/{userId}/`; `POST /api/documents` registers the file, and `POST /api/documents/{id}/process` extracts, chunks, and embeds in 24-item batches within a 40-second budget. Registration hashes content and refuses duplicates in the same chat. Pasted text and public web pages are stored as text sources; `POST /api/documents/from-url` fetches a page with SSRF checks (public IPs only, three redirects, 12-second timeout, 5 MB cap) and extracts readable text with Readability. `POST /api/documents/{id}/refresh` re-checks a web source and reindexes it only when the text changed. With `INGEST_SPREADSHEETS=1`, CSV/XLSX files become capped Markdown tables; with `INGEST_OCR=1`, image-only PDFs get a Tesseract pass over up to ten pages. The client polls until the document is `READY` or `FAILED`.
- **Retrieval.** Small notebooks (at most 60k characters of chunk text) send the complete corpus to the model. Larger notebooks use hybrid vector + full-text search with per-document coverage so every searchable file is represented; retrieved passages are then re-ranked by query-term overlap and given one neighbouring passage on each side as unciteable context. Only `READY` documents whose embedding provider, model, and dimensions match the current environment are searchable.
- **Answers.** The chat route groups passages by document, streams a citation-tagged answer, and stores sources as a `data-sources` part. Inventory questions ("how many sources?") and grounded questions whose retrieved passages are all below the match floor are answered deterministically without a model call; the latter says plainly that the answer was not found in the sources. Each source carries a plain-language match-strength label, and answers show follow-up chips derived from the cited titles. An answer can be regenerated; later assistant messages are replaced. Citations and source rows open a reading view that highlights the cited passage and offers the original file. 👍/👎 feedback is stored per answer with an optional reason and note and appears in the account export.
- **Search and sharing.** The notebook index searches titles, answer text, and source passages with Postgres full-text search (`GET /api/search`, `Cmd/Ctrl+K`); results deep-link to the exact turn or passage. An owner can create a revocable link at `/s/{slug}`; shared pages are read-only, `noindex`, show only answers and cited passages, and never expose original files or storage keys.
- **Rate limits.** Auth endpoints are limited by better-auth; chat, notebook creation, upload registration, upload tokens, document processing, export, and account deletion use per-user limits in `src/lib/rate-limit.ts`. The limiter uses an in-memory store by default; set `RATE_LIMIT_STORE=postgres` when more than one instance serves traffic.
- **Storage cleanup.** Deleting a document, chat, or account removes its blobs immediately. Failures are recorded in `blob_deletion` instead of being lost; `pnpm storage:retry` retries them (run it from a scheduled job).
- **Reindexing.** `pnpm reindex` finds documents that are `FAILED` or embedded with a different provider, model, or dimension set than the current `AI_EMBEDDING_*` values. It is a dry run; add `--apply` to re-embed them. The CLI calls `POST /api/admin/reindex`, which requires `REINDEX_SECRET` (machine auth) or an admin session with the `admin` role (or an allowlisted `ADMIN_EMAILS` address), so the real pipeline stays server-side.
- **Operations.** `GET /api/health` reports database and storage readiness (`200` healthy, `503` degraded). Server errors go through `logError` in `src/lib/log.ts`, which writes one JSON object per line for log collectors. `next.config.ts` sends security headers; the CSP is Report-Only so blob uploads and streamed answers keep working while violations are observed. `/admin` lists users with role and ban controls, failed sources with retry, the blob-deletion queue with a drain action, recent answer feedback, and workspace counts; non-admins get the normal 404.

## Project layout

```
src/app            Routes, layouts, and API handlers
src/components     UI (auth, chat, documents, landing, settings, ui primitives)
src/lib            Auth, env, Prisma, storage, email, LLM, RAG
src/generated      Generated Prisma client (never edit)
prisma             Schema, migrations, SQL index definitions
scripts            Migration/index guard and blob-deletion retry
test               Vitest unit tests (local only, not tracked)
e2e                Playwright browser tests (local only, not tracked)
eval               Retrieval evaluation fixture template
.github/workflows  CI (verify + index guard)
```

## Testing

> The Vitest and Playwright suites are kept out of the public repository. They are ignored by git and run from a local checkout that has `test/` and `e2e/` present.

```bash
pnpm test              # unit tests
pnpm exec tsc --noEmit # types
pnpm lint              # Biome
pnpm db:check          # index guard
pnpm build             # production build
```

Unit tests cover citation handling, source links, answer-feedback persistence, URL SSRF rules and extraction, title cleanup, search normalization, share slugs, context grouping, query intent detection, inventory answers, hybrid merge, the rewrite prompt, and the rate limiter.

### Browser tests

`pnpm test:e2e` runs Playwright against a running dev server (or starts one). The suite seeds its own users and sessions in the configured database, then deletes them. Always point `DATABASE_URL`/`DIRECT_URL` at a development or dedicated test database, never production.

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

If the Playwright browser download is blocked, use an installed Chrome and skip the download:

```bash
# PowerShell
$env:E2E_BROWSER_CHANNEL="chrome"; pnpm test:e2e
```

Set `E2E_BASE_URL` to test an already-running server instead of letting Playwright start one. The suite requires a real blob store and Google AI key because it indexes pasted sources and asks one model-backed question. `pnpm test:a11y` selects only the axe-tagged specs; those seed a user and a chat with a cited passage directly, so they do not need a model call.

CI runs Biome, the typecheck, and the production build on every pull request; the test suites stay local.

The URL-ingestion browser test is skipped unless you set `E2E_URL_INGEST=1`; it fetches `https://example.com/` and needs outbound network access.

### Retrieval evaluation

`pnpm test:eval` runs a fixed question set through the real retrieval path and reports recall. Copy `eval/questions.example.json` to `eval/questions.json`, point it at a notebook with known sources, then:

```bash
RAG_EVAL_USER_ID=<user id> RAG_EVAL_CHAT_ID=<chat id> RAG_EVAL_MIN_RECALL=0.8 pnpm test:eval
```

The fixture is gitignored by design; the test skips when no fixture or ids are present. Run it before changing chunking, ranking, or embedding settings.

## Deploying

1. Create a Neon database and run `pnpm db:apply` against it with `DIRECT_URL` set.
2. Create a Vercel Blob store and copy its read/write token.
3. Add every required environment variable to the hosting project. Set `BETTER_AUTH_URL` to the public URL.
4. Add the Google redirect URI if Google sign-in is enabled.
5. Deploy, then sign in and upload a test PDF.

Notes:

- Document processing uses a 60-second route budget; keep the platform limit at or above that.
- Changing `AI_EMBEDDING_*` makes existing documents unsearchable until reindexed. Open the notebook, use the "Needs reindex" banner (or the per-source reindex button), or call `POST /api/documents/{id}/process` with `{ "reindex": true }`. Reindexing deletes the old chunks and re-embeds under the current configuration. For a whole deployment, set `REINDEX_SECRET` and run `pnpm reindex` (dry run) then `pnpm reindex --apply`.
- Set `RATE_LIMIT_STORE=postgres` before running more than one instance so limits are shared.
- Schedule `pnpm storage:retry` (for example, a daily cron) to drain `blob_deletion` rows left by transient storage failures.
- Point uptime checks at `GET /api/health`.
- `maxDuration` on upload/chat routes assumes a serverless platform that permits long streaming responses.
- Webhooks and background queues are not used; indexing resumes through client polling and URL fetches happen in-request.
- Public share links are unguessable and revocable; revoking immediately makes the old URL show the not-found page. Shared pages carry `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`.
- Add the new full-text index on `chat_message(content)` via the guarded migration flow; `pnpm db:check` guards the two critical retrieval indexes.

## Troubleshooting

- **"File storage is not configured yet."** `BLOB_READ_WRITE_TOKEN` is missing or invalid.
- **OTP emails never arrive.** Check `BREVO_API_KEY`, `EMAIL_FROM`, and the Brevo sender verification.
- **A source is marked "Needs reindex".** It was embedded with different `AI_EMBEDDING_*` values. Use the reindex button in the Sources panel, run `pnpm reindex --apply`, or restore the old settings. A reindex run needs `REINDEX_SECRET` or an admin session cookie (`--cookie`).
- **Uploads fail at the 10-document limit.** Remove a source from the notebook first.
- **“Too many requests.”** Wait for the `Retry-After` window; limits reset every minute.
- **A deleted file is still in blob storage.** A transient removal failure was queued. Run `pnpm storage:retry` and check the `blob_deletion` table.
- **A shared link no longer works.** The owner revoked it; ask for a new link.
- **A pasted URL fails with “That address is not public.”** Only public http/https hosts are allowed; private, loopback, and link-local addresses are blocked to prevent server-side request forgery.
- **Health check fails.** `GET /api/health` returns `503` when the database probe fails; storage being unconfigured is reported but does not fail the check.
