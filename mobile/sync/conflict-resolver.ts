/**
 * PNP CRM Mobile — Conflict Resolver
 * File: mobile/sync/conflict-resolver.ts
 *
 * Prevents data loss when syncing from multiple devices or when the same
 * lead/follow-up already exists in the main CRM database.
 *
 * Strategy:
 * - Leads:      Skip if phone number already exists in CRM (no overwrite)
 * - Follow-ups: Skip if a newer follow-up for the same lead already exists
 * - Future:     Allow selective override with user confirmation
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type ConflictType =
  | 'DUPLICATE_PHONE'         // Lead with same phone number exists
  | 'LEAD_NOT_FOUND'          // Follow-up references a lead that doesn't exist
  | 'NEWER_FOLLOWUP_EXISTS'   // A more recent follow-up already in CRM
  | 'NONE';                   // No conflict, safe to insert

export interface ConflictReport {
  mobileId: string;
  type: ConflictType;
  message: string;
  resolution: 'SKIPPED' | 'INSERTED' | 'UPDATED';
  data?: Record<string, any>;
}

export interface ConflictSummary {
  totalProcessed: number;
  inserted: number;
  skipped: number;
  updated: number;
  conflicts: ConflictReport[];
  hasErrors: boolean;
}

// ── Lead Conflict Detection ──────────────────────────────────────────────────

/**
 * Check if a lead would cause a conflict before sending to the server.
 * This runs CLIENT-SIDE on the phone — it checks against locally cached data.
 *
 * For definitive conflict detection, the server-side sync route does a
 * full database check via Prisma.
 */
export function detectLeadConflicts(
  pendingLeads: Array<{ mobileId: string; contactNumber: string; customerName: string }>,
): ConflictReport[] {
  const reports: ConflictReport[] = [];
  const seenPhones = new Set<string>();

  for (const lead of pendingLeads) {
    // Normalize phone number for comparison
    const normalized = lead.contactNumber.replace(/\D/g, '');

    if (seenPhones.has(normalized)) {
      // Duplicate within the pending queue itself
      reports.push({
        mobileId: lead.mobileId,
        type: 'DUPLICATE_PHONE',
        message: `Lead "${lead.customerName}" has a duplicate phone number ${lead.contactNumber} in your pending queue. Only the first entry will be sent.`,
        resolution: 'SKIPPED',
        data: { contactNumber: lead.contactNumber },
      });
    } else {
      seenPhones.add(normalized);
    }
  }

  return reports;
}

/**
 * Remove intra-queue duplicates before sending to the server.
 * Keeps the FIRST occurrence of any phone number.
 */
export function deduplicatePendingLeads<T extends { mobileId: string; contactNumber: string }>(
  leads: T[]
): { deduplicated: T[]; removed: string[] } {
  const seenPhones = new Set<string>();
  const deduplicated: T[] = [];
  const removed: string[] = [];

  for (const lead of leads) {
    const normalized = lead.contactNumber.replace(/\D/g, '');
    if (seenPhones.has(normalized)) {
      removed.push(lead.mobileId);
    } else {
      seenPhones.add(normalized);
      deduplicated.push(lead);
    }
  }

  return { deduplicated, removed };
}

// ── Follow-Up Conflict Detection ─────────────────────────────────────────────

/**
 * Remove duplicate follow-ups for the same lead from the pending queue.
 * Keeps the LATEST follow-up per lead (by scheduledAt date).
 */
export function deduplicatePendingFollowUps<
  T extends { mobileId: string; leadContactNumber: string; scheduledAt: string }
>(followUps: T[]): { deduplicated: T[]; removed: string[] } {
  const latestPerLead = new Map<string, T>();

  for (const fu of followUps) {
    const key = fu.leadContactNumber.replace(/\D/g, '');
    const existing = latestPerLead.get(key);

    if (!existing) {
      latestPerLead.set(key, fu);
    } else {
      // Keep the newer one
      const existingDate = new Date(existing.scheduledAt).getTime();
      const newDate = new Date(fu.scheduledAt).getTime();
      if (newDate > existingDate) {
        latestPerLead.set(key, fu);
      }
    }
  }

  const deduplicated = Array.from(latestPerLead.values());
  const keptIds = new Set(deduplicated.map(f => f.mobileId));
  const removed = followUps.filter(f => !keptIds.has(f.mobileId)).map(f => f.mobileId);

  return { deduplicated, removed };
}

// ── Sync Summary Builder ──────────────────────────────────────────────────────

/**
 * Build a human-readable summary of the sync result to show the user.
 */
export function buildSyncSummary(result: {
  leadsInserted: number;
  leadsSkipped: number;
  followUpsInserted: number;
  followUpsSkipped: number;
  errors: string[];
}): string {
  const lines: string[] = [];

  if (result.leadsInserted > 0) {
    lines.push(`✅ ${result.leadsInserted} new lead${result.leadsInserted > 1 ? 's' : ''} added to CRM`);
  }
  if (result.leadsSkipped > 0) {
    lines.push(`⏭ ${result.leadsSkipped} lead${result.leadsSkipped > 1 ? 's' : ''} already existed — skipped`);
  }
  if (result.followUpsInserted > 0) {
    lines.push(`✅ ${result.followUpsInserted} follow-up${result.followUpsInserted > 1 ? 's' : ''} added to CRM`);
  }
  if (result.followUpsSkipped > 0) {
    lines.push(`⏭ ${result.followUpsSkipped} follow-up${result.followUpsSkipped > 1 ? 's' : ''} skipped`);
  }
  if (result.errors.length > 0) {
    lines.push(`⚠️ ${result.errors.length} item${result.errors.length > 1 ? 's' : ''} had errors`);
  }
  if (lines.length === 0) {
    lines.push('✅ Everything is up to date!');
  }

  return lines.join('\n');
}

// ── Phone Number Normalization ────────────────────────────────────────────────

/** Normalize an Indian phone number for consistent comparison */
export function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Strip country code +91 or 91 prefix if present
  if (digits.startsWith('91') && digits.length === 12) {
    return digits.slice(2);
  }
  return digits;
}

/** Compare two phone numbers ignoring formatting and country codes */
export function phonesMatch(a: string, b: string): boolean {
  return normalizeIndianPhone(a) === normalizeIndianPhone(b);
}
