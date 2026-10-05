"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AUTO_SEND_WINDOW_IST } from "@/lib/settings/policy";
import { 
  Bell, 
  Scale, 
  Link2, 
  Users, 
  Database, 
  ShieldAlert, 
  Check, 
  Clock, 
  Mail, 
  MessageSquare, 
  Save, 
  Loader2, 
  AlertTriangle, 
  Download, 
  Trash2, 
  UserPlus, 
  History, 
  CheckCircle2,
  Building2,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isHindi } = useLanguage();

  const [activeTab, setActiveTab] = useState<string>("notifications");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quietHoursWarning, setQuietHoursWarning] = useState<string | null>(null);

  // Form States
  const [settings, setSettings] = useState<any>({
    enableWhatsApp: true,
    enableEmail: true,
    sendDay1: true,
    sendDay30: true,
    sendDay45: true,
    sendDay60: true,
    quietHoursStart: "21:00",
    quietHoursEnd: "08:00",
    rbiBaseRate: 5.5,
    statutoryMultiplier: 3.0,
    effectiveAnnualRate: 16.5,
    rateEffectiveDate: new Date().toISOString().split("T")[0],
    rateNotes: "Section 16 statutory rate (3x RBI Bank Rate of 5.5% p.a.)",
    tallyStatus: "CSV_ACTIVE",
    whatsappStatus: "PENDING_CREDENTIALS",
    whatsappPhoneNumberId: "",
    whatsappAccountId: "",
    whatsappApiKey: "",
    gstGspStatus: "SANDBOX_READY",
    gstGspUsername: "",
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("OWNER");
  const [companyName, setCompanyName] = useState<string>("");

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("ACCOUNTANT");
  const [inviting, setInviting] = useState(false);

  // Delete Account Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({
            ...data.settings,
            rateEffectiveDate: data.settings.rateEffectiveDate
              ? new Date(data.settings.rateEffectiveDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          });
        }
        setQuietHoursWarning(data.quietHoursWarning || null);
        setAuditLogs(data.auditLogs || []);
        setTeamMembers(data.teamMembers || []);
        setCurrentUserRole(data.currentUserRole || "OWNER");
        setCompanyName(data.companyName || "");
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(null);

    try {
      // Calculate effective rate from base * multiplier
      const calculatedRate = Number((settings.rbiBaseRate * settings.statutoryMultiplier).toFixed(2));

      const payload = {
        ...settings,
        effectiveAnnualRate: calculatedRate,
      };

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSaveSuccess(isHindi ? "सेटिंग्स सफलतापूर्वक सहेजी गईं!" : "Settings saved successfully!");
      fetchSettings();
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteTeammate = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite teammate");
      }

      setIsInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message || "Error inviting teammate");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(isHindi ? "क्या आप इस सदस्य को हटाना चाहते हैं?" : "Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/team?id=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSettings();
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCompanyName: deleteConfirmationInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      alert("Your account has been deleted.");
      signOut({ callbackUrl: "/" });
    } catch (err: any) {
      setErrorMsg(err.message || "Error deleting account");
      setDeleting(false);
    }
  };

  const isOwner = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isHindi ? "कंपनी एवं अनुपालन सेटिंग्स" : "Company & Compliance Settings"}
              </h1>
              <Badge variant="outline" className="text-[11px] font-mono">
                {companyName || "MSME Enterprise"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isHindi
                ? "स्वचालित सूचनाएं, RBI वैधानिक ब्याज दरें, टीम अनुमतियां और डेटा प्रबंधन"
                : "Manage automated reminder triggers, Section 16 interest rates, team access, and audit records"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <Button
              onClick={handleSaveSettings}
              disabled={saving || !isOwner}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 gap-1.5"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isHindi ? "परिवर्तन सहेजें" : "Save Changes"}</span>
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading company settings...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1.5 gap-1 bg-slate-200/60 rounded-2xl">
              <TabsTrigger value="notifications" className="gap-2 py-2">
                <Bell className="h-3.5 w-3.5" />
                <span>{isHindi ? "सूचनाएं" : "Notifications"}</span>
              </TabsTrigger>
              <TabsTrigger value="interest" className="gap-2 py-2">
                <Scale className="h-3.5 w-3.5" />
                <span>{isHindi ? "धारा 16 ब्याज" : "Statutory Interest"}</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2 py-2">
                <Link2 className="h-3.5 w-3.5" />
                <span>{isHindi ? "एकीकरण" : "Integrations"}</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2 py-2">
                <Users className="h-3.5 w-3.5" />
                <span>{isHindi ? "टीम एक्सेस" : "Team Access"}</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2 py-2">
                <Database className="h-3.5 w-3.5" />
                <span>{isHindi ? "डेटा व खाता" : "Data & Account"}</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: NOTIFICATIONS */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-indigo-600" />
                    <span>{isHindi ? "स्वचालित डिलीवरी माध्यम" : "Automated Delivery Channels"}</span>
                  </CardTitle>
                  <CardDescription>
                    {isHindi
                      ? "चुनें कि क्या रिमाइंडर ईमेल या व्हाट्सएप के माध्यम से स्वतः भेजे जाने चाहिए"
                      : "Control which communication channels are active for automated and manual invoice reminders."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">WhatsApp Reminders</div>
                          <div className="text-[11px] text-slate-500">Send via WhatsApp Cloud API</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableWhatsApp}
                        onChange={(e) => setSettings({ ...settings, enableWhatsApp: e.target.checked })}
                        className="h-5 w-5 rounded-md accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">Email (SMTP / Resend)</div>
                          <div className="text-[11px] text-slate-500">Send official formal PDF notices</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableEmail}
                        onChange={(e) => setSettings({ ...settings, enableEmail: e.target.checked })}
                        className="h-5 w-5 rounded-md accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Per-Milestone Trigger Toggles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span>{isHindi ? "माइलस्टोन अनुस्मारक नियम (Day 1 / 30 / 45 / 60)" : "Per-Milestone Notification Triggers"}</span>
                  </CardTitle>
                  <CardDescription>
                    {isHindi
                      ? "तय करें कि कौन से चरणों पर खरीदार को स्वचालित नोटिस भेजा जाए और कौन सा केवल डैशबोर्ड पर दिखे"
                      : "Choose which overdue milestones actively dispatch notifications vs remaining silent indicators on your dashboard."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Day 1 */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Badge variant="indigo" className="text-[10px]">Day 1</Badge>
                          <span>Gentle Courtesy Reminder</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Dispatched immediately after payment due date.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.sendDay1}
                        onChange={(e) => setSettings({ ...settings, sendDay1: e.target.checked })}
                        className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Day 30 */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Badge variant="warning" className="text-[10px]">Day 30</Badge>
                          <span>Formal Follow-up Notice</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Warns buyer of upcoming 45-day statutory cap.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.sendDay30}
                        onChange={(e) => setSettings({ ...settings, sendDay30: e.target.checked })}
                        className="h-4 w-4 rounded accent-amber-600 cursor-pointer"
                      />
                    </div>

                    {/* Day 45 */}
                    <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/20 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                          <Badge variant="destructive" className="text-[10px]">Day 45 (Statutory)</Badge>
                          <span>Section 16 Penal Interest Demand</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Notifies {Number((settings.rbiBaseRate * settings.statutoryMultiplier).toFixed(2))}% compound monthly penal interest accrual.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.sendDay45}
                        onChange={(e) => setSettings({ ...settings, sendDay45: e.target.checked })}
                        className="h-4 w-4 rounded accent-rose-600 cursor-pointer"
                      />
                    </div>

                    {/* Day 60 */}
                    <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/30 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-red-950 flex items-center gap-1.5">
                          <Badge variant="destructive" className="text-[10px]">Day 60 (Legal)</Badge>
                          <span>Pre-Samadhaan Final Warning</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Final 7-day notice before MSEFC portal arbitration filing.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.sendDay60}
                        onChange={(e) => setSettings({ ...settings, sendDay60: e.target.checked })}
                        className="h-4 w-4 rounded accent-red-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quiet Hours Window */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span>{isHindi ? "शांत समय (Quiet Hours)" : "Quiet Hours Window"}</span>
                  </CardTitle>
                  <CardDescription>
                    {isHindi
                      ? "इस समय अवधि के दौरान कोई भी स्वचालित रिमाइंडर संदेश नहीं भेजा जाएगा (डिफ़ॉल्ट 9pm–8am)"
                      : "Automated reminders will be suppressed and queued during this window to respect business hours."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isHindi ? "प्रारंभ समय (शाम)" : "Quiet Window Start"}
                      </label>
                      <input
                        type="time"
                        value={settings.quietHoursStart}
                        onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isHindi ? "समाप्ति समय (सुबह)" : "Quiet Window End"}
                      </label>
                      <input
                        type="time"
                        value={settings.quietHoursEnd}
                        onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 max-w-md">
                    {isHindi
                      ? `स्वचालित रिमाइंडर प्रतिदिन ${AUTO_SEND_WINDOW_IST.start}–${AUTO_SEND_WINDOW_IST.end} IST के बीच भेजे जाते हैं। शांत समय इस अवधि से नहीं टकराना चाहिए।`
                      : `Automatic reminders go out once a day between ${AUTO_SEND_WINDOW_IST.start} and ${AUTO_SEND_WINDOW_IST.end} IST. Quiet hours must not overlap this window.`}
                  </p>
                  {quietHoursWarning && (
                    <div className="mt-3 max-w-md flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>{quietHoursWarning}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: STATUTORY INTEREST SETTINGS */}
            <TabsContent value="interest" className="space-y-6">
              <Card className="border-l-4 border-l-indigo-600">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="h-4 w-4 text-indigo-600" />
                    <span>{isHindi ? "RBI बैंक दर एवं धारा 16 चक्रवृद्धि ब्याज दर" : "RBI Benchmark & Section 16 Statutory Rate"}</span>
                  </CardTitle>
                  <CardDescription>
                    {isHindi
                      ? "जब भी भारतीय रिजर्व बैंक (RBI) बैंक दर में संशोधन करे, आप यहां दर को अपडेट कर सकते हैं बिना किसी कोड डिप्लॉयमेंट के। बैंक दर (MSF दर के बराबर) का उपयोग करें, रेपो दर का नहीं।"
                      : "Section 16 mandates compound interest with monthly rests at 3x the RBI Bank Rate. Use the Bank Rate (it equals the MSF rate), not the lower repo rate. Update it here whenever the RBI revises it."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isHindi ? "RBI बैंक आधार दर (%)" : "RBI Base Bank Rate (%)"}
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={settings.rbiBaseRate}
                        onChange={(e) => setSettings({ ...settings, rbiBaseRate: parseFloat(e.target.value) || 0 })}
                        className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isHindi ? "वैधानिक गुणक (MSMED Act)" : "Statutory Multiplier (Sec 16)"}
                      </label>
                      <input
                        type="number"
                        disabled
                        value={settings.statutoryMultiplier}
                        className="w-full text-sm font-mono font-bold bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed"
                      />
                      <span className="text-[10px] text-slate-400">Fixed at 3x under Section 16</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isHindi ? "प्रभावी वार्षिक चक्रवृद्धि दर" : "Effective Compounded Rate"}
                      </label>
                      <div className="h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center px-3 font-mono font-black text-indigo-700 text-sm">
                        {(settings.rbiBaseRate * settings.statutoryMultiplier).toFixed(2)}% p.a.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isHindi ? "प्रभावी तिथि (As of Date)" : "Effective As of Date"}
                      </label>
                      <input
                        type="date"
                        value={settings.rateEffectiveDate}
                        onChange={(e) => setSettings({ ...settings, rateEffectiveDate: e.target.value })}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isHindi ? "गजट / संदर्भ टिप्पणी" : "Gazette / RBI Notification Note"}
                      </label>
                      <input
                        type="text"
                        value={settings.rateNotes || ""}
                        onChange={(e) => setSettings({ ...settings, rateNotes: e.target.value })}
                        placeholder="e.g. RBI Monetary Policy Committee resolution dated..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>{isHindi ? "स्वतः पुनर्गणना:" : "Real-time Recalculation:"}</strong>{" "}
                      {isHindi
                        ? "दर बदलने पर आपके सभी अतिदेय चालानों का सेक्शन 16 ब्याज तुरंत नई दर के अनुसार पुनर्गणित किया जाएगा।"
                        : "Saving this rate automatically updates interest owed and dispute packages across all active overdue invoices for your enterprise."}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Change Audit History Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-500" />
                    <span>{isHindi ? "दर संशोधन ऑडिट इतिहास" : "Rate Revision Audit Trail"}</span>
                  </CardTitle>
                  <CardDescription>
                    {isHindi
                      ? "कानूनी विवादों एवं MSEFC परिषद में प्रस्तुत करने हेतु दर परिवर्तनों का अपरिवर्तनीय रिकॉर्ड"
                      : "Immutable historical log of interest rate revisions for audit and court submission purposes."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      {isHindi ? "कोई पूर्व दर परिवर्तन रिकॉर्ड नहीं है।" : "No historical rate modifications logged yet."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                            <th className="py-2.5 px-3">Effective Date</th>
                            <th className="py-2.5 px-3">Old Rate</th>
                            <th className="py-2.5 px-3">New Rate</th>
                            <th className="py-2.5 px-3">Reason / Gazette</th>
                            <th className="py-2.5 px-3">Updated By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono">
                                {format(new Date(log.effectiveDate), "dd MMM yyyy")}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500">{log.oldRate}%</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{log.newRate}%</td>
                              <td className="py-2.5 px-3 text-slate-700">{log.reason || "RBI Rate Revision"}</td>
                              <td className="py-2.5 px-3 text-slate-500">{log.changedBy || "Owner"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: INTEGRATIONS */}
            <TabsContent value="integrations" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tally / Zoho */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        CSV
                      </div>
                      <Badge variant="success" className="text-[10px]">
                        Active (CSV Import)
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">Tally & Zoho Books</CardTitle>
                    <CardDescription>
                      Bulk import overdue sales ledgers and invoices via standard CSV exports with auto-deduplication.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-800">Supported Formats:</div>
                      <div>• Tally Prime Overdue Ledger CSV</div>
                      <div>• Zoho Books Invoices Export</div>
                      <div>• Custom Excel Sheets</div>
                    </div>
                  </CardContent>
                </Card>

                {/* WhatsApp Cloud API */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        WA
                      </div>
                      <Badge variant={settings.whatsappApiKey ? "success" : "secondary"} className="text-[10px]">
                        {settings.whatsappApiKey ? "Connected" : "Credentials Ready"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">WhatsApp Business API</CardTitle>
                    <CardDescription>
                      Meta Cloud API credentials for verified business delivery with read receipts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number ID</label>
                      <input
                        type="text"
                        value={settings.whatsappPhoneNumberId || ""}
                        onChange={(e) => setSettings({ ...settings, whatsappPhoneNumberId: e.target.value })}
                        placeholder="e.g. 1006534289..."
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Access Token / API Key</label>
                      <input
                        type="password"
                        value={settings.whatsappApiKey || ""}
                        onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                        placeholder="EAA..."
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* GST GSP Recon */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        GST
                      </div>
                      <Badge variant="indigo" className="text-[10px]">
                        Sandbox Ready
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">GST Suvidha Provider (GSP)</CardTitle>
                    <CardDescription>
                      Direct reconciliation engine for GSTR-2B inward supplies & GSTR-3B tax payment verification.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                      <div className="font-semibold">Automated Diff Engine:</div>
                      <div>• Matches buyer GSTIN & ITC filed</div>
                      <div>• Flags non-compliant buyers</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 4: TEAM ACCESS */}
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span>{isHindi ? "कंपनी टीम सदस्य व अनुमतियां" : "Team Members & Permissions"}</span>
                    </CardTitle>
                    <CardDescription>
                      {isHindi
                        ? "Owner सभी सेटिंग्स बदल सकते हैं; Accountant / Staff चालान देख और जोड़ सकते हैं।"
                        : "Owner has full admin control. Accountant and Staff can track, add, and send reminders, but cannot modify Settings or delete records."}
                    </CardDescription>
                  </div>

                  {isOwner && (
                    <Button
                      onClick={() => setIsInviteOpen(true)}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>{isHindi ? "सदस्य जोड़ें" : "Invite Teammate"}</span>
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-slate-100">
                    {/* Owner Row */}
                    <div className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                          {(session?.user?.name || "O")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                            <span>{session?.user?.name} (You)</span>
                            <Badge variant="indigo" className="text-[10px]">Owner</Badge>
                          </div>
                          <div className="text-[11px] text-slate-500">{session?.user?.email}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600">Active</span>
                    </div>

                    {/* Team Members List */}
                    {teamMembers.map((member) => (
                      <div key={member.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {member.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                              <span>{member.name}</span>
                              <Badge variant={member.role === "ACCOUNTANT" ? "warning" : "secondary"} className="text-[10px]">
                                {member.role}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500">{member.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400">
                            Added {format(new Date(member.invitedAt), "dd MMM yyyy")}
                          </span>
                          {isOwner && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 hover:bg-rose-50 rounded"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: DATA & ACCOUNT */}
            <TabsContent value="data" className="space-y-6">
              {/* Export Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="h-4 w-4 text-emerald-600" />
                    <span>{isHindi ? "कंपनी का संपूर्ण डेटा निर्यात करें" : "Export All Company Data"}</span>
                  </CardTitle>
                  <CardDescription>
                    {isHindi
                      ? "अपने सभी चालान, धारा 16 ब्याज गणनाएं एवं अनुस्मारक इतिहास को CSV प्रारूप में डाउनलोड करें।"
                      : "Download a comprehensive CSV archive of all invoices, Section 16 penal interest claims, and reminder audit trails."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="/api/settings/export"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-98"
                  >
                    <Download className="h-4 w-4" />
                    <span>{isHindi ? "CSV बैकअप डाउनलोड करें" : "Download Full CSV Export"}</span>
                  </a>
                </CardContent>
              </Card>

              {/* Delete Company Account */}
              <Card className="border-rose-200 bg-rose-50/20">
                <CardHeader>
                  <CardTitle className="text-base text-rose-900 flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-rose-600" />
                    <span>{isHindi ? "कंपनी खाता हटाएं (Danger Zone)" : "Delete Company Account"}</span>
                  </CardTitle>
                  <CardDescription className="text-rose-700">
                    {isHindi
                      ? "यह कार्रवाई अपरिवर्तनीय है। आपके सभी चालान, रिमाइंडर, विवाद दस्तावेज और डेटा हमेशा के लिए हटा दिए जाएंगे।"
                      : "Permanently delete your company account, all invoice records, statutory interest claims, and communication history."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!isOwner}
                    onClick={() => setIsDeleteOpen(true)}
                    className="font-bold text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span>{isHindi ? "कंपनी खाता हटाएं..." : "Delete Account..."}</span>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Invite Teammate Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Invite Teammate</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleInviteTeammate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="ramesh@yourcompany.com"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="ACCOUNTANT">Accountant (Add invoices, send reminders, reconcile GST)</option>
                  <option value="STAFF">Staff (View invoices & overdue metrics only)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  {inviting ? "Inviting..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900">Permanently Delete Account</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action <strong>cannot be undone</strong>. To confirm, please type your company name{" "}
              <strong className="text-slate-900 font-mono">"{companyName || session?.user?.name}"</strong> below:
            </p>

            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="Type company name exactly"
              className="w-full text-xs font-mono bg-rose-50/50 border border-rose-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting || deleteConfirmationInput.trim().toLowerCase() !== (companyName || session?.user?.name || "").trim().toLowerCase()}
                onClick={handleDeleteAccount}
                className="font-bold text-xs"
              >
                {deleting ? "Deleting..." : "Permanently Delete Everything"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
