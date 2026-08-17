/**
 * PNP CRM Mobile — Local SQLite Database
 * File: mobile/src/db/sqlite.ts
 *
 * DB_VERSION 3:
 *   - Added local_lead_notes table for Activity Timeline.
 *   - Added leadMobileId to local_follow_ups for proper JOIN queries.
 *   - All functions return [] on browser (no dummy data ever).
 *   - Status values unified to match desktop CRM:
 *     NEW_INQUIRY | FOLLOW_UP | MEETING_SCHEDULED | WON_ORDER | CANCELLED
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'pnp_crm_local';
const DB_VERSION = 3;

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

// ── Schema ───────────────────────────────────────────────────────────────────

const CREATE_TABLE_LEADS = `
  CREATE TABLE IF NOT EXISTS local_leads (
    mobileId        TEXT PRIMARY KEY,
    customerName    TEXT NOT NULL,
    contactNumber   TEXT NOT NULL UNIQUE,
    alternateNumber TEXT,
    fullAddress     TEXT,
    serviceType     TEXT DEFAULT 'Other',
    inquirySource   TEXT DEFAULT 'OTHER',
    referenceName   TEXT,
    priority        TEXT DEFAULT 'MEDIUM',
    status          TEXT DEFAULT 'NEW_INQUIRY',
    requirementDetails TEXT,
    siteLocation    TEXT,
    budgetRange     TEXT,
    syncStatus      TEXT DEFAULT 'PENDING',
    createdAt       TEXT NOT NULL
  );
`;

const CREATE_TABLE_FOLLOWUPS = `
  CREATE TABLE IF NOT EXISTS local_follow_ups (
    mobileId            TEXT PRIMARY KEY,
    leadMobileId        TEXT NOT NULL,
    leadContactNumber   TEXT NOT NULL,
    scheduledDate       TEXT NOT NULL,
    noteGiven           TEXT,
    outcome             TEXT DEFAULT 'NOT_PICKED',
    pickedStatus        TEXT,
    nextCallDate        TEXT,
    nextCallTime        TEXT,
    cancelReason        TEXT,
    syncStatus          TEXT DEFAULT 'PENDING',
    createdAt           TEXT NOT NULL
  );
`;

const CREATE_TABLE_VISITS = `
  CREATE TABLE IF NOT EXISTS local_visits (
    mobileId      TEXT PRIMARY KEY,
    leadMobileId  TEXT NOT NULL,
    address       TEXT NOT NULL,
    date          TEXT NOT NULL,
    time          TEXT NOT NULL,
    status        TEXT DEFAULT 'SCHEDULED',
    notes         TEXT,
    syncStatus    TEXT DEFAULT 'PENDING',
    createdAt     TEXT NOT NULL
  );
`;

const CREATE_TABLE_CUSTOMERS = `
  CREATE TABLE IF NOT EXISTS local_customers_cache (
    mobileId      TEXT PRIMARY KEY,
    customerName  TEXT NOT NULL,
    contactNumber TEXT NOT NULL,
    serviceType   TEXT NOT NULL,
    siteLocation  TEXT,
    budgetRange   TEXT,
    wonAt         TEXT,
    projectStatus TEXT DEFAULT 'ACTIVE',
    syncStatus    TEXT DEFAULT 'SYNCED'
  );
`;

const CREATE_TABLE_LEAD_NOTES = `
  CREATE TABLE IF NOT EXISTS local_lead_notes (
    mobileId      TEXT PRIMARY KEY,
    leadMobileId  TEXT NOT NULL,
    noteText      TEXT NOT NULL,
    noteType      TEXT DEFAULT 'MANUAL',
    createdByName TEXT DEFAULT 'Sales Rep',
    createdAt     TEXT NOT NULL
  );
`;

// Migrate existing local_follow_ups that lack leadMobileId column
const MIGRATE_FOLLOWUPS_V3 = `
  ALTER TABLE local_follow_ups ADD COLUMN leadMobileId TEXT NOT NULL DEFAULT '';
`;
const MIGRATE_FOLLOWUPS_PICKED = `
  ALTER TABLE local_follow_ups ADD COLUMN pickedStatus TEXT;
`;
const MIGRATE_FOLLOWUPS_NEXT = `
  ALTER TABLE local_follow_ups ADD COLUMN nextCallDate TEXT;
`;
const MIGRATE_FOLLOWUPS_NEXT_TIME = `
  ALTER TABLE local_follow_ups ADD COLUMN nextCallTime TEXT;
`;
const MIGRATE_FOLLOWUPS_CANCEL = `
  ALTER TABLE local_follow_ups ADD COLUMN cancelReason TEXT;
`;

// ── Init ────────────────────────────────────────────────────────────────────

export async function initDB(): Promise<void> {
  try {
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection(DB_NAME, false);
    } else {
      db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
    }

    await db.open();
    await db.execute(CREATE_TABLE_LEADS);
    await db.execute(CREATE_TABLE_FOLLOWUPS);
    await db.execute(CREATE_TABLE_VISITS);
    await db.execute(CREATE_TABLE_CUSTOMERS);
    await db.execute(CREATE_TABLE_LEAD_NOTES);

    // Run migrations safely (ignore errors if column already exists)
    const migrations = [
      MIGRATE_FOLLOWUPS_V3,
      MIGRATE_FOLLOWUPS_PICKED,
      MIGRATE_FOLLOWUPS_NEXT,
      MIGRATE_FOLLOWUPS_NEXT_TIME,
      MIGRATE_FOLLOWUPS_CANCEL,
    ];
    for (const sql of migrations) {
      try { await db.execute(sql); } catch { /* Column already exists — safe to ignore */ }
    }

    console.log('[SQLite] Database v3 initialized successfully');
  } catch (error) {
    console.error('[SQLite] Failed to initialize database:', error);
    // On web/browser (for testing), fail gracefully — the app still works
  }
}

