# Settlr / UdyamSamadhaan — Progress Tracker

Single source of truth for what's done, what's next, and what we've learned.
Update this file at the end of every work session (see `CLAUDE.md`).

**Health check:** `npm run check` (TypeScript + full test suite)

---

## Status snapshot — 2026-10-05

| Area | State |
| :--- | :--- |
| Type check (`tsc --noEmit`) | ✅ clean |
| Test suite (`npm test`) | ✅ 44 / 44 passing (was ❌ crashing before 2026-10-05) |
| Tests that exercise real `src/` code | ✅ 8 of 8 files; multi-tenant test calls real API routes on a throwaway `prisma/test.db` |
| Production build (`next build`) | ✅ clean, no warnings |
| Version control | ✅ git, `main` tracks github.com/jaypawar07/MSME |

---

## 🔴 Backlog — bugs & risks (fix first)

| # | Priority | Issue | Where |
| :- | :- | :- | :- |
| ~~B1~~ | ✅ fixed 2026-10-05 | Buyer-risk endpoint exposed other tenants' raw invoice numbers to any user. Role is now in the session; non-admins only see their own invoice numbers. | `src/app/api/admin/buyer-risk/route.ts`, `src/lib/auth.ts` |
| B1b | Medium (product/privacy) | Pooled buyer stats still show exact totals even when a buyer has only **one** supplier, which reveals that supplier's numbers. Decide on a minimum-suppliers threshold. | same |
| ~~B2~~ | ✅ fixed 2026-10-05 | Hard-coded `NEXTAUTH_SECRET` fallback, now dev-only. | `src/lib/auth.ts` |
| ~~B3~~ | ✅ fixed 2026-10-05 | Login revealed which emails exist, now one generic message. | `src/lib/auth.ts` |
| ~~B7~~ | ✅ fixed 2026-10-05 | `prisma/dev.db` and an uploaded invoice image were committed to the public repo. Untracked and gitignored (still in older history; demo data only). | repo |
| B8 | Low | `next dev` logs "Failed to patch lockfile … reading 'os'". Harmless; fix by reinstalling `next` / refreshing the lockfile. | `package-lock.json` |
| B9 | Low | No `ADMIN` user is seeded, so `/admin/buyer-risk` only shows the non-admin view locally. | `prisma/seed.js` |
| ~~B4~~ | ✅ fixed 2026-10-05 | 4 test files re-implemented logic instead of testing it. All now import real code. | `tests/` |
| B10 | **High (product)** | Settings are saved but **never used**: the Day 1/30/45/60 switches, quiet hours, WhatsApp/Email toggles (scheduler ignores them) and the custom interest rate (calculator hard-codes 16.5%). Users think they've changed behaviour when they haven't. | `src/lib/reminders/auto-scheduler.ts`, `src/lib/msme-calculator.ts` |
| B11 | Low (docs) | README's interest formula (whole months compounded + simple interest on leftover days) differs from the code (fractional-month compounding). Confirm which is legally correct, then align. | `README.md`, `src/lib/msme-calculator.ts` |
| B12 | Medium | Auto-scheduler always uses Email if the buyer has an email address, even if Email is disabled in Settings (part of B10). | `auto-scheduler.ts` |
| B5 | Low | `session.user as any` repeated in every route. Add a typed `next-auth.d.ts` module augmentation + a `requireUser()` helper. | `src/app/api/**` |
| B6 | Low | Node warns `MODULE_TYPELESS_PACKAGE_JSON` during tests (harmless, slower). | `package.json` / tests |

## 🟢 Feature roadmap (from README "Phase 2")

| # | Feature | Status |
| :- | :- | :- |
| F1 | OCR invoice extraction (buyer, GSTIN, amount, date) | 🟡 stub exists (`src/lib/ocr/invoice-ocr.ts`, `/api/ocr`) |
| F2 | Real WhatsApp / Email delivery (Meta Cloud API / SMTP) | 🟡 sender abstraction exists, mock only (`src/lib/notifications/`) |
| F3 | Scheduled auto-reminders (cron) | 🟡 scheduler logic fixed + tested; no cron trigger; ignores Settings (B10) |
| F4 | Tally Prime / Zoho Books sync | 🟡 CSV import only |
| F5 | MSME Samadhaan / MSEFC petition PDF | 🟡 dispute package HTML exists |
| F6 | UPI QR / payment links in reminders | ⬜ not started |
| F7 | Multi-user teams & CA portal | 🟡 `TeamMember` model + settings UI; members can't log in yet |

Legend: ⬜ not started · 🟡 partial · ✅ done

---

## 📒 Change log

