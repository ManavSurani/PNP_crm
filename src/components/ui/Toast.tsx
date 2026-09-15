"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number; // milliseconds, default 5000
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = options.id || Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        ...options,
        id,
        duration: options.duration ?? 5000,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev.filter((t) => t.id !== id), newToast]);
      return id;
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      role="status"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const prefersReduced = useReducedMotion();
  const duration = toast.duration ?? 5000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration <= 0) return;

    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, toast.id, onDismiss]);

  const handleUndo = () => {
    if (toast.onUndo) {
      toast.onUndo();
    }
    onDismiss(toast.id);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
      default:
        return <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-auto relative overflow-hidden flex flex-col rounded-xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2",
        "bg-white/95 text-slate-900 border-slate-200 shadow-slate-900/10",
        "dark:bg-slate-900/95 dark:text-white dark:border-white/10 dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0 pr-2">
          {toast.title && (
            <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-0.5">
              {toast.title}
            </p>
          )}
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {toast.message}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {toast.onUndo && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              <RotateCcw className="h-3 w-3" />
              {toast.undoLabel || "Undo"}
            </button>
          )}
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 5-Second Linear Countdown Bar */}
      {!prefersReduced && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800/80">
          <div
            className="h-full bg-indigo-500/80 dark:bg-indigo-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