// ── Lead Operations ──────────────────────────────────────────────────────────

export interface LocalLead {
  mobileId: string;
  customerName: string;
  contactNumber: string;
  alternateNumber?: string;
  fullAddress?: string;
  serviceType: string;
  inquirySource: string;
  referenceName?: string;
  priority: string;
  status: string;
  requirementDetails?: string;
  siteLocation?: string;
  budgetRange?: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'ERROR';
  createdAt: string;
}

export async function saveLead(lead: Omit<LocalLead, 'mobileId' | 'createdAt' | 'syncStatus'>): Promise<LocalLead> {
  const mobileId = `mob-lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();

  const newLead: LocalLead = { ...lead, mobileId, createdAt, syncStatus: 'PENDING' };

  if (db) {
    await db.run(
      `INSERT OR REPLACE INTO local_leads
        (mobileId, customerName, contactNumber, alternateNumber, fullAddress, serviceType, inquirySource, referenceName, priority, status, requirementDetails, siteLocation, budgetRange, syncStatus, createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [mobileId, lead.customerName, lead.contactNumber, lead.alternateNumber ?? null, lead.fullAddress ?? null,
       lead.serviceType, lead.inquirySource, lead.referenceName ?? null, lead.priority ?? 'MEDIUM', lead.status,
       lead.requirementDetails ?? null, lead.siteLocation ?? null, lead.budgetRange ?? null, 'PENDING', createdAt]
    );
  }

  return newLead;
}

export async function getAllLeads(): Promise<LocalLead[]> {
  if (!db) return [];
  const result = await db.query('SELECT * FROM local_leads ORDER BY createdAt DESC;');
  return (result.values ?? []) as LocalLead[];
}

export async function getLeadByMobileId(mobileId: string): Promise<LocalLead | null> {
  if (!db) return null;
  const result = await db.query('SELECT * FROM local_leads WHERE mobileId = ? LIMIT 1;', [mobileId]);
  const rows = (result.values ?? []) as LocalLead[];
  return rows.length > 0 ? rows[0] : null;
}

export async function checkDuplicatePhone(phone: string): Promise<LocalLead | null> {
  if (!db) return null;
  const result = await db.query('SELECT * FROM local_leads WHERE contactNumber = ? LIMIT 1;', [phone]);
  const rows = (result.values ?? []) as LocalLead[];
  return rows.length > 0 ? rows[0] : null;
}

export async function getLeadByContactNumber(phone: string): Promise<LocalLead | null> {
  return checkDuplicatePhone(phone);
}

