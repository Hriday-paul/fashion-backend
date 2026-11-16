# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Express 4 + TypeScript backend for a fashion marketplace (Prisma/PostgreSQL, Redis, BullMQ, Socket.IO).

- Architecture (process model, request lifecycle, jobs, flows): [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- File/module layout and conventions: [docs/STRUCTURE.md](docs/STRUCTURE.md)

## Commands

- `npm run dev` — nodemon on `src/server.ts`
- `npm run build` → `dist/`; `npm start` runs `dist/src/server.js`
- `npx prisma generate` — required after schema edits (client lives in `generated/prisma`, not `@prisma/client`)
- `npx prisma migrate dev` / `migrate deploy` / `db seed`
- `docker-compose up` — backend, Postgres, Redis, seed

No tests or linter are configured; verify changes with `npx tsc --noEmit`.

## Gotchas

- New modules must be registered in `src/routs.ts`.
- Workers run only if imported in `src/workers/index.ts` (`makeOrder` and `payment` workers currently aren't).
- Product caches are invalidated by bumping Redis version keys, not deleting keys.
- Socket.IO runs on a separate port (`SOCKET_PORT`).
