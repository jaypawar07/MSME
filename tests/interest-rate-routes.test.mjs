import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { subDays } from "date-fns";
import { setTestSession } from "./stubs/next-auth.mjs";
import { resetTestDatabase } from "./helpers/test-db.mjs";

/**
 * End to end: a supplier who set an 18% Section 16 rate in Settings must see, send and
 * file 18% everywhere, while a supplier without Settings stays on the 16.5% default.
 */
describe("Supplier interest rate - end to end", () => {
  let prisma, invoicesRoute, disputeRoute, remindersRoute, runAutoReminderScheduler;
  let custom, standard;

  const ACTIVE_HOURS = new Date("2024-06-01T06:00:00Z"); // 11:30 IST
  const get = (url = "http://test.local/api") => new Request(url);
  const asUser = (user) => setTestSession({ user: { id: user.id, email: user.email, name: user.name, role: "OWNER" } });

  async function supplier(label, settings) {
    const user = await prisma.user.create({
      data: {
        email: `${label}@supplier.test`,
        name: label,
        passwordHash: "x",
        ...(settings && { settings: { create: settings } }),
      },
    });
    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        buyerName: "Buyer Co",
        buyerEmail: "ap@buyer.test",
        invoiceNumber: `INV-${label}`,
        amount: 100000,
        invoiceDate: subDays(ACTIVE_HOURS, 45 + 31), // 31 days past due → Day 30 demand notice
        paymentTermsDays: 45,
      },
    });
    return { user, invoice };
  }

  before(async () => {
    resetTestDatabase();
    ({ prisma } = await import("../src/lib/prisma.ts"));
    ({ runAutoReminderScheduler } = await import("../src/lib/reminders/auto-scheduler.ts"));
    invoicesRoute = await import("../src/app/api/invoices/route.ts");
    disputeRoute = await import("../src/app/api/invoices/[id]/dispute-package/route.ts");
    remindersRoute = await import("../src/app/api/invoices/[id]/reminders/route.ts");

    custom = await supplier("custom", { rbiBaseRate: 6, statutoryMultiplier: 3, effectiveAnnualRate: 18 });
    standard = await supplier("standard");
  });

  after(async () => {
    setTestSession(null);
    await prisma?.$disconnect();
  });

  test("Invoices API tells the dashboard which rate to use", async () => {
    asUser(custom.user);
    assert.equal((await (await invoicesRoute.GET(get())).json()).interestRateAnnual, 18);
    asUser(standard.user);
    assert.equal((await (await invoicesRoute.GET(get())).json()).interestRateAnnual, 16.5);
  });

  test("Automatic demand notice computes and quotes the supplier's rate", async () => {
    await runAutoReminderScheduler(custom.user.id, ACTIVE_HOURS);
    const [notice] = await prisma.reminder.findMany({ where: { invoiceId: custom.invoice.id } });
    assert.match(notice.subject, /^\[DAY_30\].*18%/);
    assert.ok(notice.message.includes("18% p.a."), "Body should quote 18% p.a.");
    assert.ok(!`${notice.subject} ${notice.message}`.includes("16.5"), "Must not quote 16.5% anywhere");

    await runAutoReminderScheduler(standard.user.id, ACTIVE_HOURS);
    const [standardNotice] = await prisma.reminder.findMany({ where: { invoiceId: standard.invoice.id } });
    assert.ok(standardNotice.subject.includes("16.5%"));
  });

  test("Dispute package (MSEFC filing) uses the supplier's rate", async () => {
    asUser(custom.user);
    const res = await disputeRoute.GET(get("http://test.local/api?format=html"), { params: { id: custom.invoice.id } });
    const html = await res.text();
    assert.ok(html.includes("18%"));
    assert.ok(!html.includes("16.5"));
  });

  test("Manual reminder without buyer contact is refused, not sent to a placeholder address", async () => {
    asUser(standard.user);
    await prisma.invoice.update({ where: { id: standard.invoice.id }, data: { buyerEmail: null } });
    const before = await prisma.reminder.count({ where: { invoiceId: standard.invoice.id } });

    const res = await remindersRoute.POST(
      new Request("http://test.local/api", { method: "POST", body: JSON.stringify({ channel: "EMAIL", message: "Please pay" }) }),
      { params: { id: standard.invoice.id } }
    );
    assert.equal(res.status, 400);
    assert.equal(await prisma.reminder.count({ where: { invoiceId: standard.invoice.id } }), before);
  });
});
