"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type ThemeMode = "light" | "dark" | "system" | "scheduled";
export type ResolvedTheme = "light" | "dark";

export interface ThemeConfig {
  mode: ThemeMode;
  shortcutEnabled: boolean;
  shortcutKey: string; // e.g. "Ctrl+Shift+D" | "Ctrl+\" | "Ctrl+Shift+L" | "Alt+T"
  schedule: {
    enabled: boolean;
    dayTime: string;   // "07:00"
    nightTime: string; // "19:00"
  };
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: "system",
  shortcutEnabled: true,
  shortcutKey: "Ctrl+Shift+D",
  schedule: {
    enabled: true,
    dayTime: "07:00",
    nightTime: "19:00",
  },
};

interface ThemeContextValue {
  theme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
  mode: ThemeMode;
  config: ThemeConfig;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  updateConfig: (updater: Partial<ThemeConfig> | ((prev: ThemeConfig) => ThemeConfig)) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "pnp_crm_theme_config";

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(s => parseInt(s, 10) || 0);
  return h * 60 + m;
}

function resolveScheduledTheme(dayTime: string, nightTime: string): ResolvedTheme {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayMinutes = parseTimeToMinutes(dayTime);
  const nightMinutes = parseTimeToMinutes(nightTime);

  if (nightMinutes > dayMinutes) {
    // Standard schedule: e.g. 07:00 to 19:00 is daytime
    const isNight = currentMinutes >= nightMinutes || currentMinutes < dayMinutes;
    return isNight ? "dark" : "light";
  } else {
    // Inverted schedule: e.g. night begins early morning
    const isNight = currentMinutes >= nightMinutes && currentMinutes < dayMinutes;
    return isNight ? "dark" : "light";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME_CONFIG;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_THEME_CONFIG,
          ...parsed,
          schedule: {
            ...DEFAULT_THEME_CONFIG.schedule,
            ...(parsed.schedule || {}),
          },
        };
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_THEME_CONFIG;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Compute resolved theme from config
  const computeTheme = useCallback((cfg: ThemeConfig): ResolvedTheme => {
    if (cfg.mode === "dark") return "dark";
    if (cfg.mode === "light") return "light";
    if (cfg.mode === "scheduled") {
      return resolveScheduledTheme(cfg.schedule.dayTime, cfg.schedule.nightTime);
    }
    // "system"
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }, []);

  // Synchronize with DOM
  const applyThemeToDOM = useCallback((theme: ResolvedTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  // Update config helper with persistence
  const updateConfig = useCallback((updater: Partial<ThemeConfig> | ((prev: ThemeConfig) => ThemeConfig)) => {
    setConfig(prev => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error("Failed to persist theme config:", err);
      }
      return next;
    });
  }, []);

  // Set mode directly
  const setMode = useCallback((mode: ThemeMode) => {
    updateConfig({ mode });
  }, [updateConfig]);

  // Toggle theme directly (sets mode to opposite manual mode)
  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    updateConfig({ mode: nextTheme });
  }, [resolvedTheme, updateConfig]);

  // Initial mount sync
  useEffect(() => {
    setMounted(true);
    const initial = computeTheme(config);
    setResolvedTheme(initial);
    applyThemeToDOM(initial);
  }, [computeTheme, applyThemeToDOM, config]);

  // Periodic evaluator for scheduled mode and system listener
  useEffect(() => {
    const current = computeTheme(config);
    setResolvedTheme(current);
    applyThemeToDOM(current);

    // Periodic evaluation for scheduled transitions
    const interval = setInterval(() => {
      if (config.mode === "scheduled") {
        const next = resolveScheduledTheme(config.schedule.dayTime, config.schedule.nightTime);
        setResolvedTheme(prev => {
          if (prev !== next) {
            applyThemeToDOM(next);
            return next;
          }
          return prev;
        });
      }
    }, 30000); // Check every 30 seconds

    // Media query listener for system mode
    if (config.mode === "system" && typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        const next = e.matches ? "dark" : "light";
        setResolvedTheme(next);
        applyThemeToDOM(next);
      };
      mediaQuery.addEventListener("change", handler);
      return () => {
        clearInterval(interval);
        mediaQuery.removeEventListener("change", handler);
      };
    }

    return () => clearInterval(interval);
  }, [config, computeTheme, applyThemeToDOM]);

  // Global Keyboard Shortcut Listener
  useEffect(() => {
    if (!config.shortcutEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Input-Bypass Guard: Don't trigger shortcut if typing in form inputs or textareas
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return;
        }
      }

      const key = event.key;
      const hasCtrl = event.ctrlKey || event.metaKey;
      const hasShift = event.shiftKey;
      const hasAlt = event.altKey;

      let matched = false;

      switch (config.shortcutKey) {
        case "Ctrl+Shift+D":
          matched = hasCtrl && hasShift && key.toUpperCase() === "D";
          break;
        case "Ctrl+\\":
          matched = hasCtrl && !hasShift && !hasAlt && key === "\\";
          break;
        case "Ctrl+Shift+L":
          matched = hasCtrl && hasShift && key.toUpperCase() === "L";
          break;
        case "Alt+T":
          matched = hasAlt && !hasCtrl && key.toUpperCase() === "T";
          break;
        default:
          // Fallback to Ctrl+Shift+D
          matched = hasCtrl && hasShift && key.toUpperCase() === "D";
          break;
      }

      if (matched) {
        event.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config.shortcutEnabled, config.shortcutKey, toggleTheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const currentTheme = mounted ? resolvedTheme : "light";
    return {
      theme: currentTheme,
      resolvedTheme: currentTheme,
      mode: config.mode,
      config,
      setMode,
      toggleTheme,
      updateConfig,
    };
  }, [mounted, resolvedTheme, config, setMode, toggleTheme, updateConfig]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
