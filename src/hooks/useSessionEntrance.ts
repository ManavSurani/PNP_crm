"use client";

import { useEffect, useState } from "react";

/**
 * Hook to guarantee that entrance animations (rolling KPI counters, chart draw-in)
 * only run ONCE per browser session. Prevents replaying on every route navigation.
 */
export function useSessionEntrance(key: string): { shouldAnimate: boolean; isReady: boolean } {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storageKey = `pnp_entered_${key}`;
      const hasEntered = sessionStorage.getItem(storageKey);
      if (!hasEntered) {
        setShouldAnimate(true);
        sessionStorage.setItem(storageKey, "true");
      } else {
        setShouldAnimate(false);
      }
    } catch {
      setShouldAnimate(false);
    } finally {
      setIsReady(true);
    }
  }, [key]);

  return { shouldAnimate, isReady };
}
