"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { StatSummaryCards } from "@/components/StatSummaryCards";
import { MSMEDSection16Banner } from "@/components/MSMEDSection16Banner";
import { InvoiceList } from "@/components/InvoiceList";
import { AddInvoiceModal } from "@/components/AddInvoiceModal";
import { SendReminderModal } from "@/components/SendReminderModal";
import { ReminderHistoryModal } from "@/components/ReminderHistoryModal";
import { InvoiceDetailModal } from "@/components/InvoiceDetailModal";
import { CSVImportModal } from "@/components/CSVImportModal";
import { AutoReminderWidget } from "@/components/AutoReminderWidget";
import { DisputePackageModal } from "@/components/DisputePackageModal";
import { GSTReconciliationModal } from "@/components/GSTReconciliationModal";
import { FinancingLeadModal } from "@/components/FinancingLeadModal";
import { BuyerRiskModal } from "@/components/BuyerRiskModal";
import OnboardingGuideModal from "@/components/OnboardingGuideModal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { trackPilotEvent } from "@/lib/analytics/tracker";
import { calculateMSMEInterest } from "@/lib/msme-calculator";
import { 
  Loader2, 
  Plus, 
  RefreshCw, 
  Sparkles, 
  Scale, 
  ArrowRight, 
  ShieldCheck, 
  FileSpreadsheet,
  Layers,
  ShieldAlert,
  IndianRupee,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language, isHindi } = useLanguage();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isGstReconOpen, setIsGstReconOpen] = useState(false);
  const [isBuyerRiskOpen, setIsBuyerRiskOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const [selectedForReminder, setSelectedForReminder] = useState<any | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const [selectedForHistory, setSelectedForHistory] = useState<any | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [selectedForDetail, setSelectedForDetail] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  const [selectedFinancingInvoice, setSelectedFinancingInvoice] = useState<any | null>(null);
  const [isFinancingOpen, setIsFinancingOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/invoices");
      if (res.status === 401) {
        setInvoices([]);
        return;
      }
      const data = await res.json();
      if (data.invoices) {
        // Enrich each invoice with real-time MSMED interest calculations
        const enriched = data.invoices.map((inv: any) => {
          const calcs = calculateMSMEInterest(
            inv.invoiceDate,
            inv.amount,
            inv.paymentTermsDays,
            inv.status
          );
          return {
            ...inv,
            calcs,
          };
        });
        setInvoices(enriched);

        // If user is brand new (0 invoices), prompt onboarding guide
        if (enriched.length === 0 && !sessionStorage.getItem("settlr_onboarding_shown")) {
          sessionStorage.setItem("settlr_onboarding_shown", "true");
          setIsGuideOpen(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
    } else if (status === "authenticated") {
      fetchInvoices();
    }
  }, [status, fetchInvoices]);

  const handleQuickMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      if (res.ok) {
        trackPilotEvent("invoice_status_updated", { invoiceId: id, status: "PAID" });
        fetchInvoices();
      }
    } catch (err) {
      console.error("Failed to mark paid:", err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        trackPilotEvent("invoice_status_updated", { invoiceId: id, status: newStatus });
        await fetchInvoices();
        // Update selected detail modal data if open
        if (selectedForDetail && selectedForDetail.id === id) {
          const updated = invoices.find((i) => i.id === id);
          if (updated) setSelectedForDetail({ ...updated, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchInvoices();
      }
    } catch (err) {
      console.error("Failed to delete invoice:", err);
    }
  };

  // If not authenticated, render Welcome / Hero with quick login
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar 
          onOpenGuide={() => setIsGuideOpen(true)}
        />
        <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-4xl mx-auto">
          <div className="mb-6 flex justify-center">
            <img
              src="/images/settlr-logo-stacked.png"
              alt="Settlr"
              className="h-32 sm:h-36 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-4">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {t.msmedActBadge} • {isHindi ? "उद्यम विलंबित भुगतान ट्रैकर" : "Udyam Supplier Delayed Payment Tracker"}
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {isHindi ? (
              <>
                अतिदेय बिलों पर नुकसान बंद करें।{" "}
                <span className="text-indigo-600">धारा 16 वैधानिक ब्याज</span> स्वतः गणना करें।
              </>
            ) : (
              <>
                Stop losing money on overdue invoices. Calculate{" "}
                <span className="text-indigo-600">Section 16 statutory interest</span> automatically.
              </>
            )}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            {isHindi
              ? "भारतीय MSME आपूर्तिकर्ताओं के लिए निर्मित। 45-दिवसीय वैधानिक सीमा लागू करें, 16.5% चक्रवृद्धि मासिक ब्याज जोड़ें और समाधान कानूनी नोटिस तैयार करें।"
              : "Built for Indian MSME suppliers. Track commercial receivables, enforce the mandatory 45-day payment cap, compute 16.5% monthly compound interest under the MSMED Act 2006, and generate escalating statutory demand notices."}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
            >
              <span>{isHindi ? "1-क्लिक डेमो लॉगिन (5 नमूना चालान)" : "1-Click Demo Login (5 Sample Invoices)"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/landing"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-sm transition-all"
            >
              {isHindi ? "पायलट प्रोग्राम में शामिल हों" : "Join Pilot Program"}
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isHindi ? "ग्रीन / येलो / रेड ट्रैकिंग" : "Green / Yellow / Red Tracking"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isHindi
                  ? "45-दिवसीय वैधानिक समय-सीमा के आधार पर स्पष्ट रंग-संकेतक स्थिति।"
                  : "Visual timeline tracking based on statutory 45-day terms and due date proximity."}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isHindi ? "3x RBI दर दंडात्मक ब्याज" : "3x RBI Rate Penal Interest"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isHindi
                  ? "धारा 16 के अंतर्गत 16.5% वार्षिक चक्रवृद्धि ब्याज की सटीक गणना।"
                  : "Automatic 16.5% annual compound interest with monthly rests under Section 16 MSMED Act 2006."}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isHindi ? "समाधान कानूनी पैकेज" : "MSME Samadhaan Filing"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isHindi
                  ? "45 दिन से अधिक विलंब पर 1-क्लिक में आधिकारिक कानूनी पीडीएफ फाइलिंग तैयार करें।"
                  : "1-click legal dispute package compilation ready for odr.msme.gov.in."}
              </p>
            </div>
          </div>
        </main>

        <OnboardingGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        onOpenAddModal={() => setIsAddOpen(true)} 
        onOpenImportModal={() => setIsImportOpen(true)}
        onOpenGstRecon={() => setIsGstReconOpen(true)}
        onOpenBuyerRisk={() => setIsBuyerRiskOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t.dashboardTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHindi
                ? `${invoices.length} सक्रिय चालान (MSMED अधिनियम धारा 15 और 16 द्वारा संरक्षित)`
                : `Monitoring ${invoices.length} active supplier invoices governed under Section 15 & 16 of the MSMED Act, 2006`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>{isHindi ? "45-दिन गाइड" : "Day 45 Guide"}</span>
            </button>

            <button
              onClick={() => fetchInvoices()}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
              <span>{t.refresh}</span>
            </button>

            <button
              onClick={() => setIsGstReconOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>{t.gstRecon}</span>
            </button>

            <button
              onClick={() => setIsImportOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>{t.importCsv}</span>
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>{t.newInvoice}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">{t.loadingInvoices}</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <StatSummaryCards invoices={invoices} />

            {/* Legal / Section 16 Info Banner */}
            <MSMEDSection16Banner />

            {/* Auto-Reminder Scheduler Card */}
            <AutoReminderWidget onRemindersDispatched={() => fetchInvoices()} />

            {/* Invoices List with sorting, color badges & Section 16 Interest owed */}
            <InvoiceList
              invoices={invoices}
              onOpenReminder={(inv) => {
                setSelectedForReminder(inv);
                setIsReminderOpen(true);
              }}
              onOpenHistory={(inv) => {
                setSelectedForHistory(inv);
                setIsHistoryOpen(true);
              }}
              onOpenDetail={(inv) => {
                setSelectedForDetail(inv);
                setIsDetailOpen(true);
              }}
              onOpenDisputePackage={(invId) => {
                setSelectedDisputeId(invId);
                setIsDisputeOpen(true);
              }}
              onOpenFinancing={(inv) => {
                setSelectedFinancingInvoice(inv);
                setIsFinancingOpen(true);
              }}
              onQuickMarkPaid={handleQuickMarkPaid}
            />
          </>
        )}
      </main>

      {/* Onboarding Guide Modal */}
      <OnboardingGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onStartAddInvoice={() => setIsAddOpen(true)}
        onStartCsvImport={() => setIsImportOpen(true)}
      />

      {/* Modals */}
      <AddInvoiceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          fetchInvoices();
        }}
      />

      <CSVImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          fetchInvoices();
        }}
        existingInvoices={invoices}
      />

      <GSTReconciliationModal
        isOpen={isGstReconOpen}
        onClose={() => setIsGstReconOpen(false)}
        invoices={invoices}
      />

      <BuyerRiskModal
        isOpen={isBuyerRiskOpen}
        onClose={() => setIsBuyerRiskOpen(false)}
      />

      <DisputePackageModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        invoiceId={selectedDisputeId}
      />

      <FinancingLeadModal
        isOpen={isFinancingOpen}
        onClose={() => setIsFinancingOpen(false)}
        invoice={selectedFinancingInvoice}
      />

      <SendReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        onSuccess={() => {
          fetchInvoices();
        }}
        invoice={selectedForReminder}
      />

      <ReminderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        invoiceNumber={selectedForHistory?.invoiceNumber || ""}
        buyerName={selectedForHistory?.buyerName || ""}
        reminders={selectedForHistory?.reminders || []}
      />

      <InvoiceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        invoice={selectedForDetail}
        onStatusChange={handleStatusChange}
        onOpenReminder={(inv) => {
          setSelectedForReminder(inv);
          setIsReminderOpen(true);
        }}
        onOpenDisputePackage={(invId) => {
          setSelectedDisputeId(invId);
          setIsDisputeOpen(true);
        }}
        onOpenFinancing={(inv) => {
          setSelectedFinancingInvoice(inv);
          setIsFinancingOpen(true);
        }}
        onDelete={handleDeleteInvoice}
      />
    </div>
  );
}
