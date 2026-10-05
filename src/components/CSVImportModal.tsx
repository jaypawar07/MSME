"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Download, 
  Layers, 
  Check, 
  AlertTriangle,
  ArrowRight,
  Info
} from "lucide-react";
import { 
  parseInvoiceCSV, 
  type ParsedInvoiceRow, 
  type CSVParseResult, 
  SAMPLE_CSV_TEMPLATES 
} from "@/lib/csv/invoice-csv-parser";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingInvoices: Array<{ invoiceNumber: string }>;
}

export function CSVImportModal({
  isOpen,
  onClose,
  onSuccess,
  existingInvoices,
}: CSVImportModalProps) {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      processCSVContent(content);
    };
    reader.onerror = () => {
      setError("Failed to read the uploaded CSV file");
    };
    reader.readAsText(file);
  };

  const processCSVContent = (content: string) => {
    try {
      const existingNumbers = existingInvoices.map((inv) => inv.invoiceNumber);
      const result = parseInvoiceCSV(content, existingNumbers);
      setParseResult(result);

      if (result.rows.length === 0) {
        setError("The uploaded CSV does not contain any valid data rows.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV format.");
    }
  };

  const handleDownloadSample = (formatKey: "settlr" | "tally" | "zoho") => {
    const content = SAMPLE_CSV_TEMPLATES[formatKey];
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sample_invoices_${formatKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.stats.validNewCount === 0) {
      setError("No valid new invoices available to import.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validRows = parseResult.rows.filter((r) => r.isValid && !r.isDuplicate);

      const res = await fetch("/api/invoices/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import invoices");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Invoices via CSV</h2>
              <p className="text-xs text-slate-500">
                Bulk import receivables from Tally Prime, Zoho Books, or standard spreadsheets
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

          {/* Upload Area & Sample Template Downloads */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Drag & Drop Area */}
            <div className="md:col-span-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-5 flex flex-col items-center justify-center text-center hover:bg-indigo-50/20 hover:border-indigo-400 transition-all">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv, text/csv"
                className="hidden"
              />
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-xs">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 mb-1">
                {fileName ? `Selected: ${fileName}` : "Click to select or drop CSV file"}
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Supports Tally voucher exports, Zoho Books CSV, or custom billing tables.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs"
              >
                {fileName ? "Change CSV File" : "Browse File"}
              </button>
            </div>

            {/* Sample Templates Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Sample Templates</span>
                <p className="text-[11px] text-slate-500 mb-3">
                  Download pre-formatted templates matching your accounting software:
                </p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadSample("tally")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-medium flex items-center justify-between text-[11px]"
                  >
                    <span>Tally Prime / ERP Format</span>
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample("zoho")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-medium flex items-center justify-between text-[11px]"
                  >
                    <span>Zoho Books CSV</span>
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample("settlr")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-medium flex items-center justify-between text-[11px]"
                  >
                    <span>Settlr Standard CSV</span>
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar (When Parsed) */}
          {parseResult && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/80 p-3 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    Detected Format:
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px] font-semibold text-indigo-700 uppercase">
                    {parseResult.detectedFormat}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 font-semibold text-[11px]">
                    {parseResult.stats.validNewCount} Ready to Import
                  </span>
                  {parseResult.stats.duplicateCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-800 font-semibold text-[11px]">
                      {parseResult.stats.duplicateCount} Duplicates Skipped
                    </span>
                  )}
                  {parseResult.stats.invalidCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-100/80 text-red-800 font-semibold text-[11px]">
                      {parseResult.stats.invalidCount} Invalid
                    </span>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="mt-3 border border-slate-200 rounded-2xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Invoice #</th>
                        <th className="py-2 px-3">Buyer Name</th>
                        <th className="py-2 px-3">Amount (₹)</th>
                        <th className="py-2 px-3">Invoice Date</th>
                        <th className="py-2 px-3">Terms</th>
                        <th className="py-2 px-3">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={
                            row.isDuplicate
                              ? "bg-amber-50/40 text-slate-500"
                              : !row.isValid
                              ? "bg-red-50/40 text-red-700"
                              : "bg-white hover:bg-slate-50/80"
                          }
                        >
                          <td className="py-2.5 px-3">
                            {row.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="h-3 w-3 inline" />
                                Duplicate
                              </span>
                            ) : !row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                Invalid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                <Check className="h-3 w-3 inline" />
                                Ready
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                            {row.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[180px] truncate">
                            {row.buyerName}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            ₹{row.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{row.invoiceDate}</td>
                          <td className="py-2.5 px-3 text-slate-600">{row.paymentTermsDays}d</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-[140px] truncate">
                            {row.buyerEmail || row.buyerPhone || "—"}
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

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span>De-duplication automatically prevents duplicate invoice numbers.</span>
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !parseResult || parseResult.stats.validNewCount === 0}
              onClick={handleImport}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {parseResult && parseResult.stats.validNewCount > 0
                  ? `Import ${parseResult.stats.validNewCount} Invoices`
                  : "Import Invoices"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
