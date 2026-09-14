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
  mode: "light",
  shortcutEnabled: true,
  shortcutKey: "Ctrl + Shift + D",
  schedule: {
    enabled: false,
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

export interface ShortcutValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates whether a shortcut string is allowed.
 * Blocks standard editing, clipboard, browser navigation, DevTools,
 * and modifier-less or Shift-only letter combinations.
 */
export function validateShortcut(shortcut: string): ShortcutValidationResult {
  if (!shortcut || !shortcut.trim()) {
    return { valid: false, reason: "Shortcut cannot be empty." };
  }

  const tokens = shortcut.split("+").map(s => s.trim()).filter(Boolean);
  if (tokens.length === 0) {
    return { valid: false, reason: "Invalid shortcut format." };
  }

  const upperTokens = tokens.map(t => t.toUpperCase());
  const hasCtrl = upperTokens.includes("CTRL") || upperTokens.includes("CMD") || upperTokens.includes("CONTROL") || upperTokens.includes("META");
  const hasAlt = upperTokens.includes("ALT");
  const hasShift = upperTokens.includes("SHIFT");

  const nonModifiers = tokens.filter(t => {
    const up = t.toUpperCase();
    return !["CTRL", "CMD", "CONTROL", "META", "ALT", "SHIFT"].includes(up);
  });

  if (nonModifiers.length === 0) {
    return { valid: false, reason: "Please press a key combination with a letter, number, or function key." };
  }

  if (nonModifiers.length > 1) {
    return { valid: false, reason: "Only one primary key can be assigned." };
  }

  const primary = nonModifiers[0];
  const primaryUpper = primary.toUpperCase();

  // 1. Single Function Keys (F1-F10 permitted standalone; F5, F11, F12 reserved)
  const isFunctionKey = /^F\d{1,2}$/i.test(primary);
  if (!hasCtrl && !hasAlt && !hasShift && isFunctionKey) {
    if (primaryUpper === "F5") {
      return { valid: false, reason: "F5 is reserved for page refresh." };
    }
    if (primaryUpper === "F11") {
      return { valid: false, reason: "F11 is reserved for full screen." };
    }
    if (primaryUpper === "F12") {
      return { valid: false, reason: "F12 is reserved for browser Developer Tools." };
    }
    return { valid: true };
  }

  // 2. Disallow single characters or symbols without modifiers
  if (!hasCtrl && !hasAlt && !hasShift) {
    return {
      valid: false,
      reason: `Single key "${primary}" cannot be used. Please include Ctrl or Alt.`
    };
  }

  // 3. Disallow Shift-only letter or number combinations (e.g. Shift + Z, Shift + A)
  if (hasShift && !hasCtrl && !hasAlt) {
    return {
      valid: false,
      reason: `Shift + ${primary} is used for typing capital letters. Please include Ctrl or Alt (e.g. Ctrl + Shift + ${primary}).`
    };
  }

  // Normalized combination string for checking reserved patterns
  const normParts: string[] = [];
  if (hasCtrl) normParts.push("CTRL");
  if (hasAlt) normParts.push("ALT");
  if (hasShift) normParts.push("SHIFT");
  normParts.push(primaryUpper);
  const normalized = normParts.join("+");

  // 4. Editing & Clipboard Protection
  const editingBlacklist: Record<string, string> = {
    "CTRL+Z": "Ctrl + Z is reserved for Undo operations.",
    "CTRL+Y": "Ctrl + Y is reserved for Redo operations.",
    "CTRL+SHIFT+Z": "Ctrl + Shift + Z is reserved for Redo operations.",
    "CTRL+C": "Ctrl + C is reserved for Copy operations.",
    "CTRL+X": "Ctrl + X is reserved for Cut operations.",
    "CTRL+V": "Ctrl + V is reserved for Paste operations.",
    "CTRL+A": "Ctrl + A is reserved for Select All.",
    "CTRL+ALT+Z": "This combination is reserved for system Undo.",
  };

  if (editingBlacklist[normalized]) {
    return { valid: false, reason: editingBlacklist[normalized] };
  }

  // 5. Browser Navigation, Search & System Actions
  const browserBlacklist: Record<string, string> = {
    "CTRL+F": "Ctrl + F is reserved for finding in page.",
    "CTRL+G": "Ctrl + G is reserved for finding next in page.",
    "CTRL+S": "Ctrl + S is reserved for saving web pages.",
    "CTRL+P": "Ctrl + P is reserved for printing.",
    "CTRL+O": "Ctrl + O is reserved for opening files.",
    "CTRL+W": "Ctrl + W is reserved for closing tabs.",
    "CTRL+SHIFT+W": "Ctrl + Shift + W is reserved for closing windows.",
    "CTRL+T": "Ctrl + T is reserved for opening new tabs.",
    "CTRL+SHIFT+T": "Ctrl + Shift + T is reserved for reopening closed tabs.",
    "CTRL+N": "Ctrl + N is reserved for opening new windows.",
    "CTRL+SHIFT+N": "Ctrl + Shift + N is reserved for opening incognito windows.",
    "CTRL+R": "Ctrl + R is reserved for reloading the page.",
    "CTRL+SHIFT+R": "Ctrl + Shift + R is reserved for hard reloading the page.",
    "CTRL+F5": "Ctrl + F5 is reserved for hard reloading the page.",
    "CTRL+H": "Ctrl + H is reserved for browser history.",
    "CTRL+J": "Ctrl + J is reserved for browser downloads.",
    "CTRL+D": "Ctrl + D is reserved for bookmarking pages. Use Ctrl + Shift + D instead.",
    "CTRL+K": "Ctrl + K is reserved for search.",
    "CTRL+E": "Ctrl + E is reserved for browser search bar focus.",
    "CTRL+L": "Ctrl + L is reserved for browser address bar focus.",
    "CTRL+U": "Ctrl + U is reserved for viewing page source.",
    "CTRL+Q": "Ctrl + Q is reserved for closing browser.",
    "CTRL+TAB": "Ctrl + Tab is reserved for switching tabs.",
    "CTRL+SHIFT+TAB": "Ctrl + Shift + Tab is reserved for switching tabs.",
    "CTRL+SHIFT+I": "Ctrl + Shift + I is reserved for browser Developer Tools.",
    "CTRL+SHIFT+J": "Ctrl + Shift + J is reserved for browser Developer Tools Console.",
    "CTRL+SHIFT+C": "Ctrl + Shift + C is reserved for inspecting page elements.",
    "ALT+F4": "Alt + F4 is reserved for closing application windows.",
    "ALT+LEFT": "Alt + Left is reserved for browser back navigation.",
    "ALT+RIGHT": "Alt + Right is reserved for browser forward navigation.",
  };

  if (browserBlacklist[normalized]) {
    return { valid: false, reason: browserBlacklist[normalized] };
  }

  return { valid: true };
}

/**
 * Checks if a shortcut key combination is a dangerous/reserved shortcut.
 */
export function isReservedShortcut(shortcut: string): boolean {
  return !validateShortcut(shortcut).valid;
}

/**
 * Dynamic keyboard shortcut matcher supporting any combination or single key.
 */
export function matchesShortcut(event: KeyboardEvent, shortcutKey: string): boolean {
  if (!shortcutKey) return false;

  // Runtime guard: disallow invalid/reserved shortcuts
  if (isReservedShortcut(shortcutKey)) return false;

  const tokens = shortcutKey.split("+").map(t => t.trim()).filter(Boolean);
  if (tokens.length === 0) return false;

  const hasCtrl = event.ctrlKey || event.metaKey;
  const hasShift = event.shiftKey;
  const hasAlt = event.altKey;

  const needsCtrl = tokens.some(t => {
    const up = t.toUpperCase();
    return up === "CTRL" || up === "CONTROL" || up === "CMD" || up === "META";
  });
  const needsShift = tokens.some(t => t.toUpperCase() === "SHIFT");
  const needsAlt = tokens.some(t => t.toUpperCase() === "ALT");

  // Verify modifier states match exactly
  if (hasCtrl !== needsCtrl || hasShift !== needsShift || hasAlt !== needsAlt) {
    return false;
  }

  // Find primary non-modifier token
  const primaryToken = tokens.find(t => {
    const up = t.toUpperCase();
    return !["CTRL", "CONTROL", "CMD", "META", "SHIFT", "ALT"].includes(up);
  });

  if (!primaryToken) return false;

  const eventKeyUpper = event.key.toUpperCase();
  const primaryUpper = primaryToken.toUpperCase();

  // Special key aliases
  if (primaryUpper === "ESC" || primaryUpper === "ESCAPE") {
    return eventKeyUpper === "ESCAPE";
  }
  if (primaryUpper === "SPACE") {
    return event.key === " " || eventKeyUpper === "SPACE";
  }
  if (primaryToken === "\\" || primaryUpper === "BACKSLASH") {
    return event.key === "\\";
  }
  if (primaryToken === "/" || primaryUpper === "SLASH") {
    return event.key === "/";
  }

  return eventKeyUpper === primaryUpper;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Safely loads and parses theme configuration from localStorage and cookies,
 * guaranteeing deep defaults and preserving boolean false for schedule.enabled.
 */
export function loadStoredConfig(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_THEME_CONFIG;
  try {
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = getCookie(STORAGE_KEY);
    }
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_THEME_CONFIG,
        ...parsed,
        shortcutKey: parsed.shortcutKey || DEFAULT_THEME_CONFIG.shortcutKey,
        schedule: {
          ...DEFAULT_THEME_CONFIG.schedule,
          ...(parsed.schedule || {}),
          enabled: typeof parsed.schedule?.enabled === "boolean" 
            ? parsed.schedule.enabled 
            : DEFAULT_THEME_CONFIG.schedule.enabled,
        },
      };
    }
  } catch (e) {
    console.error("Failed to load theme config from storage:", e);
  }
  return DEFAULT_THEME_CONFIG;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialConfig?: ThemeConfig | null;
}