export async function updateLead(mobileId: string, updates: Partial<Omit<LocalLead, 'mobileId' | 'createdAt'>>): Promise<void> {
  if (!db) return;
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.customerName !== undefined) { fields.push('customerName = ?'); values.push(updates.customerName); }
  if (updates.contactNumber !== undefined) { fields.push('contactNumber = ?'); values.push(updates.contactNumber); }
  if (updates.fullAddress !== undefined)   { fields.push('fullAddress = ?');   values.push(updates.fullAddress ?? null); }
  if (updates.serviceType !== undefined)   { fields.push('serviceType = ?');   values.push(updates.serviceType); }
  if (updates.inquirySource !== undefined) { fields.push('inquirySource = ?'); values.push(updates.inquirySource); }
  if (updates.referenceName !== undefined) { fields.push('referenceName = ?'); values.push(updates.referenceName ?? null); }
  if (updates.requirementDetails !== undefined) { fields.push('requirementDetails = ?'); values.push(updates.requirementDetails ?? null); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

  if (fields.length === 0) return;
  fields.push("syncStatus = 'PENDING'");
  values.push(mobileId);

  await db.run(
    `UPDATE local_leads SET ${fields.join(', ')} WHERE mobileId = ?`,
    values
  );
}

export async function getPendingLeads(): Promise<LocalLead[]> {
  if (!db) return [];
  const result = await db.query("SELECT * FROM local_leads WHERE syncStatus = 'PENDING';");
  return (result.values ?? []) as LocalLead[];
}

export async function markLeadsSynced(mobileIds: string[]): Promise<void> {
  if (!db || mobileIds.length === 0) return;
  const placeholders = mobileIds.map(() => '?').join(',');
  await db.run(
    `UPDATE local_leads SET syncStatus = 'SYNCED' WHERE mobileId IN (${placeholders})`,
    mobileIds
  );
}

export async function updateLeadStatus(mobileId: string, status: string): Promise<void> {
  if (!db) return;
  await db.run(
    `UPDATE local_leads SET status = ?, syncStatus = 'PENDING' WHERE mobileId = ?`,
    [status, mobileId]
  );
}

// ── Follow-Up Operations ─────────────────────────────────────────────────────

export interface LocalFollowUp {
  mobileId: string;
  leadMobileId: string;
  leadContactNumber: string;
  scheduledDate: string;
  noteGiven?: string;
  outcome: string;
  pickedStatus?: string;
  nextCallDate?: string;
  nextCallTime?: string;
  cancelReason?: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'ERROR';
  createdAt: string;
  // Joined fields (from local_leads)
  customerName?: string;
  serviceType?: string;
}

export async function saveFollowUp(fu: Omit<LocalFollowUp, 'mobileId' | 'createdAt' | 'syncStatus' | 'customerName' | 'serviceType'>): Promise<LocalFollowUp> {
  const mobileId = `mob-fu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();

  const newFu: LocalFollowUp = { ...fu, mobileId, createdAt, syncStatus: 'PENDING' };

  if (db) {
    await db.run(
      `INSERT OR REPLACE INTO local_follow_ups
        (mobileId, leadMobileId, leadContactNumber, scheduledDate, noteGiven, outcome, pickedStatus, nextCallDate, nextCallTime, cancelReason, syncStatus, createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [mobileId, fu.leadMobileId, fu.leadContactNumber, fu.scheduledDate,
       fu.noteGiven ?? null, fu.outcome, fu.pickedStatus ?? null,
       fu.nextCallDate ?? null, fu.nextCallTime ?? null, fu.cancelReason ?? null,
       'PENDING', createdAt]
    );
  }

  return newFu;
}

export async function getPendingFollowUps(): Promise<LocalFollowUp[]> {
  if (!db) return [];
  const result = await db.query(`
    SELECT f.*, l.customerName, l.serviceType
    FROM local_follow_ups f
    LEFT JOIN local_leads l ON f.leadMobileId = l.mobileId
    WHERE f.syncStatus = 'PENDING'
    ORDER BY f.scheduledDate ASC;
  `);
  return (result.values ?? []) as LocalFollowUp[];
}

export async function markFollowUpsSynced(mobileIds: string[]): Promise<void> {
  if (!db || mobileIds.length === 0) return;
  const placeholders = mobileIds.map(() => '?').join(',');
  await db.run(
    `UPDATE local_follow_ups SET syncStatus = 'SYNCED' WHERE mobileId IN (${placeholders})`,
    mobileIds
  );
}

export async function getAllFollowUps(): Promise<LocalFollowUp[]> {
  if (!db) return [];
  const result = await db.query(`
    SELECT f.*, l.customerName, l.serviceType
    FROM local_follow_ups f
    LEFT JOIN local_leads l ON f.leadMobileId = l.mobileId
    ORDER BY f.scheduledDate ASC;
  `);
  return (result.values ?? []) as LocalFollowUp[];
}

export async function getFollowUpsByLead(leadMobileId: string): Promise<LocalFollowUp[]> {
  if (!db) return [];
  const result = await db.query(
    'SELECT * FROM local_follow_ups WHERE leadMobileId = ? ORDER BY createdAt ASC;',
    [leadMobileId]
  );
  return (result.values ?? []) as LocalFollowUp[];
}

