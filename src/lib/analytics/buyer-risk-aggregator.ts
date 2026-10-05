/**
 * Buyer Payment-Risk Aggregator & Analytics Engine
 * Identifies habitual late-paying corporate buyers across MSME invoices in the ecosystem.
 * Foundation for the Settlr B2B credit & payment-risk dataset.
 */

import { calculateMSMEInterest } from "@/lib/msme-calculator";

export interface BuyerRiskProfile {
  buyerName: string;
  normalizedName: string;
  buyerGstins: string[];
  totalInvoices: number;
  overdueInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  latePaymentRate: number; // percentage (overdue / total)
  totalInvoiceValue: number;
  totalOverdueValue: number;
  totalAccruedInterest: number;
  avgDaysOverdue: number;
  maxDaysOverdue: number;
  suppliersImpactedCount: number;
  riskTier: "HIGH" | "MODERATE" | "LOW";
  riskScore: number; // 0 (Low risk) to 100 (Severe delinquency)
  sampleInvoiceNumbers: string[];
}

export interface BuyerRiskDataset {
  buyers: BuyerRiskProfile[];
  summary: {
    totalBuyersTracked: number;
    highRiskBuyersCount: number;
    moderateRiskBuyersCount: number;
    lowRiskBuyersCount: number;
    totalSystemOverdueValue: number;
    totalAccruedPenalInterest: number;
    avgSystemLateRate: number;
  };
}

/**
 * Aggregates raw invoices into structured buyer risk profiles
 */
export function aggregateBuyerPaymentRisk(
  invoices: Array<{
    id: string;
    userId: string;
    buyerName: string;
    buyerGstin?: string | null;
    invoiceNumber: string;
    amount: number;
    invoiceDate: Date | string;
    paymentTermsDays: number;
    status: string;
  }>,
  asOfDate: Date = new Date()
): BuyerRiskDataset {
  const buyerMap = new Map<
    string,
    {
      displayName: string;
      gstins: Set<string>;
      invoices: Array<{
        amount: number;
        status: string;
        isOverdue: boolean;
        daysOverdue: number;
        interestOwed: number;
        invoiceNumber: string;
        userId: string;
      }>;
    }
  >();

  invoices.forEach((inv) => {
    const norm = inv.buyerName.trim().toLowerCase();
    if (!norm) return;

    const calcs = calculateMSMEInterest(
      inv.invoiceDate,
      inv.amount,
      inv.paymentTermsDays,
      inv.status,
      asOfDate
    );

    if (!buyerMap.has(norm)) {
      buyerMap.set(norm, {
        displayName: inv.buyerName.trim(),
        gstins: new Set(),
        invoices: [],
      });
    }

    const group = buyerMap.get(norm)!;
    if (inv.buyerGstin) group.gstins.add(inv.buyerGstin.trim().toUpperCase());

    group.invoices.push({
      amount: inv.amount,
      status: inv.status,
      isOverdue: calcs.isOverdue && inv.status !== "PAID",
      daysOverdue: calcs.daysOverdue,
      interestOwed: calcs.interestOwed,
      invoiceNumber: inv.invoiceNumber,
      userId: inv.userId,
    });
  });

  const profiles: BuyerRiskProfile[] = [];
  let highRiskCount = 0;
  let modRiskCount = 0;
  let lowRiskCount = 0;
  let totalOverdueValue = 0;
  let totalInterest = 0;

  buyerMap.forEach((group, normName) => {
    const totalInvs = group.invoices.length;
    const overdueInvs = group.invoices.filter((i) => i.isOverdue);
    const paidInvs = group.invoices.filter((i) => i.status === "PAID");
    const pendingInvs = group.invoices.filter((i) => i.status === "PENDING" && !i.isOverdue);

    const totalVal = group.invoices.reduce((sum, i) => sum + i.amount, 0);
    const overdueVal = overdueInvs.reduce((sum, i) => sum + i.amount, 0);
    const accruedInt = overdueInvs.reduce((sum, i) => sum + i.interestOwed, 0);

    const lateRate = totalInvs > 0 ? Math.round((overdueInvs.length / totalInvs) * 100) : 0;
    const totalDaysOverdue = overdueInvs.reduce((sum, i) => sum + i.daysOverdue, 0);
    const avgDays = overdueInvs.length > 0 ? Math.round(totalDaysOverdue / overdueInvs.length) : 0;
    const maxDays = overdueInvs.reduce((max, i) => Math.max(max, i.daysOverdue), 0);

    const distinctSuppliers = new Set(group.invoices.map((i) => i.userId)).size;

    // Calculate Risk Score (0-100)
    // Formula weighting: late rate (40%), average delay days (30%), overdue amount scale (30%)
    const rateComponent = (lateRate / 100) * 40;
    const delayComponent = Math.min((avgDays / 60) * 30, 30);
    const valueComponent = Math.min((overdueVal / 1000000) * 30, 30);
    const riskScore = Math.min(100, Math.round(rateComponent + delayComponent + valueComponent));

    let riskTier: "HIGH" | "MODERATE" | "LOW" = "LOW";
    if (riskScore >= 60 || lateRate >= 50 || avgDays >= 30) {
      riskTier = "HIGH";
      highRiskCount++;
    } else if (riskScore >= 25 || lateRate >= 20 || overdueInvs.length > 0) {
      riskTier = "MODERATE";
      modRiskCount++;
    } else {
      lowRiskCount++;
    }

    totalOverdueValue += overdueVal;
    totalInterest += accruedInt;

    profiles.push({
      buyerName: group.displayName,
      normalizedName: normName,
      buyerGstins: Array.from(group.gstins),
      totalInvoices: totalInvs,
      overdueInvoices: overdueInvs.length,
      paidInvoices: paidInvs.length,
      pendingInvoices: pendingInvs.length,
      latePaymentRate: lateRate,
      totalInvoiceValue: totalVal,
      totalOverdueValue: overdueVal,
      totalAccruedInterest: Math.round(accruedInt * 100) / 100,
      avgDaysOverdue: avgDays,
      maxDaysOverdue: maxDays,
      suppliersImpactedCount: distinctSuppliers,
      riskTier,
      riskScore,
      sampleInvoiceNumbers: group.invoices.map((i) => i.invoiceNumber).slice(0, 5),
    });
  });

  // Sort descending by total overdue value and risk score
  profiles.sort((a, b) => b.totalOverdueValue - a.totalOverdueValue || b.riskScore - a.riskScore);

  const avgLateRate = profiles.length > 0
    ? Math.round(profiles.reduce((sum, p) => sum + p.latePaymentRate, 0) / profiles.length)
    : 0;

  return {
    buyers: profiles,
    summary: {
      totalBuyersTracked: profiles.length,
      highRiskBuyersCount: highRiskCount,
      moderateRiskBuyersCount: modRiskCount,
      lowRiskBuyersCount: lowRiskCount,
      totalSystemOverdueValue: totalOverdueValue,
      totalAccruedPenalInterest: Math.round(totalInterest * 100) / 100,
      avgSystemLateRate: avgLateRate,
    },
  };
}
