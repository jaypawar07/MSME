# Settlr Production Deployment Guide
## Vercel + Managed PostgreSQL (Neon / Supabase)

This guide provides step-by-step instructions for deploying **Settlr** (MSME Delayed Payment & Section 16 Statutory Interest Tracker) to Vercel with a managed cloud PostgreSQL database for real pilot users.

---

## 1. Architecture Overview

```mermaid
graph TD
    Client["Browser / Mobile Client (English & Hindi)"] --> VercelEdge["Vercel Edge Network (Next.js 14 App Router)"]
    VercelEdge --> AuthAPI["NextAuth.js Session & Multi-Tenant Isolation"]
    VercelEdge --> InvoicesAPI["REST / PDF / OCR API Routes"]
    VercelEdge --> CronScheduler["Vercel Cron (Daily 09:00 IST Overdue Check)"]
    
    AuthAPI --> NeonDB[("Managed PostgreSQL (Neon / Supabase) via Prisma ORM")]
    InvoicesAPI --> NeonDB
    InvoicesAPI --> VisionLLM["Google Gemini / OpenAI Vision (AI OCR)"]
    InvoicesAPI --> NotificationEngine["Resend API / SMTP (Payment Reminders)"]
    InvoicesAPI --> AnalyticsEngine["PostHog / Self-Hosted DB Telemetry"]
```

---

## 2. Environment Variables & API Keys Reference

Set the following environment variables in your Vercel Project Settings (**Settings > Environment Variables**):

| Variable Name | Required | Example / Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@ep-cool-frost-123456.ap-southeast-1.aws.neon.tech/settlr?sslmode=require` |
| `NEXTAUTH_SECRET` | **Yes** | Generate via `openssl rand -base64 32` |
| `NEXTAUTH_URL` | **Yes** | `https://your-settlr-domain.vercel.app` (or custom domain) |
| `CRON_SECRET` | **Yes** | Secret token securing `/api/cron/reminders` against unauthorized trigger |
| `RESEND_API_KEY` | Optional | `re_123456789...` (For transactional email reminders via Resend) |
| `EMAIL_FROM` | Optional | `Settlr Notices <notifications@your-domain.in>` |
| `SMTP_HOST` | Optional | `smtp.sendgrid.net` or `smtp.gmail.com` |
| `SMTP_PORT` | Optional | `587` |
| `SMTP_USER` | Optional | `apikey` |
| `SMTP_PASS` | Optional | `your_smtp_password` |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` (For AI OCR invoice parsing via Google Gemini 1.5 Flash) |
| `OPENAI_API_KEY` | Optional | `sk-...` (Alternative fallback for OCR vision extraction) |
| `NEXT_PUBLIC_POSTHOG_KEY`| Optional | `phc_...` (PostHog client analytics key) |
| `NEXT_PUBLIC_POSTHOG_HOST`| Optional | `https://app.posthog.com` |

---

## 3. Step-by-Step Deployment Instructions

### Step 3.1: Provision Managed PostgreSQL (Neon / Supabase)
1. Create a free/production database at [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Choose the **AWS Mumbai (`ap-south-1`)** region for lowest latency to Indian MSME users.
3. Copy the pooled connection string:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   ```

### Step 3.2: Configure Prisma for PostgreSQL
In `prisma/schema.prisma`, update the datasource provider when deploying to PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Run migration to build the cloud database tables:
```bash
npx prisma migrate deploy
# or push schema
npx prisma db push
```

### Step 3.3: Link Repository to Vercel
1. Push your code to GitHub / GitLab.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
3. Select your repository.
4. Set **Framework Preset** to `Next.js`.
5. Under **Environment Variables**, paste all the variables from Section 2.
6. Under **Build & Development Settings**:
   - Build Command: `npx prisma generate && next build`
   - Install Command: `npm install`
7. Click **Deploy**.

---

## 4. Automated Daily Reminders (Vercel Cron Setup)

The repository includes a configured cron endpoint at `/api/cron/reminders` which automatically evaluates all invoices for pilot users every morning and schedules escalation reminders for Days 1, 30, 45, and 60.

In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "30 3 * * *"
    }
  ]
}
```
*(Runs daily at 03:30 UTC = 09:00 AM IST on Vercel Pro. On the Hobby plan Vercel only guarantees the hour, so it runs between 08:30 and 09:29 IST. Settings therefore rejects quiet hours that overlap 08:30–09:30 IST.)*

To secure this endpoint, Vercel automatically passes `Authorization: Bearer <CRON_SECRET>` in the header. If `CRON_SECRET` is not set, the endpoint returns `503` and sends nothing; a wrong or missing token returns `401`.

Each run honours every supplier's Settings (Day 1/30/45/60 switches, quiet hours in IST, Email/WhatsApp toggles, interest rate). The response contains counts only, never buyer contact details. To trigger a run manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-settlr-domain.vercel.app/api/cron/reminders
```

---

## 5. Multi-Tenant Isolation & Security Checklist

Settlr enforces strict multi-tenant data boundaries at the API layer:
1. **User Identity Boundary**: Every database query for invoices, reminders, dispute packages, CSV imports, and financing leads includes `where: { userId: session.user.id }`.
2. **Access Control Verification**: Automated tests in `tests/multi-tenant-isolation.test.mjs` verify that Supplier A can never view, update, delete, or generate dispute packages for Supplier B's invoices.
3. **Password Security**: Passwords are hashed using bcrypt with salt rounds of 10.
4. **Statutory Integrity**: Section 16 interest calculations are computed in pure TypeScript based on the MSMED Act 2006 (16.5% compound monthly rests).

---

## 6. Pilot Launch & Verification Checklist

Before onboarding your first 5–10 pilot business owners:
- [ ] Run test suite: `node --test tests/run-all-tests.mjs` (All tests must pass).
- [ ] Verify Hindi (`hi`) and English (`en`) toggles on dashboard and reminder modals.
- [ ] Submit a test invoice and verify calculation of Section 16 interest.
- [ ] Verify PDF generation: Click **Generate Dispute Package** on an overdue invoice.
- [ ] Verify Pilot Landing Page at `/landing` and test "Join the pilot" signup form.
- [ ] Monitor pilot events in `/api/analytics/events` or PostHog dashboard.
