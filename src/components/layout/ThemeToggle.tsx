"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme, config } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 group",
        isDark 
          ? "bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-slate-700/80 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 shadow-sm",
        className
      )}
      title={`Current: ${isDark ? "Dark Mode" : "Light Mode"}${config.shortcutEnabled ? ` (${config.shortcutKey})` : ""}`}
      aria-label="Toggle theme mode"
    >
      <div className="relative h-4 w-4">
        <Sun 
          className={cn(
            "h-4 w-4 absolute inset-0 transition-all duration-300 transform",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )} 
        />
        <Moon 
          className={cn(
            "h-4 w-4 absolute inset-0 transition-all duration-300 transform",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )} 
        />
      </div>
    </button>
  );
}
