import { startOfDay, endOfDay, isPast, isToday } from "date-fns";

/**
 * Normalizes a date to the start of its local day for accurate "Date-only" comparisons.
 */
export function getStartOfLocalDate(date: Date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Logic to determine if a follow-up is overdue.
 * Strictly: nextCallDate is before today AND not completed.
 */
export function isFollowUpOverdue(nextCallDate: Date | string | null, completedDate: Date | string | null) {
  if (!nextCallDate || completedDate) return false;
  
  const d = new Date(nextCallDate);
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return dStart.getTime() < todayStart.getTime();
}

/**
 * Logic to determine if a follow-up is for today.
 */
export function isFollowUpToday(nextCallDate: Date | string | null, completedDate: Date | string | null) {
  if (!nextCallDate || completedDate) return false;
  
  const d = new Date(nextCallDate);
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return dStart.getTime() === todayStart.getTime();
}

export const PRIMARY_CITY = "Surat";

/**
 * Logic to determine if a follow-up is upcoming.
 * Simplified Definition: Any follow-up date except today.
 */
export function isFollowUpUpcoming(nextCallDate: Date | string | null, completedDate: Date | string | null) {
  if (!nextCallDate || completedDate) return false;
  
  const d = new Date(nextCallDate);
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Rule: Any date except today.
  return dStart.getTime() !== todayStart.getTime();
}
