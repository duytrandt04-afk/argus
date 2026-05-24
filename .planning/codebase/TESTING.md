# Testing Patterns

**Analysis Date:** 2026-05-24

## Test Framework

**Runner:**
- Frontend: `vitest` (configured in `frontend/vite.config.ts` under `test`).
- Backend: Go `testing` package (no separate runner config file detected).
- Config: `frontend/vite.config.ts` (`environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`, include `tests/**/*.{test,spec}.{ts,tsx}`).

**Assertion Library:**
- Frontend: Vitest `expect` with `@testing-library/jest-dom/vitest` (`frontend/src/test/setup.ts`).
- Backend: standard `testing` assertions via `t.Fatalf`, `t.Errorf`.

**Run Commands:**
```bash
cd frontend && pnpm test                    # Run frontend tests
cd frontend && pnpm test -- --watch         # Watch mode (Vitest CLI flag)
cd backend && go test ./...                 # Run backend tests
```

## Test File Organization

**Location:**
- Frontend tests are in a dedicated `frontend/tests/` tree by feature (`frontend/tests/features/events`, `frontend/tests/features/sessions`).
- Backend tests are in `backend/tests/internal/...`, mirroring implementation package layout.

**Naming:**
- Frontend: `*.test.ts` / `*.test.tsx` (for example `frontend/tests/features/events/useEvents.test.tsx`).
- Backend: `*_test.go` (for example `backend/tests/internal/repository/sqlite/sqlite_test.go`).

**Structure:**
```text
frontend/tests/<area>/<feature>.test.ts[x]
backend/tests/internal/<package>/<name>_test.go
```

## Test Structure

**Suite Organization:**
```typescript
describe('useEvents', () => {
  beforeEach(() => { /* reset globals/mocks */ })
  afterEach(() => { /* cleanup */ })

  it('opens session-scoped EventSource url when session query exists', async () => {
    // arrange
    // act
    // assert
  })
})
```

**Patterns:**
- Setup pattern: initialize globals and reset mocks in `beforeEach` (`frontend/tests/features/events/useEvents.test.tsx`, `frontend/src/test/setup.ts`).
- Teardown pattern: `afterEach(cleanup)` for React Testing Library and `vi.clearAllMocks()` where needed.
- Assertion pattern: DOM queries (`screen.getByRole`, `findByText`) plus async waits (`waitFor`) in frontend; direct value/time/concurrency assertions in backend (`backend/tests/internal/repository/sqlite/sqlite_test.go`).

## Mocking

**Framework:** Vitest mocks/spies (`vi.mock`, `vi.fn`, `vi.stubGlobal`) and Go manual fakes/real in-memory DB.

**Patterns:**
```typescript
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) }))
vi.mock('react-router-dom', async () => ({ ...actual, useSearchParams: () => [searchParams, vi.fn()] }))
```

**What to Mock:**
- Browser/runtime APIs in frontend: `fetch`, `EventSource`, `matchMedia`, `requestAnimationFrame`, `react-router-dom` (`frontend/tests/features/events/useEvents.test.tsx`, `frontend/src/test/setup.ts`).
- UI library internals when isolating page behavior (`react-resizable-panels` in `frontend/tests/features/sessions/project-session-traces.test.tsx`).

**What NOT to Mock:**
- Backend persistence behavior is primarily validated with real SQLite instances (`sqlite.New(":memory:")` / temp DB in `backend/tests/internal/repository/sqlite/sqlite_test.go`), not a mocked repository layer.

## Fixtures and Factories

**Test Data:**
```typescript
const event: EventRecord = {
  time: '2026-05-14T10:00:00Z',
  action: 'READ',
  path: '/tmp/a',
  session: 'sess',
}
```

**Location:**
- Inline fixture objects inside each test file.
- Backend helper constructors/factories inside test files (`newTestDB`, `addEvent`, `addSessionAt` in `backend/tests/internal/repository/sqlite/sqlite_test.go`).

## Coverage

**Requirements:** No explicit coverage threshold config detected.

**View Coverage:**
```bash
cd frontend && pnpm test -- --coverage
cd backend && go test ./... -cover
```

## Test Types

**Unit Tests:**
- Frontend utilities/hooks/components tested in isolation (`frontend/tests/features/dashboard/date-range.test.ts`, `frontend/tests/features/events/useEventFilters.test.ts`).

**Integration Tests:**
- Frontend page-level tests integrating router + fetch + component tree (`frontend/tests/features/sessions/project-session-traces.test.tsx`).
- Backend repository/service tests against live SQLite behavior, locking, and time logic (`backend/tests/internal/repository/sqlite/sqlite_test.go`).

**E2E Tests:**
- Not detected.

## Common Patterns

**Async Testing:**
```typescript
renderHook(() => useEvents())
await waitFor(() => expect(latestES.url).toBe('/api/events/stream?session=sess-1'))
```

**Error Testing:**
```go
if err == nil {
    t.Fatal("Add succeeded while a write lock was held, want lock error")
}
```

---

*Testing analysis: 2026-05-24*
