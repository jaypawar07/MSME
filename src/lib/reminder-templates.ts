export type SupportedLanguage = "en" | "hi";

export interface ReminderTemplateParams {
  buyerName: string;
  supplierName: string;
  invoiceNumber: string;
  amount: number;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  interestOwed: number;
  totalClaim: number;
  udyamNumber?: string | null;
  lang?: SupportedLanguage;
}

export interface ReminderTemplate {
  key: "FRIENDLY" | "FORMAL" | "URGENT_MSMED" | "LEGAL_SAMADHAAN";
  title: string;
  titleHi: string;
  badge: string;
  badgeHi: string;
  badgeColor: string;
  recommendedWhen: string;
  recommendedWhenHi: string;
  getSubject: (params: { invoiceNumber: string; amount: number; lang?: SupportedLanguage }) => string;
  generateBody: (params: ReminderTemplateParams) => string;
}

export const REMINDER_TEMPLATES: Record<string, ReminderTemplate> = {
  FRIENDLY: {
    key: "FRIENDLY",
    title: "Gentle Courtesy Reminder",
    titleHi: "विनम्र अनुस्मारक (पहला रिमाइंडर)",
    badge: "Level 1: Friendly",
    badgeHi: "स्तर 1: विनम्र",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    recommendedWhen: "Due soon or 0-7 days overdue",
    recommendedWhenHi: "देय तिथि के समीप या 0-7 दिन विलंबित",
    getSubject: ({ invoiceNumber, amount, lang = "en" }) =>
      lang === "hi"
        ? `विनम्र अनुस्मारक: चालान #${invoiceNumber} (राशि: ₹${amount.toLocaleString("en-IN")})`
        : `Gentle Reminder: Invoice #${invoiceNumber} for ₹${amount.toLocaleString("en-IN")}`,
    generateBody: ({ buyerName, supplierName, invoiceNumber, amount, dueDate, lang = "en" }) => {
      if (lang === "hi") {
        return (
          `प्रिय लेखा टीम (${buyerName}),\n\n` +
          `आशा है आप सकुशल होंगे।\n\n` +
          `यह चालान #${invoiceNumber} राशि ₹${amount.toLocaleString("en-IN")} के संबंध में एक विनम्र अनुस्मारक है, जिसकी भुगतान देय तिथि ${dueDate} थी।\n\n` +
          `कृपया पुष्टि करें कि क्या भुगतान निर्धारित या संसाधित कर दिया गया है। यदि भुगतान पहले ही किया जा चुका है, तो कृपया UTR / NEFT संदर्भ संख्या साझा करें।\n\n` +
          `आपके सहयोग के लिए धन्यवाद।\n\n` +
          `सादर,\n` +
          `${supplierName}`
        );
      }
      return (
        `Dear Accounts Team at ${buyerName},\n\n` +
        `Hope you are doing well.\n\n` +
        `This is a gentle reminder regarding Invoice #${invoiceNumber} for ₹${amount.toLocaleString("en-IN")}, dated due for payment on ${dueDate}.\n\n` +
        `Kindly confirm if the payment has been scheduled or processed. If already initiated, please share the transaction reference (UTR/NEFT).\n\n` +
        `Thank you for your valued partnership.\n\n` +
        `Warm regards,\n` +
        `${supplierName}`
      );
    },
  },
  FORMAL: {
    key: "FORMAL",
    title: "Formal Payment Follow-up",
    titleHi: "औपचारिक भुगतान सूचना",
    badge: "Level 2: Formal",
    badgeHi: "स्तर 2: औपचारिक",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    recommendedWhen: "8 - 15 days overdue",
    recommendedWhenHi: "8 से 15 दिन का विलंब",
    getSubject: ({ invoiceNumber, amount, lang = "en" }) =>
      lang === "hi"
        ? `अतिदेय भुगतान सूचना: चालान #${invoiceNumber} - तत्काल भुगतान अपेक्षित`
        : `OVERDUE NOTICE: Invoice #${invoiceNumber} - Payment Required`,
    generateBody: ({ buyerName, supplierName, invoiceNumber, amount, dueDate, daysOverdue, lang = "en" }) => {
      if (lang === "hi") {
        return (
          `प्रति: वित्त एवं लेखा विभाग, ${buyerName},\n\n` +
          `विषय: बकाया चालान #${invoiceNumber} (₹${amount.toLocaleString("en-IN")}) के भुगतान संदर्भ में\n\n` +
          `हमारे अभिलेखों के अनुसार, चालान #${invoiceNumber} का भुगतान जो ${dueDate} को देय था, अब ${daysOverdue} दिनों से अतिदेय है।\n\n` +
          `हम आपसे अनुरोध करते हैं कि संचालन में किसी भी बाधा और वैधानिक विलंब प्रक्रिया से बचने के लिए 3 कार्य दिवसों के भीतर ₹${amount.toLocaleString("en-IN")} की मूल राशि का भुगतान जारी करें।\n\n` +
          `कृपया भुगतान पुष्टिकरण अथवा UTR नंबर जल्द से जल्द प्रेषित करें।\n\n` +
          `भवदीय,\n` +
          `${supplierName}`
        );
      }
      return (
        `Attention: Finance & Accounts Department, ${buyerName},\n\n` +
        `Re: Outstanding Invoice #${invoiceNumber} (₹${amount.toLocaleString("en-IN")})\n\n` +
        `Our records show that payment for Invoice #${invoiceNumber}, which was due on ${dueDate}, is now overdue by ${daysOverdue} days.\n\n` +
        `We request you to expedite the remittance of the overdue principal sum of ₹${amount.toLocaleString("en-IN")} within 3 business days to avoid operational disruptions and statutory delay escalation.\n\n` +
        `Please revert with the payment confirmation or UTR number at your earliest.\n\n` +
        `Sincerely,\n` +
        `${supplierName}`
      );
    },
  },
  URGENT_MSMED: {
    key: "URGENT_MSMED",
    title: "Statutory Demand (MSMED Act 2006)",
    titleHi: "वैधानिक मांग नोटिस (MSMED अधिनियम धारा 16)",
    badge: "Level 3: Statutory MSME",
    badgeHi: "स्तर 3: वैधानिक MSME",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    recommendedWhen: "16 - 30 days overdue",
    recommendedWhenHi: "16 से 30 दिन का विलंब (दंडात्मक ब्याज लागू)",
    getSubject: ({ invoiceNumber, lang = "en" }) =>
      lang === "hi"
        ? `MSMED अधिनियम 2006 अंतर्गत मांग नोटिस: चालान #${invoiceNumber} पर 16.5% चक्रवृद्धि ब्याज लागू`
        : `DEMAND NOTICE under MSMED Act 2006: Invoice #${invoiceNumber} Accruing 16.5% Penal Interest`,
    generateBody: ({ buyerName, supplierName, invoiceNumber, amount, dueDate, daysOverdue, interestOwed, totalClaim, udyamNumber, lang = "en" }) => {
      if (lang === "hi") {
        return (
          `MSMED अधिनियम, 2006 की धारा 15 और 16 के अंतर्गत विलंबित भुगतान का वैधानिक नोटिस\n\n` +
          `प्रति:\nप्रबंधन एवं लेखा प्रमुख, ${buyerName}\n\n` +
          `प्रेषक:\n${supplierName} ${udyamNumber ? `(उद्यम पंजीकरण: ${udyamNumber})` : ""}\n\n` +
          `विषय: चालान #${invoiceNumber} के अतिदेय भुगतान हेतु MSMED अधिनियम दंडात्मक ब्याज सहित वैधानिक मांग।\n\n` +
          `महोदय/महोदया,\n\n` +
          `कृपया संज्ञान लें कि चालान #${invoiceNumber} (देय तिथि: ${dueDate}) का भुगतान अभी तक अप्राप्त है और यह ${daysOverdue} दिनों से अतिदेय है।\n\n` +
          `एक उद्यम-पंजीकृत MSME इकाई होने के नाते, हमारी आपूर्ति सूक्ष्म, लघु और मध्यम उद्यम विकास (MSMED) अधिनियम, 2006 के तहत संरक्षित है।\n\n` +
          `• मूल चालान राशि: ₹${amount.toLocaleString("en-IN")}\n` +
          `• वैधानिक चक्रवृद्धि दंडात्मक ब्याज (धारा 16 @ 16.5% वार्षिक, मासिक चक्र): ₹${interestOwed.toLocaleString("en-IN")}\n` +
          `• कुल वैधानिक दावा: ₹${totalClaim.toLocaleString("en-IN")}\n\n` +
          `MSMED अधिनियम की धारा 16 के तहत, विलंबित भुगतान पर RBI बैंक दर के 3 गुना चक्रवृद्धि ब्याज का भुगतान कानूनी रूप से अनिवार्य है। धारा 23 के अनुसार, यह दंडात्मक ब्याज आयकर में व्यापारिक व्यय के रूप में अमान्य है।\n\n` +
          `कृपया 48 घंटों के भीतर संपूर्ण बकाया राशि का भुगतान सुनिश्चित करें।\n\n` +
          `भवदीय,\n` +
          `${supplierName}`
        );
      }
      return (
        `FORMAL NOTICE OF DELAYED PAYMENT UNDER SECTION 15 & 16, MSMED ACT, 2006\n\n` +
        `To:\nManagement & Accounts Head, ${buyerName}\n\n` +
        `From:\n${supplierName} ${udyamNumber ? `(Udyam Reg: ${udyamNumber})` : ""}\n\n` +
        `Sub: Statutory demand for overdue payment of Invoice #${invoiceNumber} along with MSMED penal interest.\n\n` +
        `Dear Sir/Madam,\n\n` +
        `Please take notice that Invoice #${invoiceNumber} dated due on ${dueDate} remains unpaid and is currently ${daysOverdue} days overdue.\n\n` +
        `As an Udyam-registered MSME enterprise, our supplies are governed under the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006.\n\n` +
        `• Principal Amount: ₹${amount.toLocaleString("en-IN")}\n` +
        `• Statutory Compounded Interest (Section 16 @ 16.5% p.a. monthly rests): ₹${interestOwed.toLocaleString("en-IN")}\n` +
        `• Total Statutory Claim to Date: ₹${totalClaim.toLocaleString("en-IN")}\n\n` +
        `Under Section 16 of the MSMED Act, the buyer is legally obligated to pay compound interest at 3x the RBI bank rate on delayed payments. Furthermore, under Section 23 of the Act, penal interest paid on MSME delayed payments is strictly non-deductible as business expense for Income Tax.\n\n` +
        `Please clear the total outstanding balance within 48 hours.\n\n` +
        `Yours faithfully,\n` +
        `${supplierName}`
      );
    },
  },
  LEGAL_SAMADHAAN: {
    key: "LEGAL_SAMADHAAN",
    title: "Pre-Samadhaan Council Legal Warning",
    titleHi: "समाधान पोर्टल / MSEFC कानूनी अंतिम चेतावनी",
    badge: "Level 4: Legal / Samadhaan",
    badgeHi: "स्तर 4: कानूनी / समाधान",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    recommendedWhen: "30+ days overdue",
    recommendedWhenHi: "30+ दिन अतिदेय (45-दिवसीय वैधानिक सीमा उल्लंघन)",
    getSubject: ({ invoiceNumber, lang = "en" }) =>
      lang === "hi"
        ? `MSME समाधान पोर्टल पर वाद दायर करने से पूर्व अंतिम कानूनी नोटिस: चालान #${invoiceNumber}`
        : `FINAL NOTICE BEFORE FILING ON MSME SAMADHAAN PORTAL: Invoice #${invoiceNumber}`,
    generateBody: ({ buyerName, supplierName, invoiceNumber, amount, dueDate, daysOverdue, interestOwed, totalClaim, udyamNumber, lang = "en" }) => {
      if (lang === "hi") {
        return (
          `MSEFC (MSME समाधान) कानूनी कार्यवाही से पूर्व अंतिम विधिक नोटिस\n\n` +
          `प्रति:\nनिदेशक / प्रबंध भागीदार / वित्त प्रमुख\n${buyerName}\n\n` +
          `विषय: चालान #${invoiceNumber} (कुल दावा: ₹${totalClaim.toLocaleString("en-IN")}) के निपटान हेतु अंतिम सूचना\n\n` +
          `महोदय/महोदया,\n\n` +
          `पूर्व सूचनाओं के उपरांत भी आपकी कंपनी चालान #${invoiceNumber} की ₹${amount.toLocaleString("en-IN")} की देयता का भुगतान करने में विफल रही है, जो अब ${daysOverdue} दिनों से अतिदेय है (MSMED 45-दिवसीय वैधानिक सीमा का उल्लंघन)।\n\n` +
          `वर्तमान वैधानिक देयता विवरण:\n` +
          `1. मूल चालान राशि: ₹${amount.toLocaleString("en-IN")}\n` +
          `2. उपार्जित चक्रवृद्धि दंडात्मक ब्याज (धारा 16, MSMED अधिनियम): ₹${interestOwed.toLocaleString("en-IN")}\n` +
          `3. कुल वसूली योग्य राशि: ₹${totalClaim.toLocaleString("en-IN")}\n\n` +
          `कृपया संज्ञान लें कि यदि इस सूचना के 7 दिनों के भीतर ₹${totalClaim.toLocaleString("en-IN")} की संपूर्ण राशि हमारे खाते में जमा नहीं की जाती है, तो हम MSMED अधिनियम 2006 की धारा 18 के अंतर्गत सूक्ष्म और लघु उद्यम सुविधा परिषद (MSEFC) के समक्ष MSME समाधान पोर्टल (odr.msme.gov.in) पर औपचारिक विवाद दायर करेंगे।\n\n` +
          `इसे कानूनी कार्यवाही से पूर्व हमारी अंतिम सूचना मानें।\n\n` +
          `कृते ${supplierName}\n` +
          `${udyamNumber ? `उद्यम पंजीकरण संख्या: ${udyamNumber}` : ""}`
        );
      }
      return (
        `FINAL LEGAL NOTICE PRIOR TO MSEFC (MSME SAMADHAAN) PROCEEDINGS\n\n` +
        `To:\nDirectors / Managing Partner / Finance Head\n${buyerName}\n\n` +
        `RE: FINAL NOTICE FOR CLEARANCE OF INVOICE #${invoiceNumber} (₹${totalClaim.toLocaleString("en-IN")})\n\n` +
        `Dear Sir/Madam,\n\n` +
        `Despite previous notices, your company has failed to discharge its liability of ₹${amount.toLocaleString("en-IN")} for Invoice #${invoiceNumber}, which is now overdue by ${daysOverdue} days (exceeding statutory 45-day MSMED limit).\n\n` +
        `CURRENT STATUTORY LIABILITY:\n` +
        `1. Principal Invoice Value: ₹${amount.toLocaleString("en-IN")}\n` +
        `2. Accrued Compounded Penal Interest (Section 16, MSMED Act): ₹${interestOwed.toLocaleString("en-IN")}\n` +
        `3. TOTAL RECOVERABLE SUM: ₹${totalClaim.toLocaleString("en-IN")}\n\n` +
        `TAKE NOTICE that if the full amount of ₹${totalClaim.toLocaleString("en-IN")} is not credited into our account within 7 days of this communication, we shall formally file an application against ${buyerName} before the Micro and Small Enterprises Facilitation Council (MSEFC) via the MSME Samadhaan Portal under Section 18 of the MSMED Act 2006 for immediate arbitration and recovery along with full compounding interest and legal costs.\n\n` +
        `Treat this as our final intimation prior to legal escalation.\n\n` +
        `For ${supplierName}\n` +
        `${udyamNumber ? `Udyam Registration: ${udyamNumber}` : ""}`
      );
    },
  },
};

export function getRecommendedTone(daysOverdue: number): keyof typeof REMINDER_TEMPLATES {
  if (daysOverdue <= 7) return "FRIENDLY";
  if (daysOverdue <= 15) return "FORMAL";
  if (daysOverdue <= 30) return "URGENT_MSMED";
  return "LEGAL_SAMADHAAN";
}
