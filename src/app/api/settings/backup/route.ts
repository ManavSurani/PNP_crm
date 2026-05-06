import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";

const BACKUP_SECRET = "PNP_CRM_ENTERPRISE_SECRET_2026_SECURE_V1";
const APP_SIGNATURE = "PNP_CRM_APP_SIG";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Create ZIP
    const zip = new AdmZip();
    
    // Add Database
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (fs.existsSync(dbPath)) {
      zip.addLocalFile(dbPath, "prisma");
    }

    // Add .env
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      zip.addLocalFile(envPath, "");
    }

    // Add Logo
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      zip.addLocalFile(logoPath, "public");
    }

    // Add Metadata
    const metadata = {
      app: "PNP CRM",
      version: "1.0",
      backupType: "system_snapshot",
      createdAt: new Date().toISOString(),
      signature: APP_SIGNATURE
    };
    zip.addFile("metadata.json", Buffer.from(JSON.stringify(metadata), "utf8"));

    const zipData = zip.toBuffer();

    // 2. Encrypt ZIP
    // const zipData = fs.readFileSync(zipPath); // Already have zipData in memory
    
    // Create Checksum
    const hash = crypto.createHash("sha256").update(zipData).digest("hex");
    const payload = JSON.stringify({
      hash,
      signature: APP_SIGNATURE,
      timestamp: new Date().toISOString()
    });

    const key = crypto.createHash("sha256").update(BACKUP_SECRET).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    
    // Structure: [IV (16 bytes)] [Payload Length (4 bytes)] [Payload] [Encrypted Data]
    const payloadBuffer = Buffer.from(payload, "utf8");
    const payloadLengthBuffer = Buffer.alloc(4);
    payloadLengthBuffer.writeUInt32BE(payloadBuffer.length);

    const encryptedData = Buffer.concat([
      cipher.update(Buffer.concat([payloadLengthBuffer, payloadBuffer, zipData])),
      cipher.final()
    ]);

    const finalBackup = Buffer.concat([iv, encryptedData]);

    const fileName = `PNP CRM Backup - ${new Intl.DateTimeFormat('en-GB').format(new Date()).replace(/\//g, '-')}.pnpcrm`;

    return new NextResponse(finalBackup, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Backup creation failed" }, { status: 500 });
  }
}
