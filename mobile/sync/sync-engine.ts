/**
 * PNP CRM Mobile — Sync Engine
 * File: mobile/sync/sync-engine.ts
 *
 * Handles packaging local SQLite data from the phone and sending it
 * to the main CRM server through the Cloudflare Tunnel URL.
 */

import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';

// ── Configuration ───────────────────────────────────────────────────────────

/**
 * The Cloudflare Tunnel URL pointing to the main CRM running on the PC.
 * Replace this with your actual tunnel URL after running:
 *   cloudflared tunnel --url http://localhost:3000
 *
 * For a permanent URL, set up a named Cloudflare Tunnel with a free account.
 */
const CRM_BASE_URL = process.env.NEXT_PUBLIC_CRM_TUNNEL_URL || 'http://localhost:3000';
const SYNC_ENDPOINT = `${CRM_BASE_URL}/api/mobile/sync`;

/**
 * This key must match MOBILE_SYNC_SECRET in the CRM's .env file.
 * Keep this secret — it authenticates the mobile app to the CRM server.
 */
const SYNC_API_KEY = process.env.NEXT_PUBLIC_MOBILE_SYNC_SECRET || '';

// Storage keys for Preferences (persistent storage on the phone)
const STORAGE_KEYS = {
  PENDING_LEADS:      'pnp_pending_leads',
  PENDING_FOLLOWUPS:  'pnp_pending_followups',
  LAST_SYNC_TIME:     'pnp_last_sync_time',
  DEVICE_ID:          'pnp_device_id',
  SYNC_LOG:           'pnp_sync_log',
} as const;

// ── Types ───────────────────────────────────────────────────────────────────

export interface PendingLead {
  mobileId: string;
  customerName: string;
  contactNumber: string;
  alternateNumber?: string;
  fullAddress?: string;
  inquirySource: string;
  referenceName?: string;
  serviceType: string;
  priority: string;
  status: string;
  requirementDetails?: string;
  siteLocation?: string;
  budgetRange?: string;
  createdAt: string;
}

export interface PendingFollowUp {
  mobileId: string;
  leadContactNumber: string;
  scheduledAt: string;
  outcome?: string;
  notes?: string;
  status: string;
}

