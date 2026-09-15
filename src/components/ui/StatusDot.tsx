"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type StatusDotColor = "emerald" | "amber" | "rose" | "indigo" | "slate" | "purple";
export type StatusDotSize = "sm" | "md" | "lg";

interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: StatusDotColor;
  size?: StatusDotSize;
  ping?: boolean;
}

const colorStyles: Record<StatusDotColor, { dot: string; ping: string }> = {
  emerald: { dot: "bg-emerald-500", ping: "bg-emerald-400" },
  amber: { dot: "bg-amber-500", ping: "bg-amber-400" },
  rose: { dot: "bg-rose-500", ping: "bg-rose-400" },
  indigo: { dot: "bg-indigo-500", ping: "bg-indigo-400" },
  slate: { dot: "bg-slate-400 dark:bg-slate-500", ping: "bg-slate-300" },
  purple: { dot: "bg-purple-500", ping: "bg-purple-400" },
};

const sizeStyles: Record<StatusDotSize, string> = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
};

export default function StatusDot({
  color = "emerald",
  size = "md",
  ping = false,
  className,
  ...props
}: StatusDotProps) {
  const { dot, ping: pingBg } = colorStyles[color];
  const sizeClass = sizeStyles[size];

  return (
    <span className={cn("relative flex shrink-0 items-center justify-center", sizeClass, className)} {...props}>
      {ping && (
        <span
          className={cn(
            "motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            pingBg
          )}
        />
      )}
      <span className={cn("relative inline-flex rounded-full", sizeClass, dot)} />
    </span>
  );
}
export { StatusDot };
