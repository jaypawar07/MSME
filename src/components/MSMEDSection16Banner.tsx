"use client";

import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Scale, Info, CheckCircle, AlertCircle } from "lucide-react";

export function MSMEDSection16Banner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-2xs">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Statutory Delay Protection: MSMED Act, 2006
              </h3>
              <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                Section 15 & 16 Law
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Indian law strictly caps buyer payment terms at a maximum of <strong className="text-slate-800">45 days</strong>. Any payment delayed beyond this threshold automatically incurs <strong className="text-indigo-900">compound interest with monthly rests at 3x the RBI Bank Rate (16.5% p.a.)</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200 shadow-2xs"
        >
          <span>{expanded ? "Hide Details" : "View Legal Sections"}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-indigo-100/80 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 text-indigo-900 font-bold mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-indigo-600" />
              Section 15: Maximum 45 Days
            </div>
            <p className="text-slate-600 leading-relaxed">
              Payment must be made within the agreed period, which cannot under any circumstances exceed 45 days from the date of acceptance of goods/services. If no period was agreed, payment is due within 15 days.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 text-indigo-900 font-bold mb-1">
              <Scale className="h-3.5 w-3.5 text-amber-600" />
              Section 16: 3x RBI Bank Rate
            </div>
            <p className="text-slate-600 leading-relaxed">
              If delayed past 45 days, the buyer is mandatorily liable to pay compound interest with monthly rests at 3 times the RBI Bank Rate (currently 16.5% per annum), calculated automatically from the day after the due date.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 text-indigo-900 font-bold mb-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              Section 23: No Tax Deduction
            </div>
            <p className="text-slate-600 leading-relaxed">
              Any penal interest payable by the buyer under Section 16 is strictly disallowed as a deductible business expense under the Income Tax Act, 1961, creating severe financial pressure on defaulting corporate buyers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
