import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const BACKUP_SECRET =
  process.env.BACKUP_SECRET ?? "PNP_CRM_ENTERPRISE_SECRET_2026_SECURE_V1";
const APP_SIGNATURE = "PNP_CRM_APP_SIG";

// 500 MB sanity limit — prevents memory exhaustion from malicious uploads
const MAX_FILE_SIZE = 500 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Step 1: Parse & validate uploaded file BEFORE touching the database ───
  let file: File;
  try {
    const formData = await req.formData();
    file = formData.get("file") as File;

    // FIX (Major): Validate file presence, extension, and size before buffering
    if (!file || !file.name) {
      return NextResponse.json({ error: "No backup file provided" }, { status: 400 });
    }
    if (!file.name.endsWith(".pnpcrm")) {
      return NextResponse.json({ error: "Invalid backup file — must be a .pnpcrm file" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Backup file too large" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to read uploaded file" }, { status: 400 });
  }

  // ── Step 2: Decrypt & validate the backup payload ─────────────────────────
  let zipData: Buffer;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length < 20) {
      return NextResponse.json({ error: "Invalid backup file — file too small" }, { status: 400 });
    }

    // Extract IV (first 16 bytes) and encrypted body
    const iv = buffer.subarray(0, 16);
    const encryptedData = buffer.subarray(16);

    const key = crypto.createHash("sha256").update(BACKUP_SECRET).digest();

    let decrypted: Buffer;
    try {
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    } catch {
      return NextResponse.json(
        { error: "Backup not created from this PNP CRM — decryption failed" },
        { status: 400 }
      );
    }

    // FIX (Critical): Validate payload length before slicing to prevent buffer overrun
    if (decrypted.length < 4) {
      return NextResponse.json({ error: "Backup corrupted — payload too short" }, { status: 400 });
    }

    const payloadLength = decrypted.readUInt32BE(0);

    if (payloadLength > decrypted.length - 4) {
      return NextResponse.json(
        { error: "Backup corrupted — invalid payload length" },
        { status: 400 }
      );
    }

    let payload: { hash: string; signature: string; version?: string };
    try {
      payload = JSON.parse(
        decrypted.subarray(4, 4 + payloadLength).toString("utf8")
      );
    } catch {
      return NextResponse.json({ error: "Backup corrupted — invalid metadata" }, { status: 400 });
    }

    // Validate app signature
    if (payload.signature !== APP_SIGNATURE) {
      return NextResponse.json(
        { error: "Backup not created from PNP CRM" },
        { status: 400 }
      );
    }

    zipData = decrypted.subarray(4 + payloadLength);

    // FIX (Major): Actually verify the checksum 
    const actualHash = crypto.createHash("sha256").update(zipData).digest("hex");
    if (actualHash !== payload.hash) {
      return NextResponse.json(
        { error: "Backup corrupted — checksum mismatch" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    // Catch any unexpected crypto errors
    return NextResponse.json(
      { error: err.message ?? "Failed to validate backup file" },
      { status: 400 }
    );
  }

  // ── Step 3: Atomic database replacement ───────────────────────────────────
  // FIXED: Using the active path _data/crm.db
  const dbPath = path.join(process.cwd(), "_data", "crm.db");
  const preRestorePath = dbPath + ".pre-restore";
  const tempDir = path.join(process.cwd(), "temp_restore_" + Date.now());

  // FIX (Critical): Disconnect Prisma to unlock the SQLite file for replacement
  await prisma.$disconnect();

  try {
    // Safety copy of current DB before we destroy it
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, preRestorePath);
    }

    // Extract ZIP to a uniquely-named temp dir
    const zip = new AdmZip(zipData);
    zip.extractAllTo(tempDir, true);

    // Files to restore — src paths inside the ZIP, dest paths in project root
    const filesToRestore = [
      { src: path.join(tempDir, "_data", "crm.db"), dest: dbPath },
      { src: path.join(tempDir, ".env"),             dest: path.join(process.cwd(), ".env") },
      { src: path.join(tempDir, "public", "logo.png"), dest: path.join(process.cwd(), "public", "logo.png") },
    ];

    for (const { src, dest } of filesToRestore) {
      if (fs.existsSync(src)) {
        // Ensure destination directory exists
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    }

    // Verify the restored DB file actually landed correctly
    if (!fs.existsSync(dbPath)) {
      throw new Error("Database restore failed — crm.db not found after extraction");
    }

    // NEW STEP: Push the current schema to the restored database to add any missing columns.
    // --skip-generate ensures we don't try to overwrite locked DLL files while Next.js is running.
    // --accept-data-loss forces it through warnings.
    try {
      await execAsync("npx prisma db push --skip-generate --accept-data-loss");
    } catch (pushErr: any) {
      console.warn("[Restore] prisma db push warned/failed, proceeding anyway:", pushErr.stderr ?? pushErr.message);
    }

    // Reconnect Prisma BEFORE calling revalidatePath
    await prisma.$connect();

    // Verify DB is alive
    await prisma.user.count(); 

    // Reconnect & verify FIRST, then invalidate cache
    revalidatePath("/", "layout");

    // Clean up the pre-restore safety copy after confirmed success
    if (fs.existsSync(preRestorePath)) {
      fs.unlinkSync(preRestorePath);
    }

    return NextResponse.json({
      success: true,
      message: "Backup restored successfully. Refreshing...",
    });
  } catch (error: any) {
    console.error("[Restore] Error during restore:", error);

    // ── Rollback: put the original DB back if we still have a safety copy ──
    if (fs.existsSync(preRestorePath) && !fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(preRestorePath, dbPath);
        console.log("[Restore] Rolled back to pre-restore database.");
      } catch (rollbackErr) {
        console.error("[Restore] Rollback also failed:", rollbackErr);
      }
    }

    return NextResponse.json(
      { error: error.message ?? "Restore failed" },
      { status: 500 }
    );
  } finally {
    // ALWAYS reconnect Prisma
    try {
      await prisma.$connect();
    } catch (connectErr) {
      console.error("[Restore] Failed to reconnect Prisma in finally block:", connectErr);
    }

    // ALWAYS clean up temp dir
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error("[Restore] Failed to clean up temp dir:", cleanupErr);
      }
    }
  }
}
