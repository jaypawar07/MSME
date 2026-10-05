# Settlr / UdyamSamadhaan — Progress Tracker

Single source of truth for what's done, what's next, and what we've learned.
Update this file at the end of every work session (see `CLAUDE.md`).

**Health check:** `npm run check` (TypeScript + full test suite)

---

## Status snapshot — 2026-10-05

| Area | State |
| :--- | :--- |
| Type check (`tsc --noEmit`) | ✅ clean |
| Test suite (`npm test`) | ✅ 67 / 67 passing (was ❌ crashing before 2026-10-05) |
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
| B10a | ✅ fixed 2026-10-05 | Auto-reminders ignored Settings. Now follow the Day 1/30/45/60 switches, quiet hours (India time) and the Email/WhatsApp toggles. | `auto-scheduler.ts` |
| ~~B10b~~ | ✅ fixed 2026-10-05 | Custom interest rate was ignored. Now drives the calculation **and** every quoted rate: dashboard, reminder notices (EN/HI), notification email, dispute package, data export. | see change log |
| B14 | **Watch (legal)** | RBI policy decision due **7 Oct 2026**. Bank Rate is 5.50% today (so 16.5% is correct). If it changes, suppliers must update Settings; the explanatory copy (banner, onboarding, landing, page meta) still says "currently 16.5%". Consider an admin-level default instead of per-supplier entry. | `MSMEDSection16Banner.tsx`, `OnboardingGuideModal.tsx`, landing |
| B15 | Medium (legal, needs CA/lawyer) | When the RBI rate changes mid-delay, the app applies today's rate to the whole period. Should earlier months use the rate in force then? `RateAuditLog` already stores history if needed. | `msme-calculator.ts` |
| B16 | Low | Shared buyer-risk view (admin page + dashboard modal) computes all suppliers at the statutory 16.5% default; correct for comparison, but differs from a supplier's own custom rate. | `buyer-risk-aggregator.ts` |
| B11 | Low (docs) | README's interest formula (whole months compounded + simple interest on leftover days) differs from the code (fractional-month compounding). Confirm which is legally correct, then align. | `README.md`, `src/lib/msme-calculator.ts` |
| ~~B12~~ | ✅ fixed 2026-10-05 | Scheduler used Email even when disabled, and sent to a made-up `accounts@buyer.com` when the buyer had no contact. Now skips with a reason shown in the widget. | `auto-scheduler.ts` |
| B13 | Low | Manual "Send Reminder" doesn't check quiet hours (deliberate for now: it's an explicit user action). Revisit when real WhatsApp sending is live. | `api/invoices/[id]/reminders` |
| B5 | Low | `session.user as any` repeated in every route. Add a typed `next-auth.d.ts` module augmentation + a `requireUser()` helper. | `src/app/api/**` |
| B6 | Low | Node warns `MODULE_TYPELESS_PACKAGE_JSON` during tests (harmless, slower). | `package.json` / tests |

## 🟢 Feature roadmap (from README "Phase 2")

| # | Feature | Status |
| :- | :- | :- |
| F1 | OCR invoice extraction (buyer, GSTIN, amount, date) | 🟡 stub exists (`src/lib/ocr/invoice-ocr.ts`, `/api/ocr`) |
| F2 | Real WhatsApp / Email delivery (Meta Cloud API / Resend) | 🟡 implemented in `src/lib/notifications/`, active only when `RESEND_API_KEY` / `WHATSAPP_*` env vars are set; untested against the real APIs |
| F3 | Scheduled auto-reminders (cron) | 🟡 scheduler fixed, honours Settings, tested end-to-end on test DB; **no cron trigger yet** (runs only via the widget's button) |
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

### 2026-10-05 (session 3): Settings now control automatic reminders
- **Feature:** auto-reminders honour Company Settings: Day 1/30/45/60 switches (latest *enabled* milestone is used), quiet hours (in IST, held back and sent on the first run after), and Email/WhatsApp toggles (Email first, WhatsApp fallback).
- **Fixed:** never sends to a made-up `accounts@buyer.com` when the buyer has no contact; skipped invoices are reported with a reason in the widget message.
- **Safety:** `tests/setup.mjs` strips email/WhatsApp API keys; the runner test asserts they're absent so tests can never message a real buyer. DB test files scope their hooks with `describe()` so resets can't collide.
- **Tests:** 44 → 56. New `tests/auto-reminder-runner.test.mjs` runs the real scheduler on the test DB. Mutation-checked: disabling the quiet-hours check or the milestone switches turns tests red.
- **Verified:** `npm run check` 56/56, `next build` compiles. No dev-server run, to avoid creating reminder rows in the dev DB (covered by the runner test).

### 2026-10-05 (session 4): supplier's interest rate used everywhere
- **Checked:** RBI Bank Rate is 5.50% (= MSF; repo 5.25%), so the 16.5% default is correct today. My assumption that the app used the repo rate was wrong. Next RBI decision 7 Oct 2026 (B14).
- **Feature:** `calculateMSMEInterest` takes the supplier's rate; `getSupplierInterestRate(userId)` reads it from Settings. Wired into auto-reminders, manual reminders, dispute package, data export, and the invoices API (dashboard). Notices, email, dispute package and dashboard labels quote `formatRate(calcs.interestRateAnnual)`, the same number that produced the amount.
- **Fixed:** data export read the custom rate but never used it. Manual "Send Reminder" sent to a placeholder `contact@example.com` when the buyer had no contact; now returns 400 with a clear message.
- **Tests:** 56 → 67 (`interest-rate.test.mjs`, `interest-rate-routes.test.mjs`). A supplier at 18% gets 18% in the notice subject/body and dispute filing, with no "16.5" anywhere. Mutation-checked three ways (scheduler, template, dispute route).
- **Verified in browser:** dashboard renders the rate labels in English and Hindi, no console errors. Added `.claude/launch.json` (session root) for `npm run dev` previews.

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
12. **If the explanation of *why* something was skipped needs re-running the logic with tweaked inputs, restructure instead.** Pull out the question ("which milestone is due?") as its own function. *(2026-10-05)*
13. **A test that passes on the first run hasn't proven anything yet.** Mutate the code and watch it fail. *(2026-10-05)*
14. **Tests must not be able to reach real external services.** Strip API keys in setup and assert they're absent. *(2026-10-05)*
15. **Check a legal or financial "fact" before acting on it.** I suspected 16.5% was wrong (repo vs Bank Rate). A 1-minute search showed it was right. *(2026-10-05)*
16. **A quoted rate and the amount computed from it must come from the same variable.** Never print a literal rate next to a computed amount. *(2026-10-05)*
17. **A variable that is read but never used is a bug signal.** `annualRate` in the export route was exactly that. *(2026-10-05)*
