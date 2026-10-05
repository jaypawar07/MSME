/**
 * GST Reconciliation Engine (GSTR-2B & GSTR-3B Diff Table)
 * Reconciles MSME invoices against GSTR-2B / GSTR-3B filings to detect
 * mismatching values, missing invoices, and Input Tax Credit (ITC) risks.
 */

export interface GSTRRow {
  invoiceNumber: string;
  supplierOrBuyerGstin: string;
  partyName?: string;
  invoiceDate?: string;
  invoiceValue: number;
  taxableValue?: number;
  integratedTax?: number;
  centralTax?: number;
  stateTax?: number;
  itcAvailable?: boolean;
}

export type GSTMatchStatus = 
  | "MATCHED" 
  | "MISMATCH_AMOUNT" 
  | "MISSING_IN_GSTR" 
  | "UNRECORDED_IN_SYSTEM";

export interface GSTDiffItem {
  invoiceNumber: string;
  buyerName: string;
  buyerGstin?: string | null;
  systemAmount: number;
  gstrAmount: number;
  diffAmount: number;
  systemInvoiceDate?: string;
  gstrInvoiceDate?: string;
  status: GSTMatchStatus;
  statusLabel: string;
  riskSeverity: "low" | "medium" | "high";
  notes: string;
}

export interface GSTReconciliationResult {
  items: GSTDiffItem[];
  summary: {
    totalSystemInvoices: number;
    totalGstrInvoices: number;
    matchedCount: number;
    mismatchCount: number;
    missingInGstrCount: number;
    unrecordedCount: number;
    totalSystemValue: number;
    totalGstrValue: number;
    totalMismatchValue: number;
    reconciliationRate: number; // percentage
  };
}

/**
 * Reconciles system invoices against parsed GSTR rows
 */
export function reconcileInvoicesWithGSTR(
  systemInvoices: Array<{
    invoiceNumber: string;
    buyerName: string;
    buyerGstin?: string | null;
    amount: number;
    invoiceDate: Date | string;
  }>,
  gstrRows: GSTRRow[]
): GSTReconciliationResult {
  const gstrMap = new Map<string, GSTRRow>();
  const matchedGstrKeys = new Set<string>();

  gstrRows.forEach((r) => {
    const key = normalizeInvoiceKey(r.invoiceNumber);
    if (key) {
      gstrMap.set(key, r);
    }
  });

  const diffItems: GSTDiffItem[] = [];
  let matchedCount = 0;
  let mismatchCount = 0;
  let missingInGstrCount = 0;
  let totalMismatchValue = 0;

  // 1. Check all system invoices against GSTR-2B
  systemInvoices.forEach((inv) => {
    const key = normalizeInvoiceKey(inv.invoiceNumber);
    const gstrMatch = gstrMap.get(key);

    const invDateStr = typeof inv.invoiceDate === "string" 
      ? inv.invoiceDate.split("T")[0] 
      : inv.invoiceDate.toISOString().split("T")[0];

    if (gstrMatch) {
      matchedGstrKeys.add(key);
      const diff = Math.round(Math.abs(inv.amount - gstrMatch.invoiceValue) * 100) / 100;

      if (diff <= 2) {
        // Matched within rounding tolerance
        matchedCount++;
        diffItems.push({
          invoiceNumber: inv.invoiceNumber,
          buyerName: inv.buyerName,
          buyerGstin: inv.buyerGstin || gstrMatch.supplierOrBuyerGstin,
          systemAmount: inv.amount,
          gstrAmount: gstrMatch.invoiceValue,
          diffAmount: 0,
          systemInvoiceDate: invDateStr,
          gstrInvoiceDate: gstrMatch.invoiceDate,
          status: "MATCHED",
          statusLabel: "Matched in GSTR-2B",
          riskSeverity: "low",
          notes: "Invoice & GSTR return figures match perfectly.",
        });
      } else {
        // Value Mismatch
        mismatchCount++;
        totalMismatchValue += diff;
        diffItems.push({
          invoiceNumber: inv.invoiceNumber,
          buyerName: inv.buyerName,
          buyerGstin: inv.buyerGstin || gstrMatch.supplierOrBuyerGstin,
          systemAmount: inv.amount,
          gstrAmount: gstrMatch.invoiceValue,
          diffAmount: inv.amount - gstrMatch.invoiceValue,
          systemInvoiceDate: invDateStr,
          gstrInvoiceDate: gstrMatch.invoiceDate,
          status: "MISMATCH_AMOUNT",
          statusLabel: "Value Mismatch",
          riskSeverity: "high",
          notes: `System amount (₹${inv.amount.toLocaleString("en-IN")}) differs from GSTR (₹${gstrMatch.invoiceValue.toLocaleString("en-IN")}) by ₹${diff.toLocaleString("en-IN")}.`,
        });
      }
    } else {
      // Missing in GSTR-2B
      missingInGstrCount++;
      diffItems.push({
        invoiceNumber: inv.invoiceNumber,
        buyerName: inv.buyerName,
        buyerGstin: inv.buyerGstin,
        systemAmount: inv.amount,
        gstrAmount: 0,
        diffAmount: inv.amount,
        systemInvoiceDate: invDateStr,
        status: "MISSING_IN_GSTR",
        statusLabel: "Missing in GSTR-2B",
        riskSeverity: "medium",
        notes: "Buyer has not reflected invoice in GSTR-2B. ITC cannot be claimed until filed.",
      });
    }
  });

  // 2. Identify GSTR entries not yet tracked in Settlr
  let unrecordedCount = 0;
  gstrRows.forEach((r) => {
    const key = normalizeInvoiceKey(r.invoiceNumber);
    if (!matchedGstrKeys.has(key)) {
      unrecordedCount++;
      diffItems.push({
        invoiceNumber: r.invoiceNumber,
        buyerName: r.partyName || "Unmapped Buyer",
        buyerGstin: r.supplierOrBuyerGstin,
        systemAmount: 0,
        gstrAmount: r.invoiceValue,
        diffAmount: -r.invoiceValue,
        gstrInvoiceDate: r.invoiceDate,
        status: "UNRECORDED_IN_SYSTEM",
        statusLabel: "Not in Settlr",
        riskSeverity: "low",
        notes: "Invoice reported in GSTR-2B but not currently tracked in your Settlr ledger.",
      });
    }
  });

  const totalSystemValue = systemInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalGstrValue = gstrRows.reduce((sum, i) => sum + i.invoiceValue, 0);
  const reconciliationRate = systemInvoices.length > 0
    ? Math.round((matchedCount / systemInvoices.length) * 100)
    : 100;

  return {
    items: diffItems,
    summary: {
      totalSystemInvoices: systemInvoices.length,
      totalGstrInvoices: gstrRows.length,
      matchedCount,
      mismatchCount,
      missingInGstrCount,
      unrecordedCount,
      totalSystemValue,
      totalGstrValue,
      totalMismatchValue,
      reconciliationRate,
    },
  };
}

