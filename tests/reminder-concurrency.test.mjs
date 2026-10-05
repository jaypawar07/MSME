import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { subDays, subHours, subMinutes } from "date-fns";
import { resetTestDatabase } from "./helpers/test-db.mjs";

/**
 * A buyer must receive each milestone notice at most once, even when two scheduler
 * runs overlap (e.g. Vercel delivering the same cron event twice).
 */
describe("Auto Reminder Runner - no duplicate notices", () => {
  let prisma, runAutoReminderScheduler;
  const NOW = new Date("2024-06-01T06:00:00Z"); // 11:30 IST, outside quiet hours

  async function supplierWithDueInvoice(label) {
    const user = await prisma.user.create({ data: { email: `${label}@supplier.test`, name: label, passwordHash: "x" } });
    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        buyerName: "Buyer Co",
        buyerEmail: "ap@buyer.test",
        invoiceNumber: `INV-${label}`,
        amount: 100000,
        invoiceDate: subDays(NOW, 50), // 5 days past due → Day 1 notice
        paymentTermsDays: 45,
      },
    });
    return { user, invoice };
  }

  const remindersFor = (invoice) => prisma.reminder.findMany({ where: { invoiceId: invoice.id } });

  before(async () => {
    resetTestDatabase();
    ({ prisma } = await import("../src/lib/prisma.ts"));
    ({ runAutoReminderScheduler } = await import("../src/lib/reminders/auto-scheduler.ts"));
  });

  after(async () => {
    await prisma?.$disconnect();
  });

  test("Overlapping runs send the notice exactly once", async () => {
    const { user, invoice } = await supplierWithDueInvoice("overlap");
    const runs = await Promise.all([
      runAutoReminderScheduler(user.id, NOW),
      runAutoReminderScheduler(user.id, NOW),
      runAutoReminderScheduler(undefined, NOW), // the system-wide cron run at the same moment
    ]);
    assert.equal(runs.reduce((n, r) => n + r.dispatchedRemindersCount, 0), 1, "Exactly one run may send");
    const rows = await remindersFor(invoice);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].milestone, "DAY_1");
    assert.equal(rows[0].status, "SENT");
  });

  test("A failed delivery is retried by re-using its record, not duplicated", async () => {
    const { user, invoice } = await supplierWithDueInvoice("retry");
    await prisma.reminder.create({
      data: { invoiceId: invoice.id, buyerName: "Buyer Co", tone: "FRIENDLY", milestone: "DAY_1", message: "x", status: "FAILED", subject: "[DAY_1] x" },
    });
    const result = await runAutoReminderScheduler(user.id, NOW);
    assert.equal(result.dispatchedRemindersCount, 1);
    const rows = await remindersFor(invoice);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "SENT");
  });

  test("A notice another run is sending right now is left alone", async () => {
    const { user, invoice } = await supplierWithDueInvoice("inflight");
    await prisma.reminder.create({
      data: { invoiceId: invoice.id, buyerName: "Buyer Co", tone: "FRIENDLY", milestone: "DAY_1", message: "x", status: "SENDING", sentAt: subMinutes(NOW, 2) },
    });
    const result = await runAutoReminderScheduler(user.id, NOW);
    assert.equal(result.dispatchedRemindersCount, 0);
    assert.equal((await remindersFor(invoice))[0].status, "SENDING");
  });

  test("A claim abandoned by a crashed run (over an hour old) is taken over", async () => {
    const { user, invoice } = await supplierWithDueInvoice("stale");
    await prisma.reminder.create({
      data: { invoiceId: invoice.id, buyerName: "Buyer Co", tone: "FRIENDLY", milestone: "DAY_1", message: "x", status: "SENDING", sentAt: subHours(NOW, 2) },
    });
    const result = await runAutoReminderScheduler(user.id, NOW);
    assert.equal(result.dispatchedRemindersCount, 1);
    const rows = await remindersFor(invoice);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "SENT");
  });

  test("The database itself rejects a second record for the same invoice and milestone", async () => {
    const { invoice } = await supplierWithDueInvoice("unique");
    const row = { invoiceId: invoice.id, buyerName: "Buyer Co", tone: "FRIENDLY", milestone: "DAY_1", message: "x" };
    await prisma.reminder.create({ data: row });
    await assert.rejects(prisma.reminder.create({ data: row }), /Unique constraint/);
    // Manual reminders carry no milestone and are never limited
    await prisma.reminder.create({ data: { ...row, milestone: null } });
    await prisma.reminder.create({ data: { ...row, milestone: null } });
  });
});
