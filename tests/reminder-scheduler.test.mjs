import test from "node:test";
import assert from "node:assert/strict";
import { subDays } from "date-fns";
import {
  getPendingMilestones,
  evaluateInvoiceForAutoReminders,
} from "../src/lib/reminders/auto-scheduler.ts";

const asOf = new Date("2024-06-01T00:00:00Z");

// Invoice on 45-day terms that is `daysOverdue` days past due as of `asOf`
function overdueInvoice(daysOverdue, overrides = {}) {
  return {
    id: "inv_1",
    invoiceNumber: "INV-001",
    buyerName: "Tata Projects Ltd",
    buyerEmail: "ap@tata.example",
    buyerPhone: null,
    amount: 100000,
    invoiceDate: subDays(asOf, 45 + daysOverdue),
    paymentTermsDays: 45,
    status: "PENDING",
    user: { name: "Rajesh Sharma", businessName: "Apex Precision", udyamNumber: "UDYAM-MH-12-0049281" },
    ...overrides,
  };
}

const keys = (list) => list.map((m) => m.key ?? m.milestone);

test("Auto Reminder Scheduler - Within Terms (0 Overdue Days)", () => {
  assert.deepEqual(getPendingMilestones(0, [], "PENDING"), []);
});

test("Auto Reminder Scheduler - Day 1 Overdue Milestone", () => {
  const pending = getPendingMilestones(1, [], "PENDING");
  assert.deepEqual(keys(pending), ["DAY_1"]);
  assert.equal(pending[0].templateTone, "FRIENDLY");
});

test("Auto Reminder Scheduler - Day 30 Overdue with Day 1 Already Sent", () => {
  const pending = getPendingMilestones(32, ["DAY_1"], "PENDING");
  assert.deepEqual(keys(pending), ["DAY_30"]);
  assert.equal(pending[0].templateTone, "URGENT_MSMED");
});

test("Auto Reminder Scheduler - Day 45 Overdue with Day 1 and Day 30 Sent", () => {
  const pending = getPendingMilestones(47, ["DAY_1", "DAY_30"], "PENDING");
  assert.deepEqual(keys(pending), ["DAY_45"]);
  assert.equal(pending[0].templateTone, "LEGAL_SAMADHAAN");
});

test("Auto Reminder Scheduler - Day 60 Overdue with Previous Sent", () => {
  assert.deepEqual(keys(getPendingMilestones(65, ["DAY_1", "DAY_30", "DAY_45"], "PENDING")), ["DAY_60"]);
});

test("Auto Reminder Scheduler - De-duplication When All Milestones Sent", () => {
  assert.deepEqual(getPendingMilestones(75, ["DAY_1", "DAY_30", "DAY_45", "DAY_60"], "PENDING"), []);
});

test("Auto Reminder Scheduler - Paid and Disputed Invoices Suppress All Auto-Reminders", () => {
  assert.deepEqual(getPendingMilestones(45, [], "PAID"), []);
  assert.deepEqual(getPendingMilestones(45, [], "DISPUTED"), []);
});

test("Auto Reminder Scheduler - Only the latest due milestone is sent, never a burst", () => {
  // An invoice imported 65 days overdue must not get friendly + demand + 2 legal notices at once
  assert.deepEqual(keys(getPendingMilestones(65, [], "PENDING")), ["DAY_60"]);
  // Earlier milestones are superseded once a later one has gone out
  assert.deepEqual(getPendingMilestones(65, ["DAY_60"], "PENDING"), []);
  assert.deepEqual(keys(getPendingMilestones(50, ["DAY_30"], "PENDING")), ["DAY_45"]);
});

test("Auto Reminder Evaluation - Plans a tagged reminder from the real templates", () => {
  const planned = evaluateInvoiceForAutoReminders(overdueInvoice(31), [{ tone: "FRIENDLY", subject: "[DAY_1] Reminder", status: "SENT" }], asOf);
  assert.deepEqual(keys(planned), ["DAY_30"]);
  assert.equal(planned[0].channel, "EMAIL");
  assert.equal(planned[0].recipientContact, "ap@tata.example");
  assert.match(planned[0].subject, /^\[DAY_30\] /);
  assert.ok(planned[0].body.includes("INV-001"), "Body should reference the invoice number");
});

test("Auto Reminder Evaluation - Falls back to WhatsApp when buyer has no email", () => {
  const planned = evaluateInvoiceForAutoReminders(overdueInvoice(2, { buyerEmail: null, buyerPhone: "+919800000000" }), [], asOf);
  assert.equal(planned[0].channel, "WHATSAPP");
  assert.equal(planned[0].recipientContact, "+919800000000");
});

test("Auto Reminder Evaluation - 'Day 15' in a manual note is not mistaken for the Day 1 milestone", () => {
  const history = [{ tone: "FORMAL", subject: "Payment follow-up", message: "Invoice is now on Day 15 past due.", status: "LOGGED" }];
  assert.deepEqual(keys(evaluateInvoiceForAutoReminders(overdueInvoice(16), history, asOf)), ["DAY_1"]);
});

test("Auto Reminder Evaluation - A FAILED delivery is retried, not treated as sent", () => {
  const history = [{ tone: "FRIENDLY", subject: "[DAY_1] Reminder", message: "...", status: "FAILED" }];
  assert.deepEqual(keys(evaluateInvoiceForAutoReminders(overdueInvoice(3), history, asOf)), ["DAY_1"]);
});
