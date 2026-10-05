"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  Filter, 
  Loader2, 
  Scale, 
  IndianRupee,
  ShieldCheck,
  Info
} from "lucide-react";
import { 
  GSTReconciliationResult, 
  GSTDiffItem, 
  SAMPLE_GSTR2B_CSV, 
  parseGSTRCsv, 
  reconcileInvoicesWithGSTR 
} from "@/lib/gst/gst-reconciler";

interface GSTReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: any[];
}

export function GSTReconciliationModal({
  isOpen,
  onClose,
  invoices,
}: GSTReconciliationModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<GSTReconciliationResult | null>(null);
  const [filter, setFilter] = useState<"ALL" | "MATCHED" | "MISMATCH_AMOUNT" | "MISSING_IN_GSTR">("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseGSTRCsv(text);
        const recon = reconcileInvoicesWithGSTR(
          invoices.map((i) => ({
            invoiceNumber: i.invoiceNumber,
            buyerName: i.buyerName,
            buyerGstin: i.buyerGstin,
            amount: i.amount,
            invoiceDate: i.invoiceDate,
          })),
          parsed
        );
        setResult(recon);
      } catch (err: any) {
        setError(err.message || "Failed to process GSTR-2B file");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the uploaded CSV file");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_GSTR2B_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_gstr_2b_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = result
    ? result.items.filter((item) => {
        if (filter === "ALL") return true;
        return item.status === filter;
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">GST Reconciliation (GSTR-2B / 3B)</h2>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  Section 43B(h) &amp; ITC Match
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Diff table comparing system invoices against buyer GSTR-2B filings
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

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Area & Sample Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-5 flex flex-col items-center justify-center text-center hover:bg-indigo-50/50 transition-all">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv, text/csv"
                className="hidden"
              />
              <div className="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 shadow-xs">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 mb-1">
                {fileName ? `Uploaded: ${fileName}` : "Upload GSTR-2B / GSTR-3B CSV Export"}
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Drop your GST portal B2B invoice return export to reconcile amounts &amp; ITC eligibility.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs flex items-center gap-1.5"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{fileName ? "Upload Different CSV" : "Select GSTR File"}</span>
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Need a sample GSTR-2B?</span>
                <p className="text-[11px] text-slate-500 mb-3">
                  Download a pre-formatted sample with matching and mismatching invoices to test reconciliation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Download Sample GSTR-2B</span>
              </button>
            </div>
          </div>

          {/* Reconciliation Results Section */}
          {result && (
            <div className="space-y-4">
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reconciliation Score</span>
                  <span className="text-xl font-extrabold text-slate-900">{result.summary.reconciliationRate}%</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{result.summary.matchedCount} of {result.summary.totalSystemInvoices} matched</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Matched in GSTR</span>
                  <span className="text-xl font-extrabold text-emerald-800">{result.summary.matchedCount}</span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">ITC Claim Safe</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50/50 border border-red-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-red-700 block mb-1">Value Mismatches</span>
                  <span className="text-xl font-extrabold text-red-800">{result.summary.mismatchCount}</span>
                  <span className="text-[10px] text-red-700 block mt-0.5">₹{result.summary.totalMismatchValue.toLocaleString("en-IN")} Diff</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">Missing in 2B</span>
                  <span className="text-xl font-extrabold text-amber-800">{result.summary.missingInGstrCount}</span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">Buyer Unfiled / Risk</span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                  <Filter className="h-3.5 w-3.5" /> Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    filter === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  All ({result.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("MATCHED")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    filter === "MATCHED" ? "bg-emerald-600 text-white" : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  Matched ({result.summary.matchedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("MISMATCH_AMOUNT")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    filter === "MISMATCH_AMOUNT" ? "bg-red-600 text-white" : "text-red-700 hover:bg-red-50"
                  }`}
                >
                  Mismatches ({result.summary.mismatchCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("MISSING_IN_GSTR")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    filter === "MISSING_IN_GSTR" ? "bg-amber-600 text-white" : "text-amber-700 hover:bg-amber-50"
                  }`}
                >
                  Missing in 2B ({result.summary.missingInGstrCount})
                </button>
              </div>

              {/* Diff Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Buyer / GSTIN</th>
                        <th className="py-2.5 px-3">Settlr Amount</th>
                        <th className="py-2.5 px-3">GSTR-2B Amount</th>
                        <th className="py-2.5 px-3">Variance</th>
                        <th className="py-2.5 px-3">Compliance Guidance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className={
                            item.status === "MISMATCH_AMOUNT"
                              ? "bg-red-50/40"
                              : item.status === "MISSING_IN_GSTR"
                              ? "bg-amber-50/30"
                              : "bg-white hover:bg-slate-50/80"
                          }
                        >
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.status === "MATCHED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.status === "MISMATCH_AMOUNT"
                                  ? "bg-red-100 text-red-800"
                                  : item.status === "MISSING_IN_GSTR"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {item.statusLabel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                            {item.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-800 block truncate max-w-[150px]">
                              {item.buyerName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.buyerGstin || "No GSTIN"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.systemAmount > 0 ? `₹${item.systemAmount.toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {item.gstrAmount > 0 ? `₹${item.gstrAmount.toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs">
                            {item.diffAmount !== 0 ? (
                              <span className={item.diffAmount > 0 ? "text-red-600 font-bold" : "text-amber-600 font-bold"}>
                                {item.diffAmount > 0 ? `+₹${item.diffAmount.toLocaleString("en-IN")}` : `-₹${Math.abs(item.diffAmount).toLocaleString("en-IN")}`}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">₹0.00</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-[220px]">
                            {item.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span>Reconciliation helps identify unfiled buyer invoices impacting Section 43B(h) deductibility.</span>
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
