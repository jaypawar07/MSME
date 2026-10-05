"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { trackPilotEvent } from "@/lib/analytics/tracker";

interface OnboardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAddInvoice?: () => void;
  onStartCsvImport?: () => void;
}

export default function OnboardingGuideModal({
  isOpen,
  onClose,
  onStartAddInvoice,
  onStartCsvImport,
}: OnboardingGuideModalProps) {
  const { language, isHindi } = useLanguage();
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      trackPilotEvent("onboarding_started", { language });
    }
  }, [isOpen, language]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      trackPilotEvent("onboarding_completed", { language });
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/30 text-emerald-200 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-400/30">
                {isHindi ? "मार्गदर्शिका" : "Quick Guide"}
              </span>
              <span className="text-xs text-emerald-200">
                {isHindi ? `चरण ${step} / 3` : `Step ${step} of 3`}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h2 className="text-2xl font-bold mt-2">
            {step === 1 &&
              (isHindi
                ? "45 दिनों का वैधानिक नियम क्या है?"
                : "What is the 45-Day Law (MSMED Act)?")}
            {step === 2 &&
              (isHindi
                ? "डैशबोर्ड और कलर सिग्नल कैसे समझें?"
                : "How to Read Your Color-Coded Dashboard")}
            {step === 3 &&
              (isHindi
                ? "अपना पहला चालान कैसे जोड़ें?"
                : "Add Your First Invoice in 30 Seconds")}
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            {step === 1 &&
              (isHindi
                ? "भारतीय कानून के तहत MSME को समय पर भुगतान पाने का कानूनी अधिकार"
                : "Your statutory right to get paid on time under Indian law — explained simply.")}
            {step === 2 &&
              (isHindi
                ? "ग्रीन, येलो और रेड स्टेटस का अर्थ"
                : "Track which buyers are safe, approaching due date, or accumulating legal interest.")}
            {step === 3 &&
              (isHindi
                ? "फोटो खींचें, फॉर्म भरें या सीधे Tally / Excel से CSV लाएं"
                : "Upload a photo bill, fill a quick form, or import from Tally / Excel.")}
          </p>

          {/* Step Progress Indicators */}
          <div className="flex space-x-2 mt-4">
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= 1 ? "bg-emerald-400" : "bg-white/20"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= 2 ? "bg-emerald-400" : "bg-white/20"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= 3 ? "bg-emerald-400" : "bg-white/20"
              }`}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 text-slate-700 text-sm leading-relaxed">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⚖️</span>
                  <div>
                    <h4 className="font-semibold text-emerald-950 text-base">
                      {isHindi ? "नियम बहुत सरल है:" : "The Law is Very Simple:"}
                    </h4>
                    <p className="text-emerald-900 mt-1">
                      {isHindi
                        ? "यदि कोई खरीदार आपसे माल या सेवा लेता है, तो उसे अधिकतम 45 दिनों (या सहमति अनुसार) के भीतर भुगतान करना अनिवार्य है।"
                        : "Whenever you supply goods or services, the buyer must pay you within your agreed payment terms, and by law, never later than 45 days."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-900 flex items-center space-x-2">
                    <span className="text-amber-600">📈</span>
                    <span>{isHindi ? "3x बैंक दर ब्याज" : "16.5% Compounded Interest"}</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1.5">
                    {isHindi
                      ? "45वें दिन के बाद, खरीदार पर RBI बैंक दर का 3 गुना (वर्तमान में ~16.5%) चक्रवृद्धि मासिक ब्याज स्वतः जुड़ता जाता है।"
                      : "From Day 46 onwards, Section 16 charges compound penal interest at 3x the RBI Bank Rate with monthly rests."}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-900 flex items-center space-x-2">
                    <span className="text-red-600">🚫</span>
                    <span>{isHindi ? "टैक्स में छूट नहीं" : "No Tax Deduction for Buyer"}</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1.5">
                    {isHindi
                      ? "आयकर अधिनियम के अनुसार, खरीदार इस ब्याज को व्यापारिक खर्च के रूप में क्लेम नहीं कर सकता। वे जल्दी भुगतान करने को बाध्य होते हैं।"
                      : "Under Section 23, the penal interest paid to you cannot be deducted by the buyer as a tax expense."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <h5 className="font-bold text-emerald-950">
                    {isHindi ? "हरा (सुरक्षित - 0 से 30 दिन)" : "Green (Safe - 0 to 30 Days)"}
                  </h5>
                  <p className="text-xs text-emerald-800">
                    {isHindi
                      ? "भुगतान समय पर है। आप चाहें तो एक विनम्र सौजन्य अनुस्मारक भेज सकते हैं।"
                      : "Payment is within agreed terms. You can send a friendly courtesy reminder."}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="w-3 h-3 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <h5 className="font-bold text-amber-950">
                    {isHindi ? "पीला (चेतावनी - 31 से 44 दिन)" : "Yellow (Warning - 31 to 44 Days)"}
                  </h5>
                  <p className="text-xs text-amber-800">
                    {isHindi
                      ? "45 दिन की सीमा पास आ रही है। औपचारिक पत्र भेजें ताकि खरीदार को अंतिम तिथि का ध्यान रहे।"
                      : "Approaching the 45-day deadline. Send a formal follow-up to request dispatch before penal interest starts."}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-red-50/70 border border-red-200 rounded-xl">
                <span className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div>
                  <h5 className="font-bold text-red-950">
                    {isHindi ? "लाल (वैधानिक अतिदेय - 45+ दिन)" : "Red (Statutory Violation - 45+ Days)"}
                  </h5>
                  <p className="text-xs text-red-800">
                    {isHindi
                      ? "धारा 16 का दंडात्मक ब्याज जुड़ना शुरू हो चुका है। आप एक क्लिक में MSME समाधान कानूनी फाइलिंग पैकेज तैयार कर सकते हैं।"
                      : "Section 16 penal interest is ticking. You can generate a 1-click legal dispute package ready for MSME Samadhaan (odr.msme.gov.in)."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-slate-700">
                {isHindi
                  ? "Settlr में चालान जोड़ना बहुत आसान है। आप नीचे दिए गए किसी भी तरीके से शुरुआत कर सकते हैं:"
                  : "Adding invoices to Settlr takes seconds. Choose whichever method fits your business best:"}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors">
                  <span className="text-2xl">📸</span>
                  <h4 className="font-bold text-slate-900 mt-2">
                    {isHindi ? "AI फोटो / बिल अपलोड" : "AI Photo / OCR Scan"}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {isHindi
                      ? "अपने बिल का फोटो लें। AI खरीदार का नाम, राशि और तारीख खुद पहचान लेगा। आप पुष्टि करके सहेज सकते हैं।"
                      : "Snap a photo of your paper bill. AI auto-reads the buyer name, invoice number, and dates for your confirmation."}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors">
                  <span className="text-2xl">📊</span>
                  <h4 className="font-bold text-slate-900 mt-2">
                    {isHindi ? "Tally / Excel CSV आयात" : "Tally / Excel CSV Import"}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {isHindi
                      ? "Tally या Zoho से 50-100 चालान एक साथ एक क्लिक में अपलोड करें।"
                      : "Export your ledger from Tally, Zoho Books, or Excel and import all overdue invoices in one shot."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              step === 1
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            {isHindi ? "← पिछला" : "← Back"}
          </button>

          <div className="flex items-center space-x-3">
            {step === 3 && onStartCsvImport && (
              <button
                onClick={() => {
                  onClose();
                  onStartCsvImport();
                }}
                className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                {isHindi ? "CSV आयात करें" : "Import CSV"}
              </button>
            )}

            <button
              onClick={() => {
                if (step === 3) {
                  onClose();
                  if (onStartAddInvoice) onStartAddInvoice();
                } else {
                  handleNext();
                }
              }}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              {step === 3
                ? isHindi
                  ? "पहला चालान जोड़ें 🚀"
                  : "Add First Invoice 🚀"
                : isHindi
                ? "आगे बढ़ें →"
                : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