export async function getFollowUpCountByLead(leadMobileId: string): Promise<number> {
  if (!db) return 0;
  const result = await db.query(
    'SELECT COUNT(*) as count FROM local_follow_ups WHERE leadMobileId = ?;',
    [leadMobileId]
  );
  return result.values?.[0]?.count ?? 0;
}


// ── Visit Operations ─────────────────────────────────────────────────────────

export interface LocalVisit {
  mobileId: string;
  leadMobileId: string;
  address: string;
  date: string;   // ISO date: "2026-07-25"
  time: string;   // "10:30 AM"
  status: string; // SCHEDULED | COMPLETED | CANCELLED
  notes?: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'ERROR';
  createdAt: string;
  // Joined fields
  customerName?: string;
  contactNumber?: string;
}

export async function saveVisit(visit: Omit<LocalVisit, 'mobileId' | 'createdAt' | 'syncStatus' | 'customerName' | 'contactNumber'>): Promise<LocalVisit> {
  const mobileId = `mob-visit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();
  const newVisit: LocalVisit = { ...visit, mobileId, createdAt, syncStatus: 'PENDING' };

  if (db) {
    await db.run(
      `INSERT OR REPLACE INTO local_visits
        (mobileId, leadMobileId, address, date, time, status, notes, syncStatus, createdAt)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [mobileId, visit.leadMobileId, visit.address, visit.date, visit.time,
       visit.status ?? 'SCHEDULED', visit.notes ?? null, 'PENDING', createdAt]
    );
  }

  return newVisit;
}

export async function getAllVisits(): Promise<LocalVisit[]> {
  if (!db) return [];
  const result = await db.query(`
    SELECT v.*, l.customerName, l.contactNumber
    FROM local_visits v
    LEFT JOIN local_leads l ON v.leadMobileId = l.mobileId
    ORDER BY v.date ASC, v.time ASC;
  `);
  return (result.values ?? []) as LocalVisit[];
}

export async function getVisitsByLead(leadMobileId: string): Promise<LocalVisit[]> {
  if (!db) return [];
  const result = await db.query(
    'SELECT * FROM local_visits WHERE leadMobileId = ? ORDER BY date ASC, time ASC;',
    [leadMobileId]
  );
  return (result.values ?? []) as LocalVisit[];
}

export async function getTodayVisits(): Promise<LocalVisit[]> {
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  const result = await db.query(`
    SELECT v.*, l.customerName, l.contactNumber
    FROM local_visits v
    LEFT JOIN local_leads l ON v.leadMobileId = l.mobileId
    WHERE v.date = ? ORDER BY v.time ASC;
  `, [today]);
  return (result.values ?? []) as LocalVisit[];
}

export async function updateVisitStatus(mobileId: string, status: 'COMPLETED' | 'CANCELLED'): Promise<void> {
  if (!db) return;
  await db.run(
    `UPDATE local_visits SET status = ?, syncStatus = 'PENDING' WHERE mobileId = ?`,
    [status, mobileId]
  );
}

export async function getPendingVisits(): Promise<LocalVisit[]> {
  if (!db) return [];
  const result = await db.query("SELECT * FROM local_visits WHERE syncStatus = 'PENDING';");
  return (result.values ?? []) as LocalVisit[];
}

export async function markVisitsSynced(mobileIds: string[]): Promise<void> {
  if (!db || mobileIds.length === 0) return;
  const placeholders = mobileIds.map(() => '?').join(',');
  await db.run(
    `UPDATE local_visits SET syncStatus = 'SYNCED' WHERE mobileId IN (${placeholders})`,
    mobileIds
  );
}

export async function deleteSyncedRecords(): Promise<void> {
  if (!db) return;
  await db.run("DELETE FROM local_leads WHERE syncStatus = 'SYNCED';");
  await db.run("DELETE FROM local_follow_ups WHERE syncStatus = 'SYNCED';");
  await db.run("DELETE FROM local_visits WHERE syncStatus = 'SYNCED';");
}

// ── Lead Notes (Activity Timeline) ──────────────────────────────────────────

export type NoteType =
  | 'MANUAL'
  | 'SYSTEM_CREATE'
  | 'SYSTEM_STATUS'
  | 'CALL_PICKED'
  | 'CALL_NOT_PICKED'
  | 'VISIT_SCHEDULED'
  | 'VISIT_COMPLETED'
  | 'CANCELLED'
  | 'CONVERTED'
  | 'REACTIVATED'
  | 'EDITED';

