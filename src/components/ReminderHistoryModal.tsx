"use client";

import React from "react";
import { X, Clock, MessageSquare, Mail, Phone, Calendar, User, Scale, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

interface Reminder {
  id: string;
  channel: string;
  tone: string;
  subject?: string | null;
  message: string;
  buyerContact?: string | null;
  sentAt: string | Date;
}

interface ReminderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  buyerName: string;
  reminders: Reminder[];
}

export function ReminderHistoryModal({
  isOpen,
  onClose,
  invoiceNumber,
  buyerName,
  reminders,
}: ReminderHistoryModalProps) {
  if (!isOpen) return null;

  const getToneBadge = (tone: string) => {
    switch (tone) {
      case "FRIENDLY":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold">Level 1: Friendly</span>;
      case "FORMAL":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">Level 2: Formal</span>;
      case "URGENT_MSMED":
        return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-[10px] font-semibold">Level 3: Statutory MSME</span>;
      case "LEGAL_SAMADHAAN":
        return <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-semibold">Level 4: Legal / Samadhaan</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">{tone}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Communication & Reminder Audit Log</h2>
              <p className="text-xs text-slate-500">
                Invoice <span className="font-mono font-bold text-slate-800">#{invoiceNumber}</span> • {buyerName}
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

        {/* Reminders Timeline */}
        <div className="overflow-y-auto p-6 space-y-4">
          {reminders.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">No reminders sent yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Click "Send Reminder" on the invoice row to generate escalating notice templates.
              </p>
            </div>
          ) : (
            reminders.map((rem, idx) => (
              <div
                key={rem.id || idx}
                className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    {getToneBadge(rem.tone)}
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                      {rem.channel === "WHATSAPP" && <MessageSquare className="h-3 w-3 text-emerald-600" />}
                      {rem.channel === "EMAIL" && <Mail className="h-3 w-3 text-indigo-600" />}
                      {rem.channel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(rem.sentAt), "dd MMM yyyy, hh:mm a")}</span>
                  </div>
                </div>

                {rem.subject && (
                  <div className="font-semibold text-slate-900 text-xs">
                    Subject: {rem.subject}
                  </div>
                )}

                <div className="p-3 bg-white rounded-xl border border-slate-200/70 text-slate-700 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {rem.message}
                </div>

                {rem.buyerContact && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Sent to: {rem.buyerContact}</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Statutory Record Logged
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
