/**
 * Settlr Internationalization (i18n) Dictionary
 * Comprehensive bilingual translations in English and Hindi (हिन्दी)
 * for Indian MSME business owners, accountants, and finance heads.
 */

export type SupportedLanguage = "en" | "hi";

export interface Translations {
  // Navigation & Branding
  brandTagline: string;
  msmedActBadge: string;
  statutoryTrackerSub: string;
  addInvoice: string;
  importCsv: string;
  gstRecon: string;
  buyerRisk: string;
  signIn: string;
  registerMsme: string;
  signOut: string;

  // Dashboard & Hero
  dashboardTitle: string;
  dashboardSub: string;
  refresh: string;
  newInvoice: string;
  loadingInvoices: string;

  // KPI Summary Cards
  totalReceivables: string;
  activeInvoices: string;
  sec16Interest: string;
  accruingAtRate: string; // "{rate}" is replaced with the supplier's rate
  overdueBeyond45d: string;
  statutoryDelayed: string;
  settledAmount: string;
  recoveredFunds: string;

  // Banner & Auto Scheduler
  statutoryBannerTitle: string;
  statutoryBannerDesc: string;
  autoSchedulerTitle: string;
  autoSchedulerDesc: string;
  runScheduleCheck: string;
  activeAutoTrigger: string;

  // Invoices List & Filters
  allInvoices: string;
  safeInvoices: string;
  dueSoonInvoices: string;
  overdueInvoices: string;
  paidInvoices: string;
  searchPlaceholder: string;
  sortBy: string;
  dueDateAsc: string;
  amountDesc: string;
  overdueDesc: string;
  buyerNameAsc: string;

  // Table Columns & Actions
  colStatus: string;
  colInvoiceNum: string;
  colBuyer: string;
  colInvoiceValue: string;
  colTotalClaim: string;
  colDueDate: string;
  colActions: string;
  btnReminder: string;
  btnDisputePackage: string;
  btnNeedCash: string;
  btnMarkPaid: string;
  btnSettled: string;
  noInvoicesFound: string;

  // Modals & Flows
  modalAddTitle: string;
  modalAddSub: string;
  modalDisputeTitle: string;
  modalGstTitle: string;
  modalFinancingTitle: string;
  modalReminderTitle: string;
  close: string;
  cancel: string;
  save: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    // Navigation & Branding
    brandTagline: "GET PAID. ON TIME.",
    msmedActBadge: "MSMED Act 2006",
    statutoryTrackerSub: "Section 16 Overdue & Recovery Tracker",
    addInvoice: "Add Invoice",
    importCsv: "Import CSV",
    gstRecon: "GST Recon",
    buyerRisk: "Buyer Risk",
    signIn: "Sign In",
    registerMsme: "Register MSME",
    signOut: "Sign Out",

    // Dashboard & Hero
    dashboardTitle: "Receivables & Statutory Overdue Dashboard",
    dashboardSub: "Monitoring active supplier invoices governed under Section 15 & 16 of MSMED Act, 2006",
    refresh: "Refresh",
    newInvoice: "New Invoice",
    loadingInvoices: "Loading invoices and calculating statutory delay interest...",

    // KPI Summary Cards
    totalReceivables: "Total Receivables",
    activeInvoices: "active invoices",
    sec16Interest: "Sec 16 MSMED Interest",
    accruingAtRate: "Accruing @ {rate} p.a.",
    overdueBeyond45d: "Overdue (>45 Days)",
    statutoryDelayed: "Statutory delayed capital",
    settledAmount: "Settled / Paid",
    recoveredFunds: "Recovered funds",

    // Banner & Auto Scheduler
    statutoryBannerTitle: "Statutory Delay Protection: MSMED Act, 2006",
    statutoryBannerDesc: "Under Section 15, buyers must pay within agreed terms or a maximum of 45 days. Section 16 mandates 3x RBI bank rate compounding interest on delayed payments.",
    autoSchedulerTitle: "Automatic Milestone Scheduler",
    autoSchedulerDesc: "Escalates notices automatically at Day 1, 30, 45 & 60 past due without manual effort.",
    runScheduleCheck: "Run Schedule Check",
    activeAutoTrigger: "Active Auto-Trigger",

    // Invoices List & Filters
    allInvoices: "All Invoices",
    safeInvoices: "Safe (<38d)",
    dueSoonInvoices: "Due Soon",
    overdueInvoices: "Overdue (>45d)",
    paidInvoices: "Settled",
    searchPlaceholder: "Search buyer name, invoice number or GSTIN...",
    sortBy: "Sort by:",
    dueDateAsc: "Due Date (Earliest)",
    amountDesc: "Invoice Amount (High to Low)",
    overdueDesc: "Most Days Overdue",
    buyerNameAsc: "Buyer Name (A to Z)",

    // Table Columns & Actions
    colStatus: "Status",
    colInvoiceNum: "Invoice #",
    colBuyer: "Buyer",
    colInvoiceValue: "Invoice Value",
    colTotalClaim: "Total Claim",
    colDueDate: "Due Date",
    colActions: "Actions",
    btnReminder: "Reminder",
    btnDisputePackage: "Dispute Package",
    btnNeedCash: "Need Cash?",
    btnMarkPaid: "Mark Paid",
    btnSettled: "Settled",
    noInvoicesFound: "No invoices found matching your search.",

