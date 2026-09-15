"use client";

import React from "react";
import { Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type EmptyStateType = "leads" | "visits" | "search" | "customers" | "generic";

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export default function EmptyState({
  type = "generic",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  const prefersReduced = useReducedMotion();

  const renderIllustration = () => {
    switch (type) {
      case "leads":
        return (
          <svg
            className="w-16 h-16 text-indigo-500/80"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="14" y="10" width="36" height="44" rx="6" className={prefersReduced ? "" : "animate-pulse-soft"} />
            <path d="M22 22h20M22 30h14M22 38h8" />
            <circle cx="44" cy="42" r="8" className="fill-indigo-50 dark:fill-indigo-950/80 stroke-indigo-600 dark:stroke-indigo-400" />
            <path d="M44 38v8M40 42h8" className="stroke-indigo-600 dark:stroke-indigo-400" />
          </svg>
        );
      case "visits":
        return (
          <svg
            className="w-16 h-16 text-emerald-500/80"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="12" y="14" width="40" height="38" rx="6" />
            <path d="M12 24h40M22 8v8M42 8v8" />
            <circle cx="32" cy="38" r="4" className="fill-emerald-500/20 stroke-emerald-500" />
            <path d="M32 38v-3" className="stroke-emerald-600 dark:stroke-emerald-400" />
          </svg>
        );
      case "search":
        return (
          <svg
            className="w-16 h-16 text-indigo-400/80"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="28" cy="28" r="14" />
            <path d="M38 38l12 12" />
            <path d="M24 28h8M28 24v8" strokeDasharray="2 2" />
            <circle cx="28" cy="28" r="8" strokeOpacity="0.4" />
          </svg>
        );
      case "customers":
        return (
          <svg
            className="w-16 h-16 text-indigo-500/80"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="10" y="18" width="44" height="34" rx="6" />
            <path d="M22 18V12a4 4 0 014-4h12a4 4 0 014 4v6" />
            <path d="M10 30h44" />
            <path d="M28 30v4a2 2 0 002 2h4a2 2 0 002-2v-4" />
          </svg>
        );
      default:
        return (
          <svg
            className="w-16 h-16 text-slate-400 dark:text-slate-500"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 18a4 4 0 014-4h12l4 4h20a4 4 0 014 4v26a4 4 0 01-4 4H14a4 4 0 01-4-4V18z" />
            <path d="M24 34h16" strokeDasharray="3 3" />
          </svg>
        );
    }
  };

  return (
    <div
      className={cn(
        "py-16 px-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/20 backdrop-blur-[2px] transition-all",
        className
      )}
    >
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-4 shadow-sm">
        {renderIllustration()}
      </div>

      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight max-w-sm">
        {title}
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5 max-w-md">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 mt-6">
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              {secondaryActionLabel}
            </button>
          )}

          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export { EmptyState };
