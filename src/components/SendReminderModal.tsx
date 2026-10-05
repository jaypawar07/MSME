"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Send, 
  MessageSquare, 
  Mail, 
  Phone, 
  Scale, 
  AlertTriangle, 
  Clock, 
  Check, 
  Copy, 
  ExternalLink, 
  Loader2, 
  ShieldAlert,
  Sparkles,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { REMINDER_TEMPLATES, getRecommendedTone, ReminderTemplate, SupportedLanguage } from "@/lib/reminder-templates";
import { InvoiceCalculations } from "@/lib/msme-calculator";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { trackPilotEvent } from "@/lib/analytics/tracker";

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    buyerName: string;
    buyerEmail?: string | null;
    buyerPhone?: string | null;
    amount: number;
    invoiceDate: string | Date;
    calcs: InvoiceCalculations;
  } | null;
}

export function SendReminderModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}: SendReminderModalProps) {
  const { data: session } = useSession();
  const { language: appLang, isHindi } = useLanguage();

  const [selectedTone, setSelectedTone] = useState<string>("FORMAL");
  const [templateLang, setTemplateLang] = useState<SupportedLanguage>("en");
  const [selectedChannel, setSelectedChannel] = useState<"WHATSAPP" | "EMAIL" | "SMS">("EMAIL");
  const [recipientContact, setRecipientContact] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [messageBody, setMessageBody] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize initial template language with app context
  useEffect(() => {
    setTemplateLang(appLang);
  }, [appLang]);

  // Initialize defaults based on invoice state
  useEffect(() => {
    if (!invoice) return;

    const daysOverdue = invoice.calcs.daysOverdue || 0;
    const recommended = getRecommendedTone(daysOverdue);
    setSelectedTone(recommended);

    const contact =
      invoice.buyerEmail || invoice.buyerPhone || "accounts@" + invoice.buyerName.toLowerCase().replace(/\s+/g, "") + ".com";
    setRecipientContact(contact);

    updateMessageTemplate(recommended, invoice, templateLang);
  }, [invoice, templateLang]);

  const updateMessageTemplate = (toneKey: string, inv: typeof invoice, lang: SupportedLanguage) => {
    if (!inv) return;

    const template = REMINDER_TEMPLATES[toneKey] || REMINDER_TEMPLATES.FORMAL;
    const supplierName = (session?.user as any)?.businessName || session?.user?.name || "Our MSME Enterprise";
    const udyamNumber = (session?.user as any)?.udyamNumber || undefined;

    const formattedInvDate = format(new Date(inv.invoiceDate), "dd MMM yyyy");
    const formattedDueDate = format(new Date(inv.calcs.dueDate), "dd MMM yyyy");

    const body = template.generateBody({
      buyerName: inv.buyerName,
      supplierName,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      invoiceDate: formattedInvDate,
      dueDate: formattedDueDate,
      daysOverdue: inv.calcs.daysOverdue,
      interestOwed: inv.calcs.interestOwed,
      totalClaim: inv.calcs.totalClaimAmount,
      udyamNumber,
      lang,
    });

    const sub = template.getSubject({
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      lang,
    });

    setSubject(sub);
    setMessageBody(body);
  };

  const handleToneChange = (toneKey: string) => {
    setSelectedTone(toneKey);
    updateMessageTemplate(toneKey, invoice, templateLang);
  };

  const handleLangChange = (lang: SupportedLanguage) => {
    setTemplateLang(lang);
    updateMessageTemplate(selectedTone, invoice, lang);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendAndLog = async () => {
    if (!invoice) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: selectedChannel,
          tone: selectedTone,
          subject,
          message: messageBody,
          buyerContact: recipientContact,
          language: templateLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log reminder");
      }

      trackPilotEvent("reminder_sent", {
        invoiceId: invoice.id,
        tone: selectedTone,
        channel: selectedChannel,
        language: templateLang,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log reminder");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-200">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {isHindi ? "भुगतान अनुस्मारक भेजें" : "Send Payment Reminder"}
                </h2>
                <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
                  Invoice #{invoice.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Buyer: <strong className="text-slate-800">{invoice.buyerName}</strong> • Overdue:{" "}
                <span className="text-red-600 font-bold">{invoice.calcs.daysOverdue} days</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher for Reminder text */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs">
              <button
                type="button"
                onClick={() => handleLangChange("en")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  templateLang === "en" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLangChange("hi")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  templateLang === "hi" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {isHindi ? "अनुस्मारक स्तर (टोन) चुनें" : "Select Escalation Tone"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {Object.values(REMINDER_TEMPLATES).map((tmpl) => {
                const isSelected = selectedTone === tmpl.key;
                return (
                  <button
                    key={tmpl.key}
                    type="button"
                    onClick={() => handleToneChange(tmpl.key)}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tmpl.badgeColor}`}>
                        {templateLang === "hi" ? tmpl.badgeHi : tmpl.badge}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {templateLang === "hi" ? tmpl.titleHi : tmpl.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                      {templateLang === "hi" ? tmpl.recommendedWhenHi : tmpl.recommendedWhen}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery Channel & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isHindi ? "वितरण माध्यम (Channel)" : "Delivery Channel"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel("EMAIL")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedChannel === "EMAIL"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email (SMTP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel("WHATSAPP")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedChannel === "WHATSAPP"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel("SMS")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedChannel === "SMS"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>SMS</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isHindi ? "प्राप्तकर्ता का ईमेल या फ़ोन" : "Recipient Contact (Email / Phone)"}
              </label>
              <input
                type="text"
                value={recipientContact}
                onChange={(e) => setRecipientContact(e.target.value)}
                placeholder="accounts@buyer.com or +919876543210"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>
          </div>

          {/* Email Subject (if email) */}
          {selectedChannel === "EMAIL" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHindi ? "ईमेल विषय (Subject Line)" : "Email Subject Line"}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
          )}

          {/* Message Body Editor / Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {isHindi ? "सूचना संदेश (संपादन योग्य)" : "Notice Body (Editable Text)"}
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? (isHindi ? "कॉपी हो गया!" : "Copied!") : (isHindi ? "टेक्स्ट कॉपी करें" : "Copy Text")}</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-600 leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            {isHindi ? "रद्द करें" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleSendAndLog}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{isHindi ? "भेजा जा रहा है..." : "Sending Reminder..."}</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>{isHindi ? "अनुस्मारक भेजें व लॉग करें" : "Send & Log Reminder"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
