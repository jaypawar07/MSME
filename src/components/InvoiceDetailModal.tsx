"use client";

import React, { useState } from "react";
import { 
  X, 
  Calendar, 
  Building, 
  FileText, 
  Scale, 
  IndianRupee, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Image as ImageIcon,
  Send,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Edit2
} from "lucide-react";
import { format } from "date-fns";
import { type InvoiceCalculations, formatINR } from "@/lib/msme-calculator";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
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
    proofOfDeliveryUrl?: string | null;
    notes?: string | null;
    reminders?: any[];
    calcs: InvoiceCalculations;
  } | null;
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
  onOpenReminder: (inv: any) => void;
  onOpenDisputePackage?: (invoiceId: string) => void;
  onOpenFinancing?: (inv: any) => void;
  onDelete: (id: string) => Promise<void>;
}

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  onStatusChange,
  onOpenReminder,
  onOpenDisputePackage,
  onOpenFinancing,
  onDelete,
}: InvoiceDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    await onStatusChange(invoice.id, newStatus);
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete invoice #${invoice.invoiceNumber}?`)) {
      await onDelete(invoice.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Invoice #{invoice.invoiceNumber}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    invoice.status === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : invoice.calcs.isOverdue
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Created for buyer: <strong className="text-slate-800">{invoice.buyerName}</strong>
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

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Section 1: Financial & MSMED Interest Breakdown */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Principal Amount
                </span>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {formatINR(invoice.amount)}
                </div>
              </div>

              {invoice.calcs.isOverdue && invoice.status !== "PAID" && (
                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center sm:justify-end gap-1">
                    <Scale className="h-3.5 w-3.5" />
                    Section 16 Accrued Interest
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                    +{formatINR(invoice.calcs.interestOwed)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    16.5% p.a. monthly compounded ({invoice.calcs.daysOverdue} days overdue)
                  </span>
                </div>
              )}
            </div>

            {invoice.calcs.isOverdue && invoice.status !== "PAID" && (
              <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Total Statutory Legal Claim:</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {formatINR(invoice.calcs.totalClaimAmount)}
                </span>
              </div>
            )}
          </div>

          {/* Section 2: MSMED Statutory Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-1">Invoice Date</span>
              <span className="font-semibold text-slate-800">
                {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-1">Payment Window</span>
              <span className="font-semibold text-slate-800">
                {invoice.paymentTermsDays} Days (Sec 15)
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-1">Due Date</span>
              <span className="font-semibold text-slate-800">
                {format(new Date(invoice.calcs.dueDate), "dd MMM yyyy")}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                invoice.calcs.isOverdue
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              <span className="block mb-1 opacity-75">Timeline Status</span>
              <span className="font-bold">{invoice.calcs.urgencyLabel}</span>
            </div>
          </div>

          {/* Section 3: Buyer Details */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-400">
              Buyer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block">Company Name</span>
                <span className="font-semibold text-slate-800">{invoice.buyerName}</span>
              </div>
              {invoice.buyerGstin && (
                <div>
                  <span className="text-slate-400 block">GSTIN</span>
                  <span className="font-mono font-medium text-slate-800">{invoice.buyerGstin}</span>
                </div>
              )}
              {invoice.buyerPhone && (
                <div>
                  <span className="text-slate-400 block">Phone / WhatsApp</span>
                  <span className="font-medium text-slate-800">{invoice.buyerPhone}</span>
                </div>
              )}
              {invoice.buyerEmail && (
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="font-medium text-slate-800">{invoice.buyerEmail}</span>
                </div>
              )}
            </div>
            {invoice.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">Notes / Description</span>
                <p className="text-slate-700 mt-0.5">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Section 4: Attached Photo Stub */}
          {invoice.photoUrl ? (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-indigo-600" />
                  Original Attached Invoice Document
                </span>
                <a
                  href={invoice.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Full File
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-2">
                <img
                  src={invoice.photoUrl}
                  alt={`Invoice ${invoice.invoiceNumber}`}
                  className="max-h-60 mx-auto object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback for mock stub paths
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="text-[11px] text-slate-400 text-center py-1 font-mono">
                  File path: {invoice.photoUrl} (Phase 2 OCR Ready)
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
              No invoice photo attached. You can upload invoice attachments during creation.
            </div>
          )}

          {/* Section 5: Status Management */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Update Invoice Status:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusUpdate("PENDING")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  invoice.status === "PENDING"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Pending
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusUpdate("PAID")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  invoice.status === "PAID"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                Mark as Paid ✓
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusUpdate("OVERDUE")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  invoice.status === "OVERDUE"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-red-700 border-red-200 hover:bg-red-50"
                }`}
              >
                Flag Overdue
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusUpdate("DISPUTED")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  invoice.status === "DISPUTED"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-purple-700 border-purple-200 hover:bg-purple-50"
                }`}
              >
                Disputed
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Need Cash Now Referral Button */}
            {onOpenFinancing && invoice.status !== "PAID" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFinancing(invoice);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                title="Explore instant TReDS invoice discounting"
              >
                <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                <span>Need Cash Now?</span>
              </button>
            )}

            {/* Generate Dispute Package (For Overdue Invoices) */}
            {onOpenDisputePackage && (invoice.calcs.isOverdue || invoice.calcs.daysElapsed > 45) && invoice.status !== "PAID" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDisputePackage(invoice.id);
                }}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                title="Compile official MSEFC Samadhaan filing package"
              >
                <Scale className="h-3.5 w-3.5 text-red-600" />
                <span>Generate Dispute Package</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReminder(invoice);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Reminder</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
