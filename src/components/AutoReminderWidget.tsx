"use client";

import React, { useState } from "react";
import { 
  Clock, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  ChevronRight,
  BellRing,
  Info
} from "lucide-react";
import { AUTO_REMINDER_MILESTONES } from "@/lib/reminders/auto-scheduler";

interface AutoReminderWidgetProps {
  onRemindersDispatched?: () => void;
}

export function AutoReminderWidget({ onRemindersDispatched }: AutoReminderWidgetProps) {
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleTriggerNow = async () => {
    setRunning(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/reminders/auto-schedule", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger auto-reminder check");
      }

      setFeedback({
        message: data.message || "Auto-reminder check completed successfully.",
        type: "success",
      });

      if (onRemindersDispatched) {
        onRemindersDispatched();
      }
    } catch (err: any) {
      setFeedback({
        message: err.message || "Auto-reminder check encountered an error.",
        type: "error",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shrink-0">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Automatic Milestone Scheduler</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Auto-Trigger
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Escalates notices automatically at Day 1, 30, 45 &amp; 60 past due without manual effort.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={running}
          onClick={handleTriggerNow}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Scanning Schedule...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white text-white" />
              <span>Run Schedule Check</span>
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs mb-4 flex items-center gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Milestone Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {AUTO_REMINDER_MILESTONES.map((m) => (
          <div
            key={m.key}
            className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-800 text-[11px]">{m.badge}</span>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                +{m.thresholdDays}d Overdue
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
