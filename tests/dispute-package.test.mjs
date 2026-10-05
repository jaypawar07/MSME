import test from "node:test";
import assert from "node:assert/strict";
import { subDays } from "date-fns";
import { buildDisputePackageData, generateDisputePackageHtml } from "../src/lib/dispute/dispute-package-generator.ts";

test("Dispute Package - Compiles Section 18 Statutory Package for Overdue Invoice", () => {
  const asOf = new Date("2024-06-01T00:00:00Z");
  const invoiceDate = subDays(asOf, 65); // 65 days ago, 45-day term => 20 days overdue

  const disputeData = buildDisputePackageData({
    claimant: {
      name: "Rajesh Sharma",
      businessName: "Apex Precision Engineering Works",
      udyamNumber: "UDYAM-MH-12-0049281",
      email: "rajesh@apex.in",
      phone: "+91 98200 11223",
    },
    respondent: {
      name: "Apex Infra Buildcon Pvt Ltd",
      gstin: "27AABCA9921K1ZZ",
      email: "finance@apexbuildcon.demo",
      phone: "+91 98200 33003",
    },
    invoice: {
      invoiceNumber: "INV-2024-003",
      amount: 850000,
      invoiceDate: invoiceDate.toISOString(),
      paymentTermsDays: 45,
      photoUrl: "/uploads/invoices/inv-003.jpg",
      proofOfDeliveryUrl: "/uploads/proof/lr-003.pdf",
      notes: "Structural steel girders",
    },
    reminders: [
      {
        sentAt: subDays(asOf, 19).toISOString(),
        tone: "FRIENDLY",
        channel: "EMAIL",
        subject: "Gentle Reminder: Invoice #INV-2024-003",
        message: "Payment follow-up",
        status: "SENT",
      },
      {
        sentAt: subDays(asOf, 5).toISOString(),
        tone: "URGENT_MSMED",
        channel: "EMAIL",
        subject: "DEMAND NOTICE under MSMED Act 2006",
        message: "Statutory demand for delayed payment",
        status: "SENT",
      },
    ],
    asOfDate: asOf,
  });

  assert.equal(disputeData.invoice.invoiceNumber, "INV-2024-003");
  assert.equal(disputeData.claimant.udyamNumber, "UDYAM-MH-12-0049281");
  assert.equal(disputeData.calcs.daysOverdue, 20);
  assert.ok(disputeData.calcs.interestOwed > 0, "Interest must be calculated");
  assert.equal(disputeData.reminderTrail.length, 2);
  assert.ok(disputeData.caseSummary.includes("Section 18 of the MSMED Act"));

  // Verify HTML output contains required legal elements
  const html = generateDisputePackageHtml(disputeData);
  assert.ok(html.includes("MSEFC"));
  assert.ok(html.includes("samadhaan.msme.gov.in"));
  assert.ok(html.includes("Apex Precision Engineering Works"));
  assert.ok(html.includes("₹8,50,000"));
});
