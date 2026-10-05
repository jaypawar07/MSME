"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { 
  Scale, 
  Mail, 
  Lock, 
  User, 
  Building, 
  Phone, 
  ShieldCheck, 
  Loader2, 
  AlertCircle 
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [udyamNumber, setUdyamNumber] = useState("");
  const [phone, setPhone] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in your name, email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          businessName: businessName.trim() || "My MSME Enterprise",
          udyamNumber: udyamNumber.trim().toUpperCase() || null,
          phone: phone.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register account");
      }

      // Auto sign in on registration success
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (signInRes?.error) {
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <img
            src="/images/settlr-logo-stacked.png"
            alt="Settlr Logo"
            className="h-24 w-auto object-contain drop-shadow-sm"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Create your <span className="text-indigo-600">Settlr</span> Account
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Protect &amp; track MSME receivables under the MSMED Act 2006
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Proprietor / Authorized Person Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Rajesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MSME Business / Trade Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Precision Engineering Works"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Udyam Registration Number (Optional)
              </label>
              <div className="relative">
                <ShieldCheck className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="UDYAM-MH-12-0049281"
                  value={udyamNumber}
                  onChange={(e) => setUdyamNumber(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Found on your Udyam Certificate. Used in statutory Section 16 demand notices.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="rajesh@apex.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="+91 98200..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
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
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Create Account & Start Tracking</span>
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