    // Modals
    modalAddTitle: "Add New Invoice",
    modalAddSub: "Track receivables and statutory MSMED 45-day overdue timeline",
    modalDisputeTitle: "MSEFC Dispute Filing Package",
    modalGstTitle: "GST Reconciliation (GSTR-2B / 3B)",
    modalFinancingTitle: "Instant Invoice Liquidity (TReDS)",
    modalReminderTitle: "Send Statutory Demand Notice",
    close: "Close",
    cancel: "Cancel",
    save: "Save & Track Invoice",
  },

  hi: {
    // Navigation & Branding
    brandTagline: "समय पर भुगतान पाएं।",
    msmedActBadge: "एमएसएमई अधिनियम 2006",
    statutoryTrackerSub: "धारा 16 बकाया भुगतान और वसूली ट्रैकर",
    addInvoice: "बिल जोड़ें",
    importCsv: "CSV आयात करें",
    gstRecon: "GST मिलान",
    buyerRisk: "क्रेता जोखिम",
    signIn: "लॉग इन करें",
    registerMsme: "एमएसएमई पंजीकरण",
    signOut: "लॉग आउट",

    // Dashboard & Hero
    dashboardTitle: "प्राप्य राशि और वैधानिक बकाया डैशबोर्ड",
    dashboardSub: "एमएसएमईडी अधिनियम 2006 की धारा 15 और 16 के तहत सक्रिय चालानों की निगरानी",
    refresh: "ताज़ा करें",
    newInvoice: "नया बिल",
    loadingInvoices: "बिल लोड हो रहे हैं और वैधानिक ब्याज की गणना हो रही है...",

    // KPI Summary Cards
    totalReceivables: "कुल प्राप्य राशि",
    activeInvoices: "सक्रिय बिल",
    sec16Interest: "धारा 16 एमएसएमई ब्याज",
    accruingAtRate: "{rate} वार्षिक चक्रवृद्धि दर",
    overdueBeyond45d: "45 दिन से अधिक बकाया",
    statutoryDelayed: "अवरुद्ध वैधानिक पूंजी",
    settledAmount: "प्राप्त / चुकता राशि",
    recoveredFunds: "सफलतापूर्वक वसूल",

    // Banner & Auto Scheduler
    statutoryBannerTitle: "वैधानिक सुरक्षा: एमएसएमईडी अधिनियम, 2006",
    statutoryBannerDesc: "धारा 15 के तहत खरीदार को अधिकतम 45 दिनों में भुगतान करना अनिवार्य है। धारा 16 के अनुसार विलंबित भुगतान पर आरबीआई दर का 3 गुना चक्रवृद्धि ब्याज लागू होता है।",
    autoSchedulerTitle: "स्वचालित चरणबद्ध अनुस्मारक",
    autoSchedulerDesc: "1, 30, 45 और 60 दिन की देरी पर बिना किसी मानवीय प्रयास के अपने आप कानूनी नोटिस भेजे जाते हैं।",
    runScheduleCheck: "शेड्यूल जांच चलाएं",
    activeAutoTrigger: "सक्रिय ऑटो-ट्रिगर",

    // Invoices List & Filters
    allInvoices: "सभी बिल",
    safeInvoices: "सुरक्षित (<38 दिन)",
    dueSoonInvoices: "जल्द देय",
    overdueInvoices: "अतिदेय (>45 दिन)",
    paidInvoices: "चुकता",
    searchPlaceholder: "क्रेता का नाम, बिल संख्या या GSTIN खोजें...",
    sortBy: "क्रमबद्ध करें:",
    dueDateAsc: "देय तिथि (पहले से बाद)",
    amountDesc: "बिल राशि (अधिक से कम)",
    overdueDesc: "सर्वाधिक विलंबित",
    buyerNameAsc: "क्रेता नाम (A से Z)",

    // Table Columns & Actions
    colStatus: "स्थिति",
    colInvoiceNum: "बिल संख्या",
    colBuyer: "क्रेता (खरीदार)",
    colInvoiceValue: "बिल मूल्य",
    colTotalClaim: "कुल कानूनी दावा",
    colDueDate: "देय तिथि",
    colActions: "कार्रवाई",
    btnReminder: "अनुस्मारक",
    btnDisputePackage: "विवाद पैकेज",
    btnNeedCash: "तुरंत नकदी?",
    btnMarkPaid: "भुगतान हुआ",
    btnSettled: "चुकता",
    noInvoicesFound: "आपकी खोज से मेल खाता कोई बिल नहीं मिला।",

    // Modals
    modalAddTitle: "नया बिल जोड़ें",
    modalAddSub: "प्राप्य राशि और 45 दिवसीय वैधानिक समयसीमा ट्रैक करें",
    modalDisputeTitle: "एमएसएमई समाधान विवाद फाइलिंग पैकेज",
    modalGstTitle: "जीएसटी मिलान (GSTR-2B / 3B)",
    modalFinancingTitle: "तत्काल बिल छूट नकदी (TReDS)",
    modalReminderTitle: "वैधानिक मांग नोटिस भेजें",
    close: "बंद करें",
    cancel: "रद्द करें",
    save: "सहेजें और ट्रैक करें",
  },
};
