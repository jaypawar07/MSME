import test from "node:test";
import assert from "node:assert/strict";
import { subDays } from "date-fns";
import { calculateMSMEInterest, formatRate } from "../src/lib/msme-calculator.ts";
import { REMINDER_TEMPLATES } from "../src/lib/reminder-templates.ts";
import { buildDisputePackageData, generateDisputePackageHtml } from "../src/lib/dispute/dispute-package-generator.ts";
import { EmailNotificationSender } from "../src/lib/notifications/notification-sender.ts";

/**
 * A supplier's custom Section 16 rate (Settings → 3 × RBI Bank Rate) must drive both
 * the computed interest AND every rate quoted to the buyer. They must never disagree.
 */

const asOf = new Date("2024-06-01T00:00:00Z");
const invoiceDate = subDays(asOf, 45 + 61); // ~2 months past due

test("Interest Rate - Calculator uses the supplier's rate and reports it", () => {
  const atDefault = calculateMSMEInterest(invoiceDate, 100000, 45, "PENDING", asOf);
  const at18 = calculateMSMEInterest(invoiceDate, 100000, 45, "PENDING", asOf, 18);

  assert.equal(atDefault.interestRateAnnual, 16.5);
  assert.equal(at18.interestRateAnnual, 18);
  assert.equal(at18.interestRateMonthly, 1.5);
  assert.ok(at18.interestOwed > atDefault.interestOwed, "Higher rate must yield more interest");
  // 100000 × (1.015^(61/30.4167) − 1)
  assert.ok(Math.abs(at18.interestOwed - 100000 * (Math.pow(1.015, 61 / 30.4167) - 1)) < 0.01);
});

test("Interest Rate - Invalid rates fall back to the statutory default", () => {
  for (const bad of [undefined, null, 0, -5, NaN]) {
    assert.equal(calculateMSMEInterest(invoiceDate, 100000, 45, "PENDING", asOf, bad).interestRateAnnual, 16.5, String(bad));
  }
});

test("Interest Rate - formatRate prints rates without float noise", () => {
  assert.equal(formatRate(16.5), "16.5%");
  assert.equal(formatRate(18), "18%");
  assert.equal(formatRate(17.25), "17.25%");
  assert.equal(formatRate(0.1 + 0.2), "0.3%");
});

for (const lang of ["en", "hi"]) {
  test(`Interest Rate - Every reminder template quotes the supplier's rate (${lang})`, () => {
    for (const [key, template] of Object.entries(REMINDER_TEMPLATES)) {
      const text =
        template.getSubject({ invoiceNumber: "INV-1", amount: 100000, lang, interestRateAnnual: 18 }) +
        template.generateBody({
          buyerName: "Buyer", supplierName: "Supplier", invoiceNumber: "INV-1", amount: 100000,
          invoiceDate: "01 Jan 2024", dueDate: "15 Feb 2024", daysOverdue: 40, interestOwed: 2500,
          totalClaim: 102500, lang, interestRateAnnual: 18,
        });
      assert.ok(!text.includes("16.5"), `${key}/${lang} must not quote 16.5% when the rate is 18%`);
    }
    const demand = REMINDER_TEMPLATES.URGENT_MSMED.getSubject({ invoiceNumber: "INV-1", amount: 1, lang, interestRateAnnual: 18 });
    assert.ok(demand.includes("18%"), `Demand notice subject should quote 18%: ${demand}`);
  });
}

test("Interest Rate - Dispute package computes and quotes the supplier's rate", () => {
  const data = buildDisputePackageData({
    claimant: { name: "Rajesh", businessName: "Apex", udyamNumber: "UDYAM-MH-12-0049281", email: "r@apex.test" },
    respondent: { name: "Buyer Co", email: "ap@buyer.test" },
    invoice: { invoiceNumber: "INV-1", amount: 100000, invoiceDate, paymentTermsDays: 45 },
    reminders: [],
    asOfDate: asOf,
    annualRate: 18,
  });
  assert.equal(data.calcs.interestRateAnnual, 18);
  const html = generateDisputePackageHtml(data);
  assert.ok(html.includes("18%"), "Package should quote 18%");
  assert.ok(!html.includes("16.5"), "Package must not quote 16.5% when the rate is 18%");
  assert.ok(data.caseSummary.includes("18%"));
});

test("Interest Rate - Notification email quotes the rate it was given", () => {
  const html = new EmailNotificationSender().generateDefaultHtml({
    to: "ap@buyer.test", recipientName: "Buyer", supplierName: "Apex", subject: "s", bodyText: "b",
    invoiceNumber: "INV-1", amount: 100000, interestOwed: 2500, totalClaim: 102500, daysOverdue: 40,
    interestRateAnnual: 18,
  });
  assert.ok(html.includes("18% p.a."));
  assert.ok(!html.includes("16.5"));
});
