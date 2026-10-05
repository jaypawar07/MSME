"use client";

import React from "react";
import { formatINR, InvoiceCalculations } from "@/lib/msme-calculator";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Scale, 
  TrendingUp,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCurrency } from "@/components/ui/animated-counter";

interface InvoiceData {
  id: string;
  amount: number;
  status: string;
  calcs: InvoiceCalculations;
}

interface StatSummaryCardsProps {
  invoices: InvoiceData[];
}

export function StatSummaryCards({ invoices }: StatSummaryCardsProps) {
  const { t, isHindi } = useLanguage();

  // Aggregate statistics
  const activeInvoices = invoices.filter((inv) => inv.status !== "PAID");
  
  const totalOutstanding = activeInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  
  const overdueInvoices = activeInvoices.filter((inv) => inv.calcs.isOverdue);
  const totalOverduePrincipal = overdueInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  
  const totalAccruedInterest = activeInvoices.reduce(
    (acc, inv) => acc + (inv.calcs.interestOwed || 0),
    0
  );
  
  const totalStatutoryClaim = totalOutstanding + totalAccruedInterest;

  const dueSoonInvoices = activeInvoices.filter(
    (inv) => !inv.calcs.isOverdue && inv.calcs.daysRemaining <= 7 && inv.calcs.daysRemaining >= 0
  );
  const totalDueSoon = dueSoonInvoices.reduce((acc, inv) => acc + inv.amount, 0);

  const withinTermsInvoices = activeInvoices.filter(
    (inv) => !inv.calcs.isOverdue && inv.calcs.daysRemaining > 7
  );
  const totalWithinTerms = withinTermsInvoices.reduce((acc, inv) => acc + inv.amount, 0);

  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
  const totalPaid = paidInvoices.reduce((acc, inv) => acc + inv.amount, 0);

  return (
    <div className="space-y-4">
      {/* 4 Top KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overdue Receivables (Rose accent) */}
        <Card className="border-l-4 border-l-rose-500 hover:border-slate-300 relative overflow-hidden transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {t.overdueBeyond45d}
                </span>
              </div>
              <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5">
                {overdueInvoices.length} {isHindi ? "अतिदेय" : "Overdue"}
              </Badge>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              <AnimatedCurrency value={totalOverduePrincipal} />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="font-medium text-rose-600 flex items-center gap-1">
                {isHindi ? "45-दिवसीय सीमा पार" : "Beyond 45-day statutory cap"}
              </span>
              <span className="font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md text-[11px]">
                {isHindi ? "कार्रवाई जरूरी" : "Action Required"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Section 16 MSMED Interest Owed (Dark Premium Treatment Anchor) */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 border border-indigo-700/80 shadow-md shadow-indigo-950/20 relative overflow-hidden group hover:border-indigo-500 transition-all duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-2xs">
                <Scale className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                {t.sec16Interest}
              </span>
            </div>
            <Badge variant="amber" className="text-[10px] font-bold font-mono px-2 py-0.5">
              16.5% Compounded
            </Badge>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight font-mono relative z-10">
            <AnimatedCurrency value={totalAccruedInterest} />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-indigo-200/80 pt-2 border-t border-indigo-800/60 relative z-10">
            <span className="truncate">{t.accruingAt165}</span>
            <span className="font-mono text-amber-400 font-semibold shrink-0 text-[11px]">
              {isHindi ? "3x RBI दर" : "3x RBI Bank Rate"}
            </span>
          </div>
        </div>

        {/* Card 3: Due within 7 Days (Amber accent) */}
        <Card className="border-l-4 border-l-amber-500 hover:border-slate-300 relative overflow-hidden transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {isHindi ? "7 दिनों में देय" : "Due Within 7 Days"}
                </span>
              </div>
              <Badge variant="warning" className="text-[10px] font-bold px-2 py-0.5">
                {dueSoonInvoices.length} {isHindi ? "चालान" : "Invoices"}
              </Badge>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              <AnimatedCurrency value={totalDueSoon} />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="truncate">{isHindi ? "45-दिन सीमा निकट" : "Approaching Day 45"}</span>
              <span className="font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-[11px]">
                {isHindi ? "रिमाइंडर भेजें" : "Send Reminder"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Within Terms (Emerald accent) */}
        <Card className="border-l-4 border-l-emerald-500 hover:border-slate-300 relative overflow-hidden transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {isHindi ? "समय-सीमा के भीतर" : "Within 45-Day Terms"}
                </span>
              </div>
              <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                {withinTermsInvoices.length} {isHindi ? "सुरक्षित" : "Healthy"}
              </Badge>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              <AnimatedCurrency value={totalWithinTerms} />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="truncate">{isHindi ? "सुरक्षित भुगतान चक्र" : "Safe payment cycle"}</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px]">
                {isHindi ? "> 7 दिन शेष" : "> 7 days left"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statutory Claim Banner Strip (Refined Spacing & Visual Depth) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-100 tracking-tight">
                {isHindi
                  ? "कुल वैधानिक विधिक दावा मूल्य (मूल राशि + 16.5% चक्रवृद्धि ब्याज)"
                  : "Total Statutory Legal Claim Value (Principal + 16.5% Compound Interest)"}
              </span>
              <Badge variant="amber" className="text-[10px] font-mono px-2 py-0.5 font-bold">
                {isHindi ? "समाधान पोर्टल तैयार" : "MSEFC Samadhaan Ready"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {isHindi
                ? "45 दिनों के भीतर भुगतान न करने पर खरीदार MSMED अधिनियम 2006 की धारा 16 के तहत मूल राशि + 16.5% मासिक चक्रवृद्धि ब्याज देने हेतु कानूनी रूप से बाध्य है।"
                : "Buyers failing to pay within 45 days are legally liable for the principal plus 16.5% monthly compounded interest under Section 16 of the MSMED Act, 2006."}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right shrink-0 pt-2 md:pt-0 border-t border-slate-800 md:border-none w-full md:w-auto relative z-10">
          <div className="text-xs text-slate-400 font-medium">
            {isHindi ? "कुल वसूली योग्य राशि:" : "Full Recoverable Sum:"}
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono tracking-tight">
            <AnimatedCurrency value={totalStatutoryClaim} />
          </div>
        </div>
      </div>
    </div>
  );
}
