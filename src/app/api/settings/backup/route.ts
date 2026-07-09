import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma";

const BACKUP_SECRET =
  process.env.BACKUP_SECRET ?? "PNP_CRM_ENTERPRISE_SECRET_2026_SECURE_V1";
const APP_SIGNATURE = "PNP_CRM_APP_SIG";
const BACKUP_VERSION = "1.0";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (
    !accountId || !accessKeyId || !secretAccessKey ||
    accountId === "your_cloudflare_account_id_here"
  ) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function GET(req: Request) {
  // ── Auth: allow admin session OR internal scheduled script secret ──────────
  const { searchParams } = new URL(req.url);
  const internalSecret = searchParams.get("secret");
  const INTERNAL_SECRET = process.env.INTERNAL_BACKUP_SECRET;

  let isAuthorized = false;
  if (internalSecret && INTERNAL_SECRET && internalSecret === INTERNAL_SECRET) {
    isAuthorized = true;
  } else {
    const session = await auth();
    if (session?.user?.role === "ADMIN") isAuthorized = true;
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const zip = new AdmZip();

    // ── Database ──────────────────────────────────────────────────────────────
    const dbPath = path.join(process.cwd(), "_data", "crm.db");
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { error: "Database file not found. Cannot create backup." },
        { status: 500 }
      );
    }
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

    // ── Upload to Cloudflare R2 (if configured) ───────────────────────────────
    let cloudUploaded = false;
    const r2 = getR2Client();
    const r2Bucket = process.env.R2_BUCKET_NAME ?? "pnp-crm-backup";

    if (r2) {
      try {
        await r2.send(new PutObjectCommand({
          Bucket: r2Bucket,
          Key: "latest.pnpcrm",
          Body: finalBackup,
          ContentType: "application/octet-stream",
        }));
        // Record timestamp of successful cloud upload
        await (prisma.systemSetting as any).upsert({
          where: { id: "global" },
          update: { autoBackupLastRun: new Date() } as any,
          create: { id: "global", autoBackupLastRun: new Date(), sessionMaxAge: 2592000 } as any,
        });
        cloudUploaded = true;
        console.log("[Backup] Uploaded to Cloudflare R2 successfully.");
      } catch (r2Err: any) {
        console.error("[Backup] R2 upload failed (backup file still returned):", r2Err.message);
      }
    }

    // ── Return encrypted backup file ──────────────────────────────────────────
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
        "X-Cloud-Uploaded": cloudUploaded ? "true" : "false",
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
