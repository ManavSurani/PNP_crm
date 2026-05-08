import { startOfDay } from "date-fns";

/**
 * Normalizes a date to the start of its local day for accurate "Date-only" comparisons.
 * This ensures that time differences do not affect "Same Day" or "Overdue" logic.
 */
export function normalizeDate(date: Date | string | number): number {
  const d = new Date(date);
  // We use a manual reset to 00:00:00 to avoid any date-fns/timezone hidden shifts
  const normalized = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return normalized.getTime();
}

/**
 * Logic to determine if a date is strictly today.
 */
export function isTodayDate(date: Date | string | null): boolean {
  if (!date) return false;
  const target = normalizeDate(date);
  const today = normalizeDate(new Date());
  return target === today;
}

/**
 * Logic to determine if a date is strictly in the past (before today).
 */
export function isOverdueDate(date: Date | string | null): boolean {
  if (!date) return false;
  const target = normalizeDate(date);
  const today = normalizeDate(new Date());
  return target < today;
}

/**
 * Logic to determine if a date is strictly in the future (after today).
 */
export function isFutureDate(date: Date | string | null): boolean {
  if (!date) return false;
  const target = normalizeDate(date);
  const today = normalizeDate(new Date());
  return target > today;
}

/**
 * LEGACY WRAPPERS: Kept for compatibility with existing components
 * but now powered by the centralized normalization logic.
 */

export function isFollowUpToday(nextCallDate: Date | string | null, completedDate: Date | string | null) {
  if (completedDate) return false;
  return isTodayDate(nextCallDate);
}

export function isFollowUpOverdue(nextCallDate: Date | string | null, completedDate: Date | string | null) {
  if (completedDate) return false;
  return isOverdueDate(nextCallDate);
}

export function isFollowUpUpcoming(nextCallDate: Date | string | null, completedDate: Date | string | null) {
  if (completedDate) return false;
  return isFutureDate(nextCallDate);
}

export const PRIMARY_CITY = "Surat";
