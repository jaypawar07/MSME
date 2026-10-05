import test from "node:test";
import assert from "node:assert/strict";
import { subDays } from "date-fns";
import { aggregateBuyerPaymentRisk } from "../src/lib/analytics/buyer-risk-aggregator.ts";

test("Buyer Risk Aggregator - Aggregates Payment Performance and Delinquency Score", () => {
  const asOf = new Date("2024-06-01T00:00:00Z");

  const mockInvoices = [
    // Buyer A: 2 invoices, both overdue (>45d) => High Risk
    {
      id: "inv-1",
      userId: "user-1",
      buyerName: "Late Payer Corp",
      buyerGstin: "27AAACL1111A1Z1",
      invoiceNumber: "INV-01",
      amount: 500000,
      invoiceDate: subDays(asOf, 80),
      paymentTermsDays: 45,
      status: "OVERDUE",
    },
    {
      id: "inv-2",
      userId: "user-2",
      buyerName: "Late Payer Corp",
      buyerGstin: "27AAACL1111A1Z1",
      invoiceNumber: "INV-02",
      amount: 300000,
      invoiceDate: subDays(asOf, 70),
      paymentTermsDays: 45,
      status: "OVERDUE",
    },
    // Buyer B: 2 invoices, both paid on time => Low Risk
    {
      id: "inv-3",
      userId: "user-1",
      buyerName: "Punctual Buyer Ltd",
      buyerGstin: "27AAACP2222B1Z2",
      invoiceNumber: "INV-03",
      amount: 200000,
      invoiceDate: subDays(asOf, 30),
      paymentTermsDays: 45,
      status: "PAID",
    },
  ];

  const dataset = aggregateBuyerPaymentRisk(mockInvoices, asOf);

  assert.equal(dataset.summary.totalBuyersTracked, 2);
  assert.equal(dataset.summary.highRiskBuyersCount, 1);

  const lateCorp = dataset.buyers.find((b) => b.normalizedName === "late payer corp");
  assert.ok(lateCorp);
  assert.equal(lateCorp.totalInvoices, 2);
  assert.equal(lateCorp.overdueInvoices, 2);
  assert.equal(lateCorp.latePaymentRate, 100);
  assert.equal(lateCorp.totalOverdueValue, 800000);
  assert.equal(lateCorp.riskTier, "HIGH");
  assert.ok(lateCorp.riskScore >= 60);

  const goodCorp = dataset.buyers.find((b) => b.normalizedName === "punctual buyer ltd");
  assert.ok(goodCorp);
  assert.equal(goodCorp.latePaymentRate, 0);
  assert.equal(goodCorp.riskTier, "LOW");
});