### 2026-10-05
- **Fixed:** test suite crashed on start (`Cannot find package '@/lib'`). Node runs `.ts` directly but didn't understand the `@/*` tsconfig alias. Added `tests/alias-loader.mjs` and wired it into `npm test`.
- **Fixed:** type-only names were imported as values (e.g. `InvoiceCalculations`), which breaks Node type-stripping. Marked them `type` in `dispute-package-generator.ts`, `auto-scheduler.ts`, `LanguageContext.tsx`, `auth.ts`.
- **Added:** `npm run typecheck` and `npm run check`.
- **Added:** this tracker and `CLAUDE.md` working rules.
- **Audited:** invoice/reminder/dispute/financing routes correctly scope queries by `userId` ✅. Logged B1–B6.
- **Fixed (runtime crash):** generated Prisma client was stale. `CompanySettings`, `TeamMember`, `RateAuditLog`, `PilotSignup`, `AnalyticsEvent` were missing, so Settings, Team, Export, Account, Analytics and pilot signup APIs threw at runtime. `(prisma as any)` casts hid it from `tsc`. Regenerated the client, synced the local DB, and removed all 18 casts.
- **Fixed (security):** B1, B2, B3 (see backlog).
- **Verified:** `npm run check` green (27/27); smoke test on the dev server: bad email and bad password both return 401; demo login, `/api/settings`, `/api/admin/buyer-risk` and `/api/pilot/signup` succeed. Test rows deleted.
- **Repo:** `git init`, `origin` → github.com/jaypawar07/MSME (contents match local apart from today's edits). `.gitignore` = upstream file + DB/uploads rules.

### 2026-10-05 (session 2): tests now test the real code
- **Fixed (reminder bugs, found by new tests):** (1) every reached milestone fired at once, so an invoice imported 65 days overdue sent friendly + demand + 2 legal notices together; now only the latest milestone is sent and earlier ones are superseded. (2) "Day 15" in any reminder text counted as the Day 1 milestone (substring match); now word-boundary matched. (3) FAILED deliveries counted as sent and were never retried; now retried.
- **Fixed (permissions):** Accountants could edit company settings, although the Settings page says they can't. Roles now come from one matrix in `src/lib/settings/policy.ts`, used by the settings, team and account routes.
- **Fixed (validation):** settings API accepted any interest rate (negative, 500%) and any quiet-hours string. Now validated; the effective rate is always computed server-side (RBI rate × multiplier) and a client-sent value is ignored.
- **Fixed:** 14 more type-only imports across app/components. Enabled `verbatimModuleSyntax` in `tsconfig.json` so `tsc` now rejects this mistake automatically (it caught 4 my scan missed).
- **Fixed:** build log noise ("Dynamic server usage") by marking buyer-risk and export routes `force-dynamic`.
- **Tests:** rewrote calculator, scheduler, settings and multi-tenant tests to import real code (27 → 44 tests). Added `tests/setup.mjs` (forces `DATABASE_URL=file:./test.db` so tests can never touch dev data), `tests/helpers/test-db.mjs`, and next-auth stubs. Mutation-checked: removing the `userId` filter from `GET /api/invoices/[id]` makes the isolation test fail.
- **Verified:** `npm run check` 44/44, tests pass in UTC, Los Angeles, Kolkata and UTC+14 timezones, `next build` clean, dev-server smoke test of settings validation (negative rate → 400, bad time → 400, forged 99% rate → stored 16.5%).

---

## 🧠 Lessons learned (mistakes → rules)

Each time a mistake is found, add a line here so it isn't repeated.

1. **Use `import type` / `type X` for type-only imports.** Node's type-stripping (used by our tests) can't tell types from values otherwise. *(2026-10-05)*
2. **A green test that tests a copy of the code proves nothing.** New tests must import from `../src/...`. *(2026-10-05)*
3. **Run `npm run check` before calling any task done.** The suite was silently broken. *(2026-10-05)*
4. **Never cast `prisma as any`.** If a model "doesn't exist", run `npx prisma generate`. The cast hid five crashing features. *(2026-10-05)*
5. **After editing `schema.prisma`, run `npx prisma generate && npx prisma db push`.** *(2026-10-05)*
6. **Check who calls an endpoint before restricting it.** `/api/admin/buyer-risk` is also used by the dashboard's `BuyerRiskModal`. *(2026-10-05)*
7. **Write the failing test first, against the real code.** All three reminder bugs were invisible until a test called the real `auto-scheduler.ts`. *(2026-10-05)*
8. **Prove a security test can fail.** Temporarily break the guarded code (mutation check) and confirm the test goes red. *(2026-10-05)*
9. **Dates in tests: don't mix UTC instants with local-date strings.** That fails in timezones west of UTC. Run date tests with `TZ=America/Los_Angeles` too. *(2026-10-05)*
10. **When code and UI text disagree, the documented rule wins unless told otherwise.** The settings route let Accountants edit settings although the UI says they can't. *(2026-10-05)*
11. **The test loader must only rewrite imports from our own files, never `node_modules`.** *(2026-10-05)*