export interface SyncResult {
  success: boolean;
  leadsInserted: number;
  leadsSkipped: number;
  followUpsInserted: number;
  followUpsSkipped: number;
  errors: string[];
  syncedAt?: string;
  errorMessage?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline' | 'not_configured';

// ── Device ID ───────────────────────────────────────────────────────────────

/**
 * Generate or retrieve a unique ID for this device.
 * Used to identify which device sent the sync payload.
 */
export async function getDeviceId(): Promise<string> {
  const { value } = await Preferences.get({ key: STORAGE_KEYS.DEVICE_ID });
  if (value) return value;

  const newId = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await Preferences.set({ key: STORAGE_KEYS.DEVICE_ID, value: newId });
  return newId;
}

// ── Local Storage Helpers ───────────────────────────────────────────────────

/** Save a new lead to local pending queue */
export async function saveLeadLocally(lead: Omit<PendingLead, 'mobileId' | 'createdAt'>): Promise<PendingLead> {
  const newLead: PendingLead = {
    ...lead,
    mobileId: `mob-lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const existing = await getPendingLeads();
  existing.push(newLead);
  await Preferences.set({
    key: STORAGE_KEYS.PENDING_LEADS,
    value: JSON.stringify(existing),
  });

  return newLead;
}

/** Save a new follow-up to local pending queue */
export async function saveFollowUpLocally(fu: Omit<PendingFollowUp, 'mobileId'>): Promise<PendingFollowUp> {
  const newFu: PendingFollowUp = {
    ...fu,
    mobileId: `mob-fu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };

  const existing = await getPendingFollowUps();
  existing.push(newFu);
  await Preferences.set({
    key: STORAGE_KEYS.PENDING_FOLLOWUPS,
    value: JSON.stringify(existing),
  });

  return newFu;
}

/** Get all pending leads from local storage */
export async function getPendingLeads(): Promise<PendingLead[]> {
  const { value } = await Preferences.get({ key: STORAGE_KEYS.PENDING_LEADS });
  if (!value) return [];
  try { return JSON.parse(value); } catch { return []; }
}

/** Get all pending follow-ups from local storage */
export async function getPendingFollowUps(): Promise<PendingFollowUp[]> {
  const { value } = await Preferences.get({ key: STORAGE_KEYS.PENDING_FOLLOWUPS });
  if (!value) return [];
  try { return JSON.parse(value); } catch { return []; }
}

/** Get total count of pending items */
export async function getPendingCount(): Promise<number> {
  const [leads, followUps] = await Promise.all([getPendingLeads(), getPendingFollowUps()]);
  return leads.length + followUps.length;
}

/** Clear synced items from local storage after successful sync */
async function clearSyncedItems(): Promise<void> {
  await Promise.all([
    Preferences.remove({ key: STORAGE_KEYS.PENDING_LEADS }),
    Preferences.remove({ key: STORAGE_KEYS.PENDING_FOLLOWUPS }),
  ]);
}

/** Get timestamp of last successful sync */
export async function getLastSyncTime(): Promise<string | null> {
  const { value } = await Preferences.get({ key: STORAGE_KEYS.LAST_SYNC_TIME });
  return value;
}

// ── Main Sync Function ──────────────────────────────────────────────────────

/**
 * Main sync function — call this when the user taps "Sync Now".
 * 1. Checks internet connectivity
 * 2. Validates configuration
 * 3. Packages all pending local data
 * 4. Sends to CRM via Cloudflare Tunnel
 * 5. Clears local queue on success
 */
export async function syncToServer(
  onProgress?: (message: string) => void
): Promise<SyncResult> {

  const log = (msg: string) => {
    console.log('[SyncEngine]', msg);
    onProgress?.(msg);
  };

  // ── Step 1: Check internet connectivity ──
  log('Checking connectivity...');
  const networkStatus = await Network.getStatus();
  if (!networkStatus.connected) {
    return {
      success: false,
      leadsInserted: 0,
      leadsSkipped: 0,
      followUpsInserted: 0,
      followUpsSkipped: 0,
      errors: [],
      errorMessage: 'No internet connection. Please connect to WiFi or mobile data and try again.',
    };
  }

  // ── Step 2: Validate configuration ──
  if (!SYNC_API_KEY) {
    return {
      success: false,
      leadsInserted: 0,
      leadsSkipped: 0,
      followUpsInserted: 0,
      followUpsSkipped: 0,
      errors: [],
      errorMessage: 'Sync not configured. Contact your administrator.',
    };
  }

  // ── Step 3: Load pending items ──
  log('Loading pending items...');
  const [pendingLeads, pendingFollowUps] = await Promise.all([
    getPendingLeads(),
    getPendingFollowUps(),
  ]);

  if (pendingLeads.length === 0 && pendingFollowUps.length === 0) {
    return {
      success: true,
      leadsInserted: 0,
      leadsSkipped: 0,
      followUpsInserted: 0,
      followUpsSkipped: 0,
      errors: [],
      syncedAt: new Date().toISOString(),
      errorMessage: undefined,
    };
  }

  log(`Syncing ${pendingLeads.length} leads and ${pendingFollowUps.length} follow-ups...`);

  // ── Step 4: Send to server ──
  const deviceId = await getDeviceId();

  try {
    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mobile-sync-key': SYNC_API_KEY,
      },
      body: JSON.stringify({
        leads: pendingLeads,
        followUps: pendingFollowUps,
        syncedAt: new Date().toISOString(),
        deviceId,
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();

    // ── Step 5: Clear synced items on success ──
    log('Sync successful! Clearing local queue...');
    await clearSyncedItems();

    // Save last sync timestamp
    await Preferences.set({
      key: STORAGE_KEYS.LAST_SYNC_TIME,
      value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });

    return {
      success: true,
      leadsInserted:     data.results?.leadsInserted     ?? 0,
      leadsSkipped:      data.results?.leadsSkipped      ?? 0,
      followUpsInserted: data.results?.followUpsInserted ?? 0,
      followUpsSkipped:  data.results?.followUpsSkipped  ?? 0,
      errors:            data.results?.errors            ?? [],
      syncedAt:          data.syncedAt,
    };

  } catch (error: any) {
    let errorMessage = 'Failed to connect to CRM server.';

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      errorMessage = 'Connection timed out. Make sure your CRM is running and the Cloudflare Tunnel is active.';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Cannot reach the CRM server. Make sure your PC is on and the Cloudflare Tunnel is running.';
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      leadsInserted: 0,
      leadsSkipped: 0,
      followUpsInserted: 0,
      followUpsSkipped: 0,
      errors: [errorMessage],
      errorMessage,
    };
  }
}

// ── Health Check ─────────────────────────────────────────────────────────────

/**
 * Quick health check — ping the CRM server to verify connection.
 * Returns true if connected and authenticated.
 */
export async function checkServerConnection(): Promise<{
  connected: boolean;
  stats?: { totalLeads: number; pendingFollowUps: number; scheduledMeetings: number };
  error?: string;
}> {
  if (!SYNC_API_KEY) return { connected: false, error: 'Not configured' };

  try {
    const response = await fetch(SYNC_ENDPOINT, {
      method: 'GET',
      headers: { 'x-mobile-sync-key': SYNC_API_KEY },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return { connected: false, error: 'Authentication failed' };

    const data = await response.json();
    return { connected: true, stats: data.stats };
  } catch {
    return { connected: false, error: 'Server unreachable' };
  }
}
