import test from "node:test";
import assert from "node:assert/strict";
import { subDays } from "date-fns";
import { calculateMSMEInterest, formatINR } from "../src/lib/msme-calculator.ts";

test("MSME Interest Calculator - Within Terms (0 Overdue Days)", () => {
  const asOf = new Date("2024-06-01T00:00:00Z");
  const invoiceDate = subDays(asOf, 20); // 20 days elapsed, 45 day term

  const result = calculateMSMEInterest(invoiceDate, 100000, 45, "PENDING", asOf);

  assert.equal(result.isOverdue, false, "Invoice should not be overdue");
  assert.equal(result.daysOverdue, 0, "Days overdue should be 0");
  assert.equal(result.interestOwed, 0, "Interest owed should be 0 within payment terms");
  assert.equal(result.totalClaimAmount, 100000, "Total claim amount should equal principal");
});

test("MSME Interest Calculator - Section 15 Max 45-Day Cap Enforcement", () => {
  const asOf = new Date("2024-06-01T00:00:00Z");
  const invoiceDate = subDays(asOf, 50); // 50 days ago

  // User enters 90 days terms (illegal under Section 15 of MSMED Act)
  const result = calculateMSMEInterest(invoiceDate, 100000, 90, "PENDING", asOf);

  // Must clamp to 45 days: 50 days elapsed - 45 days max = 5 days overdue
  assert.equal(result.daysOverdue, 5, "Overdue days must be computed against 45-day statutory cap");
  assert.equal(result.isOverdue, true, "Should be flagged overdue after 45 days");
  assert.ok(result.interestOwed > 0, "Must accrue interest on statutory delay");
});

test("MSME Interest Calculator - Exactly 1 Month Compound Interest (16.5% p.a. with monthly rests)", () => {
  const asOf = new Date("2024-06-01T00:00:00Z");
  // Exactly 45 days term + 30.4167 days overdue (1 standard month)
  const invoiceDate = subDays(asOf, Math.round(45 + 30.4167));
  const principal = 100000;

  const result = calculateMSMEInterest(invoiceDate, principal, 45, "PENDING", asOf);

  // Expected 1 month interest at 16.5% / 12 = 1.375% of ₹100,000 = ₹1,375.00
  assert.equal(result.daysOverdue, 30);
  assert.ok(Math.abs(result.interestOwed - 1356.16) < 25, `Expected ~₹1,356 interest for 30 days, got ${result.interestOwed}`);
  assert.equal(result.totalClaimAmount, principal + result.interestOwed);
});

test("MSME Interest Calculator - Exactly 2 Months Monthly Compounding", () => {
  const asOf = new Date("2024-06-01T00:00:00Z");
  // 45 days term + 60.833 days overdue (2 full months)
  const invoiceDate = subDays(asOf, Math.round(45 + 60.833));
  const principal = 100000;

  const result = calculateMSMEInterest(invoiceDate, principal, 45, "PENDING", asOf);

  // Formula: 100000 * ((1 + 0.01375)^2 - 1) = 100000 * 0.0276889 = ₹2,768.89
  assert.ok(result.interestOwed >= 2700 && result.interestOwed <= 2800, `Interest must compound monthly, got ${result.interestOwed}`);
});

test("MSME Interest Calculator - Paid Status Excludes Penal Interest", () => {
  const asOf = new Date("2024-06-01T00:00:00Z");
  const invoiceDate = subDays(asOf, 80); // 80 days ago

  const result = calculateMSMEInterest(invoiceDate, 500000, 45, "PAID", asOf);

  assert.equal(result.interestOwed, 0, "Paid invoice must not accrue interest");
  assert.equal(result.totalClaimAmount, 500000);
});

test("MSME Interest Calculator - Status badge and urgency label", () => {
  const asOf = new Date("2024-06-01T00:00:00Z");
  const at = (daysAgo, status = "PENDING") => calculateMSMEInterest(subDays(asOf, daysAgo), 100000, 45, status, asOf);

  assert.deepEqual([at(10).statusBadgeColor, at(10).urgencyLabel], ["green", "35d left (Safe)"]);
  assert.deepEqual([at(40).statusBadgeColor, at(40).urgencyLabel], ["yellow", "Due in 5d"]);
  assert.deepEqual([at(50).statusBadgeColor, at(50).urgencyLabel], ["red", "5d Overdue"]);
  assert.equal(at(50, "PAID").statusBadgeColor, "emerald");
  assert.equal(at(50, "DISPUTED").statusBadgeColor, "purple");
});

test("MSME Interest Calculator - Accepts ISO date strings", () => {
  const asOf = new Date(2024, 5, 1, 12); // local noon, same zone parseISO uses
  const result = calculateMSMEInterest("2024-04-01", 100000, 45, "PENDING", asOf);
  assert.equal(result.daysElapsed, 61);
  assert.equal(result.daysOverdue, 16);
});

test("formatINR - Indian digit grouping", () => {
  assert.equal(formatINR(1420000), "₹14,20,000.00");
});
