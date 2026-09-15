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

import { readFileSync, appendFileSync, mkdirSync, existsSync, writeFileSync } from "fs";
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

async function performDirectBackup() {
  log("Web server offline or unreachable. Running self-contained direct backup...");

  const dbPath = path.join(projectRoot, "_data", "crm.db");
  if (!existsSync(dbPath)) {
    throw new Error("Database file _data/crm.db not found.");
  }

  // 1. Package files
  const AdmZip = (await import("adm-zip")).default;
  const zip = new AdmZip();
  zip.addLocalFile(dbPath, "_data");

  const envPath = path.join(projectRoot, ".env");
  if (existsSync(envPath)) zip.addLocalFile(envPath, "");

  const logoPath = path.join(projectRoot, "public", "logo.png");
  if (existsSync(logoPath)) zip.addLocalFile(logoPath, "public");

  const metadata = {
    app: "PNP CRM",
    version: "1.0",
    backupType: "system_snapshot",
    createdAt: new Date().toISOString(),
    signature: "PNP_CRM_APP_SIG",
  };
  zip.addFile("metadata.json", Buffer.from(JSON.stringify(metadata, null, 2), "utf8"));

  const zipData = zip.toBuffer();
  const crypto = await import("crypto");
  const hash = crypto.createHash("sha256").update(zipData).digest("hex");

  // 2. Encrypt with AES-256
  const BACKUP_SECRET = process.env.BACKUP_SECRET ?? "PNP_CRM_ENTERPRISE_SECRET_2026_SECURE_V1";
  const key = crypto.createHash("sha256").update(BACKUP_SECRET).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  const payload = JSON.stringify({ hash, signature: "PNP_CRM_APP_SIG", version: "1.0" });
  const payloadBuffer = Buffer.from(payload, "utf8");
  const payloadLengthBuffer = Buffer.alloc(4);
  payloadLengthBuffer.writeUInt32BE(payloadBuffer.length, 0);

  const encryptedData = Buffer.concat([
    cipher.update(Buffer.concat([payloadLengthBuffer, payloadBuffer, zipData])),
    cipher.final(),
  ]);

  const finalBackup = Buffer.concat([iv, encryptedData]);

  // Save local copy to _data/backups/
  const backupsDir = path.join(projectRoot, "_data", "backups");
  try { mkdirSync(backupsDir, { recursive: true }); } catch {}
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const fileName = `PNP CRM Backup - ${dd}-${mm}-${yyyy}.pnpcrm`;
  writeFileSync(path.join(backupsDir, fileName), finalBackup);

  // 3. Upload to Cloudflare R2
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const r2Bucket = process.env.R2_BUCKET_NAME ?? "pnp-crm-backup";

  let cloudUploaded = false;
  if (accountId && accessKeyId && secretAccessKey && accountId !== "your_cloudflare_account_id_here") {
    try {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const r2 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      await r2.send(new PutObjectCommand({
        Bucket: r2Bucket,
        Key: "latest.pnpcrm",
        Body: finalBackup,
        ContentType: "application/octet-stream",
      }));
      cloudUploaded = true;
    } catch (r2Err) {
      log(`WARNING: Direct R2 upload encountered error: ${r2Err.message}`);
    }
  }

  // 4. Update SQLite database timestamp
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: { autoBackupLastRun: new Date() },
      create: { id: "global", autoBackupLastRun: new Date(), sessionMaxAge: 2592000 },
    });
    await prisma.$disconnect();
  } catch (dbErr) {
    // Non-critical, continue
  }

  return cloudUploaded;
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
  let cloudUploaded = false;
  let success = false;

  try {
    const response = await fetch(
      `${BASE_URL}/api/settings/backup?secret=${encodeURIComponent(INTERNAL_SECRET)}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (response.ok) {
      cloudUploaded = response.headers.get("X-Cloud-Uploaded") === "true";
      success = true;
    } else {
      log(`API returned HTTP ${response.status}. Attempting direct backup...`);
      cloudUploaded = await performDirectBackup();
      success = true;
    }
  } catch (netErr) {
    log(`HTTP connection failed (${netErr.message}). Switching to direct backup...`);
    cloudUploaded = await performDirectBackup();
    success = true;
  }

  if (success) {
    if (cloudUploaded) {
      log("SUCCESS: Backup created and uploaded to Cloudflare R2.");
    } else {
      log("SUCCESS: Backup created locally in _data/backups. (Cloud upload skipped or not configured).");
    }
  }
} catch (error) {
  log(`FAILED: ${error.message}`);
  process.exit(1);
}
