"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Building, 
  IndianRupee, 
  Phone, 
  Mail, 
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Check,
  ScanLine,
  Info
} from "lucide-react";
import { format } from "date-fns";

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddInvoiceModal({ isOpen, onClose, onSuccess }: AddInvoiceModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerGstin, setBuyerGstin] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentTermsDays, setPaymentTermsDays] = useState("45");
  const [notes, setNotes] = useState("");

  // OCR state
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrExtracted, setOcrExtracted] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrProvider, setOcrProvider] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningOcr(true);
    setError(null);
    setOcrExtracted(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process invoice photo");
      }

      setUploadedPhotoUrl(data.photoUrl);
      setPhotoFileName(file.name);

      if (data.extractedData) {
        const ext = data.extractedData;
        if (ext.buyerName) setBuyerName(ext.buyerName);
        if (ext.buyerEmail) setBuyerEmail(ext.buyerEmail);
        if (ext.buyerPhone) setBuyerPhone(ext.buyerPhone);
        if (ext.buyerGstin) setBuyerGstin(ext.buyerGstin);
        if (ext.invoiceNumber) setInvoiceNumber(ext.invoiceNumber);
        if (ext.amount) setAmount(String(ext.amount));
        if (ext.invoiceDate) setInvoiceDate(ext.invoiceDate);
        if (ext.paymentTermsDays) setPaymentTermsDays(String(ext.paymentTermsDays));
        if (ext.notes) setNotes(ext.notes);

        setOcrConfidence(ext.confidence ? Math.round(ext.confidence * 100) : 95);
        setOcrProvider(ext.ocrProvider || "Vision AI");
        setOcrExtracted(true);
      }
    } catch (err: any) {
      console.error("OCR error:", err);
      setError(err.message || "Failed to scan photo. You can still fill the fields manually.");
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!buyerName.trim()) {
      setError("Please enter the Buyer / Customer name");
      return;
    }
    if (!invoiceNumber.trim()) {
      setError("Please enter the Invoice Number");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid invoice amount");
      return;
    }

    const terms = parseInt(paymentTermsDays, 10);
    if (isNaN(terms) || terms < 1 || terms > 45) {
      setError("Payment terms cannot exceed 45 days under Section 15 of the MSMED Act 2006");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim() || undefined,
          buyerPhone: buyerPhone.trim() || undefined,
          buyerGstin: buyerGstin.trim() || undefined,
          invoiceNumber: invoiceNumber.trim(),
          amount: parseFloat(amount),
          invoiceDate: new Date(invoiceDate).toISOString(),
          paymentTermsDays: terms,
          photoUrl: uploadedPhotoUrl,
          notes: notes.trim() || undefined,
          status: "PENDING",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create invoice");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error submitting invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add New Invoice</h2>
              <p className="text-xs text-slate-500">Track receivables and statutory MSMED 45-day overdue timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* OCR AI Vision Upload Card */}
          <div className={`rounded-2xl border-2 transition-all p-4 ${
            ocrExtracted 
              ? "border-emerald-300 bg-emerald-50/40" 
              : "border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/50"
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  ocrExtracted 
                    ? "bg-emerald-600 text-white" 
                    : "bg-indigo-600 text-white shadow-indigo-200"
                }`}>
                  {isScanningOcr ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : ocrExtracted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <ScanLine className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {ocrExtracted ? "AI Vision Extracted Data" : "AI Vision OCR Invoice Auto-Fill"}
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3 inline text-indigo-600" />
                      Vision AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Upload an invoice image or PDF to automatically extract buyer, GSTIN, amount & dates.
                  </p>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isScanningOcr}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-indigo-400 shadow-2xs flex items-center gap-1.5 transition-all"
                >
                  {isScanningOcr ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      <span>Scanning with AI...</span>
                    </>
                  ) : ocrExtracted ? (
                    <>
                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Scan Another Photo</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Upload Invoice Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* OCR Confirmation Notification Banner */}
            {ocrExtracted && (
              <div className="mt-3 pt-3 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 bg-white/70 p-2.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Extracted from bill ({photoFileName}):</strong> Please review & adjust the fields below before saving.
                  </span>
                </div>
                {ocrConfidence && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md self-start sm:self-auto">
                    {ocrConfidence}% Match
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Section 1: Buyer Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Buyer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer / Corporate Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Projects Ltd, Larsen & Toubro, etc."
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer Email (For Recovery Notices)
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="accounts@buyercompany.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer Phone (WhatsApp / SMS)
                </label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="+91 98200 12345"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="27AABCU9603R1ZM"
                  value={buyerGstin}
                  onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Invoice & Terms Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice & MSMED Terms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="INV-2024-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="450000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Payment Terms (Days) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                    Max 45 Days (Sec 15)
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="45"
                  required
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Goods Description / PO Number (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="PO #10948, 500 units machinery parts dispatched via road transport."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions & Confirmation Note */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Invoices are saved only upon clicking &quot;Save &amp; Track Invoice&quot;.</span>
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Save & Track Invoice</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
