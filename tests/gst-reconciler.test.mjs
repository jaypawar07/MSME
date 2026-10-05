import test from "node:test";
import assert from "node:assert/strict";
import { parseGSTRCsv, reconcileInvoicesWithGSTR, SAMPLE_GSTR2B_CSV } from "../src/lib/gst/gst-reconciler.ts";

test("GST Reconciler - Parses GSTR-2B CSV Export", () => {
  const parsed = parseGSTRCsv(SAMPLE_GSTR2B_CSV);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0].invoiceNumber, "INV-2024-001");
  assert.equal(parsed[0].invoiceValue, 450000);
});

test("GST Reconciler - Identifies Matches, Mismatches and Missing Invoices", () => {
  const systemInvoices = [
    {
      invoiceNumber: "INV-2024-001",
      buyerName: "Apex Infra Buildcon",
      buyerGstin: "27AABCA9921K1ZZ",
      amount: 450000,
      invoiceDate: "2024-06-15",
    },
    {
      invoiceNumber: "INV-2024-003",
      buyerName: "Apex Infra Buildcon",
      buyerGstin: "27AABCA9921K1ZZ",
      amount: 850000, // In GSTR it is 800000 -> Diff of 50000
      invoiceDate: "2024-05-20",
    },
    {
      invoiceNumber: "INV-2024-004", // Not in GSTR-2B
      buyerName: "TechNova Systems",
      buyerGstin: "27AACCT4421M1Z1",
      amount: 320000,
      invoiceDate: "2024-07-01",
    },
  ];

  const parsedGstr = parseGSTRCsv(SAMPLE_GSTR2B_CSV);
  const result = reconcileInvoicesWithGSTR(systemInvoices, parsedGstr);

  assert.equal(result.summary.matchedCount, 1, "INV-2024-001 should match");
  assert.equal(result.summary.mismatchCount, 1, "INV-2024-003 should flag mismatch");
  assert.equal(result.summary.missingInGstrCount, 1, "INV-2024-004 should be missing in 2B");
  assert.equal(result.summary.unrecordedCount, 2, "2 invoices in GSTR not in system");

  const mismatchItem = result.items.find((i) => i.invoiceNumber === "INV-2024-003");
  assert.ok(mismatchItem);
  assert.equal(mismatchItem.status, "MISMATCH_AMOUNT");
  assert.equal(mismatchItem.diffAmount, 50000);
});
