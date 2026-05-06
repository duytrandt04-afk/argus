# Phase 9 — Server Router + Middleware

> **Status:** ⬜ Pending — update STATUS.md to ✅ when done

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development`.

**Repo:** `/Users/duytran/GitHub/codex-test` | **Backend:** `backend/` | **Module:** `agent-monitor` | **Go:** 1.23

**Goal:** Wire all handlers into a single `http.Handler` with logging and CORS middleware. Uses Go 1.22 `http.ServeMux` method+pattern routing (`"POST /api/hook"`).

**Depends on:** Phase 6 (service), Phase 8 (handlers)

**Next phase:** [phase-10-wire-cleanup.md](phase-10-wire-cleanup.md)

---

## Files

| Action | Path |
|--------|------|
| Create | `backend/internal/server/middleware.go` |
| Create | `backend/internal/server/router.go` |

---

## Steps

- [ ] **Step 1: Create `backend/internal/server/middleware.go`**

```go
package server

import (
	"log"
	"net/http"
	"time"
)

func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```

- [ ] **Step 2: Create `backend/internal/server/router.go`**

```go
package server

import (
	"net/http"

	"agent-monitor/internal/handler"
	"agent-monitor/internal/service"
)

func NewRouter(svc *service.EventService) http.Handler {
	mux := http.NewServeMux()

	mux.Handle("POST /api/hook", handler.Hook(svc))
	mux.Handle("GET /api/events", handler.Events(svc))
	mux.Handle("GET /api/events/stream", handler.EventsStream(svc))
	mux.Handle("GET /api/session-usage", handler.Usage())
	mux.Handle("/api/openai/", handler.OpenAIProxy())

	return cors(logging(mux))
}
```

- [ ] **Step 3: Verify build**

```bash
cd backend && go build ./internal/server/...
```

Expected: no output, exit 0.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/server/
git commit -m "feat(server): add router with CORS and logging middleware"
```

- [ ] **Step 5: Mark complete — update STATUS.md phase 9 to ✅**