export interface LocalLeadNote {
  mobileId: string;
  leadMobileId: string;
  noteText: string;
  noteType: NoteType;
  createdByName: string;
  createdAt: string;
}

export async function addLeadNote(
  leadMobileId: string,
  noteText: string,
  noteType: NoteType = 'MANUAL',
  createdByName = 'Sales Rep'
): Promise<LocalLeadNote> {
  const mobileId = `mob-note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();

  const note: LocalLeadNote = { mobileId, leadMobileId, noteText, noteType, createdByName, createdAt };

  if (db) {
    await db.run(
      `INSERT INTO local_lead_notes (mobileId, leadMobileId, noteText, noteType, createdByName, createdAt)
       VALUES (?,?,?,?,?,?)`,
      [mobileId, leadMobileId, noteText, noteType, createdByName, createdAt]
    );
  }

  return note;
}

export async function getLeadNotes(leadMobileId: string): Promise<LocalLeadNote[]> {
  if (!db) return [];
  const result = await db.query(
    'SELECT * FROM local_lead_notes WHERE leadMobileId = ? ORDER BY createdAt ASC;',
    [leadMobileId]
  );
  return (result.values ?? []) as LocalLeadNote[];
}

// ── Customer Cache Operations ─────────────────────────────────────────────────

export interface LocalCustomer {
  mobileId: string;
  customerName: string;
  contactNumber: string;
  serviceType: string;
  siteLocation?: string;
  budgetRange?: string;
  wonAt?: string;
  projectStatus: string; // ACTIVE | COMPLETED | ON_HOLD
  syncStatus: 'PENDING' | 'SYNCED' | 'ERROR';
}

export async function saveCustomerFromLead(lead: LocalLead): Promise<void> {
  if (!db) return;
  await db.run(
    `INSERT OR REPLACE INTO local_customers_cache
      (mobileId, customerName, contactNumber, serviceType, siteLocation, budgetRange, wonAt, projectStatus, syncStatus)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [lead.mobileId, lead.customerName, lead.contactNumber, lead.serviceType,
     lead.siteLocation ?? null, lead.budgetRange ?? null, new Date().toISOString(),
     'ACTIVE', 'SYNCED']
  );
}

export async function getAllCustomers(): Promise<LocalCustomer[]> {
  if (!db) return [];
  const result = await db.query('SELECT * FROM local_customers_cache ORDER BY wonAt DESC;');
  return (result.values ?? []) as LocalCustomer[];
}

export async function updateCustomerProjectStatus(mobileId: string, projectStatus: string): Promise<void> {
  if (!db) return;
  await db.run(
    `UPDATE local_customers_cache SET projectStatus = ? WHERE mobileId = ?`,
    [projectStatus, mobileId]
  );
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export interface DashboardStats {
  totalLeads: number;
  followUps: number;
  newInquiries: number;
  siteVisits: number;
  pendingSync: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!db) {
    return { totalLeads: 0, followUps: 0, newInquiries: 0, siteVisits: 0, pendingSync: 0 };
  }

  const [total, newInq, followUp, visits, pendingLeads, pendingFU, pendingVisits] = await Promise.all([
    db.query("SELECT COUNT(*) as count FROM local_leads;"),
    db.query("SELECT COUNT(*) as count FROM local_leads WHERE status = 'NEW_INQUIRY';"),
    db.query("SELECT COUNT(*) as count FROM local_follow_ups;"),
    db.query("SELECT COUNT(*) as count FROM local_leads WHERE status = 'MEETING_SCHEDULED';"),
    db.query("SELECT COUNT(*) as count FROM local_leads WHERE syncStatus = 'PENDING';"),
    db.query("SELECT COUNT(*) as count FROM local_follow_ups WHERE syncStatus = 'PENDING';"),
    db.query("SELECT COUNT(*) as count FROM local_visits WHERE syncStatus = 'PENDING';"),
  ]);

  return {
    totalLeads:   total.values?.[0]?.count ?? 0,
    followUps:    followUp.values?.[0]?.count ?? 0,
    newInquiries: newInq.values?.[0]?.count ?? 0,
    siteVisits:   visits.values?.[0]?.count ?? 0,
    pendingSync:  (pendingLeads.values?.[0]?.count ?? 0) +
                  (pendingFU.values?.[0]?.count ?? 0) +
                  (pendingVisits.values?.[0]?.count ?? 0),
  };
}
