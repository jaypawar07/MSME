/**
 * Multi-format CSV Parser for MSME Invoices
 * Supports Tally Prime/ERP, Zoho Books, and Settlr Standard CSV exports
 * with automated column detection, date normalization, and de-duplication.
 */

export interface ParsedInvoiceRow {
  index: number;
  invoiceNumber: string;
  buyerName: string;
  amount: number;
  invoiceDate: string; // ISO format YYYY-MM-DD
  paymentTermsDays: number;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerGstin?: string | null;
  notes?: string | null;
  isDuplicate?: boolean;
  duplicateReason?: string;
  isValid: boolean;
  error?: string;
}

export interface CSVParseResult {
  detectedFormat: "tally" | "zoho" | "settlr_standard" | "generic";
  rows: ParsedInvoiceRow[];
  stats: {
    totalRows: number;
    validNewCount: number;
    duplicateCount: number;
    invalidCount: number;
  };
}

/**
 * Parses raw CSV string and normalizes rows into standard format
 */
export function parseInvoiceCSV(
  csvContent: string,
  existingInvoiceNumbers: string[] = []
): CSVParseResult {
  const lines = parseCSVToRows(csvContent);
  if (lines.length < 2) {
    return {
      detectedFormat: "generic",
      rows: [],
      stats: { totalRows: 0, validNewCount: 0, duplicateCount: 0, invalidCount: 0 },
    };
  }

  const rawHeaders = lines[0].map((h) => h.trim().toLowerCase());
  const headerMap = detectColumnMapping(rawHeaders);
  const detectedFormat = detectFormatType(rawHeaders);

  const existingLowerSet = new Set(existingInvoiceNumbers.map((num) => num.trim().toLowerCase()));
  const seenInFileSet = new Set<string>();

  const rows: ParsedInvoiceRow[] = [];
  let validNewCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) {
      continue; // Skip blank lines
    }

    const getVal = (colIndex: number | undefined): string => {
      if (colIndex === undefined || colIndex >= row.length) return "";
      return row[colIndex]?.trim() || "";
    };

    const invoiceNumber = getVal(headerMap.invoiceNumber);
    const buyerName = getVal(headerMap.buyerName);
    const rawAmount = getVal(headerMap.amount);
    const rawDate = getVal(headerMap.invoiceDate);
    const rawDueDate = getVal(headerMap.dueDate);
    const rawTerms = getVal(headerMap.paymentTermsDays);
    const buyerEmail = getVal(headerMap.buyerEmail) || null;
    const buyerPhone = getVal(headerMap.buyerPhone) || null;
    const buyerGstin = getVal(headerMap.buyerGstin)?.toUpperCase() || null;
    const notes = getVal(headerMap.notes) || null;

    // Validate Required Fields
    let isValid = true;
    let error: string | undefined;

    if (!invoiceNumber) {
      isValid = false;
      error = "Missing Invoice Number";
    } else if (!buyerName) {
      isValid = false;
      error = "Missing Buyer Name";
    }

    // Clean Amount
    const amount = parseNumber(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      isValid = false;
      error = error || "Invalid or Zero Amount";
    }

    // Parse Date
    const isoDate = parseFlexibleDate(rawDate);
    if (!isoDate) {
      isValid = false;
      error = error || "Invalid Date Format";
    }

    // Determine Terms (Default to 45 or diff between Date and Due Date, max 45 as per MSMED Act Section 15)
    let paymentTermsDays = 45;
    if (rawTerms) {
      const parsedTerms = parseInt(rawTerms.replace(/\D/g, ""), 10);
      if (!isNaN(parsedTerms) && parsedTerms > 0) {
        paymentTermsDays = Math.min(parsedTerms, 45);
      }
    } else if (rawDueDate && isoDate) {
      const dueIso = parseFlexibleDate(rawDueDate);
      if (dueIso) {
        const d1 = new Date(isoDate);
        const d2 = new Date(dueIso);
        const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) {
          paymentTermsDays = Math.min(diff, 45);
        }
      }
    }

    // Check De-duplication
    let isDuplicate = false;
    let duplicateReason: string | undefined;

    const lowerInvNum = invoiceNumber.toLowerCase();
    if (existingLowerSet.has(lowerInvNum)) {
      isDuplicate = true;
      duplicateReason = "Already exists in database";
    } else if (seenInFileSet.has(lowerInvNum)) {
      isDuplicate = true;
      duplicateReason = "Duplicate within this CSV";
    }

    if (isValid) {
      if (isDuplicate) {
        duplicateCount++;
      } else {
        validNewCount++;
        seenInFileSet.add(lowerInvNum);
      }
    } else {
      invalidCount++;
    }

    rows.push({
      index: i,
      invoiceNumber: invoiceNumber || `ROW-${i}`,
      buyerName: buyerName || "Unknown Buyer",
      amount: isNaN(amount) ? 0 : amount,
      invoiceDate: isoDate || new Date().toISOString().split("T")[0],
      paymentTermsDays,
      buyerEmail,
      buyerPhone,
      buyerGstin,
      notes,
      isDuplicate,
      duplicateReason,
      isValid,
      error,
    });
  }

  return {
    detectedFormat,
    rows,
    stats: {
      totalRows: rows.length,
      validNewCount,
      duplicateCount,
      invalidCount,
    },
  };
}

/**
 * Parses raw CSV lines handling quoted values with commas
 */
function parseCSVToRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === "," && !insideQuote) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuote) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

interface ColumnMapping {
  invoiceNumber?: number;
  buyerName?: number;
  amount?: number;
  invoiceDate?: number;
  dueDate?: number;
  paymentTermsDays?: number;
  buyerEmail?: number;
  buyerPhone?: number;
  buyerGstin?: number;
  notes?: number;
}