export function ThemeProvider({ children, initialConfig }: ThemeProviderProps) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    if (initialConfig) return initialConfig;
    return DEFAULT_THEME_CONFIG;
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const base = initialConfig || DEFAULT_THEME_CONFIG;
    if (base.mode === "dark") return "dark";
    if (base.mode === "light") return "light";
    return "light";
  });
  const [mounted, setMounted] = useState(false);

  // Compute resolved theme from config
  const computeTheme = useCallback((cfg: ThemeConfig): ResolvedTheme => {
    if (cfg.mode === "dark") return "dark";
    if (cfg.mode === "light") return "light";
    if (cfg.mode === "scheduled") {
      if (cfg.schedule?.enabled) {
        return resolveScheduledTheme(cfg.schedule.dayTime, cfg.schedule.nightTime);
      }
      return "light";
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

  // Update config helper with Triple-Layer persistence (State + localStorage + Cookie + Database)
  const updateConfig = useCallback((updater: Partial<ThemeConfig> | ((prev: ThemeConfig) => ThemeConfig)) => {
    setConfig(prev => {
      const partial = typeof updater === "function" ? updater(prev) : updater;
      const next: ThemeConfig = {
        ...prev,
        ...partial,
        schedule: {
          ...prev.schedule,
          ...(partial.schedule || {}),
          enabled: typeof partial.schedule?.enabled === "boolean" 
            ? partial.schedule.enabled 
            : (prev.schedule?.enabled ?? DEFAULT_THEME_CONFIG.schedule.enabled),
        },
      };

      const serialized = JSON.stringify(next);

      // Layer 3: localStorage
      try {
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch (err) {
        console.error("Failed to persist theme config to localStorage:", err);
      }

      // Layer 2: Cookie
      try {
        setCookie(STORAGE_KEY, serialized);
      } catch (err) {
        console.error("Failed to persist theme config to cookie:", err);
      }

      // Layer 1: SQLite Database via /api/settings
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "theme", themeConfig: next }),
      }).catch(err => {
        console.error("Failed to persist theme config to database:", err);
      });

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

  // Initial client mount sync from localStorage/cookie + cross-tab listener
  useEffect(() => {
    setMounted(true);

    // Read stored config
    const stored = loadStoredConfig();
    const active = initialConfig || stored;
    setConfig(active);

    const initial = computeTheme(active);
    setResolvedTheme(initial);
    applyThemeToDOM(initial);

    // Ensure cookie and localStorage are synchronized if initialConfig was used from server
    if (initialConfig) {
      try {
        const serialized = JSON.stringify(initialConfig);
        localStorage.setItem(STORAGE_KEY, serialized);
        setCookie(STORAGE_KEY, serialized);
      } catch (e) {}
    }

    // Cross-tab synchronization
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const updated = loadStoredConfig();
          setConfig(updated);
          const nextResolved = computeTheme(updated);
          setResolvedTheme(nextResolved);
          applyThemeToDOM(nextResolved);
        } catch (err) {
          console.error("Failed to sync theme from storage event:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [initialConfig, computeTheme, applyThemeToDOM]);

  // Periodic evaluator for scheduled mode and system listener (only runs after client mount)
  useEffect(() => {
    if (!mounted) return;

    const current = computeTheme(config);
    setResolvedTheme(current);
    applyThemeToDOM(current);

    // Periodic evaluation for scheduled transitions
    const interval = setInterval(() => {
      if (config.mode === "scheduled" && config.schedule?.enabled) {
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
  }, [mounted, config, computeTheme, applyThemeToDOM]);

  // Global Keyboard Shortcut Listener
  useEffect(() => {
    if (!mounted || !config.shortcutEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Input-Bypass Guard: Don't trigger shortcut if typing in form inputs or textareas
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return;
        }
      }

      if (matchesShortcut(event, config.shortcutKey)) {
        event.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, config.shortcutEnabled, config.shortcutKey, toggleTheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const currentTheme = mounted ? resolvedTheme : (initialConfig?.mode === "dark" ? "dark" : "light");
    return {
      theme: currentTheme,
      resolvedTheme: currentTheme,
      mode: config.mode,
      config,
      setMode,
      toggleTheme,
      updateConfig,
    };
  }, [mounted, resolvedTheme, initialConfig, config, setMode, toggleTheme, updateConfig]);

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
