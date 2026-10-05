# UdyamSamadhaan — MSME Delayed Payment & Overdue Invoice Tracker

> **Statutory delayed payment protection & automatic compound interest calculator built for Indian Udyam-registered micro and small business suppliers under the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006.**

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm** or **yarn** / **pnpm**

### 2. Installation & Setup

```bash
# 1. Clone repository or navigate to workspace
cd "MSME PROJECT"

# 2. Install dependencies
npm install

# 3. Initialize the Prisma database (zero-config SQLite locally)
npx prisma generate
npx prisma db push

# 4. Seed the 5 sample invoices across all statutory lifecycle states
node prisma/seed.js

# 5. Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Demo Credentials

The database comes pre-seeded with a verified MSME supplier account:

| Field | Demo Credentials |
| :--- | :--- |
| **Email** | `demo@msme.in` |
| **Password** | `password123` |
| **Supplier Name** | Rajesh Sharma |
| **Business Name** | Apex Precision Engineering Works |
| **Udyam Number** | `UDYAM-MH-12-0049281` |

> 💡 *On the login screen, click the **"1-Click Demo Login (Rajesh Sharma)"** button for instant access.*

**Platform admin (local development only):** `admin@msme.in` / `password123`, role `ADMIN`. Use **"Admin Demo Login"** on the login screen, then **Tools → Admin: Buyer Risk** to see the cross-supplier buyer-risk view with every supplier's invoice numbers. The seed skips this account and the button is hidden when `NODE_ENV=production`, because its password is public.

---

## 📊 5 Seeded Sample Invoices & Lifecycle States

| # | Invoice # | Buyer / Debtor | Amount (₹) | Days Old / Terms | Color & Status | Section 16 Interest Owed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `INV-2024-001` | **Tata Projects Ltd** | ₹4,80,000 | 12 days / 45d | 🟢 **Green (Within Terms)** | ₹0.00 (33 days remaining) |
| **2** | `INV-2024-002` | **Godrej Consumer Products** | ₹2,15,000 | 41 days / 45d | 🟡 **Yellow (Due Soon)** | ₹0.00 (4 days remaining) |
| **3** | `INV-2024-003` | **Apex Infra Buildcon Pvt Ltd** | ₹8,50,000 | 65 days / 45d | 🔴 **Red (20d Overdue)** | **₹7,748.24** (Sec 16 Compounded) |
| **4** | `INV-2024-004` | **Bharat Heavy Logistics Corp** | ₹14,20,000 | 110 days / 45d | 🔴 **Red (65d Overdue - Samadhaan)** | **₹42,391.80** (High Compounding) |
| **5** | `INV-2024-005` | **Larsen Smart Power Grid** | ₹3,60,000 | 50 days / 45d | ⚪ **Paid (Settled)** | ₹0.00 (Paid via NEFT) |

---

## ⚖️ MSMED Act 2006 Statutory Rules & Interest Engine

The application implements the statutory provisions of the **Micro, Small and Medium Enterprises Development Act, 2006 (MSMED Act)**:

### 1. Section 15 (Mandatory 45-Day Cap)
- Payment period agreed upon between buyer and supplier **cannot exceed 45 days** from the date of acceptance of goods or services.
- If no agreement exists, payment must be made on or before the *appointed day* (15 days).

### 2. Section 16 (Compound Interest @ 3x RBI Bank Rate)
- Where a buyer fails to pay within terms, the buyer is **statutorily liable to pay compound interest with monthly rests** at **three times the RBI Bank Rate** (hardcoded at **16.5% annually**, i.e. 1.375% monthly).
- The statutory formula calculates:
  $$\text{Interest} = \text{Principal} \times \left( (1 + r_m)^m \times (1 + r_m \times \frac{d}{30}) - 1 \right)$$
  where $r_m = \frac{16.5\%}{12} = 0.01375$.

### 3. Section 23 (Tax Penalty on Buyer)
- Interest payable under Section 16 is strictly **disallowed as a tax-deductible expense** under the Income Tax Act, 1961.

---

## 📨 Escalating Reminder Tone Levels

When you click **"Send Reminder"**, the app dynamically selects an escalating tone template based on overdue age:

1. **Level 1: Friendly Courtesy (0–7 days overdue / due soon)**: Professional courtesy check-in with UTR inquiry.
2. **Level 2: Formal Payment Demand (8–15 days overdue)**: Formal accounts payable notice citing overdue invoice terms.
3. **Level 3: Statutory Demand Notice (16–30 days overdue)**: Formal statutory demand under Section 15 & 16 of the MSMED Act 2006, calculating exact penal interest and citing Section 23 tax penalties.
4. **Level 4: Pre-Samadhaan Facilitation Council Legal Warning (30+ days overdue)**: Final pre-litigation notice before formal referral to the Micro & Small Enterprises Facilitation Council (MSEFC) via the MSME Samadhaan portal.

---

## 🗄️ Database Architecture (Prisma Schema)

- **`User`**: MSME Supplier profile with business name, Udyam Registration number (`UDYAM-XX-00-0000000`), email, and hashed password.
- **`Invoice`**: Buyer information (Name, Email, Phone, GSTIN), invoice number, amount, invoice date, payment terms (max 45 days), status (`PENDING`, `PAID`, `OVERDUE`, `DISPUTED`), notes, and photo attachment URL.
- **`Reminder`**: Audit trail of every logged reminder with timestamp, channel (`WHATSAPP`, `EMAIL`, `SMS`), tone level, subject, and generated legal notice body.

---

## ☁️ Deploying to Vercel + Neon (PostgreSQL)

To deploy to production on Vercel with a Neon serverless PostgreSQL database:

1. Create a serverless PostgreSQL database on [Neon.tech](https://neon.tech).
2. In `prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set the following Environment Variables in your Vercel Project Settings:
   - `DATABASE_URL`: `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `NEXTAUTH_SECRET`: A secure 32+ character random string
   - `NEXTAUTH_URL`: `https://your-domain.vercel.app`
   - `NEXT_PUBLIC_MSME_INTEREST_RATE_ANNUAL`: `16.5`
4. Deploy with `vercel` or via Git push!

---

## 🔮 What's Stubbed for Later Phases (Roadmap)

As per the MVP scope, the following features are stubbed with clean UI/storage ready for subsequent development phases:

- 📷 **OCR Invoice Photo Extraction**: The photo upload button saves the attachment to storage. Automatic extraction of buyer name, GSTIN, amount, and date via Tesseract/Google Cloud Vision is scheduled for Phase 2.
- 📱 **Real WhatsApp / Email Delivery**: Reminders are logged to the database audit trail and support 1-click WhatsApp web handoff; direct API dispatch via Twilio / Meta Cloud WhatsApp API will be connected in Phase 2.
- 🔄 **Accounting Software Sync**: Bidirectional sync with Tally Prime and Zoho Books.
- ⚖️ **1-Click MSME Samadhaan Portal Filing**: Auto-generating MSEFC recovery petition PDF forms.
- 💳 **Integrated Payment Links**: UPI QR codes and payment gateways (Razorpay/Cashfree) embedded in reminder notices.
- 👥 **Multi-User Teams & CA Portal**: Multi-user permissions for accounts teams and Chartered Accountants.
