import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const BACKUP_SECRET = "PNP_CRM_ENTERPRISE_SECRET_2026_SECURE_V1";
const APP_SIGNATURE = "PNP_CRM_APP_SIG";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Decrypt
    if (buffer.length < 16) throw new Error("Invalid file size");
    const iv = buffer.subarray(0, 16);
    const encryptedData = buffer.subarray(16);
    const key = crypto.createHash("sha256").update(BACKUP_SECRET).digest();
    
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    // 2. Parse Payload
    const payloadLength = decrypted.readUInt32BE(0);
    const payloadBuffer = decrypted.subarray(4, 4 + payloadLength);
    const zipData = decrypted.subarray(4 + payloadLength);

    const payload = JSON.parse(payloadBuffer.toString("utf8"));

    // Validation
    if (payload.signature !== APP_SIGNATURE) {
      return NextResponse.json({ error: "Backup not created from PNP CRM" }, { status: 400 });
    }

    const hash = crypto.createHash("sha256").update(zipData).digest("hex");
    if (hash !== payload.hash) {
      return NextResponse.json({ error: "Backup corrupted" }, { status: 400 });
    }

    // 3. Extract and Restore
    // Safely disconnect Prisma to release file locks
    await prisma.$disconnect();

    const tempExtractDir = path.join(process.cwd(), "temp_extract");
    if (fs.existsSync(tempExtractDir)) fs.rmSync(tempExtractDir, { recursive: true, force: true });
    fs.mkdirSync(tempExtractDir);

    const tempZipPath = path.join(tempExtractDir, "restore.zip");
    fs.writeFileSync(tempZipPath, zipData);

    // Unzip
    const zip = new AdmZip(zipData);
    zip.extractAllTo(tempExtractDir, true);

    // SAFETY PRE-RESTORE BACKUP
    const currentDbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (fs.existsSync(currentDbPath)) {
      fs.copyFileSync(currentDbPath, currentDbPath + ".pre-restore");
    }

    // Move files to destination
    const filesToRestore = [
      { src: "prisma/dev.db", dest: "prisma/dev.db" },
      { src: ".env", dest: ".env" },
      { src: "public/logo.png", dest: "public/logo.png" }
    ];

    for (const f of filesToRestore) {
      const srcPath = path.join(tempExtractDir, f.src);
      const destPath = path.join(process.cwd(), f.dest);
      if (fs.existsSync(srcPath)) {
        // Ensure dest dir exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        
        // Overwrite destination
        fs.copyFileSync(srcPath, destPath);
      }
    }

    // Cleanup
    fs.rmSync(tempExtractDir, { recursive: true, force: true });

    // CLEAR SERVER CACHES
    revalidatePath("/", "layout");

    return NextResponse.json({ 
      message: "Backup restored successfully",
      rehydration: "full_reload_required"
    });

  } catch (error: any) {
    console.error("Restore error:", error);
    if (error.code === 'EBUSY') {
      return NextResponse.json({ error: "Database file is currently in use. Please stop the CRM server and try again." }, { status: 500 });
    }
    return NextResponse.json({ error: "Restore failed: " + (error.message || "Unknown error") }, { status: 500 });
  }
}
