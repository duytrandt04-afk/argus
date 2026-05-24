# External Integrations

**Analysis Date:** 2026-05-24

## APIs & External Services

**LLM Provider APIs:**
- OpenAI Organization Usage API - Usage reporting proxy endpoint for frontend usage dashboard
  - SDK/Client: Direct HTTP proxy with `net/http` (`backend/internal/handler/proxy.go`)
  - Auth: `Authorization` request header forwarded by backend (`backend/internal/handler/proxy.go`, `frontend/src/features/usage/hooks/useOpenAIUsage.ts`)
- Anthropic Usage API - Usage reporting proxy endpoint for frontend usage dashboard
  - SDK/Client: Direct HTTP proxy with `net/http` (`backend/internal/handler/proxy.go`)
  - Auth: `x-api-key` request header forwarded by backend (`backend/internal/handler/proxy.go`, `frontend/src/features/usage/hooks/useOpenAIUsage.ts`)

**Agent Hook Sources:**
- Codex / Claude Code / Gemini CLI event payload ingestion via `POST /api/hook` (`backend/internal/handler/hook.go`)
  - SDK/Client: Not applicable (incoming webhook-style HTTP)
  - Auth: None enforced at application layer

## Data Storage

**Databases:**
- SQLite (embedded file DB)
  - Connection: `DB_PATH` environment variable (`backend/internal/config/config.go`, `docker-compose.yml`)
  - Client: Go `database/sql` + `modernc.org/sqlite` (`backend/internal/repository/sqlite/sqlite.go`)

**File Storage:**
- Local filesystem only
  - SQLite DB file at `backend/hooker.db` default (`backend/internal/config/config.go`)
  - Transcript/file reads from local paths for parsing/context enrichment (`backend/internal/handler/usage.go`, `backend/internal/handler/hook.go`, `backend/internal/fileutil/fileutil.go`)

**Caching:**
- Browser localStorage cache for usage dashboard results (`frontend/src/features/usage/hooks/useOpenAIUsage.ts`)
- No dedicated server-side cache service detected

## Authentication & Identity

**Auth Provider:**
- Custom header pass-through for proxied LLM usage calls
  - Implementation: Frontend collects API key input and sends header to backend proxy endpoint (`frontend/src/features/usage/hooks/useOpenAIUsage.ts`, `backend/internal/handler/proxy.go`)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/Datadog/OpenTelemetry instrumentation in app code)

**Logs:**
- Backend request and hook logs via standard `log.Printf` (`backend/internal/server/middleware.go`, `backend/internal/handler/hook.go`, `backend/cmd/server/main.go`)

## CI/CD & Deployment

**Hosting:**
- Local-first runtime on host machine (`README.md`)
- Optional Docker deployment (`Dockerfile`, `docker-compose.yml`)

**CI Pipeline:**
- Not detected (`.github/workflows/` not present in repo scan)

## Environment Configuration

**Required env vars:**
- `ADDR` - Backend listen address (`backend/internal/config/config.go`)
- `DB_PATH` - SQLite path (`backend/internal/config/config.go`, `docker-compose.yml`)
- API keys are runtime user input in frontend and forwarded as request headers, not repo env config (`frontend/src/features/usage/hooks/useOpenAIUsage.ts`)

**Secrets location:**
- Not committed in repo; API keys are entered client-side and stored in browser localStorage (`frontend/src/features/usage/hooks/useOpenAIUsage.ts`)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/hook` receives agent event payloads (`backend/internal/server/router.go`, `backend/internal/handler/hook.go`)
- `GET /api/events/stream` provides SSE stream to frontend (`backend/internal/handler/events.go`)

**Outgoing:**
- `https://api.openai.com/v1/organization/*` via backend proxy (`backend/internal/handler/proxy.go`)
- `https://api.anthropic.com/v1/*` via backend proxy (`backend/internal/handler/proxy.go`)

---

*Integration audit: 2026-05-24*
