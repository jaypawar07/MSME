"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  ShieldAlert, 
  Search, 
  Download, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  Scale, 
  IndianRupee, 
  SlidersHorizontal,
  Info
} from "lucide-react";
import { BuyerRiskDataset, BuyerRiskProfile } from "@/lib/analytics/buyer-risk-aggregator";

interface BuyerRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BuyerRiskModal({ isOpen, onClose }: BuyerRiskModalProps) {
  const [dataset, setDataset] = useState<BuyerRiskDataset | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"overdue" | "risk" | "lateRate" | "invoices">("overdue");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, search, sortBy]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Buyer Payment-Risk Intelligence</h2>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  Admin Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Aggregating habitual late payers and delinquency trends across the MSME supplier network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {dataset && (
            <>
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Buyers Analyzed</span>
                  <span className="text-xl font-extrabold text-slate-900">{dataset.summary.totalBuyersTracked}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Corporate debtors</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50/50 border border-red-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-red-700 block mb-1">High Risk Buyers</span>
                  <span className="text-xl font-extrabold text-red-800">{dataset.summary.highRiskBuyersCount}</span>
                  <span className="text-[10px] text-red-700 block mt-0.5">Frequent &gt;45d delay</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">Total Overdue Capital</span>
                  <span className="text-xl font-extrabold text-amber-900">₹{dataset.summary.totalSystemOverdueValue.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">Blocked supplier cash</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-1">Accrued Sec 16 Interest</span>
                  <span className="text-xl font-extrabold text-indigo-900">₹{dataset.summary.totalAccruedPenalInterest.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-indigo-700 block mt-0.5">@ 16.5% p.a. compound</span>
                </div>
              </div>

              {/* Controls Bar: Search, Sorting, Export */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative w-full sm:w-72">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search buyer name or GSTIN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    <span>Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none"
                    >
                      <option value="overdue">Total Overdue (₹)</option>
                      <option value="risk">Risk Score (High to Low)</option>
                      <option value="lateRate">Late Rate (%)</option>
                      <option value="invoices">Invoice Volume</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-amber-400 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Risk Matrix Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Risk Tier</th>
                        <th className="py-2.5 px-3">Buyer Enterprise</th>
                        <th className="py-2.5 px-3">Invoices</th>
                        <th className="py-2.5 px-3">Late Payment Rate</th>
                        <th className="py-2.5 px-3">Overdue Value (₹)</th>
                        <th className="py-2.5 px-3">Sec 16 Interest</th>
                        <th className="py-2.5 px-3">Avg Delay</th>
                        <th className="py-2.5 px-3">Risk Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataset.buyers.map((buyer, idx) => (
                        <tr
                          key={idx}
                          className={
                            buyer.riskTier === "HIGH"
                              ? "bg-red-50/40 hover:bg-red-50/70"
                              : buyer.riskTier === "MODERATE"
                              ? "bg-amber-50/30 hover:bg-amber-50/60"
                              : "bg-white hover:bg-slate-50/80"
                          }
                        >
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block max-w-[200px] truncate">
                              {buyer.buyerName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {buyer.buyerGstins[0] || "GSTIN unlisted"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {buyer.totalInvoices} <span className="text-[10px] text-slate-400">({buyer.overdueInvoices} late)</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold">
                            <span className={buyer.latePaymentRate >= 50 ? "text-red-600" : buyer.latePaymentRate >= 20 ? "text-amber-600" : "text-emerald-600"}>
                              {buyer.latePaymentRate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            ₹{buyer.totalOverdueValue.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-red-700">
                            ₹{buyer.totalAccruedInterest.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {buyer.avgDaysOverdue > 0 ? `${buyer.avgDaysOverdue} days` : "On Time"}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    buyer.riskScore >= 60 ? "bg-red-600" : buyer.riskScore >= 30 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${buyer.riskScore}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-bold text-slate-700">{buyer.riskScore}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span>Dataset aggregates payment performance across all MSME supplier receivables in Settlr.</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
