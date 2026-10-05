import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { subDays } from "date-fns";
import { resetTestDatabase } from "./helpers/test-db.mjs";

/**
 * Runs the real auto-reminder scheduler against the throwaway test database and
 * checks that each supplier's Company Settings actually change what is sent.
 */
describe("Auto Reminder Runner - honours Company Settings", () => {
  let prisma, runAutoReminderScheduler;

  const ACTIVE_HOURS = new Date("2024-06-01T06:00:00Z"); // 11:30 IST
  const QUIET_HOURS = new Date("2024-06-01T16:00:00Z"); // 21:30 IST

  // A supplier with one invoice 5 days past its 45-day terms (due for the Day 1 reminder)
  async function supplierWithOverdueInvoice(label, { settings, buyerEmail = "ap@buyer.test", buyerPhone = null } = {}) {
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
        buyerEmail,
        buyerPhone,
        invoiceNumber: `INV-${label}`,
        amount: 100000,
        invoiceDate: subDays(ACTIVE_HOURS, 50),
        paymentTermsDays: 45,
      },
    });
    return { user, invoice };
  }

  const remindersFor = (invoice) => prisma.reminder.findMany({ where: { invoiceId: invoice.id } });

  before(async () => {
    for (const key of ["RESEND_API_KEY", "SMTP_HOST", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"]) {
      assert.equal(process.env[key], undefined, `${key} must not be set in tests (would send real messages)`);
    }
    resetTestDatabase();
    ({ prisma } = await import("../src/lib/prisma.ts"));
    ({ runAutoReminderScheduler } = await import("../src/lib/reminders/auto-scheduler.ts"));
  });

  after(async () => {
    await prisma?.$disconnect();
  });

  test("Default settings: sends the Day 1 reminder once, and not again on the next run", async () => {
    const { user, invoice } = await supplierWithOverdueInvoice("defaults");

    const first = await runAutoReminderScheduler(user.id, ACTIVE_HOURS);
    assert.equal(first.dispatchedRemindersCount, 1);
    const [reminder] = await remindersFor(invoice);
    assert.match(reminder.subject, /^\[DAY_1\]/);
    assert.equal(reminder.channel, "EMAIL");
    assert.equal(reminder.buyerContact, "ap@buyer.test");

    const second = await runAutoReminderScheduler(user.id, ACTIVE_HOURS);
    assert.equal(second.dispatchedRemindersCount, 0, "No duplicate reminder");
    assert.equal((await remindersFor(invoice)).length, 1);
  });

  test("Quiet hours: holds the reminder back, then sends it after quiet hours", async () => {
    const { user, invoice } = await supplierWithOverdueInvoice("quiet");

    const night = await runAutoReminderScheduler(user.id, QUIET_HOURS);
    assert.equal(night.dispatchedRemindersCount, 0);
    assert.deepEqual(night.skipped.map((s) => s.reason), ["QUIET_HOURS"]);
    assert.equal((await remindersFor(invoice)).length, 0);

    const morning = await runAutoReminderScheduler(user.id, ACTIVE_HOURS);
    assert.equal(morning.dispatchedRemindersCount, 1);
  });

  test("Switched-off milestone: Day 1 disabled in Settings is not sent", async () => {
    const { user, invoice } = await supplierWithOverdueInvoice("noday1", { settings: { sendDay1: false } });
    const result = await runAutoReminderScheduler(user.id, ACTIVE_HOURS);
    assert.equal(result.dispatchedRemindersCount, 0);
    assert.deepEqual(result.skipped, []);
    assert.equal((await remindersFor(invoice)).length, 0);
  });

  test("Email disabled: falls back to WhatsApp when the buyer has a phone", async () => {
    const { user, invoice } = await supplierWithOverdueInvoice("whatsapp", {
      settings: { enableEmail: false },
      buyerPhone: "+919800000000",
    });
    await runAutoReminderScheduler(user.id, ACTIVE_HOURS);
    const [reminder] = await remindersFor(invoice);
    assert.equal(reminder.channel, "WHATSAPP");
    assert.equal(reminder.buyerContact, "+919800000000");
  });

  test("No usable channel: skipped with a reason, nothing sent to a made-up address", async () => {
    const { user, invoice } = await supplierWithOverdueInvoice("nochannel", { settings: { enableEmail: false } });
    const result = await runAutoReminderScheduler(user.id, ACTIVE_HOURS);
    assert.equal(result.dispatchedRemindersCount, 0);
    assert.deepEqual(result.skipped.map((s) => s.reason), ["NO_ENABLED_CHANNEL"]);
    assert.equal((await remindersFor(invoice)).length, 0);
  });

  test("A supplier's run never sends reminders on another supplier's invoices", async () => {
    const a = await supplierWithOverdueInvoice("tenantA");
    const b = await supplierWithOverdueInvoice("tenantB");
    await runAutoReminderScheduler(a.user.id, ACTIVE_HOURS);
    assert.equal((await remindersFor(a.invoice)).length, 1);
    assert.equal((await remindersFor(b.invoice)).length, 0);
  });
});
