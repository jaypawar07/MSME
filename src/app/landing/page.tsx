"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Scale, 
  TrendingUp, 
  Clock, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Building2,
  AlertTriangle,
  ChevronRight,
  Globe,
  Loader2
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { trackPilotEvent } from "@/lib/analytics/tracker";

export default function LandingPage() {
  const { language, toggleLanguage, isHindi } = useLanguage();

  // Interactive Interest Calculator Simulator
  const [calcAmount, setCalcAmount] = useState<number>(500000);
  const [calcDaysOverdue, setCalcDaysOverdue] = useState<number>(60);
  
  // Pilot Signup Form State
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyOverdueAmount, setMonthlyOverdueAmount] = useState("");
  const [industry, setIndustry] = useState("Manufacturing");
  const [udyamNumber, setUdyamNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Section 16 Interest Calculation (16.5% compound monthly)
  const monthlyRate = 0.165 / 12;
  const months = calcDaysOverdue / 30;
  const totalWithInterest = calcAmount * Math.pow(1 + monthlyRate, months);
  const interestOwed = Math.max(0, Math.round(totalWithInterest - calcAmount));
  const totalClaim = Math.round(calcAmount + interestOwed);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/pilot/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactName,
          email,
          phone,
          monthlyOverdueAmount: monthlyOverdueAmount ? parseFloat(monthlyOverdueAmount) : null,
          industry,
          udyamNumber,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        trackPilotEvent("pilot_lead_signup", {
          businessName,
          email,
          monthlyOverdueAmount,
          industry,
        });
      } else {
        setErrorMsg(data.error || "Failed to submit. Please try again.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/images/settlr-logo-horizontal.png"
                alt="Settlr"
                className="h-9 w-auto brightness-200 invert"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isHindi ? "English" : "हिन्दी"}</span>
            </button>

            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {isHindi ? "लॉगिन करें" : "Sign In"}
            </Link>

            <a
              href="#join-pilot"
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {isHindi ? "पायलट में शामिल हों" : "Join Pilot"}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>{isHindi ? "MSMED अधिनियम 2006 धारा 15 और 16" : "MSMED Act 2006 Statutory Protections"}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
              {isHindi ? (
                <>
                  बकाया बिलों पर <br />
                  <span className="text-emerald-400">16.5% कानूनी ब्याज</span> वसूलें।
                </>
              ) : (
                <>
                  Stop Chasing Invoices. <br />
                  <span className="text-emerald-400">Enforce Day 45 Law.</span>
                </>
              )}
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
              {isHindi
                ? "भारतीय MSME निर्माताओं और आपूर्तिकर्ताओं के लिए विशेष। अपने खरीदारों को याद दिलाएं कि 45 दिन बाद RBI बैंक दर का 3 गुना चक्रवृद्धि ब्याज कानूनी रूप से अनिवार्य है।"
                : "The dedicated receivables recovery engine for Indian MSMEs. Auto-calculate compound statutory interest, send escalating multi-tone demand notices, and compile 1-click legal filings for MSME Samadhaan."}
            </p>

            {/* Quick Benefits Bullet Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  {isHindi ? "3x RBI बैंक दर मासिक चक्रवृद्धि ब्याज" : "3x RBI Bank Rate Compound Penal Interest"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  {isHindi ? "Tally व Excel से 1-क्लिक CSV आयात" : "1-Click CSV Import from Tally & Zoho"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  {isHindi ? "AI बिल फोटो व OCR विवरण निष्कर्षण" : "AI Photo Bill Scanning & OCR"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  {isHindi ? "MSME समाधान (odr.msme.gov.in) फाइलिंग पैकेज" : "MSME Samadhaan Dispute PDF Packages"}
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <a
                href="#join-pilot"
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>{isHindi ? "अर्ली एक्सेस पायलट में शामिल हों" : "Get Free Pilot Access"}</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="/login"
                className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-colors"
              >
                {isHindi ? "लाइव डेमो देखें" : "Explore Demo"}
              </Link>
            </div>
          </div>

          {/* Right Column: Live Section 16 Simulator */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  {isHindi ? "धारा 16 ब्याज सिम्युलेटर" : "Section 16 Live Simulator"}
                </h3>
              </div>
              <span className="text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                16.5% Compounded
              </span>
            </div>

            <div className="space-y-4 mt-5">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{isHindi ? "मूल चालान राशि (Principal Invoice)" : "Principal Invoice Amount"}</span>
                  <span className="font-bold text-white font-mono">₹{calcAmount.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={5000000}
                  step={50000}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{isHindi ? "अतिदेय दिन (Days Past 45-Day Cap)" : "Days Past 45-Day Statutory Cap"}</span>
                  <span className="font-bold text-amber-400 font-mono">{calcDaysOverdue} Days</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={365}
                  step={1}
                  value={calcDaysOverdue}
                  onChange={(e) => setCalcDaysOverdue(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Live Calculation Output Card */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3 mt-4">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{isHindi ? "उपार्जित दंडात्मक ब्याज (Accrued Interest)" : "Accrued Statutory Interest"}</span>
                  <span className="text-amber-400 font-bold font-mono">+₹{interestOwed.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">
                    {isHindi ? "कुल वैधानिक वसूली योग्य दावा" : "Total Statutory Recoverable Claim"}
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    ₹{totalClaim.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 leading-snug">
                💡 <strong>{isHindi ? "कानूनी संज्ञान:" : "Statutory Note:"}</strong>{" "}
                {isHindi
                  ? "यह ब्याज आयकर अधिनियम की धारा 23 के तहत खरीदार के लिए गैर-कटौती योग्य (Non-deductible) है।"
                  : "Under Section 23 MSMED Act, this penal interest cannot be deducted by the buyer as a business expense for tax."}
              </div>
            </div>
          </div>
        </div>

        {/* Pilot Lead Capture Signup Section */}
        <section id="join-pilot" className="scroll-mt-24 pt-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 uppercase tracking-wider">
                {isHindi ? "सीमित 10 पायलट स्लॉट" : "Limited to 10 Pilot Businesses"}
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-3">
                {isHindi ? "Settlr अर्ली एक्सेस पायलट में शामिल हों" : "Join the Settlr Pilot Program"}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">
                {isHindi
                  ? "हम केवल 10 वास्तविक MSME उद्यमों के साथ काम कर रहे हैं ताकि उनके अटके हुए भुगतान को तेजी से निकाला जा सके।"
                  : "Zero software fee during pilot. Get personal onboarding, Tally CSV reconciliation support, and 1-click legal package generation."}
              </p>
            </div>

            {submitted ? (
              <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-2xl p-8 text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">
                  {isHindi ? "पायलट आवेदन प्राप्त हुआ!" : "Pilot Application Received!"}
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  {isHindi
                    ? "धन्यवाद! हमारी टीम 24 घंटों के भीतर आपसे संपर्क करेगी और आपके खाते को सक्रिय करेगी।"
                    : "Thank you for applying. Our founder will reach out within 24 hours to set up your account and assist with your overdue ledger."}
                </p>
                <div className="pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    <span>{isHindi ? "डेमो खाते का परीक्षण करें" : "Try Demo Account"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-200 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? "व्यवसाय का नाम *" : "Business / Enterprise Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Apex Engineering Works"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? "संपर्क व्यक्ति का नाम *" : "Contact Person / Owner *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? "ईमेल पता *" : "Work Email Address *"}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rajesh@apexengg.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? "व्हाट्सएप / मोबाइल नंबर *" : "WhatsApp / Mobile Number *"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? "मासिक अतिदेय राशि (लगभग)" : "Approx. Overdue Receivables (₹)"}
                    </label>
                    <input
                      type="number"
                      value={monthlyOverdueAmount}
                      onChange={(e) => setMonthlyOverdueAmount(e.target.value)}
                      placeholder="e.g. 2500000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? "उद्योग का प्रकार" : "Industry / Sector"}
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Manufacturing">Manufacturing / Engineering</option>
                      <option value="Textiles">Textiles & Garments</option>
                      <option value="Chemicals">Chemicals & Pharma</option>
                      <option value="IT_Services">IT & Digital Services</option>
                      <option value="Packaging">Packaging & Printing</option>
                      <option value="Trading">Wholesale / Distribution</option>
                      <option value="Other">Other MSME Category</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? "उद्यम पंजीकरण नंबर (वैकल्पिक)" : "Udyam Number (Optional)"}
                    </label>
                    <input
                      type="text"
                      value={udyamNumber}
                      onChange={(e) => setUdyamNumber(e.target.value)}
                      placeholder="UDYAM-XX-00-0000000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{isHindi ? "जमा किया जा रहा है..." : "Submitting Application..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{isHindi ? "पायलट आमंत्रण के लिए आवेदन करें 🚀" : "Apply for Pilot Access 🚀"}</span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Settlr. Built for Indian MSME enterprises governed under the MSMED Act, 2006.</p>
        </div>
      </footer>
    </div>
  );
}
