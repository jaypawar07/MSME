import { differenceInCalendarDays, addDays, format, parseISO } from "date-fns";

export interface InvoiceCalculations {
  invoiceDate: Date;
  dueDate: Date;
  daysElapsed: number;
  daysRemaining: number;
  daysOverdue: number;
  isOverdue: boolean;
  statusBadgeColor: "green" | "yellow" | "red" | "emerald" | "purple";
  urgencyLabel: string;
  interestRateAnnual: number;
  interestRateMonthly: number;
  interestOwed: number;
  totalClaimAmount: number;
  rbiCitation: string;
  isStatutoryDelayed: boolean; // Over 45 days
}

export const RBI_BENCHMARK_RATE = 5.5; // Benchmark RBI Bank Rate (%)
export const MSME_PENAL_MULTIPLIER = 3; // 3x RBI Bank Rate
export const MSME_STATUTORY_ANNUAL_RATE = 16.5; // 16.5% annually
export const DEFAULT_TERMS_DAYS = 45; // Section 15 max cap is 45 days

/**
 * Calculates Section 16 MSMED Act compound interest and overdue timing.
 * 
 * Section 16 mandates:
 * - Compound interest with monthly rests (monthly compounding)
 * - 3x the RBI notified Bank Rate (16.5% p.a.)
 * - From the day immediately following the agreed due date (capped at 45 days max under Section 15)
 */
export function calculateMSMEInterest(
  invoiceDateInput: string | Date,
  amount: number,
  paymentTermsDays: number = DEFAULT_TERMS_DAYS,
  status: string = "PENDING",
  asOfDate: Date = new Date()
): InvoiceCalculations {
  const invDate = typeof invoiceDateInput === "string" ? parseISO(invoiceDateInput) : invoiceDateInput;
  const terms = Math.min(Math.max(paymentTermsDays || DEFAULT_TERMS_DAYS, 1), 45); // Max 45 days under Section 15
  const dueDate = addDays(invDate, terms);
  
  const daysElapsed = Math.max(0, differenceInCalendarDays(asOfDate, invDate));
  const daysRemaining = differenceInCalendarDays(dueDate, asOfDate);
  const daysOverdue = Math.max(0, differenceInCalendarDays(asOfDate, dueDate));
  
  const isOverdue = daysOverdue > 0 || status === "OVERDUE";
  const isStatutoryDelayed = daysElapsed > 45 || daysOverdue > 0;

  // Monthly compounding calculation: 16.5% per year -> 1.375% per month
  let interestOwed = 0;
  const annualRate = MSME_STATUTORY_ANNUAL_RATE / 100;
  const monthlyRate = annualRate / 12;

  if (status !== "PAID" && isOverdue && daysOverdue > 0) {
    // Exact compound interest with monthly rests:
    // Full months + prorated days of partial month
    const avgDaysInMonth = 30.4167; // 365 / 12
    const totalMonths = daysOverdue / avgDaysInMonth;
    const compoundMultiplier = Math.pow(1 + monthlyRate, totalMonths);
    interestOwed = amount * (compoundMultiplier - 1);
  }

  // Round interest to nearest 2 decimal places
  interestOwed = Math.round(interestOwed * 100) / 100;
  const totalClaimAmount = Math.round((amount + interestOwed) * 100) / 100;

  // Determine visual color badge & label
  let statusBadgeColor: "green" | "yellow" | "red" | "emerald" | "purple" = "green";
  let urgencyLabel = "Within Terms";

  if (status === "PAID") {
    statusBadgeColor = "emerald";
    urgencyLabel = "Paid";
  } else if (status === "DISPUTED") {
    statusBadgeColor = "purple";
    urgencyLabel = "Disputed";
  } else if (isOverdue) {
    statusBadgeColor = "red";
    urgencyLabel = `${daysOverdue}d Overdue`;
  } else if (daysRemaining <= 7 && daysRemaining >= 0) {
    statusBadgeColor = "yellow";
    urgencyLabel = `Due in ${daysRemaining}d`;
  } else {
    statusBadgeColor = "green";
    urgencyLabel = `${daysRemaining}d left (Safe)`;
  }

  return {
    invoiceDate: invDate,
    dueDate,
    daysElapsed,
    daysRemaining,
    daysOverdue,
    isOverdue,
    statusBadgeColor,
    urgencyLabel,
    interestRateAnnual: MSME_STATUTORY_ANNUAL_RATE,
    interestRateMonthly: Number((monthlyRate * 100).toFixed(3)),
    interestOwed,
    totalClaimAmount,
    rbiCitation: `Interest owed: ₹${interestOwed.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} — Section 16, MSMED Act 2006`,
    isStatutoryDelayed,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}
