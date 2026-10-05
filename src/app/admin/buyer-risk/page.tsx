"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  ShieldAlert, 
  Search, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  Scale, 
  IndianRupee, 
  SlidersHorizontal,
  ArrowLeft,
  Info
} from "lucide-react";
import Link from "next/link";
import { BuyerRiskDataset } from "@/lib/analytics/buyer-risk-aggregator";

export default function BuyerRiskAdminPage() {
  const [dataset, setDataset] = useState<BuyerRiskDataset | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"overdue" | "risk" | "lateRate" | "invoices">("overdue");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (search) query.set("q", search);
        query.set("sortBy", sortBy);

        const res = await fetch(`/api/admin/buyer-risk?${query.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load buyer risk analytics");
        }
        setDataset(data.dataset);
      } catch (err: any) {
        setError(err.message || "Failed to retrieve buyer risk dataset");
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, [search, sortBy]);

  const handleExportCSV = () => {
    if (!dataset || dataset.buyers.length === 0) return;

    const headers = [
      "Buyer Name",
      "GSTIN",
      "Total Invoices",
      "Overdue Invoices",
      "Late Payment Rate (%)",
      "Total Invoice Value (INR)",
      "Total Overdue Amount (INR)",
      "Accrued Sec 16 Interest (INR)",
      "Avg Days Overdue",
      "Risk Tier",
      "Risk Score (0-100)",
    ];

    const rows = dataset.buyers.map((b) => [
      `"${b.buyerName.replace(/"/g, '""')}"`,
      `"${b.buyerGstins.join("; ")}"`,
      b.totalInvoices,
      b.overdueInvoices,
      b.latePaymentRate,
      b.totalInvoiceValue,
      b.totalOverdueValue,
      b.totalAccruedInterest,
      b.avgDaysOverdue,
      b.riskTier,
      b.riskScore,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `settlr_buyer_payment_risk_dataset_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Supplier Dashboard</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Buyer Payment-Risk Intelligence
                </h1>
                <p className="text-xs text-slate-500">
                  Aggregated B2B late-payer analytics &amp; delinquency tracking across all MSME receivables
                </p>
              </div>
            </div>
          </div>

          {dataset && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-amber-400 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export Risk CSV</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Aggregating cross-supplier late payer profiles and risk scores...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : dataset ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Buyers Analyzed</span>
                <span className="text-2xl font-extrabold text-slate-900">{dataset.summary.totalBuyersTracked}</span>
                <span className="text-xs text-slate-500 block mt-0.5">Corporate debtors</span>
              </div>

              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200 shadow-xs">
                <span className="text-xs uppercase font-bold text-red-700 block mb-1">High Risk Buyers</span>
                <span className="text-2xl font-extrabold text-red-800">{dataset.summary.highRiskBuyersCount}</span>
                <span className="text-xs text-red-700 block mt-0.5">&gt;50% delinquency rate</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-xs">
                <span className="text-xs uppercase font-bold text-amber-700 block mb-1">Total Overdue Value</span>
                <span className="text-2xl font-extrabold text-amber-900">₹{dataset.summary.totalSystemOverdueValue.toLocaleString("en-IN")}</span>
                <span className="text-xs text-amber-700 block mt-0.5">Blocked across suppliers</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 shadow-xs">
                <span className="text-xs uppercase font-bold text-indigo-700 block mb-1">Accrued Sec 16 Interest</span>
                <span className="text-2xl font-extrabold text-indigo-900">₹{dataset.summary.totalAccruedPenalInterest.toLocaleString("en-IN")}</span>
                <span className="text-xs text-indigo-700 block mt-0.5">@ 16.5% p.a. compound</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search buyer company name or GSTIN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-xs text-slate-600">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none"
                >
                  <option value="overdue">Total Overdue (₹)</option>
                  <option value="risk">Risk Score (High to Low)</option>
                  <option value="lateRate">Late Payment Rate (%)</option>
                  <option value="invoices">Invoice Volume</option>
                </select>
              </div>
            </div>

            {/* Risk Dataset Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-4">Risk Tier</th>
                      <th className="py-3 px-4">Buyer Enterprise</th>
                      <th className="py-3 px-4">Invoices Tracked</th>
                      <th className="py-3 px-4">Late Rate</th>
                      <th className="py-3 px-4">Total Overdue Amount</th>
                      <th className="py-3 px-4">Accrued Sec 16 Interest</th>
                      <th className="py-3 px-4">Average Delay</th>
                      <th className="py-3 px-4">Delinquency Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataset.buyers.map((buyer, idx) => (
                      <tr
                        key={idx}
                        className={
                          buyer.riskTier === "HIGH"
                            ? "bg-red-50/30 hover:bg-red-50/60"
                            : buyer.riskTier === "MODERATE"
                            ? "bg-amber-50/20 hover:bg-amber-50/50"
                            : "hover:bg-slate-50/80"
                        }
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              buyer.riskTier === "HIGH"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : buyer.riskTier === "MODERATE"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {buyer.riskTier === "HIGH" ? "🔴 High Risk" : buyer.riskTier === "MODERATE" ? "🟡 Moderate" : "🟢 Low Risk"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block text-sm">
                            {buyer.buyerName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {buyer.buyerGstins[0] || "GSTIN unlisted"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {buyer.totalInvoices} <span className="text-[11px] text-slate-400 font-normal">({buyer.overdueInvoices} overdue)</span>
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <span className={buyer.latePaymentRate >= 50 ? "text-red-600" : buyer.latePaymentRate >= 20 ? "text-amber-600" : "text-emerald-600"}>
                            {buyer.latePaymentRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          ₹{buyer.totalOverdueValue.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-bold text-red-700 text-sm">
                          ₹{buyer.totalAccruedInterest.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {buyer.avgDaysOverdue > 0 ? `${buyer.avgDaysOverdue} days` : "On Time"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${
                                  buyer.riskScore >= 60 ? "bg-red-600" : buyer.riskScore >= 30 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${buyer.riskScore}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-800">{buyer.riskScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
