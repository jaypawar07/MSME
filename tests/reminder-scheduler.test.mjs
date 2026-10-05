import test from "node:test";
import assert from "node:assert/strict";

const AUTO_REMINDER_MILESTONES = [
  { key: "DAY_1", thresholdDays: 1, templateTone: "FRIENDLY", label: "Day 1 Past Due" },
  { key: "DAY_30", thresholdDays: 30, templateTone: "URGENT_MSMED", label: "Day 30 Past Due" },
  { key: "DAY_45", thresholdDays: 45, templateTone: "LEGAL_SAMADHAAN", label: "Day 45 Past Due" },
  { key: "DAY_60", thresholdDays: 60, templateTone: "LEGAL_SAMADHAAN", label: "Day 60 Past Due" },
];

function getPendingMilestones(daysOverdue, sentMilestones, invoiceStatus = "PENDING") {
  if (invoiceStatus === "PAID" || invoiceStatus === "DISPUTED" || daysOverdue < 1) {
    return [];
  }

  const sentSet = new Set(sentMilestones.map((m) => m.toUpperCase()));

  return AUTO_REMINDER_MILESTONES.filter(
    (m) => daysOverdue >= m.thresholdDays && !sentSet.has(m.key)
  );
}

test("Auto Reminder Scheduler - Within Terms (0 Overdue Days)", () => {
  const pending = getPendingMilestones(0, [], "PENDING");
  assert.equal(pending.length, 0, "Should not schedule any reminders when not overdue");
});

test("Auto Reminder Scheduler - Day 1 Overdue Milestone", () => {
  const pending = getPendingMilestones(1, [], "PENDING");
  assert.equal(pending.length, 1, "Should schedule exactly 1 milestone");
  assert.equal(pending[0].key, "DAY_1");
  assert.equal(pending[0].templateTone, "FRIENDLY");
});

test("Auto Reminder Scheduler - Day 30 Overdue with Day 1 Already Sent", () => {
  // Day 1 has already been sent
  const pending = getPendingMilestones(32, ["DAY_1"], "PENDING");
  
  assert.equal(pending.length, 1, "Should only schedule DAY_30 milestone");
  assert.equal(pending[0].key, "DAY_30");
  assert.equal(pending[0].templateTone, "URGENT_MSMED");
});

test("Auto Reminder Scheduler - Day 45 Overdue with Day 1 and Day 30 Sent", () => {
  const pending = getPendingMilestones(47, ["DAY_1", "DAY_30"], "PENDING");
  
  assert.equal(pending.length, 1, "Should schedule DAY_45 milestone");
  assert.equal(pending[0].key, "DAY_45");
  assert.equal(pending[0].templateTone, "LEGAL_SAMADHAAN");
});

test("Auto Reminder Scheduler - Day 60 Overdue with Previous Sent", () => {
  const pending = getPendingMilestones(65, ["DAY_1", "DAY_30", "DAY_45"], "PENDING");
  
  assert.equal(pending.length, 1, "Should schedule DAY_60 milestone");
  assert.equal(pending[0].key, "DAY_60");
  assert.equal(pending[0].templateTone, "LEGAL_SAMADHAAN");
});

test("Auto Reminder Scheduler - De-duplication When All Milestones Sent", () => {
  const pending = getPendingMilestones(75, ["DAY_1", "DAY_30", "DAY_45", "DAY_60"], "PENDING");
  assert.equal(pending.length, 0, "Should schedule 0 reminders when all milestones have been dispatched");
});

test("Auto Reminder Scheduler - Paid Invoices Suppress All Auto-Reminders", () => {
  const pending = getPendingMilestones(45, [], "PAID");
  assert.equal(pending.length, 0, "Paid invoice must never trigger automated recovery reminders");
});
