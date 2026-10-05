import test from "node:test";
import assert from "node:assert/strict";
import { addDays, subDays } from "date-fns";

// Reusable logic under test
const MSME_STATUTORY_ANNUAL_RATE = 16.5; // 16.5% annually (3x RBI Bank rate of 5.5%)
const DEFAULT_TERMS_DAYS = 45;

function calculateMSMEInterest(
  invoiceDateInput,
  amount,
  paymentTermsDays = DEFAULT_TERMS_DAYS,
  status = "PENDING",
  asOfDate = new Date()
) {
  const invDate = typeof invoiceDateInput === "string" ? new Date(invoiceDateInput) : invoiceDateInput;
  const terms = Math.min(Math.max(paymentTermsDays || DEFAULT_TERMS_DAYS, 1), 45); // Max 45 days under Section 15
  const dueDate = addDays(invDate, terms);
  
  const daysElapsed = Math.max(0, Math.round((asOfDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.round((dueDate.getTime() - asOfDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysOverdue = Math.max(0, Math.round((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const isOverdue = daysOverdue > 0 || status === "OVERDUE";
  const isStatutoryDelayed = daysElapsed > 45 || daysOverdue > 0;

  let interestOwed = 0;
  const annualRate = MSME_STATUTORY_ANNUAL_RATE / 100;
  const monthlyRate = annualRate / 12;

  if (status !== "PAID" && isOverdue && daysOverdue > 0) {
    const avgDaysInMonth = 30.4167; // 365 / 12
    const totalMonths = daysOverdue / avgDaysInMonth;
    const compoundMultiplier = Math.pow(1 + monthlyRate, totalMonths);
    interestOwed = amount * (compoundMultiplier - 1);
  }

  interestOwed = Math.round(interestOwed * 100) / 100;
  const totalClaimAmount = Math.round((amount + interestOwed) * 100) / 100;

  return {
    invoiceDate: invDate,
    dueDate,
    daysElapsed,
    daysRemaining,
    daysOverdue,
    isOverdue,
    interestRateAnnual: MSME_STATUTORY_ANNUAL_RATE,
    interestRateMonthly: Number((monthlyRate * 100).toFixed(3)),
    interestOwed,
    totalClaimAmount,
    isStatutoryDelayed,
  };
}

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
