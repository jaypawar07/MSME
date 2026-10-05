"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  IndianRupee, 
  Zap, 
  ShieldCheck, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Percent, 
  Phone, 
  Mail, 
  User, 
  CreditCard,
  Info
} from "lucide-react";
import { useSession } from "next-auth/react";

interface FinancingLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    buyerName: string;
    amount: number;
    invoiceDate: string | Date;
    calcs: {
      daysOverdue: number;
      interestOwed: number;
      totalClaimAmount: number;
    };
  } | null;
}

export function FinancingLeadModal({
  isOpen,
  onClose,
  invoice,
}: FinancingLeadModalProps) {
  const { data: session } = useSession();

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [businessPan, setBusinessPan] = useState("");
  const [discountTenor, setDiscountTenor] = useState("30");
  const [consentGiven, setConsentGiven] = useState(true);

  const [loading, setLoading] = useState(false);
  const [successQuote, setSuccessQuote] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    setContactName(session.user.name || "");
    setContactEmail(session.user.email || "");
  }, [session]);

  if (!isOpen || !invoice) return null;

  const estimatedAdvance = Math.round(invoice.amount * 0.88);
  const estimatedFee = Math.round(invoice.amount * 0.0125);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      setError("Please fill in your contact name, phone, and email.");
      return;
    }
    if (!consentGiven) {
      setError("Please confirm your consent to receive factoring quotes.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/financing/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim(),
          businessPan: businessPan.trim().toUpperCase(),
          requestedAmount: invoice.amount,
          discountTenorDays: parseInt(discountTenor, 10),
          consentGiven: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit financing request");
      }

      setSuccessQuote(data.quote);
    } catch (err: any) {
      setError(err.message || "Failed to submit referral request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Instant Invoice Liquidity (TReDS)</h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Up to 88% Advance
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Unlock immediate cash flow for overdue invoice #{invoice.invoiceNumber}
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
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successQuote ? (
            <div className="p-6 text-center space-y-4">
              <div className="h-14 w-14 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Financing Referral Submitted!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Our TReDS invoice factoring desk partner has received your request for Invoice #{invoice.invoiceNumber}. A relationship manager will contact you at <strong>{contactPhone}</strong> within 24 hours.
              </p>

              {/* Quote Breakdown Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs max-w-md mx-auto space-y-2">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
                  Indicative Liquidity Terms
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Invoice Amount:</span>
                  <span className="font-bold text-slate-800">₹{invoice.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Estimated Upfront Payout (88%):</span>
                  <span className="font-bold text-emerald-700">₹{successQuote.estimatedUpfrontPayout.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Partner Platform:</span>
                  <span className="font-semibold text-slate-700">{successQuote.partnerNetwork}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-md"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Value & Payout Preview Card */}
              <div className="bg-gradient-to-tr from-emerald-50 via-teal-50 to-indigo-50/40 border border-emerald-200/80 rounded-2xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Invoice Value</span>
                    <span className="text-base font-extrabold text-slate-900">₹{invoice.amount.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{invoice.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Est. Instant Payout (88%)</span>
                    <span className="text-base font-extrabold text-emerald-800">₹{estimatedAdvance.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-emerald-700 block">Disbursed in 24-48 hrs</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Est. Discount Fee</span>
                    <span className="text-base font-bold text-slate-800">~₹{estimatedFee.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-500 block">~1.25% / 30 days</span>
                  </div>
                </div>
              </div>

              {/* Lead Contact Fields */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Authorized Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Person Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Rajesh Sharma"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile / WhatsApp Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+91 98200 12345"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="finance@msme.in"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business PAN (Optional)
                    </label>
                    <div className="relative">
                      <CreditCard className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={businessPan}
                        onChange={(e) => setBusinessPan(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      I authorize Settlr to share this invoice summary and contact information with RBI-regulated TReDS factoring exchanges (RXIL / M1xchange / Invoicemart) to evaluate invoice discounting and liquidity options.
                    </span>
                  </label>
                </div>
              </div>

              {/* Regulatory Disclaimer */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Disclaimer:</strong> Settlr acts solely as a technology facilitator connecting MSME suppliers with licensed factoring platforms and does not underwrite, lend, or collect debts directly.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !consentGiven}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Request Instant Discounting</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
