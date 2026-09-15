"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * High-performance numeric rolling counter hook.
 * Uses requestAnimationFrame with quadratic easing.
 * Respects OS-level prefers-reduced-motion and session entrance gating.
 */
export function useCountUp(
  target: number,
  duration = 750,
  shouldAnimate = true
): number {
  const prefersReduced = useReducedMotion();
  const [current, setCurrent] = useState<number>(() => (shouldAnimate && !prefersReduced ? 0 : target));

  useEffect(() => {
    if (!shouldAnimate || prefersReduced || target === 0) {
      setCurrent(target);
      return;
    }

    let startTime: number | null = null;
    let frameId: number;

    const easeOutQuad = (t: number) => t * (2 - t);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutQuad(progress);
      setCurrent(Math.round(easedProgress * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [target, duration, shouldAnimate, prefersReduced]);

  return current;
}
