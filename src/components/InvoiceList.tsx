"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowUpDown, 
  ChevronRight, 
  FileText, 
  History, 
  MoreVertical, 
  IndianRupee, 
  Scale, 
  Image as ImageIcon,
  Building,
  Check,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { type InvoiceCalculations, formatINR } from "@/lib/msme-calculator";

interface Reminder {
  id: string;
  channel: string;
  tone: string;
  subject?: string | null;
  message: string;
  sentAt: string | Date;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerGstin?: string | null;
  amount: number;
  invoiceDate: string | Date;
  paymentTermsDays: number;
  status: string;
  paidAt?: string | Date | null;
  photoUrl?: string | null;
  notes?: string | null;
  reminders: Reminder[];
  calcs: InvoiceCalculations;
}

interface InvoiceListProps {
  invoices: InvoiceItem[];
  onOpenReminder: (invoice: InvoiceItem) => void;
  onOpenHistory: (invoice: InvoiceItem) => void;
  onOpenDetail: (invoice: InvoiceItem) => void;
  onOpenDisputePackage?: (invoiceId: string) => void;
  onOpenFinancing?: (invoice: InvoiceItem) => void;
  onQuickMarkPaid: (id: string) => void;
}

export function InvoiceList({
  invoices,
  onOpenReminder,
  onOpenHistory,
  onOpenDetail,
  onOpenDisputePackage,
  onOpenFinancing,
  onQuickMarkPaid,
}: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "OVERDUE" | "DUE_SOON" | "WITHIN_TERMS" | "PAID">("ALL");
  const [sortBy, setSortBy] = useState<"DUE_DATE" | "AMOUNT_DESC" | "OVERDUE_DAYS" | "INVOICE_DATE">("DUE_DATE");

  // Filtering & Sorting
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Search filter
        const matchesSearch =
          inv.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (inv.buyerGstin && inv.buyerGstin.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        // Status tab filter
        if (activeFilter === "OVERDUE") return inv.calcs.isOverdue && inv.status !== "PAID";
        if (activeFilter === "DUE_SOON")
          return !inv.calcs.isOverdue && inv.calcs.daysRemaining <= 7 && inv.calcs.daysRemaining >= 0 && inv.status !== "PAID";
        if (activeFilter === "WITHIN_TERMS")
          return !inv.calcs.isOverdue && inv.calcs.daysRemaining > 7 && inv.status !== "PAID";
        if (activeFilter === "PAID") return inv.status === "PAID";

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DUE_DATE") {
          // Default: earliest due date first for active, paid last
          if (a.status === "PAID" && b.status !== "PAID") return 1;
          if (a.status !== "PAID" && b.status === "PAID") return -1;
          return new Date(a.calcs.dueDate).getTime() - new Date(b.calcs.dueDate).getTime();
        }
        if (sortBy === "AMOUNT_DESC") {
          return b.amount - a.amount;
        }
        if (sortBy === "OVERDUE_DAYS") {
          return b.calcs.daysOverdue - a.calcs.daysOverdue;
        }
        if (sortBy === "INVOICE_DATE") {
          return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
        }
        return 0;
      });
  }, [invoices, searchTerm, activeFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filter Tabs & Sort */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Buyer name, Invoice #, or GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="DUE_DATE">Sort by: Due Date (Default)</option>
              <option value="AMOUNT_DESC">Sort by: Amount (High to Low)</option>
              <option value="OVERDUE_DAYS">Sort by: Most Overdue</option>
              <option value="INVOICE_DATE">Sort by: Newest Invoice Date</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeFilter === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Invoices ({invoices.length})
          </button>

          <button
            onClick={() => setActiveFilter("OVERDUE")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === "OVERDUE"
                ? "bg-red-600 text-white shadow-2xs"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Overdue ({invoices.filter((i) => i.calcs.isOverdue && i.status !== "PAID").length})
          </button>

          <button
            onClick={() => setActiveFilter("DUE_SOON")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === "DUE_SOON"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Due &le; 7 Days (
            {
              invoices.filter(
                (i) => !i.calcs.isOverdue && i.calcs.daysRemaining <= 7 && i.calcs.daysRemaining >= 0 && i.status !== "PAID"
              ).length
            }
            )
          </button>

          <button
            onClick={() => setActiveFilter("WITHIN_TERMS")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === "WITHIN_TERMS"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Within Terms ({invoices.filter((i) => !i.calcs.isOverdue && i.calcs.daysRemaining > 7 && i.status !== "PAID").length})
          </button>

          <button
            onClick={() => setActiveFilter("PAID")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeFilter === "PAID"
                ? "bg-slate-700 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Paid ({invoices.filter((i) => i.status === "PAID").length})
          </button>
        </div>
      </div>

      {/* Invoice List Items */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="text-base font-bold text-slate-800">No invoices match your filter</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search terms or filter selection.
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const { calcs } = inv;

            // Color-code card border & left accent stripe:
            // Green: within terms (>7d)
            // Yellow: due within 7 days
            // Red: overdue
            let cardBorderColor = "border-slate-200 hover:border-slate-300";
            let accentBarColor = "bg-emerald-500";
            let statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {calcs.urgencyLabel}
              </span>
            );

            if (inv.status === "PAID") {
              accentBarColor = "bg-slate-400";
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <CheckCircle2 className="h-3 w-3 text-slate-500" />
                  Paid
                </span>
              );
            } else if (calcs.isOverdue) {
              cardBorderColor = "border-red-200/90 bg-red-50/10 hover:border-red-300";
              accentBarColor = "bg-red-500";
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  {calcs.urgencyLabel}
                </span>
              );
            } else if (calcs.daysRemaining <= 7) {
              cardBorderColor = "border-amber-200/90 bg-amber-50/10 hover:border-amber-300";
              accentBarColor = "bg-amber-500";
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="h-3 w-3 text-amber-600" />
                  {calcs.urgencyLabel}
                </span>
              );
            }

            return (
              <div
                key={inv.id}
                className={`bg-white rounded-2xl border ${cardBorderColor} shadow-2xs hover:shadow-md transition-all overflow-hidden relative flex flex-col`}
              >
                {/* Left color-coded accent indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentBarColor}`} />

                <div className="p-4 sm:p-5 pl-5 sm:pl-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Buyer & Invoice Identifiers */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        onClick={() => onOpenDetail(inv)}
                        className="font-bold text-base text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {inv.buyerName}
                      </h3>
                      {statusBadge}
                      {inv.photoUrl && (
                        <span
                          title="Original invoice photo attached (Phase 2 OCR Ready)"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          <ImageIcon className="h-3 w-3 text-indigo-500" />
                          Photo
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-700">
                        #{inv.invoiceNumber}
                      </span>
                      <span>
                        Inv Date: <strong className="text-slate-700">{format(new Date(inv.invoiceDate), "dd MMM yyyy")}</strong>
                      </span>
                      <span>
                        Due Date:{" "}
                        <strong
                          className={
                            calcs.isOverdue && inv.status !== "PAID"
                              ? "text-red-600 font-bold"
                              : "text-slate-700 font-semibold"
                          }
                        >
                          {format(new Date(calcs.dueDate), "dd MMM yyyy")}
                        </strong>
                      </span>
                      <span className="text-slate-400">({inv.paymentTermsDays}d MSMED term)</span>
                    </div>

                    {/* Section 16 Statutory MSMED Interest Display */}
                    {calcs.isOverdue && inv.status !== "PAID" ? (
                      <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 p-2 rounded-xl bg-red-50 border border-red-200/80 text-xs">
                        <Scale className="h-4 w-4 text-red-600 shrink-0" />
                        <span className="font-bold text-red-900 tracking-tight">
                          Interest owed: ₹{calcs.interestOwed.toLocaleString("en-IN", { minimumFractionDigits: 2 })} — Section 16, MSMED Act 2006
                        </span>
                        <span className="text-[10px] text-red-700 bg-white/80 px-2 py-0.5 rounded border border-red-200 font-medium">
                          16.5% p.a. monthly compound
                        </span>
                      </div>
                    ) : (
                      calcs.daysRemaining <= 7 && inv.status !== "PAID" && (
                        <div className="mt-1 text-xs text-amber-700 font-medium flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                          Approaching 45-day statutory limit. Send reminder before statutory delay interest triggers.
                        </div>
                      )
                    )}
                  </div>

                  {/* Middle Column: Principal & Total Claim Value */}
                  <div className="flex flex-row lg:flex-col items-baseline lg:items-end justify-between lg:justify-center border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 shrink-0 min-w-[180px]">
                    <div className="text-xs text-slate-400 font-medium">Invoice Value</div>
                    <div className="text-xl font-bold font-mono text-slate-900">
                      {formatINR(inv.amount)}
                    </div>
                    {calcs.isOverdue && inv.status !== "PAID" && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Claim: <span className="font-bold text-red-700 font-mono">{formatINR(calcs.totalClaimAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 shrink-0 flex-wrap lg:flex-nowrap">
                    {/* Need Cash Now Referral Button */}
                    {onOpenFinancing && inv.status !== "PAID" && (
                      <button
                        onClick={() => onOpenFinancing(inv)}
                        title="Get instant liquidity via TReDS factoring"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="hidden xl:inline">Need Cash?</span>
                      </button>
                    )}

                    {/* Generate Dispute Package (for Overdue / >45 days) */}
                    {onOpenDisputePackage && (calcs.isOverdue || calcs.daysElapsed > 45) && inv.status !== "PAID" && (
                      <button
                        onClick={() => onOpenDisputePackage(inv.id)}
                        title="Generate MSME Samadhaan MSEFC dispute package"
                        className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Scale className="h-3.5 w-3.5 text-red-600" />
                        <span className="hidden xl:inline">Dispute Package</span>
                      </button>
                    )}

                    {/* Send Reminder Button */}
                    <button
                      onClick={() => onOpenReminder(inv)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Reminder</span>
                    </button>

                    {/* Quick Mark Paid Action */}
                    {inv.status !== "PAID" ? (
                      <button
                        onClick={() => onQuickMarkPaid(inv.id)}
                        title="Mark invoice as paid"
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-xs font-semibold flex items-center gap-1"
                      >
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span className="hidden sm:inline">Mark Paid</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenDetail(inv)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium"
                      >
                        Settled
                      </button>
                    )}

                    {/* Reminder Audit History */}
                    <button
                      onClick={() => onOpenHistory(inv)}
                      title={`View reminder history (${inv.reminders.length} sent)`}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
                    >
                      <History className="h-4 w-4" />
                      {inv.reminders.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                          {inv.reminders.length}
                        </span>
                      )}
                    </button>

                    {/* Open Full Details */}
                    <button
                      onClick={() => onOpenDetail(inv)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
