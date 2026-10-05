const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding MSME Tracker Database...");

  // Clean existing data for clean idempotent seed
  await prisma.reminder.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Demo MSME Supplier
  const user = await prisma.user.create({
    data: {
      email: "demo@msme.in",
      passwordHash,
      name: "Rajesh Sharma",
      businessName: "Apex Precision Engineering Works",
      udyamNumber: "UDYAM-MH-12-0049281",
      phone: "+91 98201 54321",
    },
  });

  console.log(`Created MSME Supplier: ${user.name} (${user.email})`);

  const now = new Date();
  
  // Helper to subtract days
  const subDays = (d, days) => {
    const result = new Date(d);
    result.setDate(result.getDate() - days);
    return result;
  };

  // 5 Sample Invoices representing distinct lifecycle & MSMED statutory delay states:

  // 1. WITHIN TERMS (Green) - 12 days old, 33 days left out of 45-day MSME window
  const inv1 = await prisma.invoice.create({
    data: {
      userId: user.id,
      buyerName: "Tata Projects Infrastructure Ltd",
      buyerEmail: "procurement@tataprojects.demo",
      buyerPhone: "+91 98200 11001",
      buyerGstin: "27AAACT2727Q1ZB",
      invoiceNumber: "INV-2024-001",
      amount: 480000,
      invoiceDate: subDays(now, 12),
      paymentTermsDays: 45,
      status: "PENDING",
      notes: "High-precision CNC milled turbine parts batch #4. Dispatched via VRL Logistics.",
    },
  });

  // 2. DUE SOON (Yellow) - 41 days old, 4 days remaining before MSMED 45-day threshold
  const inv2 = await prisma.invoice.create({
    data: {
      userId: user.id,
      buyerName: "Godrej Consumer Products Ltd",
      buyerEmail: "vendor.desk@godrej.demo",
      buyerPhone: "+91 98200 22002",
      buyerGstin: "27AAACG0532M1ZA",
      invoiceNumber: "INV-2024-002",
      amount: 215000,
      invoiceDate: subDays(now, 41),
      paymentTermsDays: 45,
      status: "PENDING",
      notes: "Custom corrugated packaging cartons (5,000 units). Inspection passed.",
    },
  });

  // 3. OVERDUE (Red) - 65 days old -> 20 days overdue under Section 15
  // Accruing Section 16 MSMED compound interest @ 16.5% p.a.
  const inv3 = await prisma.invoice.create({
    data: {
      userId: user.id,
      buyerName: "Apex Infra Buildcon Pvt Ltd",
      buyerEmail: "finance@apexbuildcon.demo",
      buyerPhone: "+91 98200 33003",
      buyerGstin: "27AABCA9921K1ZZ",
      invoiceNumber: "INV-2024-003",
      amount: 850000,
      invoiceDate: subDays(now, 65),
      paymentTermsDays: 45,
      status: "OVERDUE",
      notes: "Fabricated structural steel girders for flyover pier section 7.",
      reminders: {
        create: [
          {
            buyerName: "Apex Infra Buildcon Pvt Ltd",
            buyerContact: "finance@apexbuildcon.demo",
            channel: "EMAIL",
            tone: "FORMAL",
            subject: "OVERDUE NOTICE: Invoice #INV-2024-003 - Payment Required",
            message: "Formal notice regarding overdue payment for Invoice #INV-2024-003 past the 45-day statutory window.",
            status: "MOCK_SENT",
            sentAt: subDays(now, 10),
          },
        ],
      },
    },
  });

  // 4. HEAVILY OVERDUE (Red - Samadhaan Referral Candidate) - 110 days old -> 65 days overdue
  // Accruing substantial 16.5% monthly compound interest under Section 16
  const inv4 = await prisma.invoice.create({
    data: {
      userId: user.id,
      buyerName: "Bharat Heavy Logistics Corp",
      buyerEmail: "accounts.payable@bharatlogistics.demo",
      buyerPhone: "+91 98200 44004",
      buyerGstin: "27AAACB1122D1ZC",
      invoiceNumber: "INV-2024-004",
      amount: 1420000,
      invoiceDate: subDays(now, 110),
      paymentTermsDays: 45,
      status: "OVERDUE",
      notes: "Industrial hydraulic valves & pressure gauges. Accepted on delivery without dispute.",
      reminders: {
        create: [
          {
            buyerName: "Bharat Heavy Logistics Corp",
            buyerContact: "accounts.payable@bharatlogistics.demo",
            channel: "WHATSAPP",
            tone: "FORMAL",
            subject: "Follow-up Invoice #INV-2024-004",
            message: "Reminder regarding overdue payment of Rs. 14,20,000.",
            status: "MOCK_SENT",
            sentAt: subDays(now, 45),
          },
          {
            buyerName: "Bharat Heavy Logistics Corp",
            buyerContact: "accounts.payable@bharatlogistics.demo",
            channel: "EMAIL",
            tone: "URGENT_MSMED",
            subject: "DEMAND NOTICE under MSMED Act 2006: Invoice #INV-2024-004 Accruing 16.5% Penal Interest",
            message: "Statutory demand notice under Section 15 & 16 of MSMED Act 2006 citing 3x RBI bank rate compound interest.",
            status: "MOCK_SENT",
            sentAt: subDays(now, 15),
          },
        ],
      },
    },
  });

  // 5. PAID (Emerald / Neutral) - 50 days old, paid within terms
  const inv5 = await prisma.invoice.create({
    data: {
      userId: user.id,
      buyerName: "Larsen Smart Power Grid Solutions",
      buyerEmail: "accounts@larsensmart.demo",
      buyerPhone: "+91 98200 55005",
      buyerGstin: "27AABCL8811P1ZQ",
      invoiceNumber: "INV-2024-005",
      amount: 360000,
      invoiceDate: subDays(now, 50),
      paymentTermsDays: 45,
      status: "PAID",
      paidAt: subDays(now, 8),
      notes: "Custom electronic micro-controller assemblies. Payment received via NEFT/RTGS.",
    },
  });

  console.log("Successfully seeded 5 sample MSME invoices:");
  console.log("1. Tata Projects - ₹4,80,000 (Within terms - Green)");
  console.log("2. Godrej Consumer - ₹2,15,000 (Due within 7 days - Yellow)");
  console.log("3. Apex Infra - ₹8,50,000 (20d Overdue + Sec 16 Interest - Red)");
  console.log("4. Bharat Heavy - ₹14,20,000 (65d Overdue + High Sec 16 Interest - Red/Samadhaan)");
  console.log("5. Larsen Smart - ₹3,60,000 (Paid - Settled)");
  console.log("\nDemo login: demo@msme.in / password123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
