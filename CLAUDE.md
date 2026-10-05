# Settlr / UdyamSamadhaan — working notes for Claude

MSME delayed-payment tracker for Indian suppliers (MSMED Act 2006, Sec 15/16/18).
Next.js 14 App Router · Prisma (SQLite locally, Postgres in prod) · NextAuth (JWT, credentials) · Tailwind.

## Commands
- `npm run dev`: dev server on http://localhost:3000 (demo login: see README)
- `npm run check`: **type check + all tests. Must pass before any task is called done.**
- `npm test`: tests only. Node `node:test` runs `.ts` from `src/` directly. `tests/setup.mjs` forces `DATABASE_URL=file:./test.db` (never dev data) and loads `tests/alias-loader.mjs` (`@/` alias + `next-auth` stubs).
  - Route tests: `setTestSession({ user: { id, role } })` from `tests/stubs/next-auth.mjs`, `resetTestDatabase()` from `tests/helpers/test-db.mjs`, then call the exported `GET`/`POST` handlers directly. See `tests/multi-tenant-isolation.test.mjs`.
- `npx prisma db push && node prisma/seed.js`: reset local DB schema / seed data

## Workflow (every session)
1. Read `PROGRESS.md` first: backlog, roadmap, and lessons learned.
2. Run `npm run check` to confirm the baseline before changing anything.
3. Make the change. Add or extend a test that **imports the real code from `../src/`**.
4. Run `npm run check` again. If it fails, fix it; don't report success.
5. Update `PROGRESS.md`: change-log entry, roadmap/backlog status, and a "Lessons learned" line for any mistake found (yours or pre-existing).

## Conventions
- Import types with `import type` / `{ type X }`. Required for Node type-stripping in tests.
- Use the `@/` alias for `src/` imports.
- Every API route: `getServerSession(authOptions)` → 401 if missing, and scope every Prisma query by `userId` (multi-tenant isolation).
- Never write `(prisma as any)`. After schema changes run `npx prisma generate && npx prisma db push`.
- Session user carries `id`, `businessName`, `udyamNumber`, `role` (`OWNER`/`ACCOUNTANT`/`STAFF`/`ADMIN`).
- Interest math lives only in `src/lib/msme-calculator.ts`. Don't duplicate it.
