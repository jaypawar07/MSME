import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "amber" | "indigo";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-indigo-600 text-white shadow-xs hover:bg-indigo-700",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
    destructive: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    outline: "border-slate-200 text-slate-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    warning: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    amber: "border-amber-300/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
