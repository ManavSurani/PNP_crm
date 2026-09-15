"use client";

import React from "react";
import { cn } from "@/lib/utils";
import StatusDot, { StatusDotColor } from "./StatusDot";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "purple" | "amber";
export type BadgeSize = "sm" | "md";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: StatusDotColor;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700",
  success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
  warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
  amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
  danger: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
  info: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50",
  purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[10px] px-2 py-0.5 font-semibold tracking-wide",
  md: "text-xs px-2.5 py-1 font-semibold tracking-wide",
};

export default function Badge({
  variant = "neutral",
  size = "sm",
  dot = false,
  dotColor,
  className,
  children,
  ...props
}: BadgeProps) {
  const defaultDotColor: Record<BadgeVariant, StatusDotColor> = {
    neutral: "slate",
    success: "emerald",
    warning: "amber",
    amber: "amber",
    danger: "rose",
    info: "indigo",
    purple: "purple",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <StatusDot color={dotColor || defaultDotColor[variant]} size="sm" />}
      {children}
    </span>
  );
}
export { Badge };
