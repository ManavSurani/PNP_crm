/**
 * PNP CRM — Nightly Auto-Backup Script
 *
 * This script is executed by Windows Task Scheduler at the scheduled time.
 * It calls the local CRM backup API (using an internal secret to bypass login),
 * which creates the encrypted .pnpcrm backup and uploads it to Cloudflare R2.
 *
 * Requirements:
 *   - The CRM server must be running (npm start / start-crm.bat)
 *   - INTERNAL_BACKUP_SECRET must be set in .env
 *   - R2 credentials must be set in .env
 */

import { readFileSync, appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

// ── Load .env manually (not using dotenv to keep zero extra dependencies) ─────
try {
  const envFile = readFileSync(path.join(projectRoot, ".env"), "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch (e) {
  console.error("[Auto-Backup] Could not load .env:", e.message);
  process.exit(1);
}

// ── Setup log file ────────────────────────────────────────────────────────────
const logDir = path.join(projectRoot, "_data", "auto-backup");
try {
  mkdirSync(logDir, { recursive: true });
} catch {}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(path.join(logDir, "backup.log"), line + "\n");
  } catch {}
}

// ── Main ──────────────────────────────────────────────────────────────────────
const INTERNAL_SECRET = process.env.INTERNAL_BACKUP_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

if (!INTERNAL_SECRET) {
  log("ERROR: INTERNAL_BACKUP_SECRET is not set in .env — aborting.");
  process.exit(1);
}

log("Starting auto-backup...");

try {
  const response = await fetch(
    `${BASE_URL}/api/settings/backup?secret=${encodeURIComponent(INTERNAL_SECRET)}`
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "(no body)");
    throw new Error(`Backup API returned HTTP ${response.status}: ${body}`);
  }

  const cloudUploaded = response.headers.get("X-Cloud-Uploaded") === "true";

  if (cloudUploaded) {
    log("SUCCESS: Backup created and uploaded to Cloudflare R2.");
  } else {
    log("WARNING: Backup created but R2 upload failed or R2 is not configured. Check server logs.");
  }
} catch (error) {
  log(`FAILED: ${error.message}`);
  process.exit(1);
}
