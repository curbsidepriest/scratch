# Scratch

A writing tool that helps you think, and never writes for you. See
[`docs/spec.md`](docs/spec.md) for the full product spec and the non-negotiable
invariants (§9).

## Stack

- **Next.js 16** (App Router) + **TypeScript** — one codebase, one dev command
- **Prisma 7** + **SQLite** (via the `better-sqlite3` driver adapter) — real
  schema, real migrations
- Route Handlers under `src/app/api/*` for the backend

All LLM behaviour will live behind a swappable service interface (stubbed for
v1); no code path can generate pasteable prose.

## Getting started

```bash
npm install            # also runs `prisma generate` via postinstall
npx prisma migrate dev # create the local dev.db from migrations
npm run db:seed        # seed a handful of fake snippets
npm run dev            # http://localhost:3000
```

## Scripts

- `npm run dev` / `build` / `start` — Next.js
- `npm run db:seed` — seed fake snippets (no-op if snippets already exist)
- `npm run db:reset` — drop, re-migrate, and re-seed the local db
- `npm run db:studio` — open Prisma Studio
- `npm run shots` — Playwright visual + behavioral checks (needs `npm run dev`
  running); writes images to `screenshots/` (gitignored)
- `npm run ranker:check` — deterministic Ranker-stub checks (shape + rarity)
- `npm run promote:check` / `npm run modes:check` — Playwright checks for the
  promotion flow and the three project modes (need `npm run dev` + a fresh spark)
- `npm run sparks:clear` — clear derived through-lines (not snippets), for a
  clean spark demo

## Notes / v1 decisions

- **SQLite has no enums**, so `sourceMode`, `origin`, `status`, and `kind` are
  `String` columns with allowed values defined in `src/lib/domain.ts` and
  enforced at the API boundary. They can become real Prisma enums on a future
  Postgres migration.
- **The local `dev.db` is gitignored**; recreate it with `migrate dev` + seed.
- **Snippets are never deleted** — the snippets API has no DELETE handler by
  design (spec §9.2).

## Build status

- [x] Phase 1 — backend, DB schema + migration, seed, snippets API
- [x] Phase 2 — Scratchpad home surface
- [x] Phase 3 — Timed Dump mode
- [x] Phase 4 — Ranker stub (the "spark")
- [x] Phase 5 — Promotion → Project
- [x] Phase 6 — Project modes (Filter / Architect / Editor)
