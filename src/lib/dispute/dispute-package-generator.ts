/**
 * Dispute Package Generator for MSME Samadhaan & MSEFC Council Filing
 * Formats statutory claims under Section 18 of the MSMED Act, 2006.
 * Generates both printable HTML dossier and structured filing metadata.
 */

import { format } from "date-fns";
import { calculateMSMEInterest, formatRate, type InvoiceCalculations } from "@/lib/msme-calculator";

export interface DisputePartyDetails {
  name: string;
  businessName?: string | null;
  udyamNumber?: string | null;
  gstin?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface DisputeInvoiceDetails {
  invoiceNumber: string;
  amount: number;
  invoiceDate: string | Date;
  paymentTermsDays: number;
  photoUrl?: string | null;
  proofOfDeliveryUrl?: string | null;
  notes?: string | null;
}

export interface DisputeReminderTrailItem {
  sentAt: string | Date;
  tone: string;
  channel: string;
  subject?: string | null;
  message: string;
  status: string;
}

export interface DisputePackageData {
  claimant: DisputePartyDetails;
  respondent: DisputePartyDetails;
  invoice: DisputeInvoiceDetails;
  calcs: InvoiceCalculations;
  reminderTrail: DisputeReminderTrailItem[];
  statutoryReference: string;
  filingPortal: string;
  generatedAt: Date;
  caseSummary: string;
}

/**
 * Builds structured dispute package data
 */
export function buildDisputePackageData(params: {
  claimant: DisputePartyDetails;
  respondent: DisputePartyDetails;
  invoice: DisputeInvoiceDetails;
  reminders: DisputeReminderTrailItem[];
  asOfDate?: Date;
  /** Supplier's Section 16 rate (% p.a.) from Settings; statutory default if omitted. */
  annualRate?: number | null;
}): DisputePackageData {
  const asOf = params.asOfDate || new Date();
  const calcs = calculateMSMEInterest(
    params.invoice.invoiceDate,
    params.invoice.amount,
    params.invoice.paymentTermsDays,
    "OVERDUE",
    asOf,
    params.annualRate
  );

  const formattedDueDate = format(calcs.dueDate, "dd MMMM yyyy");
  const formattedAmount = `₹${params.invoice.amount.toLocaleString("en-IN")}`;
  const formattedInterest = `₹${calcs.interestOwed.toLocaleString("en-IN")}`;
  const formattedTotal = `₹${calcs.totalClaimAmount.toLocaleString("en-IN")}`;

  const caseSummary = 
    `Application under Section 18 of the MSMED Act, 2006 by ${params.claimant.businessName || params.claimant.name} ` +
    `(Udyam: ${params.claimant.udyamNumber || "On File"}) against ${params.respondent.name} ` +
    `for recovery of delayed payment of Principal Amount ${formattedAmount} along with accrued Section 16 compound ` +
    `interest of ${formattedInterest} (computed @ ${formatRate(calcs.interestRateAnnual)} p.a. with monthly rests), ` +
    `making a total statutory claim of ${formattedTotal}, overdue by ${calcs.daysOverdue} days past the statutory 45-day cap.`;

  return {
    claimant: params.claimant,
    respondent: params.respondent,
    invoice: params.invoice,
    calcs,
    reminderTrail: params.reminders,
    statutoryReference: "Section 15, 16, 17 & 18 of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006",
    filingPortal: "https://samadhaan.msme.gov.in (MSEFC ODR Portal)",
    generatedAt: asOf,
    caseSummary,
  };
}

/**
 * Generates clean, printable HTML document styled for MSEFC Council submission
 */
export function generateDisputePackageHtml(data: DisputePackageData): string {
  const formattedGenDate = format(new Date(data.generatedAt), "dd MMMM yyyy, HH:mm");
  const formattedInvDate = format(new Date(data.invoice.invoiceDate), "dd MMM yyyy");
  const formattedDueDate = format(new Date(data.calcs.dueDate), "dd MMM yyyy");

  const formattedAmount = `₹${data.invoice.amount.toLocaleString("en-IN")}`;
  const formattedInterest = `₹${data.calcs.interestOwed.toLocaleString("en-IN")}`;
  const formattedRate = formatRate(data.calcs.interestRateAnnual);
  const formattedTotal = `₹${data.calcs.totalClaimAmount.toLocaleString("en-IN")}`;

  const remindersHtml = data.reminderTrail.length > 0
    ? data.reminderTrail.map((r, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; font-size: 11px; color: #64748b;">${i + 1}</td>
        <td style="padding: 8px; font-size: 11px;">${format(new Date(r.sentAt), "dd/MM/yyyy HH:mm")}</td>
        <td style="padding: 8px; font-size: 11px; font-weight: 600;">${r.channel} (${r.tone})</td>
        <td style="padding: 8px; font-size: 11px; color: #334155;">${r.subject || "Notice of Delayed Payment"}</td>
        <td style="padding: 8px; font-size: 11px;"><span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${r.status}</span></td>
      </tr>
    `).join("")
    : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">No automated reminders recorded</td></tr>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MSEFC Dispute Filing Package - ${data.invoice.invoiceNumber}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.4; font-size: 12px; background: #ffffff; margin: 0; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 16px; text-transform: uppercase; margin: 0 0 4px 0; color: #0f172a; letter-spacing: 0.5px; }
    .header p { margin: 2px 0; font-size: 11px; color: #475569; }
    .badge { display: inline-block; background: #fee2e2; color: #991b1b; font-weight: 700; font-size: 10px; padding: 3px 8px; border-radius: 4px; border: 1px solid #fecaca; margin-top: 4px; }
    
    .section { margin-bottom: 16px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #1e293b; background: #f1f5f9; padding: 6px 10px; border-left: 4px solid #4f46e5; margin-bottom: 8px; }
    
    .grid { display: flex; gap: 16px; margin-bottom: 12px; }
    .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #fafafa; }
    .card h3 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .card p { margin: 3px 0; font-size: 11px; }
    
    .table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .table th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; text-align: left; }
    .table td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px; }
    
    .highlight-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin: 12px 0; }
    .claim-total { font-size: 16px; font-weight: 800; color: #b91c1c; }
    
    .declaration { font-size: 10.5px; color: #334155; line-height: 1.5; border-left: 3px solid #cbd5e1; padding-left: 10px; margin: 10px 0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 10px; }
    .sig-block { width: 220px; text-align: center; border-top: 1px dashed #94a3b8; padding-top: 6px; font-size: 11px; }
    
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 12px; color: #475569;"><strong>MSME Samadhaan Filing Package:</strong> Print or Save as PDF to upload on <code>samadhaan.msme.gov.in</code></span>
    <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">🖨️ Print / Save as PDF</button>
  </div>

  <div class="header">
    <h1>Micro and Small Enterprises Facilitation Council (MSEFC)</h1>
    <p><strong>FORMAL APPLICATION FOR RECOVERY OF DELAYED PAYMENT UNDER SECTION 18 OF MSMED ACT, 2006</strong></p>
    <p>Statutory Interest Mandated under Section 16 • Filing Portal: <em>samadhaan.msme.gov.in / odr.msme.gov.in</em></p>
    <div class="badge">OVERDUE BY ${data.calcs.daysOverdue} DAYS • STATUTORY 45-DAY CAP EXCEEDED</div>
  </div>

  <!-- Section 1: Parties to the Dispute -->
  <div class="section">
    <div class="section-title">1. Parties to the Dispute</div>
    <div class="grid">
      <div class="card">
        <h3>Claimant (MSME Supplier / Applicant)</h3>
        <p><strong>Enterprise:</strong> ${data.claimant.businessName || data.claimant.name}</p>
        <p><strong>Udyam Reg No:</strong> <span style="font-family: monospace; font-weight: 700; color: #047857;">${data.claimant.udyamNumber || "N/A (Udyam Verified)"}</span></p>
        <p><strong>Proprietor/Auth Person:</strong> ${data.claimant.name}</p>
        <p><strong>Email:</strong> ${data.claimant.email || "On File"}</p>
        <p><strong>Phone:</strong> ${data.claimant.phone || "On File"}</p>
      </div>
      <div class="card">
        <h3>Respondent (Buyer / Debtor Enterprise)</h3>
        <p><strong>Company Name:</strong> ${data.respondent.name}</p>
        <p><strong>Buyer GSTIN:</strong> <span style="font-family: monospace;">${data.respondent.gstin || "Not Provided"}</span></p>
        <p><strong>Contact Email:</strong> ${data.respondent.email || "On File"}</p>
        <p><strong>Contact Phone:</strong> ${data.respondent.phone || "On File"}</p>
      </div>
    </div>
  </div>

  <!-- Section 2: Particulars of Invoice & Claim Computation -->
  <div class="section">
    <div class="section-title">2. Particulars of Invoice &amp; Section 16 Interest Computation</div>
    <table class="table">
      <tr>
        <th>Invoice Number</th>
        <th>Invoice Date</th>
        <th>Statutory Due Date</th>
        <th>Days Overdue</th>
        <th>Agreed Credit Terms</th>
      </tr>
      <tr>
        <td style="font-weight: 700; font-family: monospace;">${data.invoice.invoiceNumber}</td>
        <td>${formattedInvDate}</td>
        <td>${formattedDueDate}</td>
        <td style="color: #dc2626; font-weight: 700;">${data.calcs.daysOverdue} Days</td>
        <td>${data.invoice.paymentTermsDays} Days (Capped at 45d under Sec 15)</td>
      </tr>
    </table>

    <div class="highlight-box">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 33%;"><strong>1. Principal Invoice Amount:</strong></td>
          <td style="width: 33%;"><strong>2. Compounded Penal Interest (Sec 16):</strong></td>
          <td style="width: 34%;"><strong>3. TOTAL STATUTORY CLAIM:</strong></td>
        </tr>
        <tr>
          <td style="font-size: 14px; font-weight: 700; color: #1e293b;">${formattedAmount}</td>
          <td style="font-size: 14px; font-weight: 700; color: #991b1b;">${formattedInterest} <span style="font-size: 10px; font-weight: normal;">(@ ${formattedRate} p.a.)</span></td>
          <td><span class="claim-total">${formattedTotal}</span></td>
        </tr>
      </table>
      <p style="font-size: 10px; color: #64748b; margin: 8px 0 0 0;">
        * Interest computed strictly in compliance with Section 16 of the MSMED Act 2006 (Compounded with monthly rests at three times the RBI Bank Rate = ${formattedRate} per annum).
      </p>
    </div>
  </div>

  <!-- Section 3: Evidence of Supply & Attachments -->
  <div class="section">
    <div class="section-title">3. Proof of Supply &amp; Attached Exhibits</div>
    <table class="table">
      <tr>
        <th style="width: 25%;">Exhibit</th>
        <th style="width: 45%;">Document Description</th>
        <th style="width: 30%;">Status / Verification</th>
      </tr>
      <tr>
        <td><strong>Exhibit A</strong></td>
        <td>Tax Invoice Copy (#${data.invoice.invoiceNumber})</td>
        <td>${data.invoice.photoUrl ? "Attached & Uploaded" : "Original on Record"}</td>
      </tr>
      <tr>
        <td><strong>Exhibit B</strong></td>
        <td>Proof of Delivery / Lorry Receipt / Transport Challan</td>
        <td>${data.invoice.proofOfDeliveryUrl ? "Attached" : "Supplied & Uncontested"}</td>
      </tr>
      <tr>
        <td><strong>Exhibit C</strong></td>
        <td>Udyam Registration Certificate</td>
        <td>${data.claimant.udyamNumber ? `Valid: ${data.claimant.udyamNumber}` : "Registered MSME"}</td>
      </tr>
    </table>
  </div>

  <!-- Section 4: Notice & Communication Audit Trail -->
  <div class="section">
    <div class="section-title">4. Escalation &amp; Demand Notice Audit Trail</div>
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Date &amp; Time</th>
          <th>Channel / Tone</th>
          <th>Subject Line</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${remindersHtml}
      </tbody>
    </table>
  </div>

  <!-- Section 5: Prayer & Statutory Declaration -->
  <div class="section">
    <div class="section-title">5. Prayer for Relief &amp; Legal Declaration</div>
    <div class="declaration">
      I/We hereby solemnly declare that the goods/services against Invoice #${data.invoice.invoiceNumber} were duly delivered to the Respondent and accepted without objection. The agreed payment period has expired and exceeds the 45-day statutory limit specified under Section 15 of the MSMED Act, 2006.
      <br><br>
      <strong>PRAYER:</strong> The Claimant respectfully prays that the Hon'ble Council may be pleased to:
      <ol style="margin: 4px 0; padding-left: 20px;">
        <li>Direct the Respondent to pay the Principal outstanding sum of <strong>${formattedAmount}</strong> immediately.</li>
        <li>Direct the Respondent to pay compounded interest of <strong>${formattedInterest}</strong> plus further interest accruing at ${formattedRate} p.a. until realization under Section 16 of the Act.</li>
        <li>Award legal and administrative recovery costs under Section 18(3) of the Act.</li>
      </ol>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <strong>Authorized Signatory</strong><br>
        For ${data.claimant.businessName || data.claimant.name}<br>
        Date: ${formattedGenDate}
      </div>
      <div class="sig-block">
        <strong>Filing Verification</strong><br>
        Generated via Settlr MSME Recovery System<br>
        Ref: SETTLR-MSEFC-${data.invoice.invoiceNumber}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
