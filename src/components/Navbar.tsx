"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  ShieldCheck, 
  Plus, 
  LogOut, 
  Building2, 
  FileSpreadsheet,
  Layers,
  ShieldAlert,
  Globe,
  HelpCircle,
  ChevronDown,
  Wrench,
  Settings as SettingsIcon,
  Sparkles
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { trackPilotEvent } from "@/lib/analytics/tracker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onOpenAddModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenGstRecon?: () => void;
  onOpenBuyerRisk?: () => void;
  onOpenGuide?: () => void;
}

export function Navbar({ 
  onOpenAddModal, 
  onOpenImportModal,
  onOpenGstRecon,
  onOpenBuyerRisk,
  onOpenGuide
}: NavbarProps) {
  const { data: session } = useSession();
  const { language, toggleLanguage, t, isHindi } = useLanguage();

  const handleLanguageToggle = () => {
    const nextLang = language === "en" ? "hi" : "en";
    toggleLanguage();
    trackPilotEvent("language_switched", { toLanguage: nextLang });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      {/* Tier 1: Main Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Logo & Legal Act Tag */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-9 flex items-center">
                <img
                  src="/images/settlr-logo-horizontal.png"
                  alt="Settlr"
                  className="h-9 w-auto object-contain transition-transform group-hover:scale-102"
                />
              </div>
              <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
                <Badge variant="indigo" className="text-[10px] font-bold px-2 py-0.5">
                  {t.msmedActBadge}
                </Badge>
                <span className="text-[11px] text-slate-500 font-medium hidden lg:inline">
                  {t.statutoryTrackerSub}
                </span>
              </div>
            </Link>
          </div>

          {/* Right: User identity, Actions, Language */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLanguageToggle}
              className="gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              title={isHindi ? "Switch to English" : "हिन्दी में बदलें"}
            >
              <Globe className="h-3.5 w-3.5 text-indigo-600" />
              <span>{isHindi ? "English" : "हिन्दी"}</span>
            </Button>

            {session?.user ? (
              <>
                {/* Udyam Badge / Business Tag */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-slate-800 text-xs leading-tight truncate max-w-[140px]">
                      {(session.user as any).businessName || session.user.name}
                    </span>
                    {(session.user as any).udyamNumber && (
                      <span className="text-[10px] font-mono text-emerald-700 font-medium flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 inline text-emerald-600" />
                        {(session.user as any).udyamNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Collapsible Tools Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all active:scale-95 shadow-2xs">
                    <Wrench className="h-3.5 w-3.5 text-slate-500" />
                    <span>{isHindi ? "टूल्स" : "Tools"}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-1.5">
                    <DropdownMenuLabel>
                      {isHindi ? "MSME अनुपालन टूल्स" : "Compliance & Operations"}
                    </DropdownMenuLabel>
                    
                    {onOpenGstRecon && (
                      <DropdownMenuItem onClick={onOpenGstRecon}>
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-xs text-slate-900">{t.gstRecon}</span>
                          <span className="text-[10px] text-slate-500">GSTR-2B / 3B Diff Match</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    {onOpenBuyerRisk && (
                      <DropdownMenuItem onClick={onOpenBuyerRisk}>
                        <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-xs text-slate-900">{t.buyerRisk}</span>
                          <span className="text-[10px] text-slate-500">Delinquency Dataset</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    {onOpenImportModal && (
                      <DropdownMenuItem onClick={onOpenImportModal}>
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-xs text-slate-900">{t.importCsv}</span>
                          <span className="text-[10px] text-slate-500">Tally / Zoho Ledger Import</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    {onOpenGuide && (
                      <DropdownMenuItem onClick={onOpenGuide}>
                        <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-xs text-slate-900">
                            {isHindi ? "45-दिन नियम गाइड" : "Day 45 Statutory Guide"}
                          </span>
                          <span className="text-[10px] text-slate-500">Section 15 & 16 Explainer</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <Link href="/settings" className="w-full">
                      <DropdownMenuItem>
                        <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                          <SettingsIcon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-xs text-slate-900">
                            {isHindi ? "सेटिंग्स" : "Settings"}
                          </span>
                          <span className="text-[10px] text-slate-500">Rates, Alerts & Team</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Settings Gear Icon Link */}
                <Link
                  href="/settings"
                  title={isHindi ? "सेटिंग्स" : "Settings"}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                >
                  <SettingsIcon className="h-4 w-4" />
                </Link>

                {/* Primary CTA: Add Invoice */}
                {onOpenAddModal && (
                  <Button
                    onClick={onOpenAddModal}
                    size="sm"
                    className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t.addInvoice}</span>
                  </Button>
                )}

                {/* User Signout */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title={t.signOut}
                  className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  {t.signIn}
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  {t.registerMsme}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