/**
 * Parses GSTR-2B / GSTR-3B CSV text into GSTRRow items
 */
export function parseGSTRCsv(csvContent: string): GSTRRow[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  
  // Find column indices
  let invNumIdx = headers.findIndex((h) => h.includes("invoice no") || h.includes("invoice number") || h.includes("inv no") || h.includes("doc no"));
  let gstinIdx = headers.findIndex((h) => h.includes("gstin"));
  let nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("trade") || h.includes("party"));
  let dateIdx = headers.findIndex((h) => h.includes("date"));
  let valIdx = headers.findIndex((h) => h.includes("invoice value") || h.includes("total") || h.includes("value") || h.includes("amount"));
  let taxableIdx = headers.findIndex((h) => h.includes("taxable"));
  let igstIdx = headers.findIndex((h) => h.includes("integrated") || h.includes("igst"));
  let cgstIdx = headers.findIndex((h) => h.includes("central") || h.includes("cgst"));
  let sgstIdx = headers.findIndex((h) => h.includes("state") || h.includes("sgst"));

  if (invNumIdx === -1) invNumIdx = 0;
  if (valIdx === -1) valIdx = 1;

  const rows: GSTRRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseCsvLine(line);
    if (cols.length < 2) continue;

    const invNum = cols[invNumIdx]?.trim();
    const rawVal = cols[valIdx]?.replace(/[^0-9.]/g, "");
    const val = parseFloat(rawVal);

    if (!invNum || isNaN(val) || val <= 0) continue;

    rows.push({
      invoiceNumber: invNum,
      supplierOrBuyerGstin: gstinIdx !== -1 ? cols[gstinIdx]?.trim() || "27AAACR1234A1Z1" : "27AAACR1234A1Z1",
      partyName: nameIdx !== -1 ? cols[nameIdx]?.trim() : undefined,
      invoiceDate: dateIdx !== -1 ? cols[dateIdx]?.trim() : undefined,
      invoiceValue: val,
      taxableValue: taxableIdx !== -1 ? parseFloat(cols[taxableIdx]?.replace(/[^0-9.]/g, "")) || undefined : undefined,
      integratedTax: igstIdx !== -1 ? parseFloat(cols[igstIdx]?.replace(/[^0-9.]/g, "")) || undefined : undefined,
      centralTax: cgstIdx !== -1 ? parseFloat(cols[cgstIdx]?.replace(/[^0-9.]/g, "")) || undefined : undefined,
      stateTax: sgstIdx !== -1 ? parseFloat(cols[sgstIdx]?.replace(/[^0-9.]/g, "")) || undefined : undefined,
      itcAvailable: true,
    });
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuote = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      insideQuote = !insideQuote;
    } else if (c === "," && !insideQuote) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function normalizeInvoiceKey(invNum: string): string {
  if (!invNum) return "";
  return invNum.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

/**
 * Sample GSTR-2B CSV Template for User Download
 */
export const SAMPLE_GSTR2B_CSV = `GSTIN of Supplier,Trade/Legal Name,Invoice Number,Invoice Date,Invoice Value,Taxable Value,Integrated Tax (₹),Central Tax (₹),State/UT Tax (₹),ITC Available
27AABCA9921K1ZZ,Apex Infra Buildcon Pvt Ltd,INV-2024-001,2024-06-15,450000.00,381355.93,0.00,34322.03,34322.03,Yes
27AAGCS1234N1Z8,Shree Ganesh Packaging LLP,INV-2024-002,2024-07-10,215000.00,182203.39,0.00,16398.30,16398.30,Yes
27AABCA9921K1ZZ,Apex Infra Buildcon Pvt Ltd,INV-2024-003,2024-05-20,800000.00,677966.10,0.00,61016.95,61016.95,Yes
27AAACG0567K1Z4,Godrej Industries Ltd,INV-2024-999,2024-07-25,125000.00,105932.20,0.00,9533.90,9533.90,Yes`;
