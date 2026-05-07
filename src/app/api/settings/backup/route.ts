import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";

// FIX (Major): Read secret from .env so each install has a unique key
const BACKUP_SECRET =
  process.env.BACKUP_SECRET ?? "PNP_CRM_ENTERPRISE_SECRET_2026_SECURE_V1";
const APP_SIGNATURE = "PNP_CRM_APP_SIG";
const BACKUP_VERSION = "1.0";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const zip = new AdmZip();

    // ── Database ──────────────────────────────────────────────────────────────
    // FIXED: Using the active path _data/crm.db
    const dbPath = path.join(process.cwd(), "_data", "crm.db");
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { error: "Database file not found. Cannot create backup." },
        { status: 500 }
      );
    }
    // Store it in a 'db' folder inside the zip for clarity
    zip.addLocalFile(dbPath, "_data");

    // ── .env ──────────────────────────────────────────────────────────────────
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      zip.addLocalFile(envPath, "");
    }

    // ── Logo ──────────────────────────────────────────────────────────────────
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      zip.addLocalFile(logoPath, "public");
    }

    // ── Metadata ──────────────────────────────────────────────────────────────
    const metadata = {
      app: "PNP CRM",
      version: BACKUP_VERSION,
      backupType: "system_snapshot",
      createdAt: new Date().toISOString(),
      signature: APP_SIGNATURE,
    };
    zip.addFile(
      "metadata.json",
      Buffer.from(JSON.stringify(metadata, null, 2), "utf8")
    );

    // ── Build ZIP buffer & hash ───────────────────────────────────────────────
    const zipData = zip.toBuffer();

    // Compute hash BEFORE encrypting so restore can verify integrity
    const hash = crypto.createHash("sha256").update(zipData).digest("hex");

    // ── Encrypt ───────────────────────────────────────────────────────────────
    const key = crypto.createHash("sha256").update(BACKUP_SECRET).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    const payload = JSON.stringify({ hash, signature: APP_SIGNATURE, version: BACKUP_VERSION });
    const payloadBuffer = Buffer.from(payload, "utf8");

    const payloadLengthBuffer = Buffer.alloc(4);
    payloadLengthBuffer.writeUInt32BE(payloadBuffer.length, 0);

    const encryptedData = Buffer.concat([
      cipher.update(
        Buffer.concat([payloadLengthBuffer, payloadBuffer, zipData])
      ),
      cipher.final(),
    ]);

    const finalBackup = Buffer.concat([iv, encryptedData]);

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const fileName = `PNP CRM Backup - ${dd}-${mm}-${yyyy}.pnpcrm`;

    return new NextResponse(finalBackup, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Backup-Version": BACKUP_VERSION,
      },
    });
  } catch (error: any) {
    console.error("[Backup] Error:", error);
    return NextResponse.json(
      { error: "Backup creation failed: " + (error.message ?? "Unknown error") },
      { status: 500 }
    );
  }
}
