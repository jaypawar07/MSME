# Settlr / UdyamSamadhaan — Progress Tracker

Single source of truth for what's done, what's next, and what we've learned.
Update this file at the end of every work session (see `CLAUDE.md`).

**Health check:** `npm run check` (TypeScript + full test suite)

---

## Status snapshot — 2026-10-05

| Area | State |
| :--- | :--- |
| Type check (`tsc --noEmit`) | ✅ clean |
| Test suite (`npm test`) | ✅ 27 / 27 passing (was ❌ crashing before 2026-10-05) |
| Tests that exercise real `src/` code | ⚠️ 4 of 8 files (other 4 test copied logic) |
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
| B4 | Medium (quality) | 4 test files re-implement logic instead of importing it, so they can pass while real code is broken: `msme-calculator`, `multi-tenant-isolation`, `reminder-scheduler`, `settings-and-roles`. | `tests/` |
| B5 | Low | `session.user as any` repeated in every route. Add a typed `next-auth.d.ts` module augmentation + a `requireUser()` helper. | `src/app/api/**` |
| B6 | Low | Node warns `MODULE_TYPELESS_PACKAGE_JSON` during tests (harmless, slower). | `package.json` / tests |

## 🟢 Feature roadmap (from README "Phase 2")

| # | Feature | Status |
| :- | :- | :- |
| F1 | OCR invoice extraction (buyer, GSTIN, amount, date) | 🟡 stub exists (`src/lib/ocr/invoice-ocr.ts`, `/api/ocr`) |
| F2 | Real WhatsApp / Email delivery (Meta Cloud API / SMTP) | 🟡 sender abstraction exists, mock only (`src/lib/notifications/`) |
| F3 | Scheduled auto-reminders (cron) | 🟡 scheduler logic + `/api/reminders/auto-schedule`, no cron trigger |
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

---

## 🧠 Lessons learned (mistakes → rules)

Each time a mistake is found, add a line here so it isn't repeated.

1. **Use `import type` / `type X` for type-only imports.** Node's type-stripping (used by our tests) can't tell types from values otherwise. *(2026-10-05)*
2. **A green test that tests a copy of the code proves nothing.** New tests must import from `../src/...`. *(2026-10-05)*
3. **Run `npm run check` before calling any task done.** The suite was silently broken. *(2026-10-05)*
4. **Never cast `prisma as any`.** If a model "doesn't exist", run `npx prisma generate`. The cast hid five crashing features. *(2026-10-05)*
5. **After editing `schema.prisma`, run `npx prisma generate && npx prisma db push`.** *(2026-10-05)*
6. **Check who calls an endpoint before restricting it.** `/api/admin/buyer-risk` is also used by the dashboard's `BuyerRiskModal`. *(2026-10-05)*
