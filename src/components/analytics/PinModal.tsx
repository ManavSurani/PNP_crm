"use client";

import { useState, useRef, useEffect } from "react";
import { Lock, X, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinModalProps {
  title: string;
  subtitle: string;
  mode: "verify" | "setup" | "confirm";
  onSuccess: (pin: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function PinModal({ 
  title, 
  subtitle, 
  mode, 
  onSuccess, 
  onCancel, 
  isLoading, 
  error: externalError 
}: PinModalProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Reset and focus first input when mode changes
    setPin(["", "", "", ""]);
    inputRefs.current[0]?.focus();
  }, [mode]);

  useEffect(() => {
    if (externalError) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [externalError]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    // Auto focus next
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newPin.every(digit => digit !== "")) {
      onSuccess(newPin.join(""));
      setPin(["", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && pin.every(d => d !== "")) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const pinStr = pin.join("");
    if (pinStr.length === 4) {
      onSuccess(pinStr);
    }
  };

  const isComplete = pin.every(d => d !== "");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={cn(
        "bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[400px] p-10 relative overflow-hidden transition-all duration-300",
        shake ? "animate-shake border-rose-500 shadow-rose-100" : "animate-in zoom-in-95 duration-200"
      )}>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        {/* Close Button (Optional based on mode) */}
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center space-y-6 relative z-10">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2 shadow-inner">
            <Lock className="h-8 w-8" />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
          </div>

          {/* PIN Input Grid */}
          <div className="flex justify-center gap-4 py-4">
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={cn(
                  "h-14 w-14 bg-slate-50 border-2 rounded-2xl text-center text-2xl font-black focus:bg-white focus:ring-8 transition-all outline-none",
                  shake ? "border-rose-200 text-rose-600 focus:border-rose-500 focus:ring-rose-50/50" : "border-slate-100 text-slate-900 focus:border-primary focus:ring-primary/5"
                )}
              />
            ))}
          </div>

          {externalError && (
            <div className="flex items-center justify-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {externalError}
            </div>
          )}

          <div className="pt-6 flex flex-col gap-3">
            <button
              disabled={!isComplete || isLoading}
              onClick={handleSubmit}
              className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black tracking-widest uppercase hover:shadow-xl hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {mode === "verify" ? "Verify Security PIN" : mode === "setup" ? "Continue" : "Save Security PIN"}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase hover:text-slate-600 transition-colors"
            >
              Cancel Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
