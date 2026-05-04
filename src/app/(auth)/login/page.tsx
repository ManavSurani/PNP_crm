"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Lock, Mail, Shovel, Box, LayoutDashboard, 
  ChevronRight, Phone, ArrowLeft, CheckCircle2, ShieldQuestion 
} from "lucide-react";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/layout/BrandLogo";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Flow
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetPhone, setResetPhone] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetToken, setResetToken] = useState(""); // one-time token from verify step

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        // Parse rate-limit error from the thrown Error message
        if (res.error.includes("TOO_MANY_ATTEMPTS")) {
          const minutes = res.error.split(":")[1] || "15";
          setError(`Too many failed attempts. Try again in ${minutes} minute${minutes === "1" ? "" : "s"}.`);
        } else {
          setError("Invalid credentials. Please verify your identity.");
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Synchronisation failure. Please retry authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone: resetPhone, email: resetEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetToken(data.resetToken); // store the one-time token
        setResetStep(2);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetNewPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", resetToken, password: resetNewPassword }),
      });
      if (res.ok) {
        setResetStep(3);
        setResetToken(""); // clear token after use
      } else {
        const data = await res.json();
        setError(data.error || "Reset failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="w-full max-w-sm space-y-8 relative z-10">
          <div className="flex flex-col items-center">
            <BrandLogo className="h-16 w-16 mb-4" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security Recovery</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Identity Verification Flow</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            {resetStep === 1 && (
              <form onSubmit={handleVerifyPhone} className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-[11px] leading-relaxed font-medium">
                    Enter your account email and the <span className="font-bold">Recovery Phone Number</span> set by the Admin in <span className="font-bold">Settings → System Config</span>. This is the same number used for WhatsApp dispatch.
                  </div>
                  {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-3 h-4 w-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="email"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-600 outline-none transition-all"
                        placeholder="admin@pnp.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Recovery Phone</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-3 h-4 w-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="text"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-600 outline-none transition-all"
                        placeholder="Enter WhatsApp No"
                        value={resetPhone}
                        onChange={(e) => setResetPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 className="h-3 w-3 animate-spin" />} Verify Identity
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetMode(false)}
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back to Login
                  </button>
                </div>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-[11px] leading-relaxed font-medium">
                    Identity confirmed! Please define your new cryptographic password.
                  </div>
                  {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3 h-4 w-4 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                      <input
                        type="password"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none transition-all"
                        placeholder="••••••••"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="h-3 w-3 animate-spin" />} Update Password
                </button>
              </form>
            )}

            {resetStep === 3 && (
              <div className="text-center py-4 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-900">Protocol Updated</p>
                  <p className="text-xs text-slate-400 font-medium">Your credentials have been successfully reset. You can now authenticate with your new password.</p>
                </div>
                <button
                  onClick={() => {
                    setIsResetMode(false);
                    setResetStep(1);
                  }}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand/Identity */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mt-16" />
        <div className="relative z-10 flex flex-col items-center">
          <BrandLogo className="h-16 w-16 mb-4 hover:scale-105" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PNP CRM</h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold uppercase tracking-widest">Premium CRM Dashboard</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-[11px] font-bold uppercase tracking-wider text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3 h-4 w-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <button 
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3 h-4 w-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-200 disabled:opacity-50 border border-indigo-500/20"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />} Sign In
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4 pt-4 border-t border-slate-200">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
             Secure Gateway • PNP CRM v2.0
           </p>
           <div className="flex items-center justify-center gap-4 text-slate-300">
             <div className="h-px w-8 bg-slate-200" />
             <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
             <div className="h-px w-8 bg-slate-200" />
           </div>
        </div>
      </div>
    </div>
  );
}
