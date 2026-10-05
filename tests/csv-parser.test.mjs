import test from "node:test";
import assert from "node:assert/strict";
import { parseInvoiceCSV, SAMPLE_CSV_TEMPLATES } from "../src/lib/csv/invoice-csv-parser.ts";

test("CSV Parser - Parses Settlr Standard CSV", () => {
  const result = parseInvoiceCSV(SAMPLE_CSV_TEMPLATES.settlr, []);
  assert.equal(result.rows.length, 3);
  assert.equal(result.stats.validNewCount, 3);
  assert.equal(result.stats.duplicateCount, 0);
  assert.equal(result.rows[0].invoiceNumber, "INV-2024-101");
  assert.equal(result.rows[0].amount, 850000);
  assert.equal(result.rows[0].paymentTermsDays, 45);
});

test("CSV Parser - Parses Tally Prime Voucher Format", () => {
  const result = parseInvoiceCSV(SAMPLE_CSV_TEMPLATES.tally, []);
  assert.equal(result.rows.length, 2);
  assert.equal(result.detectedFormat, "tally");
  assert.equal(result.rows[0].invoiceNumber, "INV-2024-201");
  assert.equal(result.rows[0].buyerName, "Larsen & Toubro Ltd");
  assert.equal(result.rows[0].amount, 1250000);
});

test("CSV Parser - Parses Zoho Books Format", () => {
  const result = parseInvoiceCSV(SAMPLE_CSV_TEMPLATES.zoho, []);
  assert.equal(result.rows.length, 2);
  assert.equal(result.detectedFormat, "zoho");
  assert.equal(result.rows[0].invoiceNumber, "INV-2024-301");
  assert.equal(result.rows[0].amount, 540000);
});

test("CSV Parser - Server De-duplication against Database", () => {
  const existingInDb = ["INV-2024-101"];
  const result = parseInvoiceCSV(SAMPLE_CSV_TEMPLATES.settlr, existingInDb);
  
  assert.equal(result.stats.validNewCount, 2);
  assert.equal(result.stats.duplicateCount, 1);
  
  const duplicateRow = result.rows.find((r) => r.invoiceNumber === "INV-2024-101");
  assert.ok(duplicateRow);
  assert.equal(duplicateRow.isDuplicate, true);
  assert.equal(duplicateRow.duplicateReason, "Already exists in database");
});

test("CSV Parser - In-file Duplicate Detection", () => {
  const duplicateCsv = `invoiceNumber,buyerName,amount,invoiceDate,paymentTermsDays
INV-DUP-1,Apex Buildcon,100000,2024-06-01,45
INV-DUP-1,Apex Buildcon,100000,2024-06-01,45`;

  const result = parseInvoiceCSV(duplicateCsv, []);
  assert.equal(result.stats.validNewCount, 1);
  assert.equal(result.stats.duplicateCount, 1);
  assert.equal(result.rows[1].isDuplicate, true);
  assert.equal(result.rows[1].duplicateReason, "Duplicate within this CSV");
});

test("CSV Parser - Section 15 Max 45-Day Terms Enforcement", () => {
  const overTermsCsv = `invoiceNumber,buyerName,amount,invoiceDate,paymentTermsDays
INV-OVER-1,Big Buyer Ltd,500000,2024-06-01,90`;

  const result = parseInvoiceCSV(overTermsCsv, []);
  assert.equal(result.rows[0].paymentTermsDays, 45, "Terms in CSV exceeding 45 days must be clamped to statutory 45 days");
});