function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  headers.forEach((h, idx) => {
    // Invoice Number
    if (/^(invoice\s*no|invoice\s*number|inv\s*no|voucher\s*no|bill\s*no|vch\s*no)$/i.test(h)) {
      mapping.invoiceNumber = idx;
    }
    // Buyer Name
    else if (/^(buyer|customer|party\s*name|party|customer\s*name|billed\s*to|client)$/i.test(h)) {
      mapping.buyerName = idx;
    }
    // Amount
    else if (/^(amount|total|grand\s*total|invoice\s*amount|debit|net\s*amount|bill\s*amount)$/i.test(h)) {
      mapping.amount = idx;
    }
    // Invoice Date
    else if (/^(date|invoice\s*date|bill\s*date|vch\s*date|voucher\s*date)$/i.test(h)) {
      mapping.invoiceDate = idx;
    }
    // Due Date
    else if (/^(due\s*date|payment\s*due\s*date|credit\s*due)$/i.test(h)) {
      mapping.dueDate = idx;
    }
    // Terms
    else if (/^(terms|payment\s*terms|credit\s*days|terms\s*\(days\)|credit\s*period)$/i.test(h)) {
      mapping.paymentTermsDays = idx;
    }
    // Email
    else if (/^(email|buyer\s*email|customer\s*email|party\s*email)$/i.test(h)) {
      mapping.buyerEmail = idx;
    }
    // Phone
    else if (/^(phone|mobile|buyer\s*phone|contact|telephone)$/i.test(h)) {
      mapping.buyerPhone = idx;
    }
    // GSTIN
    else if (/^(gstin|gst\s*number|buyer\s*gstin|party\s*gstin|gst\s*identification\s*number)$/i.test(h)) {
      mapping.buyerGstin = idx;
    }
    // Notes / Narration
    else if (/^(notes|narration|remarks|description|item\s*description)$/i.test(h)) {
      mapping.notes = idx;
    }
  });

  // Fallback defaults if exact match wasn't found
  if (mapping.invoiceNumber === undefined) {
    const i = headers.findIndex((h) => h.includes("inv") || h.includes("voucher") || h.includes("bill") || h.includes("no"));
    if (i !== -1) mapping.invoiceNumber = i;
  }
  if (mapping.buyerName === undefined) {
    const i = headers.findIndex((h) => h.includes("party") || h.includes("customer") || h.includes("buyer") || h.includes("name"));
    if (i !== -1) mapping.buyerName = i;
  }
  if (mapping.amount === undefined) {
    const i = headers.findIndex((h) => h.includes("amount") || h.includes("total") || h.includes("debit") || h.includes("val"));
    if (i !== -1) mapping.amount = i;
  }
  if (mapping.invoiceDate === undefined) {
    const i = headers.findIndex((h) => h.includes("date"));
    if (i !== -1) mapping.invoiceDate = i;
  }

  return mapping;
}

function detectFormatType(headers: string[]): "tally" | "zoho" | "settlr_standard" | "generic" {
  const headerStr = headers.join(" ");
  if (headerStr.includes("voucher no") || headerStr.includes("party name") || headerStr.includes("narration")) {
    return "tally";
  }
  if (headerStr.includes("customer name") || headerStr.includes("gst identification number") || headerStr.includes("zoho")) {
    return "zoho";
  }
  if (headerStr.includes("invoicenumber") && headerStr.includes("paymenttermsdays")) {
    return "settlr_standard";
  }
  return "generic";
}

function parseNumber(val: string): number {
  if (!val) return NaN;
  const clean = val.replace(/[^0-9.-]/g, "");
  return parseFloat(clean);
}

function parseFlexibleDate(val: string): string | null {
  if (!val) return null;
  const clean = val.trim();

  // 1. ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 3. Fallback: native Date.parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Sample CSV Templates for Users to Download
 */
export const SAMPLE_CSV_TEMPLATES = {
  settlr: `invoiceNumber,buyerName,amount,invoiceDate,paymentTermsDays,buyerEmail,buyerPhone,buyerGstin,notes
INV-2024-101,Apex Infra Buildcon Pvt Ltd,850000,2024-07-15,45,finance@apexbuildcon.com,+919820033003,27AABCA9921K1ZZ,Structural steel supplies
INV-2024-102,TechNova Automation Systems,430000,2024-08-01,30,accounts@technova.com,+919833011222,27AACCT4421M1Z1,Industrial sensor controllers
INV-2024-103,Shree Ganesh Packaging LLP,215000,2024-08-10,45,billing@ganeshpack.com,+919811099887,27AAGCS1234N1Z8,Corrugated boxes lot 4`,

  tally: `Voucher No.,Party Name,Date,Due Date,Amount,Party GSTIN,Narration
INV-2024-201,Larsen & Toubro Ltd,15-06-2024,30-07-2024,1250000,27AAACL0123M1Z2,Fabricated components
INV-2024-202,Tata Motors Commercial,20-07-2024,04-09-2024,675000,27AAACT2727Q1ZW,Die-cast brackets`,

  zoho: `Invoice Number,Customer Name,Invoice Date,Due Date,Total,Customer Email,Customer Phone,GSTIN
INV-2024-301,Godrej & Boyce Mfg Co,2024-07-05,2024-08-19,540000,accounts@godrej.com,+919820011111,27AAACG0567K1Z4
INV-2024-302,Mahindra Logistics Ltd,2024-07-22,2024-09-05,380000,payments@mahindra.com,+919820022222,27AAACM1234P1Z5`,
};
