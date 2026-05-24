# Technology Stack

**Analysis Date:** 2026-05-24

## Languages

**Primary:**
- Go 1.25.0 - Backend API, ingestion, storage, and embedded UI serving in `backend/`
- TypeScript 6.0.2 - Frontend application and tests in `frontend/src/` and `frontend/tests/`

**Secondary:**
- SQL (SQLite migrations) - Schema and evolution in `backend/internal/repository/sqlite/migrations/`
- CSS - Styling in `frontend/src/index.css` and `frontend/src/styles/app.css`

## Runtime

**Environment:**
- Go toolchain 1.25.0 (`backend/go.mod`)
- Node.js 18+ (`README.md` requirements)

**Package Manager:**
- pnpm 10.23.0 (`frontend/package.json`)
- Lockfile: present (`frontend/pnpm-lock.yaml`)

## Frameworks

**Core:**
- React 19.2.5 - UI runtime (`frontend/package.json`)
- React Router DOM 7.14.2 - Client routing (`frontend/package.json`, `frontend/src/main.tsx`)
- Vite 8.0.10 - Frontend dev/build tooling (`frontend/package.json`, `frontend/vite.config.ts`)
- Go stdlib `net/http` - Backend HTTP server/router (`backend/internal/server/router.go`)

**Testing:**
- Vitest 4.1.5 - Frontend tests (`frontend/package.json`, `frontend/vite.config.ts`)
- Testing Library (`@testing-library/react`, `@testing-library/jest-dom`) - React component tests (`frontend/package.json`)
- Go `testing` package - Backend tests in `backend/tests/`

**Build/Dev:**
- TypeScript compiler (`tsc -b`) - Type/build checks (`frontend/package.json`)
- ESLint 10 + typescript-eslint - Linting (`frontend/eslint.config.js`)
- Prettier 3.8.3 - Formatting (`frontend/package.json`)

## Key Dependencies

**Critical:**
- `modernc.org/sqlite` v1.50.0 - Embedded SQLite driver for backend persistence (`backend/go.mod`, `backend/internal/repository/sqlite/sqlite.go`)
- `react` / `react-dom` v19.2.5 - UI rendering (`frontend/package.json`)
- `react-router-dom` v7.14.2 - App navigation (`frontend/package.json`)

**Infrastructure:**
- `@vitejs/plugin-react` v6.0.1 - React transform pipeline (`frontend/package.json`, `frontend/vite.config.ts`)
- `@tailwindcss/vite` v4.2.4 + `tailwindcss` v4.2.4 - Styling pipeline (`frontend/package.json`, `frontend/vite.config.ts`)
- `radix-ui`, `shadcn`, `lucide-react` - Component primitives and icon system (`frontend/package.json`, `frontend/components.json`)

## Configuration

**Environment:**
- Backend runtime config via env vars `ADDR` and `DB_PATH` (`backend/internal/config/config.go`)
- Frontend uses Vite dev server proxy to backend (`frontend/vite.config.ts`)
- `.env*` files: Not detected in repository scan

**Build:**
- Frontend: `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/eslint.config.js`
- Backend build/runtime: `backend/go.mod`, `Dockerfile`, `docker-compose.yml`, `Makefile`

## Platform Requirements

**Development:**
- Go 1.25.0+, Node.js 18+, pnpm 10.x, curl (`README.md`)
- macOS/Linux/WSL preferred (`README.md`)

**Production:**
- Local-first single-binary backend serving API + UI on `127.0.0.1:8765` (`README.md`, `backend/cmd/server/main.go`)
- Optional container runtime via `Dockerfile` + `docker-compose.yml`

---

*Stack analysis: 2026-05-24*
