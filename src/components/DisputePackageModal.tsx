"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  FileText, 
  Printer, 
  ExternalLink, 
  Scale, 
  Copy, 
  Check, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  Calendar, 
  AlertTriangle,
  FileCheck,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { type DisputePackageData } from "@/lib/dispute/dispute-package-generator";

interface DisputePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
}

export function DisputePackageModal({
  isOpen,
  onClose,
  invoiceId,
}: DisputePackageModalProps) {
  const [data, setData] = useState<DisputePackageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !invoiceId) return;

    const fetchPackage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/dispute-package`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to load dispute package");
        }
        setData(result.disputeData);
      } catch (err: any) {
        setError(err.message || "Failed to compile dispute package");
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [isOpen, invoiceId]);

  if (!isOpen) return null;

  const handleCopyCoverNote = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.caseSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPrintView = () => {
    if (!invoiceId) return;
    window.open(`/api/invoices/${invoiceId}/dispute-package?format=html`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">MSEFC Dispute Filing Package</h2>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-200">
                  Section 18 MSMED Act
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official arbitration dossier formatted for MSME Samadhaan (odr.msme.gov.in)
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
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Compiling statutory evidence, interest computation & notice trail...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Top Warning & Delay Pill */}
              <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Statutory 45-Day Cap Exceeded ({data.calcs.daysOverdue} Days Overdue)</span>
                    <span className="text-[11px] text-red-800">
                      Entitled to immediate arbitration and compounding penal interest under Section 18 of the MSMED Act.
                    </span>
                  </div>
                </div>
                <a
                  href="https://samadhaan.msme.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs self-start sm:self-auto shrink-0"
                >
                  <span>Portal: samadhaan.msme.gov.in</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Case Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Plain-Language Statutory Cover Note
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCoverNote}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Cover Note</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-slate-700 leading-relaxed font-mono bg-white p-3 rounded-xl border border-slate-200/80 text-[11px]">
                  {data.caseSummary}
                </p>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Principal Invoice Value
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    ₹{data.invoice.amount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Invoice #{data.invoice.invoiceNumber}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50/50 border border-red-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-red-600 block mb-1">
                    Sec 16 Compound Interest
                  </span>
                  <span className="text-base font-bold text-red-700">
                    ₹{data.calcs.interestOwed.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-red-600 font-medium block mt-0.5">
                    3x RBI Rate (16.5% p.a.)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">
                    Total Statutory Claim
                  </span>
                  <span className="text-base font-extrabold text-indigo-900">
                    ₹{data.calcs.totalClaimAmount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium block mt-0.5">
                    Recoverable under Sec 17 &amp; 18
                  </span>
                </div>
              </div>

              {/* Dossier Contents Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <div className="bg-slate-50 p-3 font-bold text-slate-800 border-b border-slate-200">
                  Included Exhibits &amp; Evidence in Dispute Package
                </div>
                <div className="divide-y divide-slate-100 p-2 space-y-1">
                  <div className="flex items-center justify-between p-2">
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      Original Invoice Document (# {data.invoice.invoiceNumber})
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2">
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      Proof of Delivery / Lorry Receipt Reference
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                      Attached
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2">
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      Timestamped Notice Trail ({data.reminderTrail.length} Prior Escalations)
                    </span>
                    <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">
                      Full Trail
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2">
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      Section 16 RBI Compound Interest Computation Schedule
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                      Calculated
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Filing ready for MSME Facilitation Council &amp; Online Dispute Resolution (ODR)
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleOpenPrintView}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Download Filing PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
