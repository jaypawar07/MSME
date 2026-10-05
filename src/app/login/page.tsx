"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Scale, 
  Mail, 
  Lock, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Building2, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password: password,
      });

      if (res?.error) {
        setError(res.error || "Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail("demo@msme.in");
    setPassword("password123");
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email: "demo@msme.in",
      password: "password123",
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="flex justify-center mb-3">
          <img
            src="/images/settlr-logo-stacked.png"
            alt="Settlr Logo"
            className="h-28 w-auto object-contain drop-shadow-sm"
          />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          MSMED Act Section 16 Delayed Receivables &amp; Penal Interest Tracker
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 space-y-6">
          {/* Quick Demo Login Pill */}
          <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Seeded Demo Account
              </span>
              <span className="text-[10px] bg-indigo-200/60 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                5 Sample Invoices
              </span>
            </div>
            <p className="text-slate-600 text-[11px] mb-3">
              Login immediately with pre-seeded sample invoices in Green, Yellow, and Red MSMED overdue states.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={handleQuickDemoLogin}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <span>1-Click Demo Login (Rajesh Sharma)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Or sign in with email
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MSME Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="demo@msme.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Sign In to Dashboard</span>
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Don't have an account yet?{" "}
            <Link
              href="/register"
              className="font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
            >
              Register your MSME
            </Link>
          </div>
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="text-center mt-6 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Compliant with Micro, Small & Medium Enterprises Development Act, 2006</span>
        </div>
      </div>
    </div>
  );
}
