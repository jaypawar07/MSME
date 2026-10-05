import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "success"
    | "premium";
  size?: "default" | "sm" | "lg" | "icon" | "xs";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantClasses = {
      default:
        "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 active:scale-98 focus-visible:ring-indigo-500",
      destructive:
        "bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:scale-98 focus-visible:ring-rose-500",
      outline:
        "border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 active:scale-98 focus-visible:ring-slate-400",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-98 focus-visible:ring-slate-500",
      ghost:
        "hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
      link: "text-indigo-600 underline-offset-4 hover:underline",
      success:
        "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-98 focus-visible:ring-emerald-500",
      premium:
        "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 active:scale-98 focus-visible:ring-indigo-500",
    };

    const sizeClasses = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 rounded-lg px-3 text-xs font-semibold",
      xs: "h-7 rounded-md px-2.5 text-[11px] font-semibold",
      lg: "h-11 rounded-xl px-6 text-sm font-bold",
      icon: "h-9 w-9 rounded-lg",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium ring-offset-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant] || variantClasses.default,
          sizeClasses[size] || sizeClasses.default,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
